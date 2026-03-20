import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Context
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import PublicHomePage from './pages/PublicHomePage';
import Home from './pages/Home';
import CopilotUpload from './pages/CopilotUpload';
import CopilotChat from './pages/CopilotChat';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Global System Components
import TargetCursor from './components/system/TargetCursor';

function App() {
    return (
        <AuthProvider>
            <>
                <TargetCursor
                    spinDuration={4}
                    hideDefaultCursor={true}
                    parallaxOn={true}
                    hoverDuration={0.3}
                />
                <Routes>
                    {/* Public Landing Page */}
                    <Route path="/" element={<PublicHomePage />} />

                    {/* Public auth routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Protected dashboard routes nested under /dashboard */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route path="home" element={<Home />} />
                        <Route path="copilot" element={<CopilotUpload />} />
                        <Route path="copilot/chat" element={<CopilotChat />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </>
        </AuthProvider>
    );
}

export default App;
