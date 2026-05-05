import pickle
import base64
from flask import request

# VULNERABILITY 6: Vulnerable Dependency / Insecure Deserialization
# CWE-502: Deserialization of Untrusted Data

def load_user_session():
    session_data = request.cookies.get('session_data')
    if session_data:
        # Dangerous: Unpickling untrusted data can lead to Arbitrary Code Execution (RCE)
        decoded_data = base64.b64decode(session_data)
        user_object = pickle.loads(decoded_data)
        return user_object
    return None
