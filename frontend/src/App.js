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
import ConstituencyDashboard from './components/roles/ConstituencyDashboard';
import BLODashboard from './components/roles/BLODashboard';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { getUsers } from './api';

const RoleRoute = ({ children, role, title }) => {
    const { user, loading } = useUser();
    
    if (loading) return null; // Or a loading spinner
    if (!user) return <Navigate to="/select-role" />;
    
    // Check if user role matches or is admin (optional: depends on security policy)
    // For now, we trust the user state (Modified for Prototype showing)
    
    return (
        <NotificationProvider userId={user.id}>
            <Layout title={title} user={user}>
                {children}
            </Layout>
        </NotificationProvider>
    );
};

function App() {
    const { user } = useUser();

    return (
        <ThemeProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/select-role" element={<RoleSelectionPage />} />
                    <Route path="/login" element={<LoginPage />} />

                    {/* Dashboard Routes with Layout */}
                    <Route path="/citizen/*" element={
                        <RoleRoute role="citizen" title="Citizen App">
                            <CitizenDashboard currentUser={user} boothId={17} />
                        </RoleRoute>
                    } />

                    <Route path="/worker/*" element={
                        <RoleRoute role="worker" title="Field Agent">
                            <WorkerDashboard currentUser={user} boothId={17} />
                        </RoleRoute>
                    } />

                    <Route path="/admin/*" element={
                        <RoleRoute role="admin" title="Booth Manager">
                            <AdminDashboard currentUser={user} boothId={17} />
                        </RoleRoute>
                    } />

                    <Route path="/panna/*" element={
                        <RoleRoute role="panna" title="Field Staff">
                            <PannaDashboard currentUser={user} boothId={17} />
                        </RoleRoute>
                    } />

                    <Route path="/analyst/*" element={
                        <RoleRoute role="analyst" title="Intelligence Lead">
                            <AnalystDashboard currentUser={user} boothId={17} />
                        </RoleRoute>
                    } />

                    <Route path="/city_manager/*" element={
                        <RoleRoute role="city_manager" title="Operations Lead">
                            <CityManagerDashboard currentUser={user} boothId={17} />
                        </RoleRoute>
                    } />

                    <Route path="/constituency/*" element={
                        <RoleRoute role="constituency" title="HQ Command">
                            <ConstituencyDashboard currentUser={user} boothId={17} />
                        </RoleRoute>
                    } />

                    <Route path="/blo/*" element={
                        <RoleRoute role="blo" title="Registration Lead">
                            <BLODashboard currentUser={user} boothId={17} />
                        </RoleRoute>
                    } />

                    {/* Legacy Redirects */}
                    <Route path="/dashboard" element={<Navigate to="/select-role" replace />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

const AppWrapper = () => (
    <UserProvider>
        <App />
    </UserProvider>
);

export default AppWrapper;
