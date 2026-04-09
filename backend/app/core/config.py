from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # BANCO DE DADOS
    DATABASE_URL: str = "sqlite:///./local_test.db"

    # CREDENCIAIS GERAIS DOS IEDS
    IED_USER: str = Field(..., alias="IED_USER") 
    IED_PASSWORD: str = Field(..., alias="IED_PASSWORD")

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()