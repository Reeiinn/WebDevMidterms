export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'open' | 'in_progress' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface State {
  user: AuthUser | null;
  token: string | null;
  incidents: Incident[];
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: 'SET_AUTH'; payload: { user: AuthUser; token: string } }
  | { type: 'FETCH_SUCCESS'; payload: Incident[] }
  | { type: 'CREATE_SUCCESS'; payload: Incident }
  | { type: 'UPDATE_SUCCESS'; payload: Incident }
  | { type: 'DELETE_SUCCESS'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  // Additions beyond the spec, needed for a working UI:
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGOUT' };
