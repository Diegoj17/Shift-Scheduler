// src/pages/PasswordResetConfirmPage.jsx
import AuthLayout from '../modules/admin/auth/layout/AuthLayout';
import ResetConfirmForm from '../modules/admin/auth/components/reset/ResetConfirmForm';
import ResetConfirmWelcomePanel from '../modules/admin/auth/components/reset/ResetConfirmWelcomePanel';
import '/src/styles/pages/PasswordResetPage.css';

const PasswordResetConfirmPage = () => {
  return (
    <AuthLayout>
      <div className="reset-page register-page">
        <div className="reset-card-container register-card-container">
          <div className="reset-card register-card">
            <div className="reset-card-left register-card-left">
              <ResetConfirmWelcomePanel />
            </div>
            <div className="reset-card-right register-card-right">
              <ResetConfirmForm />
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default PasswordResetConfirmPage;