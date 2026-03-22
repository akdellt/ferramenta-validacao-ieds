from enum import Enum
from pydantic import BaseModel

class ParameterStatus(str, Enum):
    MATCH = "Conforme"
    DIVERGENT = "Divergente"
    NOT_FOUND = "Não encontrado"
    NOT_APPLICABLE = "Não aplicável"

# CADA OA SO TEM UM IED
# DADOS DIVERSOS A SEREM EXTRAÍDOS DA ORDEM DE AJUSTE
class ReferenceParameter(BaseModel):
    group: str
    parameter: str
    description: str | None = None
    setting_range: str | None = None
    reference_value: str

# DADOS DIVERSOS A SEREM EXTRAÍDOS DO ARQUIVO DO IED
class CurrentParameter(BaseModel):
    parameter: str
    current_value: str

# DADOS FIXOS A SEREM EXTRAÍDOS DA OA
class OAFilesData(BaseModel):
    filename: str
    substation: str
    component_name: str
    relay_model: str
    parameters: list[ReferenceParameter]
    
# DADOS FIXOS A SEREM EXTRAÍDOS DO ARQUIVO DO IED
class IEDFilesData(BaseModel):
    filename: str
    relay_model: str
    parameters: list[CurrentParameter]


# DADOS RELEVANTES DE CADA PARÂMETRO DA IED ANALISADO
class IEDItem(ReferenceParameter):
    current_value: str
    status: ParameterStatus

# TODOS OS RESULTADOS/LINHAS PÓS VALIDAÇÃO DO RELÉ ESPECÍFICO
class ValidationResult(BaseModel):
    relay_model: str
    substation: str
    status: ParameterStatus # NESSE CASO SÓ MATCH E DIVERGENT
    parameters_list: list[IEDItem]

# TODOS OS RESULTADOS DE TODOS OS RELÉS
class ValidationReport(BaseModel):
    results: list[ValidationResult]

# PAR DE ARQUIVOS DE UMA IED
class FilePair(BaseModel):
    oa: OAFilesData
    ied: IEDFilesData

# CONJUNTO DOS PARES DE ARQUIVOS DE IEDS
class FilePairSet(BaseModel):
    pairs: list[FilePair]

# ATRIBUTOS DOS IED BUSCADOS NA REDE
class NetworkIEDSchema(BaseModel):
    id: int
    name: str
    relay_model: str
    ip_address: str

    class Config:
        from_attributes = True