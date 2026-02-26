import lxml.etree
from app.schemas.topology import *

# EXTRAI INFORMAÇÕES DOS DATASETS
def extract_datasets(root_xml, ns) -> list[DataSetSchema]:
    datasets = root_xml.xpath('.//scl:DataSet', namespaces=ns)
    dataset_list = []

    for dataset in datasets:
        dataset_name = dataset.get('name')
        
        fcdas = dataset.xpath('.//scl:FCDA', namespaces=ns)
        fcda_list = []

        for fcda in fcdas:
            fcda_list.append(
                FcdaSchema(
                    ld_inst=fcda.get("ldInst"),
                    prefix=fcda.get("prefix", ""),
                    ln_class=fcda.get("lnClass"),
                    ln_inst=fcda.get("lnInst", ""),
                    do_name=fcda.get("doName"),
                    da_name=fcda.get("daName", ""),
                    fc=fcda.get("fc")
                )
            )
        
        dataset_list.append(
            DataSetSchema(
                dataset_name= dataset_name,
                items= fcda_list
            )
        )

    return dataset_list

# VERIFICA CENÁRIO DE TOPOLOGIA
def verify_scenario_type(ied_types: list) -> TopologyType:
    # SEL 2414 - PARALELISMO
    # SEL 751 - SELETIVIDADE LÓGICA

    unique_types = set(t for t in ied_types if t is not None)

    # CENÁRIO DE SELETIVIDADE LÓGICA
    if unique_types == {"SEL_751"}:
        return TopologyType.LOGICAL_SELECTIVITY_ISOLATED
    
    # CENÁRIO DE PARALELISMO
    if unique_types == {"SEL_2414"}:
        return TopologyType.PARALLELISM
    
    # MODELOS NÃO RECONHECIDOS (OUTROS CENÁRIOS)
    return TopologyType.GENERIC

# SALVA TODAS AS INFORMAÇÕES RELEVANTES DO PROJETO
# NOME, IED, MAC, VLAN, MAX/MIN, APPID, DATASETS e EXTREFS
def read_scd_file(content: bytes) -> TopologyResponse:
    try:
        root = lxml.etree.fromstring(content)
        tree = lxml.etree.ElementTree(root)
        ns = {'scl': 'http://www.iec.ch/61850/2003/SCL'}

        ied_list = tree.xpath('//scl:IED', namespaces=ns)
        ied_objects = []
        ied_types = []

        # BUSCA NOMES E MODELOS DOS IEDS NA TOPOLOGIA
        for ied in ied_list:
            name = ied.get('name')
            type = ied.get('type')
            ied_types.append(type)

            comm_block = tree.xpath(f'//scl:ConnectedAP[@iedName="{name}"]', namespaces=ns)
            mac, app_id, vlan, min_time, max_time = None, None, None, None, None

            # BUSCA DADOS DE COMUNICAÇÃO DO IED
            if comm_block:
                cb = comm_block[0]
                mac_tag = cb.xpath('.//scl:P[@type="MAC-Address"]', namespaces=ns)
                vlan_tag = cb.xpath('.//scl:P[@type="VLAN-ID"]', namespaces=ns)
                appid_tag = cb.xpath('.//scl:P[@type="APPID"]', namespaces=ns)
                mintime_tag = cb.xpath('.//scl:MinTime', namespaces=ns)
                maxtime_tag = cb.xpath('.//scl:MaxTime', namespaces=ns)

                mac = mac_tag[0].text if mac_tag else None
                vlan = vlan_tag[0].text if vlan_tag else None
                app_id = appid_tag[0].text if appid_tag else None
                min_time = mintime_tag[0].text if mintime_tag else None
                max_time = maxtime_tag[0].text if maxtime_tag else None
            
            comm_schema = IedCommunicationSchema(
                mac_address=mac,
                app_id=app_id,
                vlan=vlan,
                min_time=min_time,
                max_time=max_time
            )

            # BUSCA INPUTS DO IED
            ext_refs = ied.xpath('.//scl:ExtRef', namespaces=ns)
            inputs_schema_list = []
            
            for ext_ref in ext_refs:
                target_ied = ext_ref.get('iedName')
                int_addr_raw = ext_ref.get('intAddr')
                int_addr = int_addr_raw.split('|')[0].strip() if int_addr_raw else None
                
                if target_ied is not None:
                    inputs_schema_list.append(ExtRefSchema(
                        listens_to=target_ied,
                        virtual_bit=int_addr,
                        ld_inst=ext_ref.get("ldInst"),
                        prefix=ext_ref.get("prefix", ""),
                        ln_class=ext_ref.get("lnClass"),
                        ln_inst=ext_ref.get("lnInst", ""),
                        do_name=ext_ref.get("doName"),
                        da_name=ext_ref.get("daName", ""),
                        fc=ext_ref.get("fc")
                    ))

            # MONTAGEM FINAL DO IED
            ied_schema = IedSchema(
                name=name,
                ied_type=type,
                communication=comm_schema,
                datasets=extract_datasets(ied, ns),
                inputs=inputs_schema_list
            )

            ied_objects.append(ied_schema)

        # RETORNA CENÁRIO DO PROJETO
        scenario_type = verify_scenario_type(ied_types) 

        # RETORNO FINAL DA API
        response = TopologyResponse(
            scenario=scenario_type,
            ieds=ied_objects
        )

        return response
    except Exception as e:
        raise Exception(f"Falha no Parser XML: {str(e)}")

# CRIA MAPA DE CONEXÃO ENTRE IEDS DO PROJETO
def build_connection_map(ieds: list[IedSchema], logic_errors: list[ErrorDetail] = []) -> list[ConnectionEdge]:
    connections = {}

    for subscriber in ieds:
        for ext_ref in subscriber.inputs:
            publisher_name = ext_ref.listens_to
            signal = ext_ref.object_ref

            if publisher_name and signal:
                key = (publisher_name, subscriber.name)
                
                if key not in connections:
                    connections[key] = set()
                
                if signal not in connections[key]:
                    connections[key].append(signal)

    map_list = []
    for (src, dst), signals in connections.items():
        link_errors = [
            e for e in logic_errors 
            if e.publisher == src and e.subscriber == dst
        ]

        map_list.append(ConnectionEdge(
            from_ied=src,
            to_ied=dst,
            signals=list(signals),
            is_broken=len(link_errors) > 0,
            errors=link_errors
        ))
    
    return map_list

# RESULTADO FINAL DE VALIDAÇÃO
def build_ied_summary(ieds: list[IedSchema], all_errors: list[ErrorDetail]) -> list[IedSummary]:
    summary_list = []
    for ied in ieds:
        specific_errors = [
            e for e in all_errors 
            if e.device == ied.name or e.subscriber == ied.name or e.publisher == ied.name
        ]

        summary_list.append(IedSummary(
            name=ied.name,
            model=ied.ied_type if ied.ied_type else "Desconhecido",
            is_healthy=len(specific_errors) == 0,
            errors=specific_errors
        ))
    return summary_list