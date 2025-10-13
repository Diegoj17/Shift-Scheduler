import { useState } from 'react';
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";
import { Link } from 'react-router-dom';
import { useAuth } from '/src/hooks/useAuth.js';
import '/src/styles/components/auth/reset/ResetForm.css';
import Modal from '/src/components/common/Modal';
import { useEffect } from 'react';

const ResetForm = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword, error, clearError } = useAuth();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

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

    setIsLoading(true);

    try {
      const result = await resetPassword(email);
      if (result && result.success) {
        setModalType('success');
        setModalTitle('Enviado');
        setModalMessage(result.data?.message || 'Se ha enviado un enlace de recuperación a tu correo electrónico.');
        setModalOpen(true);
        setEmail('');
      } else {
        setModalType('error');
        setModalTitle('Error');
        setModalMessage(result?.message || 'No se pudo enviar el enlace. Intenta nuevamente.');
        setModalOpen(true);
      }
    } catch (err) {
      console.error('Reset password failed:', err);
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Ocurrió un error al intentar enviar el enlace.');
      setModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir modal automáticamente si useAuth proporciona un error
  useEffect(() => {
    if (error) {
      setModalType('error');
      setModalTitle('Error');
      setModalMessage(error);
      setModalOpen(true);
    }
  }, [error]);

  return (
    <div className="reset-form-card-inner">
      <form onSubmit={handleSubmit} className="reset-form">
        <div className="reset-form-header">
          <h2 className="reset-form-title">Reestablecer Contraseña</h2>
          <p className="reset-form-subtitle">Ingresa tu correo electrónico para recibir instrucciones</p>
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
            'Enviar Enlace'
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