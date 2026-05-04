"""
Verstack.lk - Scan API Router
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
        # Run AST analysis
        vulnerabilities, score = analyze_code(request.code, request.language)
        
        # AI-powered analysis
        ai_results: Optional[list[AIAnalysisResult]] = None
        if request.use_ai and vulnerabilities:
            try:
                ai_results_list = await ai_service.batch_analyze(
                    vulnerabilities, 
                    request.code, 
                    request.ai_model
                )
                ai_results = ai_results_list
                
                # Merge AI fixes into vulnerabilities
                for i, vuln in enumerate(vulnerabilities):
                    if i < len(ai_results_list) and ai_results_list[i].fixed_code:
                        vuln.fixed_code = ai_results_list[i].fixed_code
                        
            except AIServiceError:
                # AI is optional - continue without it
                ai_results = None
        
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
