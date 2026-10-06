import pytest
from app.utils.security import verify_password, get_password_hash, create_access_token, decode_access_token

def test_password_hashing():
    pwd = "SecurePassword@123"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_creation_and_decoding():
    user_id = 42
    role = "candidate"
    token = create_access_token(subject=user_id, role=role)
    assert token is not None
    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == str(user_id)
    assert payload.get("role") == role
