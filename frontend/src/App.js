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
import { RefreshCw } from 'lucide-react';

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                const u = await getUsers();
                setUsers(u || []);
            } catch (e) {
                console.error('App init error:', e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative size-16 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-stone-100 rounded-full" />
                        <div className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-stone-400">Loading BoothIQ...</p>
                </div>
            </div>
        );
    }

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
