import socket
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import NetworkIED

router = APIRouter(
    prefix="/health",
    tags=["Health"]
)

@router.get("")
def health():
    return {"status": "ok"}

@router.get("/network")
def check_network(db: Session = Depends(get_db)):
    ieds = db.query(NetworkIED).limit(3).all()

    if not ieds:
        return {"online": False, "reason": "Nenhum IED cadastrado"}

    for ied in ieds:
        try:
            port = 23 if ied.connection_type == "TELNET" else 21
            sock = socket.create_connection((ied.ip_address, port), timeout=2)
            sock.close()
            return {"online": True}
        except Exception:
            continue

    return {"online": False, "reason": "Nenhum IED acessível"}