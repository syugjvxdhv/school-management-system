import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);
    
    if (loading) return <div style={{textAlign: 'center', marginTop: '50px'}}>🔄 Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;

    // Aapke backend se 'role' aa raha hai, 'user_type' nahi
    const userRole = user.role; 

    const hasAccess = 
        (allowedRoles.includes('admin') && userRole === 1) || 
        (allowedRoles.includes('teacher') && userRole === 2) || 
        (allowedRoles.includes('student') && userRole === 3);
    
    return hasAccess ? children : <Navigate to="/" replace />;
};

const HomeRedirect = () => {
    const { user, loading } = useContext(AuthContext);
    
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    
    const userRole = user.role; 

    if (userRole === 1) return <Navigate to="/admin-dashboard" replace />;
    if (userRole === 2) return <Navigate to="/teacher-dashboard" replace />;
    if (userRole === 3) return <Navigate to="/student-dashboard" replace />;
    
    return <Navigate to="/login" replace />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={
                        <AuthContext.Consumer>
                            {({ user, loading }) => {
                                if (loading) return null;
                                
                                return user ? <Navigate to="/" replace /> : <Login />;
                            }}
                        </AuthContext.Consumer>
                    } />
                    
                    <Route path="/admin-dashboard" element={
                        <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
                    } />

                    <Route path="/student-dashboard" element={
                        <ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>
                    } />

                    <Route path="/teacher-dashboard" element={
                        <ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>
                    } />
                    
                    <Route path="/" element={<HomeRedirect />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;