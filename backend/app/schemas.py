from typing import Optional
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class StatusParametro(str, Enum):
    CONFORME = "Conforme"
    DIVERGENTE = "Divergente"
    NAO_ENCONTRADO = "Não encontrado"
    NAO_APLICAVEL = "Não aplicável"

# CADA OA SO TEM UM IED
# DADOS DIVERSOS A SEREM EXTRAÍDOS DA ORDEM DE AJUSTE
class ParametroReferencia(BaseModel):
    grupo: str
    parametro: str
    descricao: Optional[str] = ""
    faixa_ajuste: Optional[str] = ""
    ajuste_referencia: str

# DADOS DIVERSOS A SEREM EXTRAÍDOS DO ARQUIVO DO IED
class ParametroAtual(BaseModel):
    parametro: str
    valor_atual: str

# DADOS FIXOS A SEREM EXTRAÍDOS DA OA
class ArquivoOA(BaseModel):
    nome_arquivo: str
    subestacao: str
    rele_tipo: str
    parametros: list[ParametroReferencia]
    
# DADOS FIXOS A SEREM EXTRAÍDOS DO ARQUIVO DO IED
class ArquivoIED(BaseModel):
    nome_arquivo: str
    rele_tipo: str
    parametros: list[ParametroAtual] 

# DADOS RELEVANTES DE CADA PARÂMETRO DA IED ANALISADO
class IEDItem(ParametroReferencia):
    valor_atual: str
    status: StatusParametro

# TODOS OS RESULTADOS/LINHAS PÓS VALIDAÇÃO DO RELÉ ESPECÍFICO
class ResultadoValidacao(BaseModel):
    rele_tipo: str
    lista_parametros: list[IEDItem]

# TODOS OS RESULTADOS DE TODOS OS RELÉS
class RelatorioValidacoes(BaseModel):
    resultados: list[ResultadoValidacao]

# PAR DE ARQUIVOS DE UMA IED
class ParArquivos(BaseModel):
    oa: ArquivoOA
    ied: ArquivoIED

# CONJUNTO DOS PARES DE ARQUIVOS DE IEDS
class ConjuntoPares(BaseModel):
    pares: list[ParArquivos]


# SCHEMAS PARA O BANCO DE DADOS
class ValidationLogBase(BaseModel):
    filename_oa: str
    filename_ied: str
    substation: str
    relay_model: str

    result_json: list[IEDItem] 
    
    status: StatusParametro
    comments: Optional[str] = None

class ValidationLogCreate(ValidationLogBase):
    pass 

class ValidationLogResponse(ValidationLogBase):
    id: int
    created_at: datetime
    user_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)