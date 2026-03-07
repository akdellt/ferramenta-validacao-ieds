import lxml.etree
from app.schemas.topology import (
    DataSetSchema, FcdaSchema, TopologyType, TopologyResponse,
    IedCommunicationSchema, ExtRefSchema, IedSchema, ConnectionEdge,
    IedSummary, ErrorDetail
)
from app.exceptions import InvalidFileContentError, FileTooLargeError

MAX_SCD_SIZE_BYTES: int = 50 * 1024 * 1024
SCL_NS = {'scl': 'http://www.iec.ch/61850/2003/SCL'}

# EXTRAI INFORMAÇÕES DOS DATASETS
def extract_datasets(ied_node: lxml.etree._Element, ns: dict) -> list[DataSetSchema]:
    datasets = ied_node.xpath('.//scl:DataSet', namespaces=ns)
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
def verify_scenario_type(relay_model: list[str | None]) -> TopologyType:
    unique_types = set(t for t in relay_model if t is not None)

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
def read_scd_file(content: bytes, filename: str) -> TopologyResponse:
    if not content:
        raise InvalidFileContentError(filename=filename, details="Arquivo vazio.")

    if len(content) > MAX_SCD_SIZE_BYTES:
        raise FileTooLargeError(
            filename=filename,
            max_size_mb=int(MAX_SCD_SIZE_BYTES / (1024 * 1024))
        )
    
    try:
        root = lxml.etree.fromstring(content)
        tree = lxml.etree.ElementTree(root)

        ied_list = tree.xpath('//scl:IED', namespaces=SCL_NS)
        ied_objects = []
        ied_models = []

        # BUSCA NOMES E MODELOS DOS IEDS NA TOPOLOGIA
        for ied in ied_list:
            name = ied.get('name')
            relay_model = ied.get('type')
            ied_models.append(relay_model)

            comm_block = tree.xpath(f'//scl:ConnectedAP[@iedName="{name}"]', namespaces=SCL_NS)

            mac = app_id = vlan = min_time = max_time = None
            # BUSCA DADOS DE COMUNICAÇÃO DO IED
            if comm_block:
                cb = comm_block[0]
                mac_tag = cb.xpath('.//scl:P[@type="MAC-Address"]', namespaces=SCL_NS)
                vlan_tag = cb.xpath('.//scl:P[@type="VLAN-ID"]', namespaces=SCL_NS)
                appid_tag = cb.xpath('.//scl:P[@type="APPID"]', namespaces=SCL_NS)
                mintime_tag = cb.xpath('.//scl:MinTime', namespaces=SCL_NS)
                maxtime_tag = cb.xpath('.//scl:MaxTime', namespaces=SCL_NS)

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
            ext_refs = ied.xpath('.//scl:ExtRef', namespaces=SCL_NS)
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
            ied_objects.append(IedSchema(
                name=name,
                relay_model=relay_model,
                communication=comm_schema,
                datasets=extract_datasets(ied, SCL_NS),
                inputs=inputs_schema_list
            ))

        # RETORNO FINAL DA API
        response = TopologyResponse(
            scenario=verify_scenario_type(ied_models),
            ieds=ied_objects
        )

        return response
    except lxml.etree.XMLSyntaxError as e:
        raise InvalidFileContentError(filename=filename, details=f"Erro de sintaxe XML: {str(e)}")
    except Exception as e:
        raise Exception(f"Erro interno no processamento de '{filename}': {str(e)}")

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
                connections[key].add(signal)

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
            relay_model=ied.relay_model if ied.relay_model else "Desconhecido",
            is_healthy=len(specific_errors) == 0,
            errors=specific_errors
        ))
    return summary_list