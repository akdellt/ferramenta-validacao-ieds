from app.schemas.topology import TopologyResponse, ValidationForm, ErrorDetail, TopologyType, ErrorCategory

def validate_project_integrity(scd_data: TopologyResponse, form: ValidationForm) -> list[ErrorDetail]:
    integrity_errors = []
    form_feeders = set()

    # VERIFICA QUANTIDADE DE TRANSFORMADORES EM RELAÇÃO AO FORMULÁRIO
    scd_transformers = [ied for ied in scd_data.ieds if "T" in ied.name.upper()]
    if len(scd_transformers) != form.transformer_count:
        integrity_errors.append(
            ErrorDetail(
                category=ErrorCategory.INTEGRITY,
                message="Quantidade de transformadores no SCD não condiz com o formulário",
                expected=str(form.transformer_count),
                found=str(len(scd_transformers))
            )
        )

    # VERIFICA QUANTIDADE TOTAL DE ALIMENTADORES EM RELAÇÃO AO FORMULÁRIO
    for feeders in form.expected_mapping.values():
        form_feeders.update(feeders)

    if len(form_feeders) != form.feeder_count:
        integrity_errors.append(
            ErrorDetail(
            category=ErrorCategory.INTEGRITY,
            message="Quantidade de alimentadores únicos no SCD não condiz com o formulário",
            expected=str(form.feeder_count),
            found=str(len(form_feeders))
        )
        )

    # VERIFICA SE ALIEMNTADORES ESTÃO LIGADOS AOS TRANSFORMADORES CORRETOS
    for trafo_name, expected_feeders in form.expected_mapping.items():
        trafo_ied = next((ied for ied in scd_data.ieds if ied.name ==  trafo_name), None)
        # TRANFORMADOR DO FORMULÁRIO NÃO EXISTE NO ARQUIVO
        if not trafo_ied:
            integrity_errors.append(
                ErrorDetail(
                    category=ErrorCategory.INTEGRITY,
                    message=f"Transformador declarado no formulário não existe no arquivo SCD",
                    device=trafo_name
                )
            )
            continue

        actual_feeders = set(ext.listens_to for ext in trafo_ied.inputs if ext.listens_to)
        # TRANSFORMADOR ESPERADO NÃO ESTÁ CONECTADO
        for feeder in expected_feeders:
            if feeder not in actual_feeders:
                integrity_errors.append(
                        ErrorDetail(
                            category=ErrorCategory.INTEGRITY,
                            message=f"{trafo_name} deveria estar ouvindo {feeder}",
                            publisher=feeder,
                            subscriber=trafo_name,
                            expected="Conectado",
                            found="Desconectado"
                        )
                    )
                
        extra_feeders = actual_feeders - set(expected_feeders)
        if form.expected_topology == TopologyType.PARALLELISM:
            extra_feeders = {f for f in extra_feeders if "T" not in f.upper()}
        # CONEXÕES INESPERADAS EM RELAÇÃO AO FORMULÁRIO
        for extra in extra_feeders:
            integrity_errors.append(
                ErrorDetail(
                    category=ErrorCategory.INTEGRITY,
                    message=f"{trafo_name} está ouvindo {extra}, mas isso não foi mapeado",
                    publisher=extra,
                    subscriber=trafo_name
                )
            )

    # VERIFICA TOPOLOGIA SELECIONADA
    has_inter_trafo_comm = False
    for t1 in scd_transformers:
        t1_inputs = set(ext.listens_to for ext in t1.inputs if ext.listens_to)
        # BUSCA CONEXÃO ENTRE TRANSFORMADORES
        if any("T" in other.upper() for other in t1_inputs if other != t1.name):
            has_inter_trafo_comm = True
            break
        
        # VERIFICA SE HÁ CONEXÃO ENTRE TRAFOS QUANDO SELECIONADO PARALELISMO
        if form.expected_topology ==TopologyType.PARALLELISM and not has_inter_trafo_comm:
            integrity_errors.append(
                ErrorDetail(
                    category=ErrorCategory.INTEGRITY,
                    message="Paralelismo selecionado, mas transformadores não estão conectados",
                    expected="Transformadores interconectados",
                    found="Transformadores isolados"
                )
            )
        
        # VERIFICA SE NÃO HÁ CONEXÃO ENTRE TRAFOS QUANDO SELECIONADO SLBF COM TRAFOS INDEPENDENTES
        elif form.expected_topology ==TopologyType.LOGICAL_SELECTIVITY_ISOLATED and has_inter_trafo_comm:
            integrity_errors.append(
                ErrorDetail(
                    category=ErrorCategory.INTEGRITY,
                    message="SLBF Independente selecionada, mas transformadores estão conectados",
                    expected="Transformadores isolados",
                    found="Transformadores interconectados"
                )
            )

        # VERIFICA SE HÁ CONEXÃO ENTRE TRAFOS QUANDO SELECIONADO SLBF COM TRAFOS COM BARRA COMUM
        elif form.expected_topology == TopologyType.LOGICAL_SELECTIVITY_COUPLED:
            all_mapped_feeders = []
            for feeders in form.expected_mapping.values():
                all_mapped_feeders.extend(feeders)
            
            # VERIFICA PRESENÇA DOS ALIMENTADORES EM TODOS OS TRANSFORMADORES
            is_shared = len(all_mapped_feeders) != len(set(all_mapped_feeders))
            if not is_shared:
                integrity_errors.append(
                    ErrorDetail(
                        category=ErrorCategory.INTEGRITY,
                        message="SLBF Barra Comum selecionada, mas transformadores não estão conectados",
                        expected="Alimentadores compartilhados",
                        found="Alimentadores exclusivos"
                    )
                )

    return integrity_errors