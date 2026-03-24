import sys
import os

sys.path.append(os.getcwd())

from app.database import SessionLocal, engine
from app import models
from app.models import NetworkIED

def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # LISTA DE IEDS
    ieds_to_add = [
        {
            "name": "SLZ_13T1", 
            "substation": "SLZ", 
            "component_name": "13T1", 
            "relay_model": "SEL 751", 
            "ip_address": "10.9.24.110", 
            "connection_type": "FTP"
        },
        {
            "name": "SLZ_13T2", 
            "substation": "SLZ", 
            "component_name": "13T2", 
            "relay_model": "SEL 751", 
            "ip_address": "10.9.24.110",
            "connection_type": "TELNET"
        },
    ]

    try:
        print("Limpando tabela antiga")
        db.query(NetworkIED).delete() 
        db.commit()

        for data in ieds_to_add:
            exists = db.query(NetworkIED).filter(NetworkIED.name == data["name"]).first()
            if not exists:
                new_ied = NetworkIED(**data)
                db.add(new_ied)
                print(f"IED {data['name']} adicionado")
            else:
                print(f"IED {data['name']} já existe, pulando")
        
        db.commit()
        print("\nIeds inseridos")
    except Exception as e:
        db.rollback()
        print(f"Erro ao popular banco: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()