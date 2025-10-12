import AuthLayout from '../modules/admin/auth/layout/AuthLayout';
import LoginWelcomePanel from '../modules/admin/auth/components/login/LoginWelcomePanel';
import LoginForm from '../modules/admin/auth/components/login/LoginForm';
import '/src/styles/pages/LoginPage.css';

const Login = () => {
  return (
    <AuthLayout>
      <div className="login-main-container">
        <div className="login-content">
          <div className="login-split-container">
            <LoginWelcomePanel />
            <LoginForm />
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;