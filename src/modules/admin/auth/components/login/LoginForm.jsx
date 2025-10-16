import { useState, useEffect } from 'react';
import { useAuth } from '/src/hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';
import { FaUser } from "react-icons/fa";
import { Link } from 'react-router-dom';
import LoginPasswordInput from './LoginPasswordInput';
import '/src/styles/components/auth/login/LoginForm.css';
import Modal from '/src/components/common/Modal';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    if (!email || !password) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await login(email, password);
      if (result.success) {
        // result.data comes from authService.login -> { token, user }
        const user = result.data?.user;
        const role = (user?.role || '').toString().toLowerCase();

        // Roles that should go to admin dashboard
        const adminRoles = ['admin', 'administrador', 'gerente', 'manager', 'superadmin'];

        if (adminRoles.includes(role)) {
          navigate('/admin/dashboard');
        } else {
          // Usuarios normales van a la página principal de usuario
          navigate('/main');
        }
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('error');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (error) {
      setModalType('error');
      setModalTitle('Error');
      setModalMessage(error);
      setModalOpen(true);
    }
  }, [error]);

  return (
    <div className="login-form-panel">
      <form onSubmit={handleSubmit} className="login-card">
        <div className="login-card-header">
          <h2>Iniciar Sesión</h2>
          <p className="login-app-tagline">Accede a tu cuenta</p>
        </div>

  {/* errores ahora mostrados mediante Modal */}

        <div className="login-form-group">
          <label htmlFor="email" className="login-form-label">
            Correo Electrónico
          </label>
          <div className="login-input-wrapper">
            <FaUser className="login-input-icon" />
            <input
              type="email"
              id="email"
              className="login-form-input"
              placeholder="Ingresa tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <LoginPasswordInput 
          password={password}
          setPassword={setPassword}
          isLoading={isLoading}
          showResetPassword={true}
        />

        <button 
          type="submit" 
          className={`login-btn ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          <span className="login-btn-text">Iniciar Sesión</span>
          {isLoading && <div className="login-spinner" aria-hidden="true"></div>}
        </button>

        <div className="login-footer">
          <p>¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link></p>
        </div>
      </form>
      <Modal isOpen={modalOpen} type={modalType} title={modalTitle} message={modalMessage} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default LoginForm;