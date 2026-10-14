import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { ROLES } from './constants/roles.js';

import HomePage from './pages/HomePage.jsx';
import PublicMerit from './pages/PublicMerit.jsx';
import Notifications from './pages/Notifications.jsx';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import VerifyOtp from './pages/auth/VerifyOtp.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import Forbidden from './pages/auth/Forbidden.jsx';

import ApplicantDashboard from './pages/applicant/Dashboard.jsx';
import ApplicationForm from './pages/applicant/ApplicationForm.jsx';
import Documents from './pages/applicant/Documents.jsx';
import Payment from './pages/applicant/Payment.jsx';
import Status from './pages/applicant/Status.jsx';

import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminApplications from './pages/admin/Applications.jsx';
import AdminReview from './pages/admin/Review.jsx';
import AdminCourses from './pages/admin/Courses.jsx';
import AdminCutOffs from './pages/admin/CutOffs.jsx';
import AdminMeritList from './pages/admin/MeritList.jsx';
import AdminOfficers from './pages/admin/Officers.jsx';

const STAFF = [ROLES.OFFICER, ROLES.ADMIN];

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/results" element={<PublicMerit />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/forbidden" element={<Forbidden />} />

            <Route element={<ProtectedRoute roles={[ROLES.APPLICANT]} />}>
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<ApplicantDashboard />} />
                <Route path="application" element={<ApplicationForm />} />
                <Route path="documents" element={<Documents />} />
                <Route path="payment" element={<Payment />} />
                <Route path="status" element={<Status />} />
                <Route path="notifications" element={<Notifications />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute roles={STAFF} />}>
              <Route path="/admin" element={<AppLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="applications" element={<AdminApplications />} />
                <Route path="applications/:id" element={<AdminReview />} />
                <Route path="notifications" element={<Notifications />} />
                <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
                  <Route path="courses" element={<AdminCourses />} />
                  <Route path="cutoffs" element={<AdminCutOffs />} />
                  <Route path="merit" element={<AdminMeritList />} />
                  <Route path="officers" element={<AdminOfficers />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </SocketProvider>
    </AuthProvider>
  );
}
