// client/src/index.js (MODIFICADO o NUEVO)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Asegúrate de que esto esté aquí si tienes CSS global
import { BrowserRouter } from 'react-router-dom'; // Importa BrowserRouter

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* ¡ENVUELVE TU COMPONENTE APP CON BrowserRouter AQUÍ! */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);