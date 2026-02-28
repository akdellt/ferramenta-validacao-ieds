from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/historico", 
    tags=["Histórico"]
)

# --- ROTA 1: SALVAR UM NOVO HISTÓRICO ---
@router.post("/", response_model=schemas.ValidationLogResponse, status_code=status.HTTP_201_CREATED)
def criar_historico(log: schemas.ValidationLogCreate, db: Session = Depends(get_db)):
    db_log = models.ValidationLog(**log.model_dump())
    
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    return db_log

# --- ROTA 2: LISTAR TODOS (PARA A TABELA) ---
@router.get("/", response_model=List[schemas.ValidationLogResponse])
def ler_historico(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logs = db.query(models.ValidationLog).offset(skip).limit(limit).all()
    return logs

# --- ROTA 3: PEGAR UM ESPECÍFICO (DETALHES) ---
@router.get("/{log_id}", response_model=schemas.ValidationLogResponse)
def read_history_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(models.ValidationLog).filter(models.ValidationLog.id == log_id).first()
    
    if log is None:
        raise HTTPException(status_code=404, detail="Log de validação não encontrado")
    
    return log