import lxml.etree
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.topology import TopologyType, ValidationSummary, TopologyValidationResponse, ValidationForm
from app.services.topology_parser import read_scd_file, build_connection_map, build_ied_summary
from app.validators.network_rules import validate_network_rules
from app.validators.logical_selectivity import validate_logical_selectivity
from app.validators.parallelism import validate_parallelism
from app.services.integrity_check import validate_project_integrity
from app.exceptions import InvalidFileFormatError, EmptyFileError, InvalidFileContentError, FileProcessingError

router = APIRouter(
    prefix="/topologies", 
    tags=["Topologia"]
)

# ROTA DE LER ARQUIVO SCD
@router.post("/validate", response_model=TopologyValidationResponse)
async def validate_scd_project(file: UploadFile = File(...), form_data: str = Form(...)):
    if not file or not file.filename:
        raise HTTPException(
            status_code=400, 
            detail="Arquivo inválido ou sem nome detectado."
        )
    
    if not file.filename.lower().endswith(('.scd', '.xml')):
        raise InvalidFileFormatError(file.filename, ".scd, .xml")
    
    try:
        form = ValidationForm(**json.loads(form_data))
        content = await file.read()
        
        if not content:
            raise EmptyFileError(file.filename)
        
        response_data = read_scd_file(content)

        # EXECUTA VALIDADORES
        integrity_errors = validate_project_integrity(response_data, form)
        network_errors = validate_network_rules(response_data)
        scenario_errors = []

        if form.expected_topology == TopologyType.PARALLELISM:
            scenario_errors = validate_parallelism(response_data)
        elif form.expected_topology in [
            TopologyType.LOGICAL_SELECTIVITY_ISOLATED, 
            TopologyType.LOGICAL_SELECTIVITY_COUPLED
        ]:
            scenario_errors = validate_logical_selectivity(response_data, form.expected_topology, form)
            
        elif form.expected_topology == TopologyType.GENERIC:
            pass

        all_errors = integrity_errors + network_errors + scenario_errors

        # CONSTRÓI ESQUEMA DE CONEXÕES E INFORMAÇÕES DE ERRO
        connections = build_connection_map(response_data.ieds, scenario_errors)
        ied_summary_list = build_ied_summary(response_data.ieds, all_errors)
        
        return TopologyValidationResponse(
            filename=file.filename,
            scenario=form.expected_topology,
            is_valid=len(all_errors) == 0,
            summary=ValidationSummary(
                integrity_errors_count=len(integrity_errors),
                network_errors_count=len(network_errors),
                logic_errors_count=len(scenario_errors),
                total_errors=len(all_errors)
            ),
            integrity_errors=integrity_errors,
            network_errors=network_errors,
            logic_errors=scenario_errors,
            ied_summary=ied_summary_list,
            connection_map=connections
        )

    except lxml.etree.XMLSyntaxError as e:
        raise InvalidFileContentError(file.filename, motivo=f"XML com erro de sintaxe: {str(e)}")
    except Exception as e:
        raise FileProcessingError(file.filename, erro_original=str(e))