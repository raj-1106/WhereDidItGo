import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Opt in to offline/installable behavior. See service-worker.ts for exactly
// what is and isn't cached (deliberately no /api/* caching).
serviceWorkerRegistration.register();
