from typing import Optional

class AppException(Exception):
    """ Exceção base """
    def __init__(
            self, 
            mensagem: str, 
            status_code: int = 400, 
            nome_arquivo: Optional[str] = None, 
            detalhes: Optional[str] = None
        ):
        self.mensagem = mensagem
        self.status_code = status_code
        self.nome_arquivo = nome_arquivo
        self.detalhes = detalhes
        super().__init__(self.mensagem)

# ARQUIVOS
class EmptyFileError(AppException):
    """ Arquivo vazio """
    def __init__(self, nome_arquivo: str):
        super().__init__(
            mensagem=f"O arquivo '{nome_arquivo}' está vazio.",
            status_code=400,
            nome_arquivo=nome_arquivo
        )

class InvalidFileFormatError(AppException):
    """ Arquivo no formato inválido:
    - Extensão incorreta (.xlsx, .xls, .txt, .scd, .xml)
    - Tamanho acima do limite
    """
    def __init__(self, nome_arquivo: str, formatos_aceitos: str):
        super().__init__(
            mensagem=f"Formato inválido para '{nome_arquivo}'. Aceitos: {formatos_aceitos}",
            status_code=415,
            nome_arquivo=nome_arquivo
        )

class InvalidFileContentError(AppException):
    """ Arquivo com conteúdo não correspondente ao esperado
    - Não possui os cabeçalhos das OAs/Logs de IEDs
    - Dados vazios"""
    def __init__(self, nome_arquivo: str, motivo: str):
        super().__init__(
            mensagem=f"Conteúdo inválido em '{nome_arquivo}': {motivo}",
            status_code=422,
            nome_arquivo=nome_arquivo,
            detalhes=motivo
        )

class IEDNotIdentifiedError(AppException):
    """ Tipo de IED não identificado """
    def __init__(self, nome_arquivo: str, detalhes: Optional[str] = None):
        super().__init__(
            mensagem=f"Não foi possível identificar o modelo do IED no arquivo '{nome_arquivo}'",
            status_code=422,
            nome_arquivo=nome_arquivo,
            detalhes=detalhes
        )

class DuplicatedReferenceError(AppException):
    """ Dois ou mais arquivos referentes a um mesmo IED"""
    def __init__(self, tipo_rele: str, arquivos: list[str]):
        super().__init__(
            mensagem=f"Conflito: Mais de um arquivo de OA encontrado para o relé '{tipo_rele}'.",
            status_code=409,
            detalhes=f"Arquivos conflitantes: {', '.join(arquivos)}. Mantenha apenas um por tipo."
        )

# PROCESSAMENTO
class IncompatiblePairError(AppException):
    """ Par de arquivos OA + IED incompatível """
    def __init__(self, oa_file: str, ied_file: str, motivo: str = ""):
        super().__init__(
            mensagem=f"Incompatibilidade detectada entre '{oa_file}' e '{ied_file}'. {motivo}",
            status_code=400,
            detalhes=motivo
        )

class FileValidationError(AppException):
    """ Validação falhou """
    def __init__(self, nome_arquivo: str, motivo: str):
        super().__init__(
            mensagem=f"Validação falhou para '{nome_arquivo}': {motivo}",
            status_code=400,
            nome_arquivo=nome_arquivo,
            detalhes=motivo
        )

class FileProcessingError(AppException):
    """ Processamento do arquivo falhou """
    def __init__(self, nome_arquivo: str, erro_original: str):
        super().__init__(
            mensagem=f"Erro inesperado ao processar '{nome_arquivo}'.",
            status_code=500,
            nome_arquivo=nome_arquivo,
            detalhes=erro_original
        )

class ProcessingTimeoutError(AppException):
    """ Processamento excedeu tempo limite """
    def __init__(self, tempo_limite: str):
        super().__init__(
            mensagem=f"O processamento excedeu o tempo limite de {tempo_limite}.",
            status_code=408,
        )

class EngineeringRuleError(AppException):
    """
    Violação de regra da empresa (VBs, Datasets, MACs).
    """
    def __init__(self, regra: str, causa: str, nome_arquivo: Optional[str] = None):
        super().__init__(
            mensagem=f"Violação de regra de engenharia ({regra}): {causa}",
            status_code=400,
            nome_arquivo=nome_arquivo,
            detalhes=causa
        )