export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "customer";
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}
