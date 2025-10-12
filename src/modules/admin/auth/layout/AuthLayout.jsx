import React from 'react';
import Footer from '../../../../components/common/Footer';
import '../../../../styles/components/auth/layout/AuthLayout.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout">
      <div className="auth-layout-content">
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default AuthLayout;