from app.schemas.parameters import OAFilesData, IEDFilesData, ValidationResult, IEDItem, ParameterStatus, FilePair, FilePairSet, ValidationReport
from app.exceptions import IncompatiblePairError

NOT_APPLICABLE_VALUES: set[str] = {"-", "—", "N/A", "NA", "S/A"}

def not_applicable(valor: str | None) -> bool:
    if not valor: return False
    return valor.strip() in NOT_APPLICABLE_VALUES

# FUNÇÃO AUXILIAR PARA IDENTIFICAR VALORES NUMÉRICOS
def compare_values(ref_value: str, read_value: str) -> bool:
    if ref_value is None: ref_value = ""
    if read_value is None: read_value = ""

    s_ref = str(ref_value).strip().lower()
    s_read = str(read_value).strip().lower()

    if s_ref == s_read:
        return True

    try:
        f_ref = float(s_ref.replace(',', '.'))
        f_read = float(s_read.replace(',', '.'))
        return abs(f_ref - f_read) < 0.0001
    except (ValueError, TypeError):
        return False


# VALIDA PARAMETROS ENTRE DOIS ARQUIVOS
def validate_parameters(oa: OAFilesData, ied: IEDFilesData) -> ValidationResult:
    ied_dict = {p.parameter: p.current_value for p in ied.parameters}

    validated_items = []

    for param_oa in oa.parameters:
        if not_applicable(param_oa.reference_value):
            continue

        current_value_ied = ied_dict.get(param_oa.parameter)

        if current_value_ied is None:
            validated_items.append(IEDItem(
                **param_oa.model_dump(),
                current_value="",
                status=ParameterStatus.NOT_FOUND
            ))
            continue


        status = (
            ParameterStatus.MATCH
            if compare_values(param_oa.reference_value, current_value_ied)
            else ParameterStatus.DIVERGENT
        )

        validated_items.append(IEDItem(
            **param_oa.model_dump(),
            current_value=current_value_ied,
            status=status
        ))

    global_status = ParameterStatus.MATCH
    if any(item.status != ParameterStatus.MATCH for item in validated_items):
        global_status = ParameterStatus.DIVERGENT

    return ValidationResult(
        relay_model=oa.relay_model,
        substation=oa.substation,
        status=global_status,
        parameters_list=validated_items
    )

# CONFIRMA QUE ARQUIVOS DO PAR SÃO SOBRE MESMO IED
def validate_ied_compatibility(pair: FilePair) -> ValidationResult:
    relay_oa = str(pair.oa.relay_model).strip().lower()
    relay_ied = str(pair.ied.relay_model).strip().lower()

    if relay_oa not in relay_ied and relay_ied not in relay_oa:
        raise IncompatiblePairError(
            oa_file=pair.oa.filename,
            ied_file=pair.ied.filename,
            details=f"O modelo na OA é '{relay_oa}', mas o arquivo de campo indica '{relay_ied}'."
        )

    return validate_parameters(pair.oa, pair.ied)

# VALIDAÇÃO É CHAMADA PARA TODOS OS PARES DE ARQUIVOS
def process_files(batch: FilePairSet) -> ValidationReport:
    results = []

    for pair in batch.pairs:
        result = validate_ied_compatibility(pair)
        results.append(result)

    return ValidationReport(results=results)