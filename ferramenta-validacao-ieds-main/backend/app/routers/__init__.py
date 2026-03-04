from enum import Enum
from pydantic import BaseModel


class StatusParametro(str, Enum):
    CONFORME = "Conforme"
    DIVERGENTE = "Divergente"
    NAO_ENCONTRADO = "Não encontrado"
    NAO_APLICAVEL = "Não aplicável"


class ParametroReferencia(BaseModel):
    grupo: str
    parametro: str
    descricao: str
    faixa_ajuste: str
    ajuste_referencia: str


class ParametroAtual(BaseModel):
    parametro: str
    valor_atual: str


class ArquivoOA(BaseModel):
    nome_arquivo: str
    subestacao: str
    rele_tipo: str
    parametros: list[ParametroReferencia]


class ArquivoIED(BaseModel):
    nome_arquivo: str
    rele_tipo: str
    parametros: list[ParametroAtual]


class ParArquivos(BaseModel):
    oa: ArquivoOA
    ied: ArquivoIED


class ConjuntoPares(BaseModel):
    pares: list[ParArquivos]


class IEDItem(BaseModel):
    grupo: str
    parametro: str
    descricao: str
    faixa_ajuste: str
    ajuste_referencia: str
    valor_atual: str
    status: StatusParametro


class ResultadoValidacao(BaseModel):
    rele_tipo: str
    lista_parametros: list[IEDItem]


class RelatorioValidacoes(BaseModel):
    resultados: list[ResultadoValidacao]