import { useState, type SubmitEvent } from 'react';
import { useService } from '../context/ServiceContext';
import { ENVIRONMENTS, type Environment } from '../types';

export default function MicroserviceForm() {
  const { state, createService } = useService();
  const [name, setName] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [environment, setEnvironment] = useState<Environment>('DEVELOPMENT');

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ok = await createService({ name, endpointUrl, environment });
    if (ok) {
      setName('');
      setEndpointUrl('');
      setEnvironment('DEVELOPMENT');
    }
  };

  return (
    <form className="stack panel" onSubmit={handleSubmit}>
      <h2>Register a service</h2>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. payments-api" required />
      </label>
      <label>
        Endpoint URL
        <input
          type="url"
          value={endpointUrl}
          onChange={(e) => setEndpointUrl(e.target.value)}
          required
        />
      </label>
      <label>
        Environment
        <select value={environment} onChange={(e) => setEnvironment(e.target.value as Environment)}>
          {ENVIRONMENTS.map((env) => (
            <option key={env} value={env}>
              {env}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={state.loading}>
        Register
      </button>
    </form>
  );
}
