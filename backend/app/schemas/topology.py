from typing import Optional
from enum import Enum
from pydantic import BaseModel, computed_field

# POSSÍVEIS CENÁRIOS DE TOPOLOGIA
class TopologyType(str, Enum):
    PARALLELISM = "Paralelismo"
    LOGICAL_SELECTIVITY_COUPLED = "Seletividade Lógica com Barra Comum"
    LOGICAL_SELECTIVITY_ISOLATED = "Seletividade Lógica Independente"
    GENERIC = "Cenário Não Identificado"

# POSSÍVEIS CATEGORIAS DE ERRO
class ErrorCategory(str, Enum):
    INTEGRITY = "Integrity"       
    COMMUNICATION = "Communication" 
    LOGIC = "Logic"


# CLASSE BASE DE INFORMAÇÕES DOS ARQUIVOS DOS DATASETS
class BaseScdElement(BaseModel):
    ld_inst: Optional[str] = None
    prefix: str = ""
    ln_class: Optional[str] = None
    ln_inst: str = ""
    do_name: Optional[str] = None
    da_name: str = ""
    fc: Optional[str] = None

    @computed_field
    @property
    def object_ref(self) -> str:
        name = f"{self.ld_inst}/{self.prefix}{self.ln_class}{self.ln_inst}.{self.do_name}"
        if self.da_name:
            name += f".{self.da_name}"
        return name
    
# ESCUTAS DOS IEDS (INFORMAÇÕES DOS DADOS INSERIDOS)
class ExtRefSchema(BaseScdElement):
    listens_to: Optional[str] = None
    virtual_bit: Optional[str] = None

# INFORMAÇÕES DOS ARQUIVOS DOS DATASETS
class FcdaSchema(BaseScdElement):
    pass

# PACOTE DE DADOS (DATASET)
class DataSetSchema(BaseModel):
    dataset_name: str
    items: list[FcdaSchema]

# DADOS DE COMUNICAÇÃO DA IED
class IedCommunicationSchema(BaseModel):
    mac_address: Optional[str] = None
    app_id: Optional[str] = None
    vlan: Optional[str] = None
    min_time: Optional[str] = None
    max_time: Optional[str] = None

# ESTRUTURA DO IED
class IedSchema(BaseModel):
    name: str
    ied_type: Optional[str] = None
    communication: IedCommunicationSchema
    datasets: list[DataSetSchema] = []
    inputs: list[ExtRefSchema] = []

# RESPOSTA DE CENÁRIO
class TopologyResponse(BaseModel):
    scenario: TopologyType
    ieds: list[IedSchema]

# SCHEMA DE ERRO
class ErrorDetail(BaseModel):
    category: ErrorCategory               
    message: str
    device: Optional[str] = None   
    related_to: Optional[str] = None             
    publisher: Optional[str] = None    
    subscriber: Optional[str] = None   
    affected_signal: Optional[str] = None 
    expected: Optional[str] = None
    found: Optional[str] = None

# INFORMAÇÕES DO IED
class IedSummary(BaseModel):
    name: str
    model: str
    is_healthy: bool = True
    errors: list[ErrorDetail] = []

# INFORMAÇÕES DE CONEXÃO
class ConnectionEdge(BaseModel):
    from_ied: str # PUBLICADOR
    to_ied: str   # ASSINANTE
    signals: list[str]
    is_broken: bool = False
    errors: list[ErrorDetail] = []

# CONTAGER DE TIPOS DE ERROS
class ValidationSummary(BaseModel):
    integrity_errors_count: int  
    network_errors_count: int    
    logic_errors_count: int     
    total_errors: int

# RESPOSTA FINAL DE VALIDAÇÃO
class TopologyValidationResponse(BaseModel):
    filename: str
    scenario: TopologyType
    is_valid: bool
    summary: ValidationSummary
    integrity_errors: list[ErrorDetail] = []
    network_errors: list[ErrorDetail] = []
    logic_errors: list[ErrorDetail] = []
    ied_summary: list[IedSummary]
    connection_map: list[ConnectionEdge]

# DADOS A RECEBER DO FORMULÁRIO
class ValidationForm(BaseModel):
    expected_topology: TopologyType
    transformer_count: int
    feeder_count: int
    expected_mapping: dict[str, list[str]]