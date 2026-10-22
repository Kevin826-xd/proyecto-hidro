export type UserStatus = "pending" | "approved" | "rejected";

export type ApprovalDecision = "approve" | "reject";

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
