from app.schemas.topology import TopologyResponse, ErrorDetail, ErrorCategory

def validate_communication_rules(topology: TopologyResponse) -> list[ErrorDetail]:
    comm_errors = []
    mac_addresses = {}
    app_ids = {}

    for ied in topology.ieds:
        # ENDEREÇOS MAC DEVEM SER DIFERENTES
        mac = ied.communication.mac_address
        if mac is not None:
            if mac in mac_addresses:
                first_ied = mac_addresses[mac]
                comm_errors.append(
                    ErrorDetail(
                        category=ErrorCategory.COMMUNICATION,
                        message=f"Endereço MAC duplicado detectado.",
                        device=ied.name,
                        related_to=first_ied,
                        expected="MAC Único",
                        found=mac
                    )
                )
            else:
                mac_addresses[mac] = ied.name

        # VLANs DEVEM SER IGUAIS (ESPECIFICAMENTE 001)
        vlan = ied.communication.vlan
        if vlan is not None:
            if vlan != "001":
                comm_errors.append(
                    ErrorDetail(
                        category=ErrorCategory.COMMUNICATION,
                        message=f"VLAN inválido.",
                        device=ied.name,
                        expected="001",
                        found=vlan
                    )
                )

        # APPIDs DEVEM SER DIFERENTES
        app_id = ied.communication.app_id
        if app_id:
            if app_id in app_ids:
                first_ied = app_ids[app_id]
                comm_errors.append(
                    ErrorDetail(
                        category=ErrorCategory.COMMUNICATION,
                        message=f"APPID duplicado detectado.",
                        device=ied.name,        
                        related_to=first_ied,
                        expected="APPID Único",
                        found=app_id
                    )
                )
            else:
                app_ids[app_id] = ied.name

        # TEMPO DE COMUNICAÇÃO NORMAL DEVE SER 1000 MS
        max_time = ied.communication.max_time
        if max_time:
            try:
                if int(max_time) != 1000:
                    comm_errors.append(
                        ErrorDetail(
                            category=ErrorCategory.COMMUNICATION,
                            message="Max Time fora do padrão.",
                            device=ied.name,
                            expected="1000",
                            found=str(max_time)
                        )
                    )
            except ValueError:
                pass

        # TEMPO DE COMUNICAÇÃO DE FALHAS DEVE SER 4 MS
        min_time = ied.communication.min_time
        if min_time:
            try:
                if int(min_time) != 4:
                    comm_errors.append(
                        ErrorDetail(
                            category=ErrorCategory.COMMUNICATION,
                            message="Min Time fora do padrão.",
                            device=ied.name,
                            expected="4",
                            found=str(min_time)
                        )
                    )
            except ValueError:
                pass
                
    return comm_errors