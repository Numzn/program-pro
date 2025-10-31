from passlib.context import CryptContext


# Use regular bcrypt but manually handle long passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt, truncating if necessary.
    
    Bcrypt 5.0+ enforces 72-byte limit, so we truncate longer passwords.
    """
    # Truncate password to 72 bytes for bcrypt compatibility
    if len(password.encode('utf-8')) > 72:
        # Convert to bytes, truncate, then back to string
        password_bytes = password.encode('utf-8')[:72]
        # Try to decode back to string, replacing invalid characters
        password = password_bytes.decode('utf-8', 'ignore')
        print(f"⚠️  Password truncated from {len(password)} chars to fit 72 bytes")
    
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.
    
    For verification, we need to truncate the same way as hashing.
    """
    # Truncate password to 72 bytes if necessary (matching hash_password logic)
    if len(plain_password.encode('utf-8')) > 72:
        password_bytes = plain_password.encode('utf-8')[:72]
        plain_password = password_bytes.decode('utf-8', 'ignore')
    
    return pwd_context.verify(plain_password, hashed_password)

