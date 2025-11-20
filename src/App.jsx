import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from '../src/pages/RegisterPage.jsx';
import PasswordReset from './pages/PasswordResetPage.jsx';
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { NotificationToastProvider } from './contexts/NotificationToastContext.jsx';
import ProfileView from './components/profile/ProfileView.jsx';
import EditProfile from './components/profile/EditProfile.jsx';
import ChangePassword from './components/profile/ChangePassword.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import Dashboard from './pages/admin/DashboardPage.jsx';
import MainPage from './pages/user/MainPage.jsx';
import ManagementPage from './pages/admin/ManagementPage.jsx';
import CalendarPage from './pages/admin/CalendarPage.jsx';
import ShiftCalendarPage from './pages/user/ShiftCalendarPage.jsx';
import TimeClockPage from './pages/user/TimeClockPage.jsx';
import TimeAvailabilityPage from './pages/user/TimeAvailabilityPage.jsx';
import TimeSchedulePage from './pages/admin/TimeSchedulePage.jsx';
import ShiftChangeRequestPage from './pages/user/ShiftChangeRequestPage.jsx';
import ShiftChangeReviewPage from './pages/admin/ShiftChangeReviewPage.jsx';


function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <NotificationToastProvider>
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
        </NotificationToastProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
