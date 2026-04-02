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
import Profile from './pages/Profile';
import ComparePapers from './pages/ComparePapers';
import IdeaGenerator from './pages/IdeaGenerator';

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
                        <Route index element={<Navigate to="copilot" replace />} />
                        <Route path="home" element={<Navigate to="/" replace />} />
                        <Route path="copilot" element={<CopilotUpload />} />
                        <Route path="copilot/chat" element={<CopilotChat />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="compare" element={<ComparePapers />} />
                        <Route path="ideas" element={<IdeaGenerator />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </>
        </AuthProvider>
    );
}

export default App;
