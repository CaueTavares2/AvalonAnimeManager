import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { runSelfDiagnostics } from './utils/healthCheck';

// Execute basic health check for runtime
if (import.meta.env.DEV) {
  runSelfDiagnostics();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
