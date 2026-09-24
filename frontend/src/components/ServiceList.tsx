import { useService } from '../context/ServiceContext';
import { ENVIRONMENTS, STATUSES, type Environment, type Status } from '../types';

export default function ServiceList() {
  const { state, dispatch, updateService, deleteService } = useService();
  const visible =
    state.selectedEnvironment === 'ALL'
      ? state.services
      : state.services.filter((s) => s.environment === state.selectedEnvironment);

  return (
    <>
      <label className="filter">
        Environment
        <select
          value={state.selectedEnvironment}
          onChange={(e) => dispatch({ type: 'SET_ENV_FILTER', payload: e.target.value as Environment | 'ALL' })}
        >
          <option value="ALL">All</option>
          {ENVIRONMENTS.map((env) => (
            <option key={env} value={env}>{env}</option>
          ))}
        </select>
      </label>

      {state.loading && state.services.length === 0 ? (
        <p className="muted">Loading services…</p>
      ) : visible.length === 0 ? (
        <p className="muted">No services registered yet.</p>
      ) : (
        <ul className="list">
          {visible.map((s) => (
            <li key={s.id} className={`service status-${s.status}`}>
              <div>
                <h3>{s.name}</h3>
                <p><a href={s.endpointUrl} target="_blank" rel="noreferrer">{s.endpointUrl}</a></p>
                <p className="muted small">{s.environment} · {new Date(s.createdAt).toLocaleString()}</p>
              </div>
              <div className="service-actions">
                <select
                  aria-label="Status"
                  value={s.status}
                  onChange={(e) => void updateService(s.id, { status: e.target.value as Status })}
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <button className="danger" onClick={() => void deleteService(s.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
