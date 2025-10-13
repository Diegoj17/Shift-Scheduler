import { Link } from 'react-router-dom';
import '/src/styles/components/auth/register/RegisterWelcomePanel.css';

const RegisterWelcomePanel = () => {
  return (
    <div className="register-welcome-panel">
      <div className="register-welcome-content">
        <div className="register-logo-container">
          <img 
            src="/img/calendario.png" 
            alt="Programador de turnos" 
            className="register-logo" 
          />

          <h1 className="register-welcome-app-name">Shift Scheduler</h1>
        </div>

        <div className="register-welcome-section">
          <h2>¡Hola!</h2>
          <p>Registrate para hacer parte de nuestro equipo.</p>
        </div>

        <div className="register-welcome-footer">
          <div className="register-welcome-account">
            <p className="register-welcome-account-text">¿Ya tienes una cuenta?</p>
            <Link to="/login" className="register-welcome-login-btn">Inicia Sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterWelcomePanel;