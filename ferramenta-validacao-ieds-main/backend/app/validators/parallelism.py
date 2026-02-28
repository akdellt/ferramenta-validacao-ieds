from app.schemas.topology import TopologyResponse, ErrorDetail, ErrorCategory

# VALIDAÇÃO DAS REGRAS DE PARALELISMO
def validate_parallelism_topology(topology: TopologyResponse) -> list[ErrorDetail]:
    errors = []
    all_ied_names = {ied.name for ied in topology.ieds}
    
    # MÁXIMO DE CINCO TRANSFORMADORES EM PARALELO
    if len(all_ied_names) > 5:
        errors.append(ErrorDetail(
            category=ErrorCategory.LOGIC,
            message=f"Subestação suporta no máximo 5 tranformadores em paralelo",
            expected="Máximo 5 IEDs",
            found=f"{str(len(all_ied_names))} IEDs"
        ))
        return errors

    # TODOS OS TRANSFORMADORES EM PARALELO DEVEM SE COMUNICAR COM OS OUTROS
    for ied in topology.ieds:
        expected_partners = all_ied_names - {ied.name}
        actual_partners = {ext_ref.listens_to for ext_ref in ied.inputs if ext_ref.listens_to}
        missing_partners = expected_partners - actual_partners

        for missing in missing_partners:
            errors.append(ErrorDetail(
                category=ErrorCategory.LOGIC,
                message=f"Este IED não está conectado ao IED parceiro",
                publisher=missing,
                subscriber=ied.name,
                expected="IED conectado",
                found="IED ausente"
            ))
    return errors

# VALIDAÇÃO DOS DATASETS DOS IEDS (TODOS DEVEM SER IGUAIS)
def validate_datasets(topology: TopologyResponse) -> list[ErrorDetail]:
    dataset_errors = []

    if not topology.ieds:
        return dataset_errors
    
    # USA PRIMEIRO DATASET COMO REFERÊNCIA PARA OS OUTROS
    reference_ied = topology.ieds[0]
    reference_ds_count = len(reference_ied.datasets)
    
    for ied in topology.ieds[1:]:
        # VERIFICA QUANTIDADE DE DATASETS NO PROJETO
        if len(ied.datasets) != reference_ds_count:
            dataset_errors.append(ErrorDetail(
                category=ErrorCategory.LOGIC,
                message=f"IED tem número de datasets diferente da referência {reference_ied.name}",
                device=ied.name,
                expected=f"{reference_ds_count} datasets",
                found=f"{len(ied.datasets)} datasets"
            ))
            continue
        
        # VERIFICA CONTEÚDO DOS DATASETS
        for i in range(reference_ds_count):
            ref_ds = reference_ied.datasets[i]
            cur_ds = ied.datasets[i]
            
            ref_signals = set(item.object_ref for item in ref_ds.items)
            cur_signals = set(item.object_ref for item in cur_ds.items)

            if ref_signals != cur_signals:
                missing = ref_signals - cur_signals
                extra = cur_signals - ref_signals

                found_details = []
                if missing:
                    found_details.append(f"Faltando: {', '.join(missing)}")
                if extra:
                    found_details.append(f"Extra: {', '.join(extra)}")

                dataset_errors.append(ErrorDetail(
                    category=ErrorCategory.LOGIC,
                    message=f"Dataset possui arquivos divergente da referência {reference_ied.name}",
                    device=ied.name,
                    expected="Sincronizado com referência",
                    found=" | ".join(found_details)
                ))

    return dataset_errors

# VALIDAÇÃO DAS POSIÇÕES DOS DADOS NOS VBS
def validate_parallelism_vbs(topology: TopologyResponse) -> list[ErrorDetail]:
    # POSIÇÕES DOS VBS DEVEM ESTAR CORRETOS
        # VB1 -- VB4 : SINALIZA MESTRE                          Ind07
        # VB5 -- VB8 : QUALIDADE DA MENSAGEM GOOSE, VAR INTERNA 
        # VB9 -- VB12 : AUMENTO DE TAP DO MESTRE                Ind01
        # VB13 -- VB16: DIMINUIÇÃO DE TAP DO MESTRE             Ind02
        # VB17 -- VB20: SINALIZA OPERAÇÃO EM PARALELO           Ind08
        # RA1 -- RA4 : POSIÇÃO DO TAP                           AnIn16
    vb_errors = []
    
    ied_names = sorted([ied.name for ied in topology.ieds])
    
    for ied in topology.ieds:
        used_vbs = {}

        expected_ieds = [name for name in ied_names if name != ied.name]
        ied_slots = {ied: index + 1 for index, ied in enumerate(expected_ieds)}

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

            if target not in ied_slots:
                continue
            
            slot = ied_slots[target]
            vb_upper = vb.upper()

            # VALIDAÇÃO DE REGRAS DE POSICIONAMENTO DAS VBS
            if vb_upper.startswith("VB"):
                try:
                    expected_vb = None
                    signal_type = ""

                    # CRUZA O DO_NAME COM A POSIÇÃO CORRETA:
                    if do_name == "Ind07":                      # MESTRE (VB 1 a 4)
                        expected_vb = slot
                        signal_type = "Mestre"
                    elif do_name == "Ind01":                    # AUMENTO DE TAP (VB 9 a 12)
                        expected_vb = slot + 8
                        signal_type = "Aumento de Tap"
                    elif do_name == "Ind02":                    # DIMINUI DE TAP (VB 13 a 16)
                        expected_vb = slot + 12
                        signal_type = "Diminuição de Tap"
                    elif do_name == "Ind08":                    # PARALELO (VB 17 a 20)
                        expected_vb = slot + 16
                        signal_type = "Operação em Paralelo"
                    elif do_name is None or do_name == "":      # QUALIDADE GOOSE (Sem doName, VB 5 a 8)
                        expected_vb = slot + 4
                        signal_type = "Qualidade da Mensagem"
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
                    expected_str = f"VB{expected_vb:02d}"
                    if num != expected_vb:
                        vb_errors.append(ErrorDetail(
                            category=ErrorCategory.LOGIC,
                            message=f"Sinal '{signal_type}' do trafo {target} está na posição errada",
                            publisher=target,
                            subscriber=ied.name,
                            affected_signal=obj_ref,
                            expected=expected_str,
                            found=vb_upper
                        )) 
                    
                except ValueError:
                    vb_errors.append(ErrorDetail(
                        category=ErrorCategory.LOGIC, 
                        message="VB com formato inválido", 
                        device=ied.name, 
                        found=vb
                        ))

            # VALIDAÇÃO DE REGRAS DE POSICIONAMENTO DAS RAS       
            elif vb_upper.startswith("RA"):
                try:
                    num = int(vb_upper.replace("RA", ""))
                    expected_ra = slot   

                    if num != expected_ra:
                        vb_errors.append(ErrorDetail(
                            category=ErrorCategory.LOGIC,
                            message=f"posição do Tap de {target} deveria estar no slot fixo",
                            publisher=target,
                            subscriber=ied.name,
                            affected_signal=obj_ref,
                            expected=f"RA{expected_ra:02d}",
                            found=vb_upper
                        ))
                except ValueError:
                    vb_errors.append(ErrorDetail(
                        category=ErrorCategory.LOGIC, 
                        message="RA com formato inválido", 
                        device=ied.name, 
                        found=vb
                        ))
                    
            else:
                vb_errors.append(ErrorDetail(
                    category=ErrorCategory.LOGIC,
                    message="Esperado VB ou RA como tipo de IntAddr", 
                    device=ied.name, 
                    found=vb
                ))

    return vb_errors

# VALIDAÇÃO DE DADOS ENVIADOS PELOS PUBLISHERS
def validate_parallelism_vars(topology: TopologyResponse) -> list[ErrorDetail]:
    publish_errors = []
    ied_dict = {ied.name: ied for ied in topology.ieds}

    for subscriber in topology.ieds:
        for ext_ref in subscriber.inputs:
            target_name = ext_ref.listens_to
            do_name = ext_ref.do_name
            da_name = ext_ref.da_name
            obj_ref = ext_ref.object_ref

            if not target_name or not do_name:
                continue

            # DEFINE O IED PUBLISHER
            publisher = ied_dict.get(target_name)
            
            if not publisher:
                continue

            # VERIFICA EXISTÊNCIA DE DADO DO DATASET
            var_is_published = any(
                fcda.do_name == do_name and fcda.da_name == da_name
                for dataset in publisher.datasets
                for fcda in dataset.items
            )

            if not var_is_published:
                publish_errors.append(ErrorDetail(
                    category=ErrorCategory.LOGIC,
                    message=("Alimentador não está publicando este dado"),
                    publisher=publisher.name,
                    subscriber=subscriber.name,
                    affected_signal=obj_ref,
                    expected="Sinal no DataSet",
                    found="Sinal ausente"
                ))

    return publish_errors

# VALIDAÇÃO COMPLETA DO CENÁRIO DE PARALELISMO
def validate_parallelism(topology: TopologyResponse) -> list[ErrorDetail]:
    all_parallelism_errors = []
    
    # REGRAS GERAIS DEVEM SER SEGUIDAS
    all_parallelism_errors.extend(validate_parallelism_topology(topology))

    # DATASETS DOS IEDS DEVEM SER IGUAIS
    all_parallelism_errors.extend(validate_datasets(topology))

    # DADOS ENVIADOS DEVEM ESTAR CORRETOS
    all_parallelism_errors.extend(validate_parallelism_vars(topology))

    # VBS DEVEM SER PREENCHIDOS SEGUINDO REGRA
    all_parallelism_errors.extend(validate_parallelism_vbs(topology))

    return all_parallelism_errors