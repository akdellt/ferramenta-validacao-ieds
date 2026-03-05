class AppException(Exception):
    def __init__(
            self, 
            message: str, 
            status_code: int = 400, 
            filename: str | None = None, 
            details: str | None = None
        ):
        self.message = message
        self.status_code = status_code
        self.filename = filename
        self.details = details
        super().__init__(self.message)

# ARQUIVOS
class EmptyFileError(AppException):
    def __init__(self, filename: str):
        super().__init__(
            message=f"O arquivo '{filename}' está vazio.",
            status_code=400,
            filename=filename
        )

class FileTooLargeError(AppException):
    def __init__(self, filename: str, max_size_mb: int):
        super().__init__(
            message=f"O arquivo '{filename}' excede o limite de {max_size_mb}MB.",
            status_code=413,
            filename=filename
        )

class InvalidFileFormatError(AppException):
    def __init__(self, filename: str, accepted_formats: str):
        super().__init__(
            message=f"Formato inválido para '{filename}'. Aceitos: {accepted_formats}",
            status_code=415,
            filename=filename
        )

class InvalidFileContentError(AppException):
    def __init__(self, filename: str, details: str):
        super().__init__(
            message=f"Conteúdo inválido em '{filename}': {details}",
            status_code=422,
            filename=filename,
            details=details
        )

class IEDNotIdentifiedError(AppException):
    def __init__(self, filename: str, details: str | None = None):
        super().__init__(
            message=f"Não foi possível identificar o modelo do IED no arquivo '{filename}'",
            status_code=422,
            filename=filename,
            details=details
        )

class DuplicatedReferenceError(AppException):
    def __init__(self, relay_model: str, files: list[str]):
        super().__init__(
            message=f"Conflito: Mais de um arquivo de OA encontrado para o relé '{relay_model}'.",
            status_code=409,
            details=f"Arquivos conflitantes: {', '.join(files)}. Mantenha apenas um por tipo."
        )

# PROCESSAMENTO
class IncompatiblePairError(AppException):
    def __init__(self, oa_file: str, ied_file: str, details: str = ""):
        super().__init__(
            message=f"Incompatibilidade detectada entre '{oa_file}' e '{ied_file}'. {details}",
            status_code=400,
            details=details
        )

class FileValidationError(AppException):
    def __init__(self, filename: str, details: str):
        super().__init__(
            message=f"Validação falhou para '{filename}': {details}",
            status_code=400,
            filename=filename,
            details=details
        )

class FileProcessingError(AppException):
    def __init__(self, filename: str, details: str):
        super().__init__(
            message=f"Erro inesperado ao processar '{filename}'.",
            status_code=500,
            filename=filename,
            details=details
        )

class ProcessingTimeoutError(AppException):
    def __init__(self, time_limit: str):
        super().__init__(
            message=f"O processamento excedeu o tempo limite de {time_limit}.",
            status_code=408,
        )

class EngineeringRuleError(AppException):
    def __init__(self, rule: str, details: str, filename: str | None = None):
        super().__init__(
            message=f"Violação de regra de engenharia ({rule}): {details}",
            status_code=400,
            filename=filename,
            details=details
        )