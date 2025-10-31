from passlib.context import CryptContext


# Use bcrypt_sha256 to handle passwords longer than 72 bytes
# This automatically pre-hashes passwords with SHA-256 before applying bcrypt
# Works with bcrypt 5.0.0+ which enforces 72-byte limit
pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt_sha256 (bcrypt with SHA-256 pre-hash).
    
    This scheme handles passwords of any length by:
    1. Pre-hashing with SHA-256
    2. Then applying bcrypt
    Works with bcrypt 5.0.0+ which enforces 72-byte limit.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.
    
    Works with bcrypt_sha256 hashed passwords.
    """
    return pwd_context.verify(plain_password, hashed_password)

