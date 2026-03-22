from app.database import SessionLocal, engine
from app import models
from app.models import NetworkIED

def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # LISTA DE IEDS
    ieds_to_add = [
        {
            "name": "CLP_02T2", 
            "substation": "CLP", 
            "component_name": "02T2", 
            "relay_model": "SEL 2414", 
            "ip_address": "host.docker.internal", 
            "connection_type": "FTP"
        },
        {
            "name": "ITAQUI_12L1", 
            "substation": "CLP", 
            "component_name": "12L1", 
            "relay_model": "SEL 311C", 
            "ip_address": "192.168.1.41",
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