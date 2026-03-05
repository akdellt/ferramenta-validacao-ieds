from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..schemas import logs
from .. import models
from ..database import get_db

router = APIRouter(
    prefix="/logs", 
    tags=["Validation History"]
)

# SALVAR UM NOVO HISTÓRICO
@router.post("/", response_model=logs.ValidationLogResponse, status_code=status.HTTP_201_CREATED)
def create_log(log_data: logs.ValidationLogCreate, db: Session = Depends(get_db)):
    db_log = models.ValidationLog(**log_data.model_dump())
    
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    return db_log

# LISTAR TODOS (PARA A TABELA)
@router.get("/", response_model=list[logs.ValidationLogResponse])
def get_log_list(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    history_logs = db.query(models.ValidationLog)\
        .order_by(models.ValidationLog.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    return history_logs

# PEGAR UM ESPECÍFICO (DETALHES)
@router.get("/{log_id}", response_model=logs.ValidationLogResponse)
def get_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(models.ValidationLog).filter(models.ValidationLog.id == log_id).first()
    
    if log is None:
        raise HTTPException(status_code=404, detail="Log de validação não encontrado")
    
    return log