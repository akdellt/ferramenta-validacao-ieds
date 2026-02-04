from app.schemas import *

VALORES_NAO_APLICAVEL: set[str] = {"-", "—", "N/A", "NA", "S/A"}

def nao_aplicavel(valor: str) -> bool:
    return valor.strip() in VALORES_NAO_APLICAVEL

# FUNÇÃO AUXILIAR PARA IDENTIFICAR VALORES NUMÉRICOS
def comparar_valores(valor_ref: str, valor_lido: str) -> bool:
    s_ref = str(valor_ref).strip().lower()
    s_lido = str(valor_lido).strip().lower()

    if s_ref == s_lido:
        return True

    try:
        f_ref = float(s_ref)
        f_lido = float(s_lido)
        return abs(f_ref - f_lido) < 0.0001
    except ValueError:
        return False


# VALIDA PARAMETROS ENTRE DOIS ARQUIVOS
def validar_parametros(oa: ArquivoOA, ied: ArquivoIED) -> ResultadoValidacao:
    dict_ied = {p.parametro: p.valor_atual for p in ied.parametros}

    param_validados = []

    # Para cada parâmetro na OA, buscar correspondente no IED
    for param_oa in oa.parametros:
        if nao_aplicavel(param_oa.ajuste_referencia):
            param_validados.append(IEDItem(
                **param_oa.model_dump(),  
                valor_atual=dict_ied.get(param_oa.parametro, ""),
                status=StatusParametro.NAO_APLICAVEL
            ))
            continue

        valor_atual_ied = dict_ied.get(param_oa.parametro)

        if valor_atual_ied is None:
            param_validados.append(IEDItem(
                **param_oa.model_dump(),  
                valor_atual="",
                status=StatusParametro.NAO_ENCONTRADO
            ))
            continue


        status = (
            StatusParametro.CONFORME
            if comparar_valores(param_oa.ajuste_referencia, valor_atual_ied)
            else StatusParametro.DIVERGENTE
        )

        param_validados.append(IEDItem(
            **param_oa.model_dump(),  
            valor_atual=valor_atual_ied,
            status=status
        ))

    tem_problema = any(
        item.status in (StatusParametro.DIVERGENTE, StatusParametro.NAO_ENCONTRADO)
        for item in param_validados
    )
        
    resultado_validacao = ResultadoValidacao(
        rele_tipo=oa.rele_tipo,
        lista_parametros=param_validados
    )

    return resultado_validacao

# CONFIRMA QUE ARQUIVOS DO PAR SÃO SOBRE MESMO IED
def validar_ied(par: ParArquivos) -> ResultadoValidacao:
    rele_oa = str(par.oa.rele_tipo).strip().lower()
    rele_ied = str(par.ied.rele_tipo).strip().lower()

    if rele_oa not in rele_ied and rele_ied not in rele_oa:
        raise ValueError(
            f"Modelos incompatíveis: OA='{par.oa.rele_tipo}' vs IED='{par.ied.rele_tipo}'"
        )

    return validar_parametros(par.oa, par.ied)

# VALIDAÇÃO É CHAMADA PARA TODOS OS PARES DE ARQUIVOS
def processar_arquivos(lote: ConjuntoPares) -> RelatorioValidacoes:
    resultados = []

    for par in lote.pares:
        try:
            resultado = validar_ied(par)
            resultados.append(resultado)
        except Exception as e:
            resultados.append(ResultadoValidacao(
                rele_tipo=f"{par.oa.rele_tipo} / {par.ied.rele_tipo}",
                lista_parametros=[]
            ))

    return RelatorioValidacoes(resultados=resultados)