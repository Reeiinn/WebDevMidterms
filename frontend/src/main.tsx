import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ServiceProvider } from './context/ServiceContext';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServiceProvider>
      <App />
    </ServiceProvider>
  </StrictMode>
);
