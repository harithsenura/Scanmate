"""
Scanmate - Scan API Router
FastAPI endpoints for code scanning, analysis, and AI-powered fix generation.
"""
import time
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import JSONResponse

from app.models.schemas import (
    ScanRequest,
    ScanResult,
    ScanProgressUpdate,
    HealthCheckResponse,
    AIAnalysisResult,
)
from app.services.ast_analyzer import analyze_code
from app.ai.ai_service import AIService, AIServiceError
from app.core.config import get_settings

router = APIRouter(prefix="/api/v1", tags=["scan"])
ai_service = AIService()


@router.post("/scan", response_model=ScanResult)
async def scan_code(request: ScanRequest):
    """
    Analyze source code for security vulnerabilities.
    
    - **code**: Source code string to analyze
    - **language**: Programming language (python, javascript, typescript, etc.)
    - **filename**: Optional filename for context
    - **use_ai**: Whether to use AI for enhanced analysis and fix generation
    - **ai_model**: Specific AI model to use (gpt-4, llama-3)
    
    Returns a complete scan result with vulnerabilities, security score, and AI-generated fixes.
    """
    start_time = time.time()
    scan_id = f"scan-{uuid.uuid4().hex[:12]}"
    
    try:
        # Primary Scan Logic
        vulnerabilities = []
        score = 100
        ai_results: Optional[list[AIAnalysisResult]] = None
        
        deep_analysis = None
        
        if request.use_ai:
            try:
                # Perform Holistic AI Audit (LLM-First Semantic Analysis)
                audit_result = await ai_service.audit_code(
                    request.code, 
                    request.language, 
                    request.filename or "untitled",
                    user_groq_key=request.user_groq_key,
                    user_gemini_key=request.user_gemini_key
                )
                
                vulnerabilities = audit_result.get("vulnerabilities", [])
                deep_analysis_dict = audit_result.get("deep_analysis")
                
                if deep_analysis_dict:
                    from app.models.schemas import DeepAnalysisReport
                    deep_analysis = DeepAnalysisReport(**deep_analysis_dict)
                
                # If AI found vulnerabilities, calculate score and wrap results
                if vulnerabilities:
                    # Calculate score deduction
                    deduction = 0
                    for v in vulnerabilities:
                        if v.severity == "critical": deduction += 25
                        elif v.severity == "high": deduction += 15
                        elif v.severity == "medium": deduction += 5
                        elif v.severity == "low": deduction += 2
                    score = max(0, 100 - deduction)
                    
                    # Wrap for frontend compatibility
                    ai_results = [
                        AIAnalysisResult(
                            explanation=v.description,
                            recommendation=v.recommendation,
                            fixed_code=v.fixed_code,
                            references=[],
                            confidence_score=0.95
                        ) for v in vulnerabilities
                    ]
                else:
                    score = 100
                    
            except Exception:
                # Fallback to AST if AI fails
                vulnerabilities, score = analyze_code(request.code, request.language)
        else:
            # Standard AST/Regex Analysis
            vulnerabilities, score = analyze_code(request.code, request.language)
            
            # Second-Pass: AI Validation to filter False Positives
            if vulnerabilities and getattr(get_settings(), 'GROQ_API_KEY', None):
                validated_vulns = []
                for v in vulnerabilities:
                    try:
                        validation = await ai_service.validate_vulnerability(
                            code_snippet=request.code,
                            vuln_name=v.title,
                            vuln_description=v.description,
                            filename=request.filename or "untitled",
                            user_groq_key=request.user_groq_key,
                            user_gemini_key=request.user_gemini_key
                        )
                        
                        if validation.get("is_true_positive", True):
                            # Attach validation metadata to the vulnerability
                            v.confidence_score = validation.get("confidence_score", 50) / 100.0
                            validated_vulns.append(v)
                        else:
                            print(f"🗑️ Filtered False Positive: {v.title} → {validation.get('reasoning', 'N/A')}")
                    except Exception as val_err:
                        print(f"⚠️ Validation failed for {v.title}: {val_err}")
                        validated_vulns.append(v)  # Keep it if validation fails
                
                vulnerabilities = validated_vulns
                
                # Recalculate score after filtering
                deduction = 0
                for v in vulnerabilities:
                    if v.severity == "critical": deduction += 25
                    elif v.severity == "high": deduction += 15
                    elif v.severity == "medium": deduction += 5
                    elif v.severity == "low": deduction += 2
                score = max(0, 100 - deduction)
        
        scan_duration_ms = int((time.time() - start_time) * 1000)
        
        # Build summary
        severity_counts = {}
        for v in vulnerabilities:
            severity_counts[v.severity] = severity_counts.get(v.severity, 0) + 1
        
        result = ScanResult(
            id=scan_id,
            timestamp=datetime.utcnow(),
            filename=request.filename or "untitled",
            language=request.language,
            total_lines=len(request.code.split('\n')),
            scan_duration_ms=scan_duration_ms,
            security_score=score,
            vulnerabilities=vulnerabilities,
            ai_analysis=ai_results,
            deep_analysis=deep_analysis,
            summary={
                "total_vulnerabilities": len(vulnerabilities),
                "severity_breakdown": severity_counts,
                "critical_count": severity_counts.get("critical", 0),
                "high_count": severity_counts.get("high", 0),
                "medium_count": severity_counts.get("medium", 0),
                "low_count": severity_counts.get("low", 0),
            },
            status="completed",
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


@router.post("/scan/file", response_model=ScanResult)
async def scan_file(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    use_ai: bool = Form(True),
    ai_model: Optional[str] = Form(None),
):
    """
    Upload and scan a source code file.
    
    - **file**: Source code file to analyze
    - **language**: Programming language (auto-detected if not provided)
    - **use_ai**: Enable AI-powered analysis
    - **ai_model**: AI model preference
    """
    settings = get_settings()
    
    # Validate file size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE_BYTES / 1024 / 1024}MB"
        )
    
    code = content.decode('utf-8')
    
    # Auto-detect language from filename
    detected_language = language or _detect_language(file.filename or "")
    
    request = ScanRequest(
        code=code,
        language=detected_language or "python",
        filename=file.filename or "uploaded",
        use_ai=use_ai,
        ai_model=ai_model,
    )
    
    return await scan_code(request)


@router.get("/scan/{scan_id}/progress")
async def get_scan_progress(scan_id: str):
    """Get real-time scan progress (for long-running scans)."""
    # This would integrate with Supabase Realtime in production
    return ScanProgressUpdate(
        scan_id=scan_id,
        status="completed",
        progress_percent=100,
        current_vulnerability_count=0,
        timestamp=datetime.utcnow(),
    )


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint for monitoring."""
    settings = get_settings()
    
    services = {
        "ast_analyzer": "healthy",
        "ai_service": "healthy" if ai_service.openai_client else "not_configured",
    }
    
    return HealthCheckResponse(
        status="healthy",
        version=settings.APP_VERSION,
        timestamp=datetime.utcnow(),
        services=services,
    )


@router.get("/vulnerabilities/rules")
async def get_detection_rules():
    """Get all active vulnerability detection rules."""
    from app.services.ast_analyzer import RULES
    
    return {
        "rules": [
            {
                "name": rule.name,
                "type": rule.vulnerability_type,
                "severity": rule.severity,
                "cwe_id": rule.cwe_id,
                "cwe_name": rule.cwe_name,
            }
            for rule in RULES.values()
        ],
        "total_rules": len(RULES),
    }


def _detect_language(filename: str) -> Optional[str]:
    """Detect programming language from file extension."""
    extension_map = {
        '.py': 'python',
        '.js': 'javascript',
        '.ts': 'typescript',
        '.java': 'java',
        '.go': 'go',
        '.rs': 'rust',
        '.php': 'php',
        '.rb': 'ruby',
        '.cpp': 'cpp',
        '.c': 'c',
        '.cs': 'csharp',
    }
    
    import os
    ext = os.path.splitext(filename.lower())[1]
    return extension_map.get(ext)
