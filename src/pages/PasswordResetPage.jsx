import AuthLayout from '../modules/admin/auth/layout/AuthLayout';
import ResetWelcomePanel from '../modules/admin/auth/components/reset/ResetWelcomePanel';
import ResetForm from '../modules/admin/auth/components/reset/ResetForm';
import '/src/styles/pages/PasswordResetPage.css';
import '/src/styles/pages/RegisterPage.css';

const PasswordResetPage = () => {
  return (
    <AuthLayout>
      <div className="reset-page register-page">
        <div className="reset-card-container register-card-container">
          <div className="reset-card register-card">
            <div className="reset-card-left register-card-left">
              <ResetWelcomePanel />
            </div>
            <div className="reset-card-right register-card-right">
              <ResetForm />
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default PasswordResetPage;