from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # DADOS DO USUÁRIO MASTER
    MASTER_USER_REGISTRATION: str = "Admin"
    MASTER_USER_NAME: str = "ADMIN_EQUATORIAL"
    MASTER_USER_PASSWORD: str = "mudar123"

    # BANCO DE DADOS ---
    DATABASE_URL: str = "sqlite:///./local_test.db"

    # GERENCIADOR DE SENHAS
    VAULT_API_URL: str = "https://api.vault-empresa.com/v1"
    VAULT_CLIENT_ID: str = "app_id"
    VAULT_CLIENT_SECRET: str = "chave_secreta"
    VAULT_AUTH_ENDPOINT: str = "/auth/token"
    VAULT_SECRET_ENDPOINT: str = "/secrets"
    VAULT_SECRET_KEY: str = "password"

    # CREDENCIAIS GERAIS DOS IEDS
    IED_USER: str = "2AC"
    IED_PASSWORD: str = "OTTER"

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()