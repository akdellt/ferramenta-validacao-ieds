export interface BackendError {
  error: string;
  message: string;
  filename?: string;
  details?: string;
  path?: string;
}
