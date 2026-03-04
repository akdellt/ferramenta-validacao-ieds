from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import TypeVar, Callable
from app.schemas import ArquivoOA, ArquivoIED, ConjuntoPares, RelatorioValidacoes, ParArquivos
from app.services.leitura import leitura_oa, leitura_ied
from app.services.comparador import processar_arquivos
from app.exceptions import InvalidFileFormatError

router = APIRouter(
    prefix="/processamento", 
    tags=["Processamento"]
)

T = TypeVar('T')

async def processar_arquivos_upload(
        arquivos: list[UploadFile],
        extensoes_validas: tuple[str, ...],
        func_leitura: Callable[[bytes, str], T],
        nome_padrao: str
) -> list[T]:
    resultados = []
    
    for arquivo in arquivos:
        nome_arquivo = (arquivo.filename or "").lower()
        
        # Validar extensão
        if not nome_arquivo.endswith(extensoes_validas):
            raise InvalidFileFormatError(
                nome_arquivo=arquivo.filename or nome_padrao,
                formatos_aceitos=", ".join(extensoes_validas)
            )
    
        conteudo = await arquivo.read()
        nome_real = arquivo.filename or nome_padrao
        
        dados = func_leitura(conteudo, nome_real)
        resultados.append(dados)
    
    return resultados

# ROTA DE LER ARQUIVOS DO EXCEL
@router.post("/ler-oas", response_model=list[ArquivoOA])
async def ler_ordens_ajuste(arquivos: list[UploadFile] = File(...)):
    return await processar_arquivos_upload(
        arquivos=arquivos,
        extensoes_validas=(".xlsx", ".xls"),
        func_leitura=leitura_oa,
        nome_padrao="sem_nome.xlsx"
    )

# ROTA DE LER ARQUIVOS DOS IEDS
@router.post("/ler-ieds", response_model=list[ArquivoIED])
async def ler_arquivos_ied(arquivos: list[UploadFile] = File(...)):
    return await processar_arquivos_upload(
        arquivos=arquivos,
        extensoes_validas=(".txt",),
        func_leitura=leitura_ied,
        nome_padrao="sem_nome.txt"
    )

# ROTA DE VALIDAR PARES
@router.post("/validar-pares", response_model=RelatorioValidacoes)
async def validar_pares(lista_oas: list[UploadFile] = File(...), lista_ieds: list[UploadFile] = File(...)):
    
    if len(lista_oas) != len(lista_ieds):
        raise HTTPException(
            status_code=400, 
            detail=f"Quantidade incompatível: Recebido {len(lista_oas)} OAs e {len(lista_ieds)} IEDs."
        )

    lista_pares_montados = []

    # 2. Iterar sobre as duas listas simultaneamente usando zip()
    for arquivo_oa, arquivo_ied in zip(lista_oas, lista_ieds):
        await arquivo_oa.seek(0)
        conteudo_oa = await arquivo_oa.read()
        dados_oa = leitura_oa(conteudo_oa, arquivo_oa.filename or "sem_nome.xlsx")

        await arquivo_ied.seek(0)
        conteudo_ied = await arquivo_ied.read()
        dados_ied = leitura_ied(conteudo_ied, arquivo_ied.filename or "sem_nome.txt")

        par = ParArquivos(oa=dados_oa, ied=dados_ied)
        lista_pares_montados.append(par)
        
    lote_pronto = ConjuntoPares(pares=lista_pares_montados)

    relatorio = processar_arquivos(lote_pronto)
    
    return relatorio