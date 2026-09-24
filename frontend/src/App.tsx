import { useService } from './context/ServiceContext';
import Login from './components/Login';
import MicroserviceForm from './components/MicroserviceForm';
import ServiceList from './components/ServiceList';

export default function App() {
  const { state, logout } = useService();

  if (!state.token) return <Login />;

  return (
    <div className="shell">
      <header>
        <h1>PulseDesk</h1>
        <div>
          <span className="muted small">{state.user?.email}</span>{' '}
          <button className="ghost" onClick={logout}>Sign out</button>
        </div>
      </header>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <div className="layout">
        <MicroserviceForm />
        <section>
          <h2>Services ({state.services.length})</h2>
          <ServiceList />
        </section>
      </div>
    </div>
  );
}
