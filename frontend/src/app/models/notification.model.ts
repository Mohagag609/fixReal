export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: any;
  read_at?: string;
  created_at: string;
  updated_at: string;
  is_read: boolean;
}