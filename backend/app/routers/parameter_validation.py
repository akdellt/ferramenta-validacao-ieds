from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from collections.abc import Callable
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.parameters import *
from app.services.parameter_module.parameter_parser import parse_oa_file, parse_ied_file
from app.services.parameter_module.comparator import process_files
from app.services.network_module.network_client import search_ied
from app.exceptions import InvalidFileFormatError
from app.models import NetworkIED
import json

router = APIRouter(
    prefix="/relays", 
    tags=["Parameter Validation"]
)

async def process_upload_files[T](
        files: list[UploadFile],
        valid_extensions: tuple[str, ...],
        read_func: Callable[[bytes, str], T],
        default_name: str
) -> list[T]:
    results = []
    
    for file in files:
        filename = (file.filename or "").lower()
        
        if not filename.endswith(valid_extensions):
            raise InvalidFileFormatError(
                filename=file.filename or default_name,
                accepted_formats=", ".join(valid_extensions)
            )
    
        content = await file.read()
        real_name = file.filename or default_name
        
        data = read_func(content, real_name)
        results.append(data)
    
    return results

# ROTA DE LER ARQUIVOS DO EXCEL
@router.post("/read-oa", response_model=list[OAFilesData])
async def read_oa_files(files: list[UploadFile] = File(...)):
    return await process_upload_files(
        files=files,
        valid_extensions=(".xlsx", ".xls"),
        read_func=parse_oa_file,
        default_name="unnamed_oa.xlsx"
    )

# ROTA DE LER ARQUIVOS DOS IEDS
@router.post("/read-ied", response_model=list[IEDFilesData])
async def read_ied_files(files: list[UploadFile] = File(...)):
    return await process_upload_files(
        files=files,
        valid_extensions=(".txt",),
        read_func=parse_ied_file,
        default_name="unnamed_ied.txt"
    )

# ROTA DE VALIDAR PARES
@router.post("/validate-pairs", response_model=ValidationReport)
async def validate_pairs(oa_list: list[UploadFile] = File(...), ied_data: str = Form(...)):
    
    try:
        ied_json_list = json.loads(ied_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Formato de ied_data inválido.")

    if len(oa_list) != len(ied_json_list):
        raise HTTPException(
            status_code=400, 
            detail=f"Quantidade incompatível: {len(oa_list)} OAs e {len(ied_json_list)} IEDs."
        )

    mounted_pairs = []

    for oa_file, ied_dict in zip(oa_list, ied_json_list):
        await oa_file.seek(0)
        oa_content = await oa_file.read()
        oa_data = parse_oa_file(oa_content, oa_file.filename or "sem_nome.xlsx")

        try:
            ied_structured_data = IEDFilesData(**ied_dict) 
        except Exception as e:
            raise HTTPException(
                status_code=422, 
                detail=f"Dados do IED incompatíveis com IEDFilesData: {str(e)}"
            )

        pair = FilePair(oa=oa_data, ied=ied_structured_data)
        mounted_pairs.append(pair)
        
    full_set = FilePairSet(pairs=mounted_pairs)
    report = process_files(full_set)
    
    return report

# ROTA DE BUSCAR DADOS PELA REDE
@router.get("/search-network/{ied_name}", response_model=IEDFilesData)
async def fetch_ied_from_network(ied_name: str, db: Session = Depends(get_db)):
    ied = db.query(NetworkIED).filter(NetworkIED.name == ied_name).first()

    if not ied:
        raise HTTPException(
            status_code=404,
            detail=f"IED {ied_name} não encontrado."
        )
    
    try:
        raw_content, remote_filename = await search_ied(ied)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Falha de conexão com o IED (Rede): {str(e)}"
        )

    try:
        parsed_data = parse_ied_file(raw_content.encode("latin-1", errors="ignore"), remote_filename)
        return parsed_data
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Erro ao interpretar dados do IED: {str(e)}"
        )
    
# ROTA DE BUSCAR TODOS OS IPS DOS IEDS CADASTRADOS (MAPA DE IPS)
@router.get("/network-ieds", response_model=list[NetworkIEDSchema])
def get_all_network_ieds(db: Session = Depends(get_db)):
    ieds = db.query(NetworkIED).all()
    return ieds