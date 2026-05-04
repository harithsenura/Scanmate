"""
Verstack.lk - AST-Based Static Analysis Engine
Core SAST engine using Python's ast module and regex-based pattern matching
to detect common security vulnerabilities.
"""
import ast
import hashlib
import re
from typing import List, Optional, Tuple
from dataclasses import dataclass
from app.models.schemas import Vulnerability, SeverityLevel, VulnerabilityType


@dataclass
class DetectionRule:
    """A vulnerability detection rule."""
    name: str
    vulnerability_type: VulnerabilityType
    severity: SeverityLevel
    cwe_id: str
    cwe_name: str
    description: str
    recommendation: str


# Detection Rules Database
RULES = {
    "sql_injection": DetectionRule(
        name="SQL Injection via String Concatenation",
        vulnerability_type=VulnerabilityType.SQL_INJECTION,
        severity=SeverityLevel.CRITICAL,
        cwe_id="CWE-89",
        cwe_name="SQL Injection",
        description="User-supplied input is directly concatenated into a SQL query string, allowing attackers to manipulate the query structure.",
        recommendation="Use parameterized queries or prepared statements to separate code from data.",
    ),
    "hardcoded_secret": DetectionRule(
        name="Hardcoded Secret or API Key",
        vulnerability_type=VulnerabilityType.HARDCODED_SECRET,
        severity=SeverityLevel.CRITICAL,
        cwe_id="CWE-798",
        cwe_name="Hardcoded Credentials",
        description="A sensitive value (API key, password, token) is hardcoded in the source file.",
        recommendation="Store secrets in environment variables or use a secrets management service.",
    ),
    "insecure_deserialization": DetectionRule(
        name="Insecure Deserialization",
        vulnerability_type=VulnerabilityType.INSECURE_DESERIALIZATION,
        severity=SeverityLevel.HIGH,
        cwe_id="CWE-502",
        cwe_name="Deserialization of Untrusted Data",
        description="Use of unsafe deserialization functions on untrusted data can lead to arbitrary code execution.",
        recommendation="Use json.loads() for untrusted data, or implement signed serialization.",
    ),
    "command_injection": DetectionRule(
        name="Command Injection",
        vulnerability_type=VulnerabilityType.COMMAND_INJECTION,
        severity=SeverityLevel.CRITICAL,
        cwe_id="CWE-78",
        cwe_name="OS Command Injection",
        description="User input is passed to system shell commands without proper sanitization.",
        recommendation="Use subprocess with a list of arguments instead of shell=True. Avoid os.system().",
    ),
    "path_traversal": DetectionRule(
        name="Path Traversal",
        vulnerability_type=VulnerabilityType.PATH_TRAVERSAL,
        severity=SeverityLevel.HIGH,
        cwe_id="CWE-22",
        cwe_name="Path Traversal",
        description="User-controlled input is used to construct file paths without proper validation.",
        recommendation="Use os.path.abspath() and validate paths against an allowlist of permitted directories.",
    ),
    "weak_crypto": DetectionRule(
        name="Weak Cryptographic Algorithm",
        vulnerability_type=VulnerabilityType.WEAK_CRYPTO,
        severity=SeverityLevel.MEDIUM,
        cwe_id="CWE-327",
        cwe_name="Broken Cryptographic Algorithm",
        description="Use of cryptographically broken hash functions or weak encryption algorithms.",
        recommendation="Use SHA-256 or stronger for hashing. Use bcrypt/Argon2 for password hashing.",
    ),
    "debug_mode": DetectionRule(
        name="Debug Mode Enabled",
        vulnerability_type=VulnerabilityType.DEBUG_MODE,
        severity=SeverityLevel.LOW,
        cwe_id="CWE-489",
        cwe_name="Active Debug Code",
        description="Debug mode is enabled, which may expose sensitive information or allow remote code execution.",
        recommendation="Never enable debug mode in production environments.",
    ),
    "xss": DetectionRule(
        name="Cross-Site Scripting (XSS)",
        vulnerability_type=VulnerabilityType.XSS,
        severity=SeverityLevel.HIGH,
        cwe_id="CWE-79",
        cwe_name="Cross-site Scripting",
        description="User input is rendered in HTML context without proper escaping or sanitization.",
        recommendation="Use template auto-escaping, or explicitly escape user input with html.escape().",
    ),
    "ssrf": DetectionRule(
        name="Server-Side Request Forgery (SSRF)",
        vulnerability_type=VulnerabilityType.SSRF,
        severity=SeverityLevel.HIGH,
        cwe_id="CWE-918",
        cwe_name="Server-Side Request Forgery",
        description="User-controlled URLs are fetched by the server, potentially accessing internal services.",
        recommendation="Validate and sanitize URLs. Use an allowlist of permitted domains.",
    ),
}

# Regex patterns for quick detection (enhanced for JS/TS/ENV support)
SECRET_PATTERNS = [
    r'(?i)((api[_-]?key|password|secret|token|auth[_-]?token|access[_-]?key|private[_-]?key)\s*[:=]\s*[\"\']?[^\"\']{5,}[\"\']?)',
    r'(?i)(const|let|var)\s+(api[_-]?key|password|secret|token|auth[_-]?token|access[_-]?key|private[_-]?key)\s*=\s*[\"\']?[^\"\']{5,}[\"\']?',
]

# Patterns that usually indicate a false positive
FALSE_POSITIVE_PATTERNS = [
    r'\.(getItem|setItem|removeItem|clear)\s*\(',
    r'JSON\.(parse|stringify)\s*\(',
    r'console\.(log|info|debug|warn|error)\s*\(',
    r'[\"\'](user|name|id|type|status|mode|theme|email)[\"\']',
]

DANGEROUS_FUNCTIONS = {
    'eval': RULES["command_injection"],
    'exec': RULES["command_injection"],
    'os.system': RULES["command_injection"],
    'os.popen': RULES["command_injection"],
    'subprocess.call': RULES["command_injection"],
    'subprocess.Popen': RULES["command_injection"],
    'pickle.loads': RULES["insecure_deserialization"],
    'yaml.load': RULES["insecure_deserialization"],
    'marshal.loads': RULES["insecure_deserialization"],
    'hashlib.md5': RULES["weak_crypto"],
    'hashlib.sha1': RULES["weak_crypto"],
    'open': RULES["path_traversal"],
}

SQL_EXECUTION_METHODS = ['execute', 'executemany', 'executescript']


class VulnerabilityVisitor(ast.NodeVisitor):
    """AST visitor that traverses Python code to find vulnerabilities."""
    
    def __init__(self, source_code: str):
        self.source_code = source_code
        self.source_lines = source_code.split('\n')
        self.vulnerabilities: List[Vulnerability] = []
        self._counter = 0
    
    def _make_id(self) -> str:
        self._counter += 1
        return f"vuln-{self._counter}"
    
    def _get_source_snippet(self, node: ast.AST) -> str:
        try:
            return ast.get_source_segment(self.source_code, node) or ""
        except Exception:
            if hasattr(node, 'lineno') and node.lineno:
                return self.source_lines[node.lineno - 1].strip()
            return ""
    
    def _create_vulnerability(
        self,
        rule: DetectionRule,
        node: ast.AST,
        custom_description: Optional[str] = None,
        custom_recommendation: Optional[str] = None,
    ) -> Vulnerability:
        line = getattr(node, 'lineno', 1) or 1
        col = getattr(node, 'col_offset', 0) or 0
        snippet = self._get_source_snippet(node)
        
        return Vulnerability(
            id=self._make_id(),
            title=rule.name,
            severity=rule.severity,
            vulnerability_type=rule.vulnerability_type,
            line=line,
            column=col,
            description=custom_description or rule.description,
            cwe_id=rule.cwe_id,
            cwe_name=rule.cwe_name,
            recommendation=custom_recommendation or rule.recommendation,
            confidence_score=0.85,
            source_snippet=snippet,
        )
    
    def visit_Call(self, node: ast.Call):
        """Detect dangerous function calls."""
        func_name = self._get_func_name(node.func)
        
        # Check for dangerous functions
        if func_name in DANGEROUS_FUNCTIONS:
            rule = DANGEROUS_FUNCTIONS[func_name]
            self.vulnerabilities.append(
                self._create_vulnerability(rule, node)
            )
        
        # Check for SQL injection via string formatting in execute calls
        if func_name and any(method in func_name for method in SQL_EXECUTION_METHODS):
            self._check_sql_injection(node)
        
        # Check for os.system with string formatting
        if func_name in ('os.system', 'subprocess.call', 'subprocess.Popen'):
            if node.args:
                first_arg = node.args[0]
                if isinstance(first_arg, (ast.BinOp, ast.JoinedStr, ast.Call)):
                    if isinstance(first_arg, ast.Call) and self._get_func_name(first_arg.func) == 'str.format':
                        self.vulnerabilities.append(
                            self._create_vulnerability(RULES["command_injection"], node)
                        )
        
        self.generic_visit(node)
    
    def visit_Assign(self, node: ast.Assign):
        """Detect hardcoded secrets in assignments."""
        for target in node.targets:
            if isinstance(target, ast.Name):
                target_name = target.id
                # Check if the variable name looks like a secret
                secret_keywords = ['api_key', 'password', 'secret', 'token', 'auth_token', 
                                   'private_key', 'aws_key', 'access_key']
                if any(keyword in target_name.lower() for keyword in secret_keywords):
                    # Check if it's a hardcoded string (not env var or function call)
                    if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                        if not node.value.value.startswith(('os.environ', 'env.', 'getenv')):
                            self.vulnerabilities.append(
                                self._create_vulnerability(
                                    RULES["hardcoded_secret"],
                                    node,
                                    custom_description=f"The variable '{target_name}' contains a hardcoded secret value. "
                                                      f"This exposes sensitive credentials in source code.",
                                    custom_recommendation=f"Use os.environ.get('{target_name.upper()}') or a secrets manager "
                                                         f"to externalize the value of '{target_name}'.",
                                )
                            )
        
        self.generic_visit(node)
    
    def visit_Constant(self, node: ast.Constant):
        """Detect secrets in string constants using regex patterns."""
        if isinstance(node.value, str) and len(node.value) > 8:
            # Check for high entropy (potential secret)
            if self._is_high_entropy(node.value):
                # Check context - only flag if it looks like a credential
                secret_indicators = ['key', 'token', 'secret', 'password', 'auth']
                line_text = self.source_lines[node.lineno - 1] if node.lineno else ""
                if any(indicator in line_text.lower() for indicator in secret_indicators):
                    self.vulnerabilities.append(
                        self._create_vulnerability(
                            RULES["hardcoded_secret"],
                            node,
                            custom_description="High-entropy string detected that appears to be a secret or credential.",
                        )
                    )
        
        self.generic_visit(node)
    
    def _check_sql_injection(self, node: ast.Call):
        """Check if a SQL execution call uses string formatting."""
        if not node.args:
            return
        
        first_arg = node.args[0]
        
        # f-string: f"SELECT * FROM {table}"
        if isinstance(first_arg, ast.JoinedStr):
            self.vulnerabilities.append(
                self._create_vulnerability(
                    RULES["sql_injection"],
                    node,
                    custom_description="SQL query uses f-string interpolation, allowing injection attacks.",
                )
            )
            return
        
        # String concatenation: "SELECT * FROM " + table
        if isinstance(first_arg, ast.BinOp) and isinstance(first_arg.op, ast.Add):
            if isinstance(first_arg.left, ast.Constant) or isinstance(first_arg.right, ast.Constant):
                self.vulnerabilities.append(
                    self._create_vulnerability(
                        RULES["sql_injection"],
                        node,
                        custom_description="SQL query uses string concatenation, allowing injection attacks.",
                    )
                )
            return
        
        # .format(): "SELECT * FROM {}".format(table)
        if isinstance(first_arg, ast.Call):
            func_name = self._get_func_name(first_arg.func)
            if func_name and 'format' in func_name:
                self.vulnerabilities.append(
                    self._create_vulnerability(
                        RULES["sql_injection"],
                        node,
                        custom_description="SQL query uses .format() method, allowing injection attacks.",
                    )
                )
                return
        
        # % formatting: "SELECT * FROM %s" % table
        if isinstance(first_arg, ast.BinOp) and isinstance(first_arg.op, ast.Mod):
            self.vulnerabilities.append(
                self._create_vulnerability(
                    RULES["sql_injection"],
                    node,
                    custom_description="SQL query uses %-formatting, allowing injection attacks.",
                )
            )
    
    def _get_func_name(self, node: ast.expr) -> str:
        """Extract the full function name from an AST node."""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            value = self._get_func_name(node.value)
            return f"{value}.{node.attr}" if value else node.attr
        return ""
    
    @staticmethod
    def _is_high_entropy(string: str) -> bool:
        """Check if a string has high entropy (potential secret)."""
        if len(string) < 16:
            return False
        
        # Shannon entropy calculation
        import math
        entropy = 0
        for x in range(256):
            p_x = float(string.count(chr(x))) / len(string)
            if p_x > 0:
                entropy += -p_x * math.log(p_x, 2)
        
        return entropy > 4.5


class ASTAnalyzer:
    """Main AST-based static analysis engine."""
    
    @staticmethod
    def analyze_python(code: str) -> List[Vulnerability]:
        """Analyze Python code for vulnerabilities."""
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            # Return a single syntax error vulnerability
            return [Vulnerability(
                id="vuln-syntax",
                title="Syntax Error",
                severity=SeverityLevel.INFO,
                vulnerability_type=VulnerabilityType.DEBUG_MODE,
                line=e.lineno or 1,
                column=e.offset or 0,
                description=f"Syntax error in code: {e.msg}",
                recommendation="Fix the syntax error before running security analysis.",
                confidence_score=1.0,
                source_snippet=str(e.text) if e.text else "",
            )]
        
        visitor = VulnerabilityVisitor(code)
        visitor.visit(tree)
        
        # Also run regex-based checks
        regex_vulns = ASTAnalyzer._regex_analysis(code)
        
        # Merge and deduplicate
        all_vulns = visitor.vulnerabilities + regex_vulns
        
        # Deduplicate by line + title
        seen = set()
        unique_vulns = []
        for v in all_vulns:
            key = (v.line, v.title)
            if key not in seen:
                seen.add(key)
                unique_vulns.append(v)
        
        return unique_vulns
    
    @staticmethod
    def _regex_analysis(code: str) -> List[Vulnerability]:
        """Supplement AST analysis with regex-based pattern matching."""
        vulnerabilities = []
        lines = code.split('\n')
        counter = 100
        
        for i, line in enumerate(lines, 1):
            # Check for debug mode
            if re.search(r'app\.run\(.*debug\s*=\s*True', line, re.IGNORECASE):
                counter += 1
                vulnerabilities.append(Vulnerability(
                    id=f"vuln-{counter}",
                    title=RULES["debug_mode"].name,
                    severity=RULES["debug_mode"].severity,
                    vulnerability_type=RULES["debug_mode"].vulnerability_type,
                    line=i,
                    column=line.find('debug'),
                    description=RULES["debug_mode"].description,
                    cwe_id=RULES["debug_mode"].cwe_id,
                    cwe_name=RULES["debug_mode"].cwe_name,
                    recommendation=RULES["debug_mode"].recommendation,
                    confidence_score=0.9,
                    source_snippet=line.strip(),
                ))
            
            # Check for secrets
            is_fp = any(re.search(fp, line) for fp in FALSE_POSITIVE_PATTERNS)
            
            for pattern in SECRET_PATTERNS:
                if not is_fp and re.search(pattern, line):
                    counter += 1
                    vulnerabilities.append(Vulnerability(
                        id=f"vuln-{counter}",
                        title=RULES["hardcoded_secret"].name,
                        severity=RULES["hardcoded_secret"].severity,
                        vulnerability_type=VulnerabilityType.HARDCODED_SECRET,
                        line=i,
                        column=0,
                        description=f"Potential hardcoded secret or credential detected on line {i}.",
                        cwe_id=RULES["hardcoded_secret"].cwe_id,
                        cwe_name=RULES["hardcoded_secret"].cwe_name,
                        recommendation=RULES["hardcoded_secret"].recommendation,
                        confidence_score=0.8,
                        source_snippet=line.strip(),
                    ))
                    break
            
            # Check for JS specific: eval()
            if re.search(r'\beval\s*\(', line):
                counter += 1
                vulnerabilities.append(Vulnerability(
                    id=f"vuln-{counter}",
                    title="Unsafe use of eval()",
                    severity=SeverityLevel.CRITICAL,
                    vulnerability_type=VulnerabilityType.COMMAND_INJECTION,
                    line=i,
                    column=line.find('eval'),
                    description="The eval() function is extremely dangerous as it can execute arbitrary code with the privileges of the caller.",
                    cwe_id="CWE-95",
                    cwe_name="Improper Neutralization of Directives in Dynamically Evaluated Code",
                    recommendation="Avoid eval(). Use safer alternatives like JSON.parse() or specific functional logic.",
                    confidence_score=0.9,
                    source_snippet=line.strip(),
                ))

            # Check for JS specific: innerHTML
            if re.search(r'\.innerHTML\s*=', line):
                counter += 1
                vulnerabilities.append(Vulnerability(
                    id=f"vuln-{counter}",
                    title="Potential XSS via innerHTML",
                    severity=SeverityLevel.HIGH,
                    vulnerability_type=VulnerabilityType.XSS,
                    line=i,
                    column=line.find('.innerHTML'),
                    description="Directly setting innerHTML can lead to Cross-Site Scripting (XSS) if the data is not sanitized.",
                    cwe_id="CWE-79",
                    cwe_name="Cross-site Scripting",
                    recommendation="Use textContent or innerText instead, or sanitize the HTML before insertion.",
                    confidence_score=0.8,
                    source_snippet=line.strip(),
                ))
            
            # Check for weak crypto (Python & JS)
            if re.search(r'hashlib\.md5\(|hashlib\.sha1\(|MD5|SHA1|crypto\.createHash\([\"\']md5[\"\']\)', line, re.IGNORECASE):
                counter += 1
                vulnerabilities.append(Vulnerability(
                    id=f"vuln-{counter}",
                    title=RULES["weak_crypto"].name,
                    severity=RULES["weak_crypto"].severity,
                    vulnerability_type=RULES["weak_crypto"].vulnerability_type,
                    line=i,
                    column=0,
                    description=RULES["weak_crypto"].description,
                    cwe_id=RULES["weak_crypto"].cwe_id,
                    cwe_name=RULES["weak_crypto"].cwe_name,
                    recommendation=RULES["weak_crypto"].recommendation,
                    confidence_score=0.85,
                    source_snippet=line.strip(),
                ))
        
        return vulnerabilities
    
    @staticmethod
    def calculate_security_score(vulnerabilities: List[Vulnerability], total_lines: int) -> int:
        """Calculate a security score from 0-100 based on findings."""
        if not vulnerabilities:
            return 100
        
        severity_weights = {
            SeverityLevel.CRITICAL: 20,
            SeverityLevel.HIGH: 10,
            SeverityLevel.MEDIUM: 5,
            SeverityLevel.LOW: 2,
            SeverityLevel.INFO: 0,
        }
        
        total_penalty = sum(
            severity_weights.get(v.severity, 0) for v in vulnerabilities
        )
        
        # Normalize by lines of code
        normalized_penalty = min(total_penalty, 80)
        
        score = max(0, 100 - normalized_penalty)
        return round(score)


def analyze_code(code: str, language: str = "python") -> Tuple[List[Vulnerability], int]:
    """Main entry point for code analysis."""
    if language.lower() == "python":
        vulns = ASTAnalyzer.analyze_python(code)
    else:
        # For non-Python, use regex-based analysis
        vulns = ASTAnalyzer._regex_analysis(code)
    
    total_lines = len(code.split('\n'))
    score = ASTAnalyzer.calculate_security_score(vulns, total_lines)
    
    return vulns, score
