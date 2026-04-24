// src/pages/PasswordResetConfirmPage.jsx
import AuthLayout from '../modules/admin/auth/layout/AuthLayout';
import ResetConfirmForm from '../modules/admin/auth/components/reset/ResetConfirmForm';
import ResetConfirmWelcomePanel from '../modules/admin/auth/components/reset/ResetConfirmWelcomePanel';
import '/src/styles/pages/PasswordResetPage.css';

const PasswordResetConfirmPage = () => {
  return (
    <AuthLayout>
      <div className="reset-page">
        <div className="reset-card-container">
          <div className="reset-card">
            <div className="reset-card-left">
              <ResetConfirmWelcomePanel />
            </div>
            <div className="reset-card-right">
              <ResetConfirmForm />
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default PasswordResetConfirmPage;
