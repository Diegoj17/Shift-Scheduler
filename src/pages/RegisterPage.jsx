import { useState } from 'react';
import RegisterForm from '../modules/admin/auth/components/register/RegisterForm';
import Modal from '../components/common/Modal';
import AuthLayout from '../modules/admin/auth/layout/AuthLayout';
import RegisterWelcomePanel from '../modules/admin/auth/components/register/RegisterWelcomePanel';
import '/src/styles/pages/RegisterPage.css';

const RegisterPage = () => {
  const [modal, setModal] = useState({ 
    open: false, 
    type: 'success', 
    title: '', 
    message: '' 
  });

  const handleRegisterSuccess = () => {
    setModal({
      open: true,
      type: 'success',
      title: 'Cuenta creada',
      message: 'Tu cuenta se creó correctamente.'
    });
  };

  const handleRegisterError = () => {
    setModal({
      open: true,
      type: 'error',
      title: 'Error al registrar',
      message: 'No fue posible crear la cuenta. Intenta de nuevo.'
    });
  };

  return (
    <AuthLayout>
      <div className="register-page">
        <div className="register-card-container">
          <div className="register-card">
            <div className="register-card-left">
              <RegisterWelcomePanel />
            </div>
            <div className="register-card-right">
              <RegisterForm 
                onRegisterSuccess={handleRegisterSuccess}
                onRegisterError={handleRegisterError}
              />
            </div>
          </div>
        </div>

        <Modal
          isOpen={modal.open}
          type={modal.type}
          title={modal.title}
          message={modal.message}
          onClose={() => setModal(m => ({ ...m, open: false }))}
        />
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;