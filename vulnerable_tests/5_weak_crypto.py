import hashlib

# VULNERABILITY 5: Deprecated API Usage (Weak Cryptography)
# CWE-327: Use of a Broken or Risky Cryptographic Algorithm

def hash_user_password(password: str) -> str:
    # Dangerous: MD5 is cryptographically broken and vulnerable to collision attacks
    hasher = hashlib.md5()
    hasher.update(password.encode('utf-8'))
    return hasher.hexdigest()

def verify_password(stored_hash: str, input_password: str) -> bool:
    return stored_hash == hash_user_password(input_password)
