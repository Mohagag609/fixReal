export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface AuditLogStats {
  total: number;
  today: number;
  this_week: number;
  this_month: number;
  actions: Array<{
    action: string;
    count: number;
  }>;
  tables: Array<{
    table_name: string;
    count: number;
  }>;
}