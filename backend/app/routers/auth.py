from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..schemas import logs
from ..core.security import verify_password

from .. import models
from ..database import get_db

router = APIRouter(
    prefix="/auth", 
    tags=["Authentication"]
)

@router.post("/login")
async def login(data: logs.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.registration == data.registration).first()
    
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Matrícula ou senha incorretos"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    
    return {
        "registration": user.registration,
        "name": user.name,
        "role": user.role,
        "token": "fake-jwt-token",
        "is_active": user.is_active
    }