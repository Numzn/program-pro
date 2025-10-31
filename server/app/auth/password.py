from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bcrypt has a 72-byte limit for passwords
MAX_PASSWORD_LENGTH = 72


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Bcrypt has a 72-byte limit, so we truncate if necessary.
    Note: In production, you should validate password length at the API level.
    """
    # Truncate to 72 bytes if password is longer
    if len(password.encode('utf-8')) > MAX_PASSWORD_LENGTH:
        password = password[:MAX_PASSWORD_LENGTH]
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.
    
    Truncates password to 72 bytes if necessary to match bcrypt limitation.
    """
    # Truncate to 72 bytes if password is longer (for verification)
    if len(plain_password.encode('utf-8')) > MAX_PASSWORD_LENGTH:
        plain_password = plain_password[:MAX_PASSWORD_LENGTH]
    return pwd_context.verify(plain_password, hashed_password)

