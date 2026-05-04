"""
Verstack.lk - Pydantic Schemas
Request/response models for the SAST API.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from enum import Enum


class SeverityLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class VulnerabilityType(str, Enum):
    SQL_INJECTION = "sql_injection"
    XSS = "xss"
    HARDCODED_SECRET = "hardcoded_secret"
    INSECURE_DESERIALIZATION = "insecure_deserialization"
    PATH_TRAVERSAL = "path_traversal"
    WEAK_CRYPTO = "weak_crypto"
    DEBUG_MODE = "debug_mode"
    INSECURE_HEADER = "insecure_header"
    COMMAND_INJECTION = "command_injection"
    SSRF = "ssrf"


class ScanRequest(BaseModel):
    """Request model for initiating a code scan."""
    code: str = Field(..., min_length=1, max_length=500_000, description="Source code to analyze")
    language: Literal["python", "javascript", "typescript", "java", "go", "rust", "php"] = Field(
        default="python", description="Programming language of the code"
    )
    filename: Optional[str] = Field(default="untitled", description="Name of the file being scanned")
    use_ai: bool = Field(default=True, description="Whether to use AI for enhanced analysis")
    ai_model: Optional[str] = Field(default=None, description="AI model to use (gpt-4, llama-3, etc.)")


class Vulnerability(BaseModel):
    """Individual vulnerability finding."""
    id: str
    title: str
    severity: SeverityLevel
    vulnerability_type: VulnerabilityType
    line: int
    column: int
    description: str
    cwe_id: Optional[str] = None
    cwe_name: Optional[str] = None
    recommendation: str
    fixed_code: Optional[str] = None
    confidence_score: float = Field(ge=0.0, le=1.0)
    source_snippet: Optional[str] = None


class AIAnalysisResult(BaseModel):
    """AI-generated analysis for a vulnerability."""
    vulnerability_id: str
    ai_explanation: str
    ai_recommendation: str
    fixed_code: Optional[str] = None
    references: List[str] = []
    model_used: str


class ScanResult(BaseModel):
    """Complete scan result response."""
    id: str
    timestamp: datetime
    filename: str
    language: str
    total_lines: int
    scan_duration_ms: int
    security_score: int = Field(ge=0, le=100)
    vulnerabilities: List[Vulnerability]
    ai_analysis: Optional[List[AIAnalysisResult]] = None
    summary: dict
    status: Literal["completed", "failed", "partial"]


class ScanProgressUpdate(BaseModel):
    """Real-time scan progress update via WebSocket/Supabase Realtime."""
    scan_id: str
    status: Literal["queued", "parsing", "analyzing", "ai_processing", "completed", "failed"]
    progress_percent: int = Field(ge=0, le=100)
    message: Optional[str] = None
    current_vulnerability_count: int = 0
    timestamp: datetime


class FileUploadScan(BaseModel):
    """Request for scanning an uploaded file."""
    language: Optional[str] = None
    use_ai: bool = True
    ai_model: Optional[str] = None


class HealthCheckResponse(BaseModel):
    """Health check endpoint response."""
    status: str
    version: str
    timestamp: datetime
    services: dict
