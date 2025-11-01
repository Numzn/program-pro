from passlib.context import CryptContext


# Use bcrypt without deprecated="auto" to force the scheme
# The "auto" flag causes passlib to select bcrypt_sha256, which has issues
pwd_context = CryptContext(schemes=["bcrypt"])


def hash_password(password: str) -> str:
    """Hash a password using bcrypt, handling long passwords."""
    # Ensure password is <= 72 bytes for bcrypt compatibility
    password_bytes = password.encode('utf-8')
    original_len = len(password_bytes)
    if original_len > 72:
        password_bytes = password_bytes[:72]
        password = password_bytes.decode('utf-8', 'ignore')
        print(f"⚠️  Password truncated from {original_len} to {len(password)} bytes")
    
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    # Truncate the same way during verification
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
        plain_password = password_bytes.decode('utf-8', 'ignore')
    
    return pwd_context.verify(plain_password, hashed_password)

