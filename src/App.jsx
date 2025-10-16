import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from '../src/pages/RegisterPage.jsx';
import PasswordReset from './pages/PasswordResetPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import Dashboard from './pages/admin/DashboardPage.jsx';
import MainPage from './pages/user/MainPage.jsx';




function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<PasswordReset />} />

          <Route path="/dashboard" element={
          
              <Dashboard />
      
          } />
          <Route path="/main" element={

              <MainPage />

          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
