"""
ScanMate - AI Analysis Service
Enterprise-grade AI security auditing with Semantic Caching, Exponential Backoff,
Token Trimming, Hybrid Model Strategy, and Multi-Provider Fallback.
"""
import os
import re
import hashlib
import asyncio
import time
import json
from typing import List, Optional, Dict, Any
import httpx
from app.core.config import get_settings
from app.models.schemas import Vulnerability, AIAnalysisResult


class AIServiceError(Exception):
    """AI service operation error."""
    pass


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Solution 1: SEMANTIC CACHE (In-Memory, Hash-Based)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_semantic_cache: Dict[str, dict] = {}
_cache_timestamps: Dict[str, float] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour


def _cache_key(code: str, filename: str, mode: str) -> str:
    """Generate SHA-256 hash key for semantic caching."""
    content = f"{mode}:{filename}:{code}"
    return hashlib.sha256(content.encode()).hexdigest()


def _get_cached(key: str) -> Optional[dict]:
    """Retrieve from cache if not expired."""
    if key in _semantic_cache:
        if time.time() - _cache_timestamps.get(key, 0) < CACHE_TTL_SECONDS:
            print(f"⚡ CACHE HIT [{key[:12]}...] — Saved an API call!")
            return _semantic_cache[key]
        else:
            del _semantic_cache[key]
            del _cache_timestamps[key]
    return None


def _set_cached(key: str, value: dict):
    """Store result in cache with timestamp."""
    _semantic_cache[key] = value
    _cache_timestamps[key] = time.time()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Solution 4: CODE PRE-PROCESSING & TOKEN TRIMMING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def trim_code_tokens(code: str) -> str:
    """
    Strip noise from code before sending to AI to reduce token count.
    Removes: comments, blank lines, non-essential imports.
    """
    lines = code.split('\n')
    trimmed = []
    for line in lines:
        stripped = line.strip()
        # Skip empty lines
        if not stripped:
            continue
        # Skip single-line comments (Python, JS, Java, Go, Rust, PHP)
        if stripped.startswith('#') and not stripped.startswith('#!'):
            # Keep .env-style KEY=VALUE lines that start with #
            if '=' not in stripped:
                continue
        if stripped.startswith('//'):
            continue
        # Skip block comment markers
        if stripped.startswith('/*') or stripped.startswith('*') or stripped.startswith('*/'):
            continue
        # Skip pure-import lines (keep from...import for context)
        if re.match(r'^import\s+[\w.]+\s*$', stripped):
            continue
        trimmed.append(line)
    return '\n'.join(trimmed)


class AIService:
    """AI-powered code analysis with enterprise scaling solutions."""
    
    def __init__(self):
        self.settings = get_settings()
        self.openai_client = None
        if self.settings.OPENAI_API_KEY:
            try:
                import openai
                self.openai_client = openai.AsyncOpenAI(api_key=self.settings.OPENAI_API_KEY)
            except ImportError:
                pass
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Solution 5: EXPONENTIAL BACKOFF WITH RETRY
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    async def _call_groq(self, messages: list, temperature: float = 0.2, 
                         json_mode: bool = True, max_retries: int = 3) -> Optional[str]:
        """Call Groq API with exponential backoff retry logic."""
        if not getattr(self.settings, 'GROQ_API_KEY', None):
            return None
            
        headers = {
            "Authorization": f"Bearer {self.settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": getattr(self.settings, 'GROQ_MODEL', "llama-3.3-70b-versatile"),
            "messages": messages,
            "temperature": temperature,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers=headers, json=payload, timeout=90.0
                    )
                    
                    if response.status_code == 200:
                        return response.json()["choices"][0]["message"]["content"]
                    
                    if response.status_code == 429:
                        wait_time = (2 ** attempt) + 1  # 1s, 3s, 5s
                        print(f"⏳ Groq 429 — Backoff attempt {attempt+1}/{max_retries}, waiting {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                    
                    if response.status_code == 413:
                        print(f"📦 Groq 413 — Payload too large, skipping.")
                        return None
                    
                    print(f"⚠️ Groq error {response.status_code}: {response.text[:200]}")
                    return None
                    
            except Exception as e:
                print(f"⚠️ Groq attempt {attempt+1} failed: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
        
        return None
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Solution 6: MULTI-PROVIDER FALLBACK (Groq → Gemini)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    async def _call_gemini(self, system_instruction: str, prompt: str, 
                           max_retries: int = 2) -> Optional[str]:
        """Fallback to Gemini API with exponential backoff."""
        if not getattr(self.settings, 'GEMINI_API_KEY', None):
            return None
            
        model_name = getattr(self.settings, 'GEMINI_MODEL', "gemini-2.0-flash")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.settings.GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": f"SYSTEM: {system_instruction}\n\nUSER: {prompt}"}]}],
            "generationConfig": {"temperature": 0.2, "topK": 1, "topP": 1, "maxOutputTokens": 8192}
        }
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(url, json=payload, timeout=90.0)
                    
                    if response.status_code == 200:
                        result = response.json()
                        return result["candidates"][0]["content"]["parts"][0]["text"]
                    
                    if response.status_code == 429:
                        wait_time = (2 ** attempt) + 1
                        print(f"⏳ Gemini 429 — Backoff attempt {attempt+1}/{max_retries}, waiting {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                    
                    print(f"⚠️ Gemini error {response.status_code}")
                    return None
                    
            except Exception as e:
                print(f"⚠️ Gemini attempt {attempt+1} failed: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
        
        return None
    
    async def _call_ai(self, system_instruction: str, prompt: str, 
                       json_mode: bool = True) -> Optional[str]:
        """
        Multi-provider AI call: Groq → Gemini fallback chain.
        Implements Solution 6 (Multi-Provider Fallback).
        """
        # Try Groq first (faster, higher limits)
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ]
        result = await self._call_groq(messages, json_mode=json_mode)
        if result:
            print("✅ AI Response via Groq")
            return result
        
        # Fallback to Gemini
        print("🔄 Groq unavailable, falling back to Gemini...")
        result = await self._call_gemini(system_instruction, prompt)
        if result:
            print("✅ AI Response via Gemini (fallback)")
            return result
        
        print("❌ All AI providers failed")
        return None

    
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

    async def validate_vulnerability(
        self,
        code_snippet: str,
        vuln_name: str,
        vuln_description: str,
        filename: str,
    ) -> dict:
        """
        Second-pass AI validation with Semantic Caching + Token Trimming.
        Uses the ScanMate Penetration Testing Researcher persona.
        """
        # Solution 1: Check Semantic Cache first
        cache_key = _cache_key(code_snippet, f"{filename}:{vuln_name}", "validate")
        cached = _get_cached(cache_key)
        if cached:
            return cached

        # Solution 4: Token Trimming
        trimmed_code = trim_code_tokens(code_snippet)[:3000]

        system_prompt = (
            "### ROLE\n"
            "You are a Senior Cyber Security Researcher specialized in Penetration Testing "
            "and Exploitability Analysis. Your mission is to audit automated scanner findings "
            "for the platform 'ScanMate'.\n\n"
            "### OBJECTIVE\n"
            "Filter out 'Noise' (Code quality, formatting, stylistic preferences) and identify "
            "ONLY 'True Security Vulnerabilities' that pose a direct threat.\n\n"
            "### EVALUATION CRITERIA\n"
            "1. EXPLOITABILITY: Can an external attacker or unauthorized user realistically exploit "
            "this line of code? (If NO, it is a False Positive).\n"
            "2. IMPACT: Does this lead to Data Leakage, Unauthorized Access, or System Compromise?\n"
            "3. NOISE REDUCTION: Ignore naming conventions, missing comments, or minor linter warnings. "
            "These are NOT security threats.\n\n"
            "### RESPONSE FORMAT (STRICT JSON)\n"
            "{\n"
            '  "is_security_threat": boolean,\n'
            '  "confidence_level": "0-100%",\n'
            '  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",\n'
            '  "technical_verdict": "A sharp, 1-sentence technical explanation.",\n'
            '  "action_plan": {\n'
            '     "fix": "Specific code correction.",\n'
            '     "prevention": "Architectural advice to avoid this in the future."\n'
            "  }\n"
            "}"
        )

        user_prompt = (
            f"### INPUT DATA\n"
            f"- File: {filename}\n"
            f"- Scanner Finding: {vuln_name}\n"
            f"- Scanner Description: {vuln_description}\n\n"
            f"### CODE SNIPPET\n```\n{trimmed_code}\n```"
        )

        try:
            # Solution 5+6: Call AI with backoff + multi-provider fallback
            text = await self._call_ai(system_prompt, user_prompt, json_mode=True)
            
            if not text:
                return {"is_true_positive": True, "confidence_score": 50, "status": "Review Required",
                        "reasoning": "All AI providers unavailable.", "remediation": "Manual review needed."}

            parsed = json.loads(text)
            
            confidence_raw = parsed.get("confidence_level", "50%")
            confidence_int = int(str(confidence_raw).replace("%", "")) if confidence_raw else 50
            
            result = {
                "is_true_positive": parsed.get("is_security_threat", True),
                "confidence_score": confidence_int,
                "status": parsed.get("severity", "MEDIUM"),
                "reasoning": parsed.get("technical_verdict", ""),
                "remediation": parsed.get("action_plan", {}).get("fix", ""),
                "prevention": parsed.get("action_plan", {}).get("prevention", ""),
            }
            
            # Solution 1: Cache the result
            _set_cached(cache_key, result)
            return result

        except Exception as e:
            print(f"Vulnerability validation failed: {e}")
            return {"is_true_positive": True, "confidence_score": 50, "status": "Review Required",
                    "reasoning": "Validation failed due to an error.", "remediation": "Manual review needed."}

    async def audit_code(
        self,
        code: str,
        language: str,
        filename: str,
    ) -> dict:
        """
        Perform a holistic semantic security audit with all scaling solutions:
        - Solution 1: Semantic Caching
        - Solution 3: Request Batching (full project in one call)
        - Solution 4: Token Trimming
        - Solution 5: Exponential Backoff
        - Solution 6: Multi-Provider Fallback (Groq → Gemini)
        """
        # Solution 1: Check Semantic Cache
        cache_key = _cache_key(code, filename, "audit")
        cached = _get_cached(cache_key)
        if cached:
            return cached
        
        # Solution 4: Token Trimming — strip noise before sending to AI
        trimmed_code = trim_code_tokens(code)
        
        system_instruction = (
            "You are an Elite Senior Software Engineer and Cyber Security Auditor. "
            f"Analyze the following {language} code for a comprehensive full-project review. "
            "Your goal is to find REAL, ACTIONABLE vulnerabilities, not generic warnings. "
            "You must provide a deep, narrative-style report in SIMPLE, CLEAR ENGLISH. "
            "Your output MUST be a strict JSON object with the following structure:\n"
            "{\n"
            '  "deep_analysis": {\n'
            '    "security_audit": "Narrative of concrete security flaws. DO NOT report the mere usage of a library (like supabase or gsap) as a risk unless you see a specific flaw in how it is used.",\n'
            '    "validation_audit": "Review of data handling. Only report if you see missing validation for user-controlled inputs.",\n'
            '    "engineering_audit": "Architecture and code quality review. Be professional and critical like a Senior Engineer.",\n'
            '    "hardcoded_credentials": "Explicitly identify any real admin credentials, API keys, or tokens found in .env or config files. If none are found, say so."\n'
            "  },\n"
            '  "vulnerabilities": [\n'
            '    { "title": "...", "severity": "critical|high|medium|low", "type": "...", "line": 1, "description": "...", "recommendation": "...", "fixed_code": "...", "cwe_id": "..." }\n'
            "  ]\n"
            "}\n"
            "STRICT AUDIT RULES:\n"
            "1. DO NOT hallucinate. Only report what you see in the provided code.\n"
            "2. If you see a .env file with actual values, report them as CRITICAL in 'hardcoded_credentials'.\n"
            "3. Ignore safe UI patterns, animation libraries (GSAP), and standard variable names.\n"
            "4. Return ONLY the JSON object. No markdown wrapping block."
        )
        
        prompt = f"File: {filename}\n\nCode:\n{trimmed_code}"
        
        try:
            # Solution 5+6: Call AI with exponential backoff + multi-provider fallback
            text = await self._call_ai(system_instruction, prompt, json_mode=True)
            
            if not text:
                return {"vulnerabilities": [], "deep_analysis": None}
            
            # --- COMMON PARSING LOGIC ---
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
                
            parsed = json.loads(text)
            print(f"✅ Audit parsed. Keys: {parsed.keys()}")
            
            vulnerabilities = []
            valid_types = ["sql_injection", "xss", "hardcoded_secret", "insecure_deserialization", 
                          "path_traversal", "weak_crypto", "debug_mode", "insecure_header", 
                          "command_injection", "ssrf"]
            
            for i, v in enumerate(parsed.get("vulnerabilities", [])):
                try:
                    raw_type = v.get("type", "sql_injection").lower().replace(" ", "_")
                    vuln_type = raw_type if raw_type in valid_types else "sql_injection"
                    
                    vulnerabilities.append(Vulnerability(
                        id=f"ai-vuln-{i}",
                        title=v.get("title", "Security Vulnerability"),
                        severity=v.get("severity", "medium").lower() if v.get("severity") in ["critical", "high", "medium", "low"] else "medium",
                        vulnerability_type=vuln_type,
                        line=int(v.get("line", 1)),
                        column=0,
                        description=v.get("description", ""),
                        cwe_id=v.get("cwe_id", ""),
                        cwe_name=v.get("title", ""),
                        recommendation=v.get("recommendation", ""),
                        fixed_code=v.get("fixed_code", ""),
                        confidence_score=0.95,
                        source_snippet=""
                    ))
                except Exception as vuln_e:
                    print(f"Skipping vuln {i} due to validation error: {vuln_e}")
                    continue
                
            deep_analysis = parsed.get("deep_analysis")
            result = {
                "vulnerabilities": vulnerabilities,
                "deep_analysis": deep_analysis
            }
            
            # Solution 1: Cache the result
            _set_cached(cache_key, result)
            return result
            
        except Exception as e:
            import traceback
            print(f"❌ Audit failed: {e}")
            traceback.print_exc()
            return {"vulnerabilities": [], "deep_analysis": None}

