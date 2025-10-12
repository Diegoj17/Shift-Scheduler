import { Link } from 'react-router-dom';
import '/src/styles/components/auth/register/RegisterWelcomePanel.css';

const RegisterWelcomePanel = () => {
  return (
    <div className="register-welcome-panel">
      <div className="register-welcome-content">
        <div className="register-logo-container">
          <img 
            src="/public/img/calendario.png" 
            alt="Programador de turnos" 
            className="register-logo" 
          />

          <h1 className="register-welcome-app-name">Programador de turnos</h1>
          <p className="register-welcome-tagline">Gestión de turnos y horarios</p>
        </div>

        <div className="register-welcome-section">
          <h2>¡Hola!</h2>
          <p>Accede a tu cuenta para gestionar los horarios de tu equipo de manera eficiente.</p>
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