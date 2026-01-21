from pydantic import BaseModel

# CADA OA SO TEM UM IED
# DADOS DIVERSOS A SEREM EXTRAÍDOS DA ORDEM DE AJUSTE
class ParametroReferencia(BaseModel):
    grupo: str
    parametro: str
    descricao: str
    faixa_ajuste: str
    ajuste_referencia: str

# DADOS DIVERSOS A SEREM EXTRAÍDOS DO ARQUIVO DO IED
class ParametroAtual(BaseModel):
    parametro: str
    valor_atual: str

# DADOS FIXOS A SEREM EXTRAÍDOS DA OA
class ArquivoOA(BaseModel):
    nome_arquivo: str
    tamanho: int
    subestacao: str
    rele_marca: str
    modelo: str
    parametros: list[ParametroReferencia]
    
# DADOS FIXOS A SEREM EXTRAÍDOS DO ARQUIVO DO IED
class ArquivoIED(BaseModel):
    nome_arquivo: str
    tamanho: int
    rele_tipo: str
    parametros: list[ParametroAtual] 

# DADOS RELEVANTES DE CADA PARÂMETRO DA IED ANALISADO
class IEDItem(BaseModel):
    grupo: str
    parametro: str
    descricao: str
    faixa_ajuste: str
    ajuste_referencia: str
    valor_atual: str
    status: str

# TODOS OS RESULTADOS/LINHAS PÓS VALIDAÇÃO DO RELÉ ESPECÍFICO
class ResultadoValidacao(BaseModel):
    rele_tipo: str
    lista_parametros: list[IEDItem]

# TODOS OS RESULTADOS DE TODOS OS RELÉS
class RelatorioValidacoes(BaseModel):
    resultados: list[ResultadoValidacao]
    

