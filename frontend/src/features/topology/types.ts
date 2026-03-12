// POSSÍVEIS CENÁRIOS
export type TopologyType =
  | "Paralelismo"
  | "Seletividade Lógica com Barra Comum"
  | "Seletividade Lógica Independente"
  | "Cenário Não Identificado";

// CATEGORIAS DE ERRO
export type ErrorCategory = "Formulário" | "Comunicação" | "Lógica";

// DETALHE DO ERRO
export interface ErrorDetail {
  category: ErrorCategory;
  message: string;
  device?: string;
  related_to?: string;
  publisher?: string;
  subscriber?: string;
  affected_signal?: string;
  expected?: string;
  found?: string;
}

// RESUMO DO IED
export interface IedSummary {
  name: string;
  relay_model: string;
  is_healthy: boolean;
  errors: ErrorDetail[];
}

export interface ConnectionEdge {
  from_ied: string;
  to_ied: string;
  signals: string[];
  is_broken: boolean;
  errors: ErrorDetail[];
}

// RESPOSTA FINAL DO BACKEND
export interface TopologyValidationResponse {
  filename: string;
  scenario: TopologyType;
  is_valid: boolean;
  summary: {
    consistency_errors_count: number;
    communication_errors_count: number;
    logic_errors_count: number;
    total_errors: number;
  };
  consistency_errors: ErrorDetail[];
  communication_errors: ErrorDetail[];
  logic_errors: ErrorDetail[];
  ied_summary: IedSummary[];
  connection_map: ConnectionEdge[];
}

export interface TopologyResponse {
  scenario: string;
  ieds: any[];
  connections: ConnectionEdge[];
}

export interface Feeder {
  id: string;
  name: string;
}

export interface Transformer {
  id: string;
  name: string;
  relay_model: string;
  feeders: Feeder[];
}
