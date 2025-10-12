import { useState } from 'react';
import { FaUser } from "react-icons/fa";
import { Link } from 'react-router-dom';
import LoginPasswordInput from './LoginPasswordInput';
import '/src/styles/components/auth/login/LoginForm.css';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, ingresa usuario y contraseña');
      return;
    }
    
    setIsLoading(true);
    // Simular llamada API
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="login-form-panel">
      <form onSubmit={handleSubmit} className="login-card">
        <div className="login-card-header">
          <h2>Iniciar Sesión</h2>
          <p className="login-app-tagline">Accede a tu cuenta</p>
        </div>

        {error && <div className="login-error-message">{error}</div>}

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
          {isLoading ? (
            <div className="login-spinner"></div>
          ) : (
            'Iniciar Sesión'
          )}
        </button>

        <div className="login-footer">
          <p>¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link></p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;