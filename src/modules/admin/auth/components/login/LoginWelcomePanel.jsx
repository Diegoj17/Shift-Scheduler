import { FaCalendarAlt, FaClock, FaUsers } from "react-icons/fa";
import '/src/styles/components/auth/login/LoginWelcomePanel.css';

const LoginWelcomePanel = () => {
  return (
    <div className="login-info-panel">
      <div className="login-info-content">
        <div className="login-logo-container">
          <img
            src="/img/calendario.png"
            alt="Logo Shift Scheduler"
            className="login-logo"
          />
          <h1 className="login-app-name">Shift Scheduler</h1>
          <p className="login-app-tagline">Gestión de turnos y horarios</p>
        </div>

        <div className="login-welcome-section">
          <h2>¡Bienvenido!</h2>
          <p>Accede a tu cuenta para gestionar los horarios de tu equipo de manera eficiente.</p>
        </div>

        <div className="login-features">
          <div className="login-feature">
            <div className="login-feature-icon">
              <FaCalendarAlt />
            </div>
            <div className="login-feature-text">
              <h3>Programación Inteligente</h3>
              <p>Crea horarios optimizados automáticamente</p>
            </div>
          </div>
          
          <div className="login-feature">
            <div className="login-feature-icon">
              <FaClock />
            </div>
            <div className="login-feature-text">
              <h3>Control de Tiempo</h3>
              <p>Gestiona horas extras y tiempo de descanso</p>
            </div>
          </div>
          
          <div className="login-feature">
            <div className="login-feature-icon">
              <FaUsers />
            </div>
            <div className="login-feature-text">
              <h3>Gestión de Equipos</h3>
              <p>Coordina múltiples equipos y departamentos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginWelcomePanel;