from fastapi import APIRouter, UploadFile, File, HTTPException
from collections.abc import Callable
from app.schemas.parameters import *
from app.services.parameter_parser import parse_oa_file, parse_ied_file
from app.services.comparator import process_files
from app.exceptions import InvalidFileFormatError

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
async def ler_ordens_ajuste(files: list[UploadFile] = File(...)):
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
async def validate_pairs(oa_list: list[UploadFile] = File(...), ied_list: list[UploadFile] = File(...)):
    
    if len(oa_list) != len(ied_list):
        raise HTTPException(
            status_code=400, 
            detail=f"Quantidade incompatível: Recebido {len(oa_list)} OAs e {len(ied_list)} IEDs."
        )

    mounted_pairs = []

    for oa_file, ied_file in zip(oa_list, ied_list):
        await oa_file.seek(0)
        oa_content = await oa_file.read()
        oa_data = parse_oa_file(oa_content, oa_file.filename or "sem_nome.xlsx")

        await ied_file.seek(0)
        ied_content = await ied_file.read()
        ied_data = parse_ied_file(ied_content, ied_file.filename or "sem_nome.txt")

        pair = FilePair(oa=oa_data, ied=ied_data)
        mounted_pairs.append(pair)
        
    full_set = FilePairSet(pairs=mounted_pairs)

    report = process_files(full_set)
    
    return report