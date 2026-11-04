import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installWorkspaceFetch } from './lib/workspaceStore';

// Every /api call carries the active brand workspace
installWorkspaceFetch();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
