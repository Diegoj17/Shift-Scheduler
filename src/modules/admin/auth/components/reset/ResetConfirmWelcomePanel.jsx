import React from 'react';
import { Link } from 'react-router-dom';
import '/src/styles/components/auth/reset/ResetWelcomePanel.css';

const ResetConfirmWelcomePanel = () => {
  return (
    <div className="reset-welcome-panel">
      <div className="reset-welcome-content">
        <div className="reset-logo-container">
          <img
            src="/img/calendario.png"
            alt="Programador de turnos"
            className="reset-logo"
          />
          <h1 className="reset-welcome-app-name">Shift Scheduler</h1>
        </div>

        <div className="reset-welcome-section">
          <h2>Crear Nueva Contraseña</h2>
          <p>Ingresa y confirma tu nueva contraseña para completar el proceso.</p>
        </div>

        <div className="reset-welcome-footer">
          <div className="reset-welcome-account">
            <div className="reset-welcome-actions">
              <div className="reset-action">
                <p className="reset-action-label">¿Recordaste tu contraseña?</p>
                <Link to="/login" className="reset-welcome-login-btn">Iniciar sesión</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ResetConfirmWelcomePanel;
