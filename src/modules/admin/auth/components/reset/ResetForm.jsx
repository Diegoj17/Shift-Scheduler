import { useState, useEffect } from 'react';
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";
import { Link } from 'react-router-dom';
import { useAuth } from '/src/hooks/useAuth.js';
import '/src/styles/components/auth/reset/ResetForm.css';
import Modal from '/src/components/common/Modal';

const ResetForm = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword, error, clearError } = useAuth();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  // Efecto SOLO para errores del hook useAuth
  useEffect(() => {
    if (error) {
      setModalType('error');
      setModalTitle('Error');
      setModalMessage(error);
      setModalOpen(true);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!email) {
      setModalType('error');
      setModalTitle('Correo requerido');
      setModalMessage('Por favor ingresa tu correo electrónico.');
      setModalOpen(true);
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setModalType('error');
      setModalTitle('Correo inválido');
      setModalMessage('Por favor ingresa un correo electrónico válido.');
      setModalOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(email);

      // Verificar resultado explícitamente
      if (result && result.success === true) {
        // ÉXITO: El correo existe y se envió el enlace
        setModalType('success');
        setModalTitle('¡Enlace enviado!');
        setModalMessage(result.message || 'Se ha enviado un enlace de recuperación a tu correo electrónico.');
        setModalOpen(true);
        setEmail('');
      } else {
        // ERROR: El correo no existe u otro problema
        const msg = result?.message || 'No se pudo enviar el enlace. Verifica el correo electrónico.';
        setModalType('error');
        setModalTitle('Error');
        setModalMessage(msg);
        setModalOpen(true);
      }
    } catch (err) {
      // Captura cualquier error no manejado
      console.error('Reset password failed:', err);
      const msg = err?.message || 'Error al solicitar el enlace de recuperación.';
      setModalType('error');
      setModalTitle('Error');
      setModalMessage(msg);
      setModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-form-card-inner">
      <form onSubmit={handleSubmit} className="reset-form">
        <div className="reset-form-header">
          <h2 className="reset-form-title">Restablecer Contraseña</h2>
          <p className="reset-form-subtitle">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <div className="reset-form-group">
          <label htmlFor="email" className="reset-form-label">
            Correo Electrónico
          </label>
          <div className="reset-input-container">
            <FaEnvelope className="reset-input-icon" />
            <input
              type="email"
              id="email"
              className="reset-input"
              placeholder="Ingresa tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <button 
          type="submit" 
          className={`reset-btn ${isLoading ? 'reset-loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="reset-spinner"></div>
          ) : (
            'Enviar Enlace de Recuperación'
          )}
        </button>
      </form>
      
      <Modal 
        isOpen={modalOpen} 
        type={modalType} 
        title={modalTitle} 
        message={modalMessage} 
        onClose={() => setModalOpen(false)} 
      />
    </div>
  );
};

export default ResetForm;