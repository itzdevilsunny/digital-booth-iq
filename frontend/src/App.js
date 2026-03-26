import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import LoginPage from './components/auth/LoginPage';
import RoleSelectionPage from './components/auth/RoleSelection';
import Layout from './components/layout/Layout';
import CitizenDashboard from './components/roles/CitizenDashboard';
import WorkerDashboard from './components/roles/WorkerDashboard';
import AdminDashboard from './components/roles/AdminDashboard';
import PannaDashboard from './components/roles/PannaDashboard';
import AnalystDashboard from './components/roles/AnalystDashboard';
import CityManagerDashboard from './components/roles/CityManagerDashboard';
import { NotificationProvider } from './contexts/NotificationContext';
import { getUsers } from './api';

const RoleRoute = ({ children, role, title, user }) => {
    if (!user) return <Navigate to="/select-role" />;
    return (
        <NotificationProvider userId={user.id}>
            <Layout title={title}>
                {children}
            </Layout>
        </NotificationProvider>
    );
};

function App() {
    const [users, setUsers] = useState([]);

    // Fetch users silently in the background — do NOT block render on this.
    // The backend (Render free tier) can take 30-60s to cold-start; we fall
    // back to dummy users in getRoleUser() if the list is empty.
    useEffect(() => {
        getUsers()
            .then(u => setUsers(u || []))
            .catch(e => console.error('App init error (non-blocking):', e));
    }, []);

    // Helper to get dummy user for a role
    const getRoleUser = (role) => users.find(u => u.role === role) || { id: `dummy-${role}`, role, name: `Demo ${role}`, booth_id: 17 };

    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/select-role" element={<RoleSelectionPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Dashboard Routes with Layout */}
                <Route path="/citizen/*" element={
                    <RoleRoute role="citizen" title="Public Portal" user={getRoleUser('citizen')}>
                        <CitizenDashboard currentUser={getRoleUser('citizen')} boothId={17} />
                    </RoleRoute>
                } />

                <Route path="/worker/*" element={
                    <RoleRoute role="worker" title="Field Officer" user={getRoleUser('worker')}>
                        <WorkerDashboard currentUser={getRoleUser('worker')} boothId={17} />
                    </RoleRoute>
                } />

                <Route path="/admin/*" element={
                    <RoleRoute role="admin" title="Booth Manager" user={getRoleUser('admin')}>
                        <AdminDashboard currentUser={getRoleUser('admin')} boothId={17} />
                    </RoleRoute>
                } />

                <Route path="/panna/*" element={
                    <RoleRoute role="panna" title="Voter Guide" user={getRoleUser('panna')}>
                        <PannaDashboard currentUser={getRoleUser('panna')} boothId={17} />
                    </RoleRoute>
                } />

                <Route path="/analyst/*" element={
                    <RoleRoute role="analyst" title="Data Analyst" user={getRoleUser('analyst')}>
                        <AnalystDashboard currentUser={getRoleUser('analyst')} boothId={17} />
                    </RoleRoute>
                } />

                <Route path="/city_manager/*" element={
                    <RoleRoute role="city_manager" title="Admin Portal" user={getRoleUser('city_manager')}>
                        <CityManagerDashboard currentUser={getRoleUser('city_manager')} boothId={17} />
                    </RoleRoute>
                } />

                {/* Legacy Redirects */}
                <Route path="/dashboard" element={<Navigate to="/select-role" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
