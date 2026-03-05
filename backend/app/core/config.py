import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MASTER_USER_REGISTRATION: str = os.getenv("MASTER_USER_REGISTRATION", "Admin")
    MASTER_USER_NAME: str = os.getenv("MASTER_USER_NAME", "ADMIN_EQUATORIAL")
    MASTER_USER_PASSWORD: str = os.getenv("MASTER_USER_PASSWORD", "mudar123")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./local_test.db")

settings = Settings()