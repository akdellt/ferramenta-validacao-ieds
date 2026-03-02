from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from .. import models
from ..database import get_db

router = APIRouter(
    prefix="/auth", 
    tags=["Autenticação"]
)

class UserLogin(BaseModel):
    registration: str
    password: str

@router.post("/login")
async def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.registration == data.registration).first()
    
    if not user or user.hashed_password != data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Matrícula ou senha incorretos"
        )
    
    return {
        "registration": user.registration,
        "name": user.full_name,
        "role": user.role,
        "token": "fake-jwt-token" 
    }