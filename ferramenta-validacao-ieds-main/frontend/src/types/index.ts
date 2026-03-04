export interface BackendError {
  erro: string;
  mensagem: string;
  arquivo?: string;
  detalhes?: string;
  caminho?: string;
}
