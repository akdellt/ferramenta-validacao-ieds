from app.schemas.topology import TopologyResponse, ValidationForm, ErrorDetail, TopologyType, ErrorCategory

def validate_project_consistency(scd_data: TopologyResponse, form: ValidationForm) -> list[ErrorDetail]:
    consistency_errors = []

    scd_trafos_all = [
        ied for ied in scd_data.ieds 
        if "T" in ied.name.upper() and "Y" not in ied.name.upper()
    ]
    scd_trafos_dict = {ied.name.strip().upper(): ied for ied in scd_trafos_all}
    scd_all_names = [ied.name for ied in scd_data.ieds]

    form_trafo_names = [name.strip().upper() for name in form.expected_mapping.keys()]
    form_all_trafos = set(form_trafo_names)
    form_feeders = {f.strip().upper() for feeders in form.expected_mapping.values() for f in feeders}

    # VERIFICA QUANTIDADE DE TRANSFORMADORES EM RELAÇÃO AO FORMULÁRIO
    if len(scd_trafos_all) != form.transformer_count:
        consistency_errors.append(
            ErrorDetail(
                category=ErrorCategory.CONSISTENCY,
                message="A quantidade de transformadores no SCD não condiz com o formulário",
                expected=f"{form.transformer_count} (Formulário)",
                found=f"{len(scd_trafos_all)} (Arquivo SCD)"
            )
        )

    # VERIFICA QUANTIDADE TOTAL DE ALIMENTADORES EM RELAÇÃO AO FORMULÁRIO
    if len(form_feeders) != form.feeder_count:
        consistency_errors.append(
            ErrorDetail(
            category=ErrorCategory.CONSISTENCY,
            message="Quantidade de alimentadores únicos no SCD não condiz com o formulário",
            expected=str(form.feeder_count),
            found=str(len(form_feeders))
            )
        )

    scd_trafos_inputs = []

    # VERIFICA SE ALIMENTADORES ESTÃO LIGADOS AOS TRANSFORMADORES CORRETOS
    for trafo_name, expected_feeders in form.expected_mapping.items():
        t_key = trafo_name.strip().upper()
        trafo_ied = scd_trafos_dict.get(t_key)

        # TRANFORMADOR DO FORMULÁRIO NÃO EXISTE NO ARQUIVO
        if not trafo_ied:
            if len(scd_all_names) > 3:
                expected_display = " / ".join(scd_all_names[:3]) + f" ... (+{len(scd_all_names)-3} outros)"
            else:
                expected_display = " / ".join(scd_all_names)

            consistency_errors.append(
                ErrorDetail(
                    category=ErrorCategory.CONSISTENCY,
                    message=f"O transformador '{trafo_name}' não consta no arquivo SCD",
                    device=trafo_name,
                    expected=trafo_name,
                    found=expected_display
                )
            )
            continue
        
        actual_feeders = {ext.listens_to.strip().upper() for ext in trafo_ied.inputs if ext.listens_to}
        scd_trafos_inputs.append(actual_feeders)

        missing_in_scd = [f for f in expected_feeders if f.strip().upper() not in actual_feeders]
        
        # TRANSFORMADOR ESPERADO NÃO ESTÁ CONECTADO
        for feeder in missing_in_scd:
                consistency_errors.append(
                    ErrorDetail(
                        category=ErrorCategory.CONSISTENCY,
                        message=f"{trafo_name} deveria estar ouvindo {feeder}",
                        device=trafo_name,
                        expected=feeder,
                        found=" / ".join(list(actual_feeders)[:3]) or "Nenhuma conexão"
                    )
                )

        # CONEXÕES INESPERADAS EM RELAÇÃO AO FORMULÁRIO        
        expected_set = {f.strip().upper() for f in expected_feeders}
        extra_feeders = actual_feeders - expected_set

        if form.expected_topology == TopologyType.PARALLELISM:
            extra_feeders -= form_all_trafos

        if not missing_in_scd:
            for extra in extra_feeders:
                consistency_errors.append(
                    ErrorDetail(
                        category=ErrorCategory.CONSISTENCY,
                        message=f"{trafo_name} ouve {extra}, mas isso não foi mapeado",
                        publisher=extra,
                        subscriber=trafo_name
                    )
                )
    
    # VERIFICA TOPOLOGIA SELECIONADA
    has_shared = False
    if len(scd_trafos_inputs) >= 2:
        has_shared = any(scd_trafos_inputs[i] & scd_trafos_inputs[j] 
                         for i in range(len(scd_trafos_inputs)) 
                         for j in range(i + 1, len(scd_trafos_inputs)))

    has_inter = any(any(other in form_all_trafos for other in inputs) 
                    for inputs in scd_trafos_inputs)

    # VERIFICA SE HÁ CONEXÃO ENTRE TRAFOS QUANDO SELECIONADO PARALELISMO
    if form.expected_topology == TopologyType.PARALLELISM:
        if form.transformer_count < 2:
            consistency_errors.append(
                ErrorDetail(
                    category=ErrorCategory.CONSISTENCY,
                    message="Paralelismo exige no mínimo 2 transformadores",
                    expected="Dois ou mais transformadores",
                    found=f"{form.transformer_count} transformador"
                )
            )  
        elif not has_inter:    
            consistency_errors.append(
                ErrorDetail(
                    category=ErrorCategory.CONSISTENCY,
                    message="Paralelismo selecionado, mas transformadores não estão conectados",
                    expected="Transformadores interconectados",
                    found="Transformadores isolados"
                )
            )
    
    # VERIFICA SE NÃO HÁ CONEXÃO ENTRE TRAFOS QUANDO SELECIONADO SLBF COM TRAFOS INDEPENDENTES
    elif form.expected_topology == TopologyType.LOGICAL_SELECTIVITY_ISOLATED:
        if has_shared or has_inter:
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
        
        elif not has_shared:
            consistency_errors.append(
                ErrorDetail(
                    category=ErrorCategory.CONSISTENCY,
                    message="SLBF Barra Comum selecionada, mas transformadores não estão conectados",
                    expected="Alimentadores compartilhados",
                    found="Alimentadores exclusivos"
                )
            )

    return consistency_errors