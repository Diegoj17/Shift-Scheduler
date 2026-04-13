import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import './App.css'
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { NotificationToastProvider } from './contexts/NotificationToastContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const PasswordReset = lazy(() => import('./pages/PasswordResetPage.jsx'));
const PasswordResetConfirmPage = lazy(() => import('./pages/PasswordResetConfirmPage.jsx'));
const Dashboard = lazy(() => import('./pages/admin/DashboardPage.jsx'));
const MainPage = lazy(() => import('./pages/user/MainPage.jsx'));
const ManagementPage = lazy(() => import('./pages/admin/ManagementPage.jsx'));
const CalendarPage = lazy(() => import('./pages/admin/CalendarPage.jsx'));
const ShiftCalendarPage = lazy(() => import('./pages/user/ShiftCalendarPage.jsx'));
const TimeClockPage = lazy(() => import('./pages/user/TimeClockPage.jsx'));
const TimeAvailabilityPage = lazy(() => import('./pages/user/TimeAvailabilityPage.jsx'));
const TimeSchedulePage = lazy(() => import('./pages/admin/TimeSchedulePage.jsx'));
const ShiftChangeRequestPage = lazy(() => import('./pages/user/ShiftChangeRequestPage.jsx'));
const ShiftChangeReviewPage = lazy(() => import('./pages/admin/ShiftChangeReviewPage.jsx'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage.jsx'));
const ProfileView = lazy(() => import('./components/profile/ProfileView.jsx'));
const EditProfile = lazy(() => import('./components/profile/EditProfile.jsx'));
const ChangePassword = lazy(() => import('./components/profile/ChangePassword.jsx'));

const appLoadingStyle = {
  minHeight: '40vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1rem',
  color: '#334155',
};


function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <NotificationToastProvider>
        <Suspense fallback={<div style={appLoadingStyle}>Cargando aplicación...</div>}>
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
          <Route path="/admin/availability" element={
            <ProtectedRoute>
              <TimeSchedulePage />
            </ProtectedRoute>
          } />
          <Route path="/admin/management" element={
            <ProtectedRoute>
              <ManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/shift-change-review" element={
            <ProtectedRoute>
              <ShiftChangeReviewPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute>
              <ReportsPage />
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
          <Route path="/employee/time" element={
            <ProtectedRoute>
              <TimeClockPage />
            </ProtectedRoute>
          } />
          <Route path="/employee/availability" element={
            <ProtectedRoute>
              <TimeAvailabilityPage />
            </ProtectedRoute>
          } />
          <Route path="/employee/shift-change-request" element={
            <ProtectedRoute>
              <ShiftChangeRequestPage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfileView />
            </ProtectedRoute>
          } />
          <Route path="/edit-profile" element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          } />
          <Route path="/change-password" element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          } />
        </Routes>
        </Suspense>
        </NotificationToastProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
