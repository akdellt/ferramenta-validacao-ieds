from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas import ArquivoOA, ArquivoIED, ConjuntoPares, RelatorioValidacoes, ParArquivos
from app.services.leitura import leitura_oa, leitura_ied
from app.services.comparador import processar_arquivos
from typing import TypeVar, Callable

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
    erros = []
    arquivos_invalidos = []
    
    for arquivo in arquivos:
        nome_arquivo = (arquivo.filename or "").lower()
        
        # Validar extensão
        if not nome_arquivo.endswith(extensoes_validas):
            arquivos_invalidos.append(arquivo.filename or "Arquivo sem nome")
            continue
        
        try:
            conteudo = await arquivo.read()
            nome_real = arquivo.filename or nome_padrao
            dados = func_leitura(conteudo, nome_real)
            resultados.append(dados)
        except Exception as e:
            print(f"Erro ao processar {arquivo.filename}: {e}")
            erros.append(arquivo.filename or "Arquivo desconhecido")
    
    # Tratamento de erros consolidado
    if not resultados:
        if arquivos_invalidos:
            raise HTTPException(
                status_code=400,
                detail=f"Nenhum arquivo válido. Extensões aceitas: {extensoes_validas}. Recebidos: {arquivos_invalidos}"
            )
        if erros:
            raise HTTPException(
                status_code=400,
                detail=f"Falha ao processar arquivos: {erros}"
            )
        raise HTTPException(
            status_code=400,
            detail="Nenhum arquivo foi enviado"
        )
    
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
        try:
            # --- PROCESSAMENTO DA OA ---
            # Resetar ponteiro do arquivo (boas práticas) e ler bytes
            await arquivo_oa.seek(0)
            conteudo_oa = await arquivo_oa.read()
            # Converte bytes -> Objeto ArquivoOA
            dados_oa = leitura_oa(conteudo_oa, arquivo_oa.filename or "sem_nome.xlsx")

            # --- PROCESSAMENTO DO IED ---
            await arquivo_ied.seek(0)
            conteudo_ied = await arquivo_ied.read()
            # Converte bytes -> Objeto ArquivoIED
            dados_ied = leitura_ied(conteudo_ied, arquivo_ied.filename or "sem_nome.txt")

            # --- MONTAGEM DO PAR ---
            # Cria o objeto ParArquivos que o comparador espera
            par = ParArquivos(oa=dados_oa, ied=dados_ied)
            lista_pares_montados.append(par)

        except Exception as e:
            # Se um par falhar na leitura, paramos tudo e avisamos
            raise HTTPException(
                status_code=400, 
                detail=f"Erro ao processar par ({arquivo_oa.filename} + {arquivo_ied.filename}): {str(e)}"
            )

    # 3. Criar o objeto ConjuntoPares
    lote_pronto = ConjuntoPares(pares=lista_pares_montados)

    # 4. Chamar a função de validação existente (sem precisar alterar o comparador.py)
    relatorio = processar_arquivos(lote_pronto)
    
    return relatorio