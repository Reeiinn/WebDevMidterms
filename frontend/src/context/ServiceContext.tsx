import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { api, ApiError, type Action, type NewService, type ServiceUpdate, type State } from '../types';

const initialState: State = {
  user: JSON.parse(localStorage.getItem('user') ?? 'null'),
  token: localStorage.getItem('token'),
  services: [],
  selectedEnvironment: 'ALL',
  loading: false,
  error: null,
};

// Pure reducer: no fetch, no localStorage in here. Side effects live in the actions below.
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_AUTH':
      return { ...state, user: action.payload.user, token: action.payload.token, error: null };
    case 'SET_ENV_FILTER':
      return { ...state, selectedEnvironment: action.payload };
    case 'FETCH_SERVICES_SUCCESS':
      return { ...state, services: action.payload, loading: false, error: null };
    case 'CREATE_SERVICE_SUCCESS':
      return { ...state, services: [action.payload, ...state.services], loading: false, error: null };
    case 'UPDATE_SERVICE_SUCCESS':
      return {
        ...state,
        services: state.services.map((s) => (s.id === action.payload.id ? action.payload : s)),
        error: null,
      };
    case 'DELETE_SERVICE_SUCCESS':
      return { ...state, services: state.services.filter((s) => s.id !== action.payload), error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload || null, loading: false };
    case 'LOGOUT':
      return { ...initialState, user: null, token: null };
    default:
      return state;
  }
}

interface ContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  authenticate: (mode: 'login' | 'register', email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchServices: () => Promise<void>;
  createService: (data: NewService) => Promise<boolean>;
  updateService: (id: string, data: ServiceUpdate) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
}

const ServiceContext = createContext<ContextValue | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  // One place to turn any thrown error into a SET_ERROR dispatch (and log out on 401)
  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 401 && state.token) {
        logout();
        return;
      }
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Something went wrong' });
    },
    [logout, state.token]
  );

  // Handles both sign in and sign up: both return { token, user }
  const authenticate = useCallback(async (mode: 'login' | 'register', email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { token, user } =
        mode === 'login' ? await api.login(email, password) : await api.register(email, password);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'SET_AUTH', payload: { user, token } });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Request failed' });
    }
  }, []);

  const fetchServices = useCallback(async () => {
    if (!state.token) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      dispatch({ type: 'FETCH_SERVICES_SUCCESS', payload: await api.getServices(state.token) });
    } catch (e) {
      handleError(e);
    }
  }, [state.token, handleError]);

  const createService: ContextValue['createService'] = useCallback(
    async (data) => {
      if (!state.token) return false;
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        dispatch({ type: 'CREATE_SERVICE_SUCCESS', payload: await api.createService(state.token, data) });
        return true;
      } catch (e) {
        handleError(e);
        return false;
      }
    },
    [state.token, handleError]
  );

  const updateService: ContextValue['updateService'] = useCallback(
    async (id, data) => {
      if (!state.token) return;
      try {
        dispatch({ type: 'UPDATE_SERVICE_SUCCESS', payload: await api.updateService(state.token, id, data) });
      } catch (e) {
        handleError(e);
      }
    },
    [state.token, handleError]
  );

  const deleteService = useCallback(
    async (id: string) => {
      if (!state.token) return;
      try {
        await api.deleteService(state.token, id);
        dispatch({ type: 'DELETE_SERVICE_SUCCESS', payload: id });
      } catch (e) {
        handleError(e);
      }
    },
    [state.token, handleError]
  );

  // Load services whenever we become authenticated (login or page refresh with a saved token)
  useEffect(() => {
    if (state.token) void fetchServices();
  }, [state.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({ state, dispatch, authenticate, logout, fetchServices, createService, updateService, deleteService }),
    [state, authenticate, logout, fetchServices, createService, updateService, deleteService]
  );

  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
}

export function useService(): ContextValue {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error('useService must be used inside <ServiceProvider>');
  return ctx;
}
