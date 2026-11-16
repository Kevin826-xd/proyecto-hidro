// pending: se registró pero todavía no ingresa el código que le llegó al correo.
// verified: ya verificó su correo y puede iniciar sesión.
export type UserStatus = "pending" | "verified";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "customer";
  status: UserStatus;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}
