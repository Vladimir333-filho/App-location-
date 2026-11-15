import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Regista o Service Worker para instalação PWA e recepção de notificações push.
// Não é feito cache de APIs, sessões ou páginas privadas.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      console.warn('QuotaMob: não foi possível registar o Service Worker.', error);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
