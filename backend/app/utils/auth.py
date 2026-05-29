import base64
import json
import hmac
import hashlib
import time
from typing import Optional, Dict, Any

# Secure salt generation and HMAC signing key
SECRET_KEY = "asurada_super_secret_jwt_key_2026"

def b64_encode(data: bytes) -> str:
    """Url-safe base64 encoding without padding character '='."""
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def b64_decode(data: str) -> bytes:
    """Url-safe base64 decoding with restored padding."""
    padding = '=' * (4 - len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)

def hash_password(password: str, salt: str) -> str:
    """
    PBKDF2-SHA256 password hashing helper utilizing Python standard hashlib.
    """
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return dk.hex()

def generate_salt() -> str:
    """Generates a secure random salt."""
    import secrets
    return secrets.token_hex(16)

def verify_password(password: str, salt: str, hashed: str) -> bool:
    """Verifies a password against the stored salt and hash."""
    return hash_password(password, salt) == hashed

def create_access_token(username: str, role: str, expires_in_seconds: int = 86400) -> str:
    """
    Creates a signed access token in standard JWT structure (Header.Payload.Signature) 
    using standard libraries and HMAC-SHA256 signature verification.
    """
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": username,
        "role": role,
        "exp": int(time.time()) + expires_in_seconds
    }
    
    header_encoded = b64_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_encoded = b64_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    
    signing_input = f"{header_encoded}.{payload_encoded}"
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input.encode('utf-8'), hashlib.sha256).digest()
    signature_encoded = b64_encode(signature)
    
    return f"{header_encoded}.{payload_encoded}.{signature_encoded}"

def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and verifies a token signature. Returns payload claims dictionary if valid and non-expired.
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
            
        header_encoded, payload_encoded, signature_encoded = parts
        
        # Verify signature
        signing_input = f"{header_encoded}.{payload_encoded}"
        expected_signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input.encode('utf-8'), hashlib.sha256).digest()
        expected_signature_encoded = b64_encode(expected_signature)
        
        if not hmac.compare_digest(signature_encoded.encode('utf-8'), expected_signature_encoded.encode('utf-8')):
            return None
            
        # Parse payload
        payload_bytes = b64_decode(payload_encoded)
        payload = json.loads(payload_bytes.decode('utf-8'))
        
        # Check expiration
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload
    except Exception:
        return None
