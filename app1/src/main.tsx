// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './global.css'; // Stellen Sie sicher, dass Ihre globale CSS hier importiert wird

// ReactDOM.createRoot ist der Einstiegspunkt für die React 18 Concurrent Features.
// Es wird das Element mit der ID 'root' aus der index.html als Render-Ziel verwendet.
// Das Ausrufezeichen (!) am Ende von 'document.getElementById("root")!' ist ein
// Non-null Assertion Operator, der TypeScript mitteilt, dass dieses Element
// definitiv existiert und nicht null ist.
ReactDOM.createRoot(document.getElementById('root')!).render(
  // React.StrictMode ist eine Entwickler-Hilfskomponente, die zusätzliche Prüfungen
  // und Warnungen während der Entwicklung durchführt, um potenzielle Probleme
  // in Ihrer Anwendung zu erkennen. Sie rendert keine sichtbare UI.
  <React.StrictMode>
    {/* Die App-Komponente wird hier gerendert und ist der Wurzelpunkt Ihrer Anwendung */}
    <App />
  </React.StrictMode>,
);