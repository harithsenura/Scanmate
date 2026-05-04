import re

SECRET_PATTERNS = [
    r'(?i)(api[_-]?key\s*=\s*[\"\'][^\"\']+[\"\'])',
    r'(?i)(password\s*=\s*[\"\'][^\"\']+[\"\'])',
    r'(?i)(secret\s*=\s*[\"\'][^\"\']+[\"\'])',
    r'(?i)(token\s*=\s*[\"\'][^\"\']+[\"\'])',
]

test_line = "const password = 'admin';"
for pattern in SECRET_PATTERNS:
    if re.search(pattern, test_line):
        print(f"Match found for: {pattern}")
    else:
        print(f"No match for: {pattern}")
