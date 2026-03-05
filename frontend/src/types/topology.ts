export interface ConnectionEdge {
  from_ied: string;
  to_ied: string;
  signals: string[];
  is_broken: boolean;
  errors: any[];
}

export interface TopologyResponse {
  scenario: string;
  ieds: any[];
  connections: ConnectionEdge[];
}
