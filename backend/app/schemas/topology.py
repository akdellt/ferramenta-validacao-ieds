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
    CONSISTENCY = "Consistency"       
    COMMUNICATION = "Communication" 
    LOGIC = "Logic"


# CLASSE BASE DE INFORMAÇÕES DOS ARQUIVOS DOS DATASETS
class BaseScdElement(BaseModel):
    ld_inst: str | None = None
    prefix: str = ""
    ln_class: str | None = None
    ln_inst: str = ""
    do_name: str | None = None
    da_name: str = ""
    fc: str | None = None

    @computed_field
    @property
    def object_ref(self) -> str:
        name = f"{self.ld_inst}/{self.prefix}{self.ln_class}{self.ln_inst}.{self.do_name}"
        if self.da_name:
            name += f".{self.da_name}"
        return name
    
# ESCUTAS DOS IEDS (INFORMAÇÕES DOS DADOS INSERIDOS)
class ExtRefSchema(BaseScdElement):
    listens_to: str | None = None
    virtual_bit: str | None = None

# INFORMAÇÕES DOS ARQUIVOS DOS DATASETS
class FcdaSchema(BaseScdElement):
    pass

# PACOTE DE DADOS (DATASET)
class DataSetSchema(BaseModel):
    dataset_name: str
    items: list[FcdaSchema]

# DADOS DE COMUNICAÇÃO DA IED
class IedCommunicationSchema(BaseModel):
    mac_address: str | None = None
    app_id: str | None = None
    vlan: str | None = None
    min_time: str | None = None
    max_time: str | None = None

# ESTRUTURA DO IED
class IedSchema(BaseModel):
    name: str
    relay_model: str | None = None
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
    device: str | None = None  
    related_to: str | None = None            
    publisher: str | None = None    
    subscriber: str | None = None   
    affected_signal: str | None = None
    expected: str | None = None
    found: str | None = None

# INFORMAÇÕES DO IED
class IedSummary(BaseModel):
    name: str
    relay_model: str
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
    consistency_errors_count: int  
    communication_errors_count: int    
    logic_errors_count: int     
    total_errors: int

# RESPOSTA FINAL DE VALIDAÇÃO
class TopologyValidationResponse(BaseModel):
    filename: str
    scenario: TopologyType
    is_valid: bool
    summary: ValidationSummary
    consistency_errors: list[ErrorDetail] = []
    communication_errors: list[ErrorDetail] = []
    logic_errors: list[ErrorDetail] = []
    ied_summary: list[IedSummary]
    connection_map: list[ConnectionEdge]

# DADOS A RECEBER DO FORMULÁRIO
class ValidationForm(BaseModel):
    expected_topology: TopologyType
    transformer_count: int
    feeder_count: int
    expected_mapping: dict[str, list[str]]