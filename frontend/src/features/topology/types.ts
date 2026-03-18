export const TOPOLOGY_MAP = {
  PARALLELISM: "Paralelismo",
  LOGICAL_SELECTIVITY_COUPLED: "Seletividade Lógica com Barra Comum",
  LOGICAL_SELECTIVITY_ISOLATED: "Seletividade Lógica Independente",
  GENERIC: "Cenário Não Identificado",
} as const;

export type TopologyType = (typeof TOPOLOGY_MAP)[keyof typeof TOPOLOGY_MAP];

export const getTopologyHelpers = (type: string | null) => {
  return {
    isParallel: type === TOPOLOGY_MAP.PARALLELISM,
    isCommonBus: type === TOPOLOGY_MAP.LOGICAL_SELECTIVITY_COUPLED,
    isIndependent: type === TOPOLOGY_MAP.LOGICAL_SELECTIVITY_ISOLATED,
    showFeederList: type !== TOPOLOGY_MAP.PARALLELISM,
  };
};

export type ErrorCategory = "Consistência" | "Comunicação" | "Lógica";

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
