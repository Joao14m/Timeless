import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import BlockedApp from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BlockedApp />
  </StrictMode>
);
