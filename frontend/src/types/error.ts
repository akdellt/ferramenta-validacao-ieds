export interface BackendError {
  error: string;
  message: string;
  filename?: string;
  detail?: string;
  path?: string;
}
