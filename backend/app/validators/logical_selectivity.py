from app.schemas.topology import TopologyResponse, ErrorDetail, TopologyType, ValidationForm, ErrorCategory

# VALIDAÇÃO DE POSIÇÕES DOS DADOS NOS VBS
def validate_logical_selectivity_vbs(topology: TopologyResponse) -> list[ErrorDetail]:
    # POSIÇÕES DOS VBS DEVEM ESTAR CORRETOS
        # GRUPOS DE 7 VBS RESERVADAS
            # VB1 : FALHA DISJUNTOR 11CX            IND16
            # VB2 : BLOQ INST DO FASE PELO 11CX     IND17
            # VB3 : BLOQ INST RESIDUAL PELO 11CX    IND18
            # VB4 : BLOW SELETIVIDADE LOGICA        IND11
            # VB5 : QUALIDADE DO SINAL ENVIADO      
            # VB6 : RESERVADO (VAZIO)
            # VB7 : RESERVADO (VAZIO)
    vb_errors = []
        
    for ied in topology.ieds:
        # IGNORA ALIMENTADORES DE PONTA
        if not ied.inputs:
            continue

        used_vbs = {}

        senders = sorted(list(set(ext_ref.listens_to for ext_ref in ied.inputs if ext_ref.listens_to)))
        sender_slots = {sender: index + 1 for index, sender in enumerate(senders)}

        for ext_ref in ied.inputs:
            vb = ext_ref.virtual_bit
            target = ext_ref.listens_to
            do_name = ext_ref.do_name
            obj_ref = ext_ref.object_ref

            # ESPAÇO NÃO EXISTE
            if not vb:
                vb_errors.append(ErrorDetail(
                    category=ErrorCategory.LOGIC,
                    message=f"{ied.name} tenta ouvir {target} sem mapeamento de Virtual Bit",
                    publisher=target,
                    subscriber=ied.name,
                    affected_signal=obj_ref
                ))
                continue

            # NÃO PODE TER DOIS DADOS NA MESMA VB
            if vb in used_vbs:
                vb_errors.append(ErrorDetail(
                    category=ErrorCategory.LOGIC,
                    message=f"Múltiplos sinais apontando para {vb}",
                    device=ied.name,
                    affected_signal=obj_ref,
                    expected="VB Única",
                    found=vb
                ))
            else:
                used_vbs[vb] = obj_ref

            if not target: continue

            slot = sender_slots[target]
            vb_upper = vb.upper()

            # VALIDAÇÃO DE REGRAS DE POSICIONAMENTO
            if vb_upper.startswith("VB"):
                try:
                    base_offset = (slot - 1) * 7
                    expected_vb = None
                    
                    # CRUZA O DO_NAME COM A POSIÇÃO CORRETA
                    if do_name == "Ind16":                          # FALHA DISJUNTOR (Posição 1)
                        expected_vb = base_offset + 1
                    elif do_name == "Ind17":                        # BLOQ INST FASE (Posição 2)
                        expected_vb = base_offset + 2
                    elif do_name == "Ind18":                        # BLOQ INST RESIDUAL (Posição 3)
                        expected_vb = base_offset + 3
                    elif do_name == "Ind11":                        # BLOQ SELETIVIDADE LOGICA (Posição 4)
                        expected_vb = base_offset + 4
                    elif do_name is None or do_name == "":          # QUALIDADE DO SINAL (Posição 5)
                        expected_vb = base_offset + 5
                    else:
                        vb_errors.append(ErrorDetail(
                            category=ErrorCategory.LOGIC,
                            message="Sinal não reconhecido",
                            device=ied.name,
                            found=do_name
                        ))
                        continue        
                    
                    # VERIFICA SE ESTÁ USANDO O BLOCO RESERVADO
                    num = int(vb_upper.replace("VB", ""))
                    expected_vb_str = f"VB{expected_vb:03d}"

                    if num != expected_vb:
                        vb_errors.append(ErrorDetail(
                            category=ErrorCategory.LOGIC,
                            message=f"Sinal '{obj_ref}' do trafo {target} está na posição errada",
                            publisher=target,
                            subscriber=ied.name,
                            affected_signal=obj_ref,
                            expected=expected_vb_str,
                            found=vb_upper
                        )) 
                    
                    # VALIDA VBS RESERVADAS (VAZIAS)
                    if num == base_offset + 6 or num == base_offset + 7:
                        vb_errors.append(ErrorDetail(
                            category=ErrorCategory.LOGIC,
                            message=f"{vb} faz parte do espaço reservado (vazio) do bloco",
                            device=ied.name,
                            found=vb,
                            expected="Espaço Vazio"
                        ))
                    
                except ValueError:
                    vb_errors.append(ErrorDetail(
                        category=ErrorCategory.LOGIC,
                        message="VB com formato inválido",
                        device=ied.name,
                        found=vb,
                    ))

    return vb_errors

# VALIDAÇÃO DE PUBLISHER -> SUBSCRIBER
def validate_selectivity_directionality(topology: TopologyResponse) -> list[ErrorDetail]:
    direction_errors = []

    for ied in topology.ieds:
        current_name = ied.name.upper()
        if "T" in current_name:
            for ext_ref in ied.inputs:
                publisher_name = ext_ref.listens_to.upper() if ext_ref.listens_to else ""
                if "Y" in publisher_name:
                    direction_errors.append(ErrorDetail(
                        category=ErrorCategory.LOGIC,
                        message="Transformador não deve enviar mensagem para Alimentador",
                        publisher=publisher_name,
                        subscriber=ied.name,
                        affected_signal=ext_ref.object_ref
                    ))

    return direction_errors

# VALIDAÇÃO DE DATASETS DOS IEDS
def validate_selectivity_datasets(topology: TopologyResponse) -> list[ErrorDetail]:
    dataset_errors = []

    ied_dict = {ied.name: ied for ied in topology.ieds}

    for subscriber in topology.ieds:
        for ext_ref in subscriber.inputs:
            target_name = ext_ref.listens_to
            obj_ref = ext_ref.object_ref

            if not target_name or not obj_ref:
                continue

            if obj_ref.startswith("ControlBlock/"):
                if target_name not in ied_dict:
                    dataset_errors.append(ErrorDetail(
                        category=ErrorCategory.LOGIC,
                        message="IED publicador de sinal de controle não encontrado no projeto",
                        publisher=target_name,
                        subscriber=subscriber.name,
                        affected_signal=obj_ref,
                        expected=target_name,
                        found="IED Ausente"
                    ))
                continue

            publisher = ied_dict.get(target_name)
            if not publisher:
                dataset_errors.append(
                    ErrorDetail(
                        category=ErrorCategory.LOGIC,
                        message="Este IED não está conectado ao IED parceiro",
                        publisher=target_name,
                        subscriber=subscriber.name,
                        expected=f"Conexão com {target_name}",
                        found=f"IED {target_name} ausente nos Inputs"
                    )
                )
                continue

            var_is_published = any(
                fcda.object_ref == obj_ref 
                for ds in publisher.datasets for fcda in ds.items
            )

            if not var_is_published:
                dataset_errors.append(
                    ErrorDetail(
                        category=ErrorCategory.LOGIC,
                        message=f"Sinal esperado do IED {subscriber.name} não encontrado no dataset",
                        publisher=publisher.name,
                        subscriber=subscriber.name,
                        affected_signal=obj_ref,
                        expected=obj_ref,
                        found=f"Sinal ausente no {target_name}"
                    )
                )

    return dataset_errors

# VALIDAÇÃO COMPLETA DO CENÁRIO DE SELETIVIDADE LÓGICA
def validate_logical_selectivity(topology: TopologyResponse, topology_scenario: TopologyType, form: ValidationForm) -> list[ErrorDetail]:
    all_selectivity_errors = []

    # IED DO TRANSFORMADOR DEVE SER APENAS SUBSCRIBER E IEDS DE BORDA DEVEM SER PUBLISHERS
    all_selectivity_errors.extend(validate_selectivity_directionality(topology))

    # DADOS ENVIADOS DEVEM ESTAR CORRETOS
    all_selectivity_errors.extend(validate_selectivity_datasets(topology))

    # VBS DEVEM SER PREENCHIDOS SEGUINDO REGRA
    all_selectivity_errors.extend(validate_logical_selectivity_vbs(topology))

    # CASO ESPECÍFICO DE SLBF COM BARRA COMUM
    if topology_scenario == TopologyType.LOGICAL_SELECTIVITY_COUPLED:
        for trafo_name, expected_feeders in form.expected_mapping.items():
            t_name_up = trafo_name.strip().upper()
            trafo_ied = next((ied for ied in topology.ieds if ied.name.strip().upper() == t_name_up), None)
            if not trafo_ied: 
                continue
            
            actual_publishers = {ext.listens_to.strip().upper() for ext in trafo_ied.inputs if ext.listens_to}
            
            for feeder in expected_feeders:
                f_name_up = feeder.strip().upper()
                if f_name_up not in actual_publishers:
                    all_selectivity_errors.append(ErrorDetail(
                        category=ErrorCategory.LOGIC,
                        message=f"Alimentador deve estar conectado ao Transformador",
                        publisher=feeder,
                        subscriber=trafo_name,
                        expected="Conectado",
                        found="Desconectado"
                    ))

    return all_selectivity_errors
