import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthenticatedRoute from './components/auth/AuthenticatedRoute';
import AdminRoute from './components/auth/AdminRoute';
import StaffRoute from './components/auth/StaffRoute';
import TechnicianRoute from './components/auth/TechnicianRoute';
import UserRoute from './components/auth/UserRoute';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AdminBookingsPage from './pages/AdminBookingsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import Alert from './pages/Alert';
import AdminResourcesPage from './pages/AdminResourcesPage';
import AdminTicketsPage from './pages/AdminTicketsPage';
import AdminTechniciansPage from './pages/AdminTechniciansPage';
import EnhancedRegistrationPage from './pages/EnhancedRegistrationPage';
import ForceChangePasswordPage from './pages/ForceChangePasswordPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import RegistrationPage from './pages/RegistrationPage';
import StaffLoginPage from './pages/StaffLoginPage';
import TechnicianDashboardPage from './pages/TechnicianDashboardPage';
import TechnicianTicketsPage from './pages/TechnicianTicketsPage';
import UserDashboardPage from './pages/UserDashboardPage';
import UserBookingsPage from './pages/UserBookingsPage';
import { IncidentTicketingPage } from './pages/Incident_tickting';
import './App.css';
import StudyAreasPage from './facilities/pages/StudyAreasPage';


function Unauthorized() {
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/register-enhanced" element={<EnhancedRegistrationPage />} />
          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<StaffRoute />}>
            <Route path="/staff/change-password" element={<ForceChangePasswordPage />} />
          </Route>

          <Route element={<UserRoute />}>
            <Route path="/dashboard" element={<UserDashboardPage />} />
            <Route path="/bookings" element={<UserBookingsPage />} />
            <Route path="/study-areas" element={<StudyAreasPage />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/resources" element={<AdminResourcesPage />} />
            <Route path="/admin/alerts" element={<Alert />} />
            <Route path="/admin/technicians" element={<AdminTechniciansPage />} />
            <Route path="/admin/tickets" element={<AdminTicketsPage />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          </Route>

          <Route element={<TechnicianRoute />}>
            <Route path="/technician/dashboard" element={<TechnicianDashboardPage />} />
            <Route path="/technician/tickets" element={<TechnicianTicketsPage />} />
          </Route>

          <Route element={<AuthenticatedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/incident-ticketing" element={<IncidentTicketingPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;