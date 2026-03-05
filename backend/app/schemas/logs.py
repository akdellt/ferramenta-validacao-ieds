from datetime import datetime
from pydantic import BaseModel, ConfigDict

# BASE DE INFORMAÇÕES A SEREM ENVIADAS PARA O BANCO DE DADOS
class ValidationLogBase(BaseModel):
    substation: str
    relay_model: str
    filename_oa: str
    filename_ied: str
    status: str
    user_registration: str | None = None
    result_json: list[dict[str, object]] 

# SCHEMA DE CRIAÇÃO DE HISTÓRICO
class ValidationLogCreate(ValidationLogBase):
    pass 

# SCHEMA DE RESPOSTA DE DADOS DO HISTÓRICO PARA INTERFACE
class ValidationLogResponse(ValidationLogBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# INFORMAÇÕES DE LOGIN
class UserLogin(BaseModel):
    registration: str
    password: str