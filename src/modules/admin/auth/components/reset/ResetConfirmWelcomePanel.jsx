import React from 'react';
import { Link } from 'react-router-dom';
import '../../../../styles/components/auth/reset/ResetWelcomePanel.css';

const ResetConfirmWelcomePanel = () => {
  return (
    <div className="register-welcome-panel reset-welcome-panel">
      <div className="register-welcome-content reset-welcome-content">
        <div className="register-logo-container reset-logo-container">
          <img
            src="/img/calendario.png"
            alt="Programador de turnos"
            className="register-logo reset-logo"
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