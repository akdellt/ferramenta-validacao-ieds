from app.schemas.topology import TopologyResponse, ValidationForm, ErrorDetail, TopologyType, ErrorCategory

def validate_project_consistency(scd_data: TopologyResponse, form: ValidationForm) -> list[ErrorDetail]:
    consistency_errors = []
    form_feeders = set()

    # VERIFICA QUANTIDADE DE TRANSFORMADORES EM RELAÇÃO AO FORMULÁRIO
    scd_transformers = [ied for ied in scd_data.ieds if "T" in ied.name.upper()]
    scd_count = len(scd_transformers)
    form_count = form.transformer_count
    if scd_count != form_count:
        if scd_count < form_count:
            msg = "Há mais transformadores no formulário do que no SCD"
        else:
            msg = "Há mais transformadores no SCD do que no formulário"

        consistency_errors.append(
            ErrorDetail(
                category=ErrorCategory.CONSISTENCY,
                message=msg,
                expected=f"{form_count} (Formulário)",
                found=f"{scd_count} (Arquivo SCD)"
            )
        )

    # VERIFICA QUANTIDADE TOTAL DE ALIMENTADORES EM RELAÇÃO AO FORMULÁRIO
    for feeders in form.expected_mapping.values():
        form_feeders.update(feeders)

    if len(form_feeders) != form.feeder_count:
        consistency_errors.append(
            ErrorDetail(
            category=ErrorCategory.CONSISTENCY,
            message="Quantidade de alimentadores únicos no SCD não condiz com o formulário",
            expected=str(form.feeder_count),
            found=str(len(form_feeders))
            )
        )

    # VERIFICA SE ALIMENTADORES ESTÃO LIGADOS AOS TRANSFORMADORES CORRETOS
    for trafo_name, expected_feeders in form.expected_mapping.items():
        trafo_ied = next((ied for ied in scd_data.ieds if ied.name ==  trafo_name), None)
        # TRANFORMADOR DO FORMULÁRIO NÃO EXISTE NO ARQUIVO
        if not trafo_ied:
            valid_names = [ied.name for ied in scd_transformers]
            if len(valid_names) > 3:
                expected_display = " / ".join(valid_names[:3]) + f" ... (+{len(valid_names)-3} outros)"
            else:
                expected_display = " / ".join(valid_names)

            consistency_errors.append(
                ErrorDetail(
                    category=ErrorCategory.CONSISTENCY,
                    message=f"O transformador '{trafo_name}' não consta no arquivo SCD",
                    expected=trafo_name,
                    found=expected_display
                )
            )
            continue
        
        reported_as_missing = set()
        actual_feeders = set(ext.listens_to for ext in trafo_ied.inputs if ext.listens_to)
        # TRANSFORMADOR ESPERADO NÃO ESTÁ CONECTADO
        for feeder in expected_feeders:
            if feeder not in actual_feeders:
                reported_as_missing.add(feeder)
                found_list = list(actual_feeders)
                found_display = " / ".join(found_list) if found_list else "Nenhuma conexão detectada"

                consistency_errors.append(
                    ErrorDetail(
                        category=ErrorCategory.CONSISTENCY,
                        message=f"{trafo_name} deveria estar ouvindo {feeder}",
                        expected=feeder,
                        found=found_display
                    )
                )

        # CONEXÕES INESPERADAS EM RELAÇÃO AO FORMULÁRIO        
        extra_feeders = actual_feeders - set(expected_feeders)
        if form.expected_topology == TopologyType.PARALLELISM:
            extra_feeders = {f for f in extra_feeders if "T" not in f.upper()}

        for extra in extra_feeders:
            if len(reported_as_missing) > 0:
                continue
            
            consistency_errors.append(
                ErrorDetail(
                    category=ErrorCategory.CONSISTENCY,
                    message=f"{trafo_name} está ouvindo {extra}, mas isso não foi mapeado",
                    publisher=extra,
                    subscriber=trafo_name
                )
            )
    
    # VERIFICA TOPOLOGIA SELECIONADA
    scd_trafos_inputs = []
    for t in scd_transformers:
        inputs = set(ext.listens_to for ext in t.inputs if ext.listens_to)
        scd_trafos_inputs.append(inputs)

    has_shared_feeders = False
    if len(scd_trafos_inputs) > 1:
        for i in range(len(scd_trafos_inputs)):
            for j in range(i + 1, len(scd_trafos_inputs)):
                if scd_trafos_inputs[i] & scd_trafos_inputs[j]:
                    has_shared_feeders = True
                    break

    has_inter_trafo_comm = False
    for inputs in scd_trafos_inputs:
        if any("T" in other.upper() for other in inputs):
            has_inter_trafo_comm = True
            break
        
    # VERIFICA SE HÁ CONEXÃO ENTRE TRAFOS QUANDO SELECIONADO PARALELISMO
    if form.expected_topology ==TopologyType.PARALLELISM and not has_inter_trafo_comm:
        consistency_errors.append(
            ErrorDetail(
                category=ErrorCategory.CONSISTENCY,
                message="Paralelismo selecionado, mas transformadores não estão conectados",
                expected="Transformadores interconectados",
                found="Transformadores isolados"
            )
        )
    
    # VERIFICA SE NÃO HÁ CONEXÃO ENTRE TRAFOS QUANDO SELECIONADO SLBF COM TRAFOS INDEPENDENTES
    elif form.expected_topology ==TopologyType.LOGICAL_SELECTIVITY_ISOLATED:
        if has_shared_feeders or has_inter_trafo_comm:
            consistency_errors.append(
                ErrorDetail(
                    category=ErrorCategory.CONSISTENCY,
                    message="SLBF Independente selecionada, mas transformadores estão conectados",
                    expected="Transformadores isolados",
                    found="Transformadores interconectados"
                )
            )

    # VERIFICA SE HÁ CONEXÃO ENTRE TRAFOS QUANDO SELECIONADO SLBF COM TRAFOS COM BARRA COMUM
    elif form.expected_topology == TopologyType.LOGICAL_SELECTIVITY_COUPLED:
        if form.transformer_count < 2:
            consistency_errors.append(
            ErrorDetail(
                category=ErrorCategory.CONSISTENCY,
                message="SLBF Barra Comum exige no mínimo 2 transformadores",
                expected="2 ou mais transformadores",
                found=f"{form.transformer_count} transformador(es)"
            )
        )
        
        elif not has_shared_feeders:
            consistency_errors.append(
                ErrorDetail(
                    category=ErrorCategory.CONSISTENCY,
                    message="SLBF Barra Comum selecionada, mas transformadores não estão conectados",
                    expected="Alimentadores compartilhados",
                    found="Alimentadores exclusivos"
                )
            )

        

    return consistency_errors