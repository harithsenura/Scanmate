"""
Verstack.lk - AI Analysis Service
Integrates with OpenAI GPT-4 and Llama-3 to generate vulnerability explanations
and secure code refactoring suggestions.
"""
import os
from typing import List, Optional
import httpx
from app.core.config import get_settings
from app.models.schemas import Vulnerability, AIAnalysisResult


class AIServiceError(Exception):
    """AI service operation error."""
    pass


class AIService:
    """AI-powered code analysis and fix generation service."""
    
    def __init__(self):
        self.settings = get_settings()
        self.openai_client = None
        if self.settings.OPENAI_API_KEY:
            try:
                import openai
                self.openai_client = openai.AsyncOpenAI(api_key=self.settings.OPENAI_API_KEY)
            except ImportError:
                pass
    
    async def analyze_vulnerability(
        self,
        vulnerability: Vulnerability,
        source_code: str,
        model: Optional[str] = None,
    ) -> AIAnalysisResult:
        """
        Use AI to analyze a vulnerability and generate a fix.
        
        Args:
            vulnerability: The detected vulnerability
            source_code: Full source code for context
            model: AI model to use (gpt-4, llama-3, etc.)
        
        Returns:
            AIAnalysisResult with explanation and fixed code
        """
        model = model or self.settings.OPENAI_MODEL or "gpt-4-turbo-preview"
        
        # Try Gemini (Free & Powerful)
        if self.settings.GEMINI_API_KEY and "your-gemini" not in self.settings.GEMINI_API_KEY:
            try:
                return await self._gemini_analyze(vulnerability, source_code)
            except Exception as e:
                print(f"⚠️ Gemini failed, trying others: {e}")
        
        # Try OpenAI
        if self.openai_client and "gpt" in model.lower() and "your-openai" not in self.settings.OPENAI_API_KEY:
            try:
                return await self._openai_analyze(vulnerability, source_code, model)
            except Exception as e:
                print(f"⚠️ OpenAI failed, trying others: {e}")
        
        # Fallback to Llama
        if self.settings.LLAMA_API_ENDPOINT:
            return await self._llama_analyze(vulnerability, source_code, model)
        
        # Final fallback: rule-based analysis
        return self._rule_based_analysis(vulnerability, source_code, model)

    async def _gemini_analyze(
        self,
        vulnerability: Vulnerability,
        source_code: str,
    ) -> AIAnalysisResult:
        """Analyze using Google Gemini 1.5 Flash."""
        if not self.settings.GEMINI_API_KEY:
            raise AIServiceError("Gemini API key not set")
            
        # Use v1beta for latest models
        model_name = self.settings.GEMINI_MODEL or "gemini-2.0-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.settings.GEMINI_API_KEY}"
        
        prompt = self._build_analysis_prompt(vulnerability, source_code)
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"SYSTEM: You are an expert SAST security engineer specializing in static application security testing. Analyze the following vulnerability detected by AST analysis and provide a JSON response. Respond ONLY with a valid JSON object containing: explanation (string), recommendation (string), fixed_code (string), and references (array of strings).\n\nUSER: {prompt}"
                }]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "topK": 1,
                "topP": 1,
                "maxOutputTokens": 2048
            }
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=30.0)
                if response.status_code != 200:
                    print(f"❌ Gemini API Error Status: {response.status_code}")
                    print(f"❌ Gemini API Response: {response.text}")
                    raise AIServiceError(f"Gemini API error: {response.text}")
                
                import json
                data = response.json()
                content_text = data['candidates'][0]['content']['parts'][0]['text']
                result = json.loads(content_text)
                
                return AIAnalysisResult(
                    vulnerability_id=vulnerability.id,
                    ai_explanation=result.get("explanation", vulnerability.description),
                    recommendation=result.get("recommendation", "Secure the code following best practices."),
                    fixed_code=result.get("fixed_code"),
                    references=result.get("references", []),
                    confidence_score=0.95
                )
            except Exception as e:
                print(f"❌ Gemini Analysis Exception: {str(e)}")
                raise e
    
    async def _openai_analyze(
        self,
        vulnerability: Vulnerability,
        source_code: str,
        model: str,
    ) -> AIAnalysisResult:
        """Analyze using OpenAI GPT-4."""
        if not self.openai_client:
            raise AIServiceError("OpenAI client not initialized")
        
        prompt = self._build_analysis_prompt(vulnerability, source_code)
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert security engineer specializing in static application "
                            "security testing (SAST). Your task is to analyze code vulnerabilities "
                            "and provide secure, production-ready refactored code. "
                            "Respond with a JSON object containing: explanation (string), recommendation (string), "
                            "fixed_code (string), and references (array of strings)."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=1500,
                response_format={"type": "json_object"},
            )
            
            import json
            content = response.choices[0].message.content
            result = json.loads(content)
            
            return AIAnalysisResult(
                vulnerability_id=vulnerability.id,
                ai_explanation=result.get("explanation", vulnerability.description),
                ai_recommendation=result.get("recommendation", vulnerability.recommendation),
                fixed_code=result.get("fixed_code"),
                references=result.get("references", []),
                model_used=model,
            )
            
        except Exception as e:
            raise AIServiceError(f"OpenAI analysis failed: {str(e)}")
    
    async def _llama_analyze(
        self,
        vulnerability: Vulnerability,
        source_code: str,
        model: str,
    ) -> AIAnalysisResult:
        """Analyze using Llama-3 via API endpoint."""
        if not self.settings.LLAMA_API_ENDPOINT:
            raise AIServiceError("Llama API endpoint not configured")
        
        prompt = self._build_analysis_prompt(vulnerability, source_code)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.settings.LLAMA_API_ENDPOINT}/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.settings.LLAMA_API_KEY or ''}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "messages": [
                            {
                                "role": "system",
                                "content": (
                                    "You are a security expert. Analyze vulnerabilities and provide "
                                    "secure code fixes. Respond with JSON: explanation, recommendation, "
                                    "fixed_code, references."
                                ),
                            },
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.2,
                        "max_tokens": 1500,
                    },
                    timeout=30.0,
                )
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                import json
                parsed = json.loads(content)
                
                return AIAnalysisResult(
                    vulnerability_id=vulnerability.id,
                    ai_explanation=parsed.get("explanation", vulnerability.description),
                    ai_recommendation=parsed.get("recommendation", vulnerability.recommendation),
                    fixed_code=parsed.get("fixed_code"),
                    references=parsed.get("references", []),
                    model_used=model,
                )
                
        except Exception as e:
            raise AIServiceError(f"Llama analysis failed: {str(e)}")
    
    def _rule_based_analysis(
        self,
        vulnerability: Vulnerability,
        source_code: str,
        model: str,
    ) -> AIAnalysisResult:
        """Fallback rule-based analysis when AI is unavailable."""
        # Generate a contextual fix based on vulnerability type
        fixed_code = self._generate_fallback_fix(vulnerability, source_code)
        
        return AIAnalysisResult(
            vulnerability_id=vulnerability.id,
            ai_explanation=vulnerability.description,
            ai_recommendation=vulnerability.recommendation,
            fixed_code=fixed_code,
            references=[
                f"https://cwe.mitre.org/data/definitions/{vulnerability.cwe_id.replace('CWE-', '')}.html",
            ] if vulnerability.cwe_id else [],
            model_used="rule-based-fallback",
        )
    
    def _build_analysis_prompt(self, vulnerability: Vulnerability, source_code: str) -> str:
        """Build the analysis prompt for AI models."""
        return f"""Analyze the following security vulnerability and provide a secure fix.

VULNERABILITY DETAILS:
- Title: {vulnerability.title}
- Severity: {vulnerability.severity}
- Type: {vulnerability.vulnerability_type}
- CWE: {vulnerability.cwe_id} ({vulnerability.cwe_name})
- Line: {vulnerability.line}, Column: {vulnerability.column}
- Description: {vulnerability.description}
- Current Recommendation: {vulnerability.recommendation}

SOURCE CODE SNIPPET:
```python
{vulnerability.source_snippet or "N/A"}
```

FULL SOURCE CONTEXT:
```python
{source_code[:3000]}
```

Provide your response as a JSON object with these fields:
- "explanation": Detailed explanation of why this is vulnerable and how it could be exploited. Explain the security impact in plain English.
- "recommendation": A clear, numbered, step-by-step guide on how to fix the issue (e.g., "1. Import the module\n2. Update the variable...").
- "fixed_code": Complete, production-ready replacement code that fixes the vulnerability.
- "references": Array of relevant OWASP/CWE documentation URLs.
"""
    
    def _generate_fallback_fix(
        self,
        vulnerability: Vulnerability,
        source_code: str,
    ) -> Optional[str]:
        """Generate a basic fix based on vulnerability patterns."""
        vuln_type = vulnerability.vulnerability_type
        
        if vuln_type == "sql_injection":
            return '# SECURE: Use parameterized query\nquery = "SELECT * FROM users WHERE id = ?"\ncursor.execute(query, (user_id,))'
        
        elif vuln_type == "hardcoded_secret":
            return '# SECURE: Load from environment\nimport os\nAPI_KEY = os.environ.get("API_KEY")\nif not API_KEY:\n    raise ValueError("API_KEY environment variable not set")'
        
        elif vuln_type == "insecure_deserialization":
            return '# SECURE: Use JSON instead of pickle\nimport json\ndata = json.loads(request.data)'
        
        elif vuln_type == "command_injection":
            return '# SECURE: Use subprocess with list args\nimport subprocess\nresult = subprocess.run(["ls", "-la", directory], capture_output=True, text=True)'
        
        elif vuln_type == "weak_crypto":
            return '# SECURE: Use strong hashing\nimport hashlib\nhash_value = hashlib.sha256(password.encode()).hexdigest()'
        
        elif vuln_type == "debug_mode":
            return '# SECURE: Disable debug in production\napp.run(debug=False)'
        
        elif vuln_type == "path_traversal":
            return '# SECURE: Validate and sanitize paths\nimport os\nsafe_path = os.path.abspath(os.path.join(base_dir, filename))\nif not safe_path.startswith(base_dir):\n    raise ValueError("Invalid path")'
        
        return None
    
    async def batch_analyze(
        self,
        vulnerabilities: List[Vulnerability],
        source_code: str,
        model: Optional[str] = None,
    ) -> List[AIAnalysisResult]:
        """Analyze multiple vulnerabilities in batch."""
        results = []
        for vuln in vulnerabilities:
            try:
                result = await self.analyze_vulnerability(vuln, source_code, model)
                results.append(result)
            except AIServiceError:
                # Fall back to rule-based
                result = self._rule_based_analysis(vuln, source_code, model or "fallback")
                results.append(result)
        return results
