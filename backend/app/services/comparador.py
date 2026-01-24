from app.schemas import *

# FUNÇÃO AUXILIAR PARA IDENTIFICAR VALORES NUMÉRICOS
def comparar_valores(valor_ref: str, valor_lido: str) -> bool:
    if valor_ref is None or valor_lido is None:
        return False

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
    dict_ied = {p.parametro: p for p in ied.parametros}

    param_validados = []

    # Para cada parâmetro na OA, buscar correspondente no IED
    for param_oa in oa.parametros:
        param_ied = dict_ied.get(param_oa.parametro)

        valor_lido = None
        status="Não encontrado"

        if param_ied:
            valor_lido = param_ied.valor_atual

            if comparar_valores(param_oa.ajuste_referencia, valor_lido):
                status = "Conforme"
            else:
                status = "Divergente"
        
        item = IEDItem(
            **param_oa.model_dump(),  
            valor_atual=valor_lido if valor_lido is not None else "NENHUM",
            status=status
        )
        param_validados.append(item)

    divergente = any(i.status != "Conforme" for i in param_validados)
    status_geral = "Reprovado" if divergente else "Aprovado"
        
    resultado_validacao = ResultadoValidacao(
        rele_tipo=oa.rele_tipo,
        status_geral=status_geral,
        lista_parametros=param_validados
    )

    return resultado_validacao

# CONFIRMA QUE ARQUIVOS DO PAR SÃO SOBRE MESMO IED
def validar_ied(par: ParArquivos) -> ResultadoValidacao:
    rele_tipo_oa = str(par.oa.rele_tipo).strip().lower()
    rele_tipo_ied = str(par.ied.rele_tipo).strip().lower()

    match = (rele_tipo_oa in rele_tipo_ied) or (rele_tipo_ied in rele_tipo_oa)
    if not match:
        return ResultadoValidacao(
            rele_tipo=f"{par.oa.rele_tipo} vs {par.ied.rele_tipo}",
            status_geral="Erro: Modelos Diferentes",
            lista_parametros=[]
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
                rele_tipo="Erro",
                status_geral=f"Falha no processamento: {str(e)}",
                lista_parametros=[]
            ))

    return RelatorioValidacoes(resultados=resultados)