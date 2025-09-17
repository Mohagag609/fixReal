export interface CreateUserData {
  email: string;
  name: string;
  role?: string;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: string;
}

export interface UserWithDetails {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
}