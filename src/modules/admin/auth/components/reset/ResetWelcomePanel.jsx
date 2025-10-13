import { Link } from 'react-router-dom';
import '/src/styles/components/auth/reset/ResetWelcomePanel.css';
import '/src/styles/components/auth/register/RegisterWelcomePanel.css';

const ResetWelcomePanel = () => {
  return (
    <div className="register-welcome-panel reset-welcome-panel">
      <div className="register-welcome-content reset-welcome-content">
        <div className="register-logo-container reset-logo-container">
          <img
            src="/public/img/calendario.png"
            alt="Programador de turnos"
            className="register-logo reset-logo"
          />

          <h1 className=" reset-welcome-app-name">Shift Scheduler</h1>
        </div>

        <div className=" reset-welcome-section">
          <h2>¿Olvidaste tu contraseña?</h2>
          <p>Introduce tu correo y te enviaremos las instrucciones para restablecerla.</p>
        </div>

        <div className="reset-welcome-footer">
          <div className="reset-welcome-account">
            <div className="reset-welcome-actions">
              <div className="reset-action">
                <p className="reset-action-label">¿Recordaste tu contraseña?</p>
                <Link to="/login" className="reset-welcome-login-btn">Iniciar sesión</Link>
              </div>

              <div className="reset-action">
                <p className="reset-action-label">¿No tienes cuenta?</p>
                <Link to="/register" className="reset-welcome-login-btn">Crea una cuenta</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetWelcomePanel;
