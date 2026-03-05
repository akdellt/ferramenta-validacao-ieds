export type ValidationStatus =
  | "Conforme"
  | "Divergente"
  | "Não encontrado"
  | "Não aplicável";

export interface Parameter {
  parameter: string;
  description: string;
  setting_range?: string;
  reference_value: string;
  current_value: string;
  status: ValidationStatus;
  group: string;
}

export interface IedResult {
  relay_model: string;
  parameters_list: Parameter[];
}

export interface BackendReport {
  results: IedResult[];
}
