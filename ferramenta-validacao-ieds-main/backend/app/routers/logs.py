from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, parameters
from ..database import get_db

router = APIRouter(
    prefix="/logs", 
    tags=["Histórico"]
)

# SALVAR UM NOVO HISTÓRICO
@router.post("/", response_model=parameters.ValidationLogResponse, status_code=status.HTTP_201_CREATED)
def create_log(log: parameters.ValidationLogCreate, db: Session = Depends(get_db)):
    db_log = models.ValidationLog(**log.model_dump())
    
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    return db_log

# LISTAR TODOS (PARA A TABELA)
@router.get("/", response_model=list[parameters.ValidationLogResponse])
def get_log_list(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logs = db.query(models.ValidationLog).order_by(models.ValidationLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs

# PEGAR UM ESPECÍFICO (DETALHES)
@router.get("/{log_id}", response_model=parameters.ValidationLogResponse)
def get_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(models.ValidationLog).filter(models.ValidationLog.id == log_id).first()
    
    if log is None:
        raise HTTPException(status_code=404, detail="Log de validação não encontrado")
    
    return log