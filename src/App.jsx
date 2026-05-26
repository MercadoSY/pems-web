import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { auth } from './firebase/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import HeaderFooterLayout from './components/layout/HeaderFooterLayout';

// PERFORMANCE: Lazily load page components for code-splitting.
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PoultryListPage = lazy(() => import('./pages/PoultryListPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const GenerateReportPage = lazy(() => import('./pages/GenerateReportPage'));
const WorkersPage = lazy(() => import('./pages/WorkersPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const HistoryLogsPage = lazy(() => import('./pages/HistoryLogsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// A lightweight loading component to show while lazy-loaded components are fetched.
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fc' }}>
    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// A protected route component that relies on Firebase's authentication state.
const ProtectedRoute = ({ user }) => {
  if (!user) {
    console.warn('ProtectedRoute: Unauthenticated user detected. Redirecting to login.');
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
};

// Main application component with robust, centralized authentication handling.
function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const INACTIVITY_TIMEOUT_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
    const LAST_ACTIVITY_KEY = 'pems_last_activity';

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
        const now = Date.now();

        if (lastActivity && (now - parseInt(lastActivity, 10) > INACTIVITY_TIMEOUT_MS)) {
          console.log(`User inactive for more than 90 days. Forcing logout.`);
          signOut(auth).catch(err => console.error("Error during inactivity sign out:", err));
          // After signOut, onAuthStateChanged will run again with currentUser = null
          localStorage.removeItem(LAST_ACTIVITY_KEY);
        } else {
          // User is active and authenticated
          localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
          setUser(currentUser);
          console.log(`Auth state changed: User is logged in as ${currentUser.email}`);
        }
      } else {
        // User is not authenticated
        setUser(null);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        console.log("Auth state changed: User is logged out.");
      }
      setIsAuthReady(true);
    });
    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleStorageChange = (event) => {
      // Listen for the custom logout event from another tab to ensure session consistency.
      if (event.key === 'pems-logout-event') {
        console.log('Logout event detected from another tab. Reloading page to sync auth state.');
        // A simple reload is sufficient. onAuthStateChanged will detect the signed-out state.
        window.location.reload();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Display a global loader while Firebase initializes and checks the auth state.
  // This prevents a flash of incorrect content (e.g., login page for an auth'd user).
  if (!isAuthReady) {
    return <PageLoader />;
  }

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes with shared layout (Header/Footer) */}
          <Route element={!user ? <HeaderFooterLayout /> : <Navigate to="/dashboard" replace />}>
            <Route path="/home" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Standalone public route for login. Does not use the shared layout. */}
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
          
          {/* Protected Routes are nested under a route element that uses the secure ProtectedRoute component. */}
          <Route element={<ProtectedRoute user={user} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/poultry-list" element={<PoultryListPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/generate-report" element={<GenerateReportPage />} />
            <Route path="/workers" element={<WorkersPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/history-logs" element={<HistoryLogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Default route redirects based on authentication status. */}
          <Route
            path="/"
            element={
              user
                ? <Navigate to="/dashboard" replace />
                : <Navigate to="/home" replace />
            }
          />
          {/* A catch-all route to redirect any invalid paths to the default route. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;