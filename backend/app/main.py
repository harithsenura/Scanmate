"""
Scanmate AI Code Scanner - FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.routers import scan


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown events."""
    settings = get_settings()
    
    # Startup
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    print(f"   Debug mode: {settings.DEBUG}")
    print(f"   AI service: {'configured' if settings.OPENAI_API_KEY else 'not configured'}")
    
    yield
    
    # Shutdown
    print(f"👋 {settings.APP_NAME} shutting down gracefully...")


def create_application() -> FastAPI:
    """Application factory pattern for creating the FastAPI instance."""
    settings = get_settings()
    
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="""
        AI-powered Static Application Security Testing (SAST) platform.
        
        ## Features
        - **AST-based Analysis**: Deep code parsing using Python's ast module
        - **AI-Powered Fixes**: GPT-4 and Llama-3 integration for secure code refactoring
        - **Real-time Updates**: Supabase Realtime for live scan progress
        - **Multiple Languages**: Python, JavaScript, TypeScript, and more
        
        ## Authentication
        API endpoints support Supabase JWT tokens for authenticated requests.
        """,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.DEBUG else [
            "https://scanmate.ai",
            "https://app.scanmate.ai",
            "http://localhost:3000",
            "http://localhost:5173",
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    
    # Trusted host middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"] if settings.DEBUG else ["scanmate.ai", "*.scanmate.ai"],
    )
    
    # Include routers
    app.include_router(scan.router)
    
    # Root endpoint
    @app.get("/")
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "operational",
            "documentation": "/docs" if settings.DEBUG else None,
        }
    
    return app


# Create the application instance
app = create_application()

# For direct execution
if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else 4,
    )
