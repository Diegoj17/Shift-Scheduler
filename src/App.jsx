import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from '../src/pages/RegisterPage.jsx';
import PasswordReset from './pages/PasswordResetPage.jsx';
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import Dashboard from './pages/admin/DashboardPage.jsx';
import MainPage from './pages/user/MainPage.jsx';
import ManagementPage from './pages/admin/ManagementPage.jsx';
import CalendarPage from './pages/admin/CalendarPage.jsx';
import ShiftCalendarPage from './pages/user/ShiftCalendarPage.jsx';





function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/reset-password/confirm" element={<PasswordResetConfirmPage />} />

          

          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/calendar" element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/management" element={
            <ProtectedRoute>
              <ManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/employee/main" element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          } />
          <Route path="/employee/calendar" element={
            <ProtectedRoute>
              <ShiftCalendarPage />
            </ProtectedRoute>
          } />
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
