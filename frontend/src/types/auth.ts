export interface User {
  registration: string;
  name: string;
  role: "Admin" | "Tecnico";
  token?: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
