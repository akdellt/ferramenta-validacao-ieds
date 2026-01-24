from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from app.schemas import ArquivoOA, ArquivoIED, ConjuntoPares, RelatorioValidacoes
from app.services.leitura import leitura_oa, leitura_ied
from app.services.comparador import processar_arquivos

router = APIRouter(
    prefix="/processamento", 
    tags=["Processamento"]
)


# ROTA DE LER ARQUIVOS DO EXCEL
@router.post("/ler-oas", response_model=list[ArquivoOA])
async def ler_ordens_ajuste(arquivos: list[UploadFile] = File(...)):
    resultados = []
    erros = []

    for arquivo in arquivos:
        nome_arquivo = (arquivo.filename or "").lower()

        if not nome_arquivo.endswith((".xlsx", ".xls")):
            continue

        try:
            conteudo = await arquivo.read()
            nome_real = arquivo.filename or "sem_nome.xlsx" # Param não pode ser vazio

            dados = leitura_oa(conteudo, nome_real)
            resultados.append(dados)
        except Exception as e:
            print(f"Erro ao ler {arquivo.filename}: {e}")
            erros.append(arquivo.filename or "Arquivo desconhecido")

    if not resultados and erros:
        raise HTTPException(status_code=400, detail=f"Falha ao ler arquivos: {erros}")
    
    return resultados

# ROTA DE LER ARQUIVOS DOS IEDS
@router.post("/ler-ieds", response_model=list[ArquivoIED])
async def ler_arquivos_ied(arquivos: list[UploadFile] = File(...)):
    resultados = []
    erros = []

    for arquivo in arquivos:
        nome_arquivo = (arquivo.filename or "").lower()

        if not nome_arquivo.endswith('.txt'):
            continue

        try:
            conteudo = await arquivo.read()
            nome_real = arquivo.filename or "sem_nome.xlsx"

            dados = leitura_ied(conteudo, nome_real)
            resultados.append(dados)
        except Exception as e:
            print(f"Erro ao ler {arquivo.filename}: {e}")
            erros.append(arquivo.filename or "Arquivo desconhecido")

    if not resultados and erros:
        raise HTTPException(status_code=400, detail=f"Falha ao ler arquivos: {erros}")
    
    return resultados

# ROTA DE VALIDAR PARES
@router.post("/validar-pares", response_model=RelatorioValidacoes)
def validar_pares(lote: ConjuntoPares = Body(...)):
    relatorio = processar_arquivos(lote)
    return relatorio