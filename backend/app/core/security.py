from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import logging

ph = PasswordHasher()

def get_password_hash(password: str) -> str:
    try:
        return ph.hash(password)
    except Exception as e:
        logging.error(f"Erro ao gerar hash: {e}")
        raise e

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False
    except Exception as e:
        logging.error(f"Erro na verificação de senha: {e}")
        return False