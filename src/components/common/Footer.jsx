import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/components/common/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Columna izquierda - PQRSD */}
        <div className="column">
          <div className="logo">
            <img
              src="public/img/calendario.png"
              alt="Logo Shift Scheduler"
              className="logo-image"
            />
            <h3 className="shift-title">Shift Scheduler</h3>
          </div>
          <p className="description">
            Sistema de Gestión de Turnos y Horarios para Personal
          </p>
        </div>
      </div>

      <hr className="divider" />

      {/* Sección inferior */}
      <div className="bottom-section">
        <div className="copyright">
          <div>2025 © All Rights Reserved. Desarrollado por: Casi Tech - Grupo 9 AyD</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;