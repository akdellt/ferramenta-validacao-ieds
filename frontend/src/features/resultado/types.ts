export type StatusValidacao =
  | "Conforme"
  | "Divergente"
  | "Não encontrado"
  | "Não aplicável";

export interface ParametroBackend {
  parametro: string;
  descricao: string;
  faixa_ajuste?: string;
  ajuste_referencia: string;
  valor_atual: string;
  status: StatusValidacao;
  grupo?: string;
}

export interface ResultadoIED {
  rele_tipo: string;
  lista_parametros: ParametroBackend[];
}

export interface RelatorioBackend {
  resultados: ResultadoIED[];
}
