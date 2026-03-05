export const ParameterStatus = {
  MATCH: "Conforme",
  DIVERGENT: "Divergente",
  NOT_FOUND: "Não encontrado",
  NOT_APPLICABLE: "Não aplicável",
} as const;

export type ParameterStatusType =
  (typeof ParameterStatus)[keyof typeof ParameterStatus];

export interface ValidationItem {
  group: string;
  parameter: string;
  description: string;
  setting_range: string;
  reference_value: string;
  current_value: string;
  status: ParameterStatusType;
}

export interface ValidationResult {
  relay_model: string;
  substation: string;
  status: string;
  parameters_list: ValidationItem[];
}
