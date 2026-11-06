import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    
    const { login } = useContext(AuthContext); 
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        
        if (!credentials.username || !credentials.password) {
            setError('Please enter both username and password.');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const userData = await login(credentials.username, credentials.password);
            
            
            const userObj = userData?.user || userData;
            const role = userObj?.role;

            if (role !== undefined && role !== null) {
                
                switch (role) {
                    case 1:
                        navigate('/admin-dashboard');
                        break;
                    case 2:
                        navigate('/teacher-dashboard');
                        break;
                    case 3:
                        navigate('/student-dashboard');
                        break;
                    default:
                        navigate('/');
                }
            } else {
                setError('Authentication succeeded, but no role was found.');
                setLoading(false);
            }
        } catch (err) {
            setLoading(false);
            
            const backendMsg = err.response?.data?.detail || err.response?.data?.error;
            setError(backendMsg || 'Invalid username or password. Please try again.');
        }
    };

    
    const containerStyle = { 
        maxWidth: '400px', 
        margin: '100px auto', 
        padding: '30px', 
        border: '1px solid #ddd', 
        borderRadius: '10px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
        backgroundColor: '#fff',
        fontFamily: 'Arial, sans-serif'
    };

    const inputGroupStyle = { marginBottom: '20px' };
    
    const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' };

    const inputStyle = { 
        width: '100%', 
        padding: '12px', 
        borderRadius: '5px', 
        border: '1px solid #ddd', 
        boxSizing: 'border-box',
        fontSize: '16px'
    };

    const buttonStyle = { 
        width: '100%', 
        padding: '12px', 
        background: loading ? '#a0c4ff' : '#007bff', 
        color: 'white', 
        border: 'none', 
        borderRadius: '5px', 
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        transition: 'background 0.3s ease'
    };

    const errorStyle = { 
        background: '#f8d7da', 
        color: '#721c24', 
        padding: '10px', 
        borderRadius: '5px', 
        marginBottom: '20px', 
        textAlign: 'center',
        fontSize: '14px',
        border: '1px solid #f5c6cb'
    };

    return (
        <div style={containerStyle}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
                🔐 School Management
            </h2>
            
            {error && <div style={errorStyle}>{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div style={inputGroupStyle}>
                    <label style={labelStyle}>Username</label>
                    <input 
                        type="text" 
                        value={credentials.username} 
                        onChange={e => setCredentials({...credentials, username: e.target.value})} 
                        style={inputStyle} 
                        placeholder="Enter your username"
                        disabled={loading}
                        required 
                    />
                </div>
                
                <div style={{ ...inputGroupStyle, marginBottom: '25px' }}>
                    <label style={labelStyle}>Password</label>
                    <input 
                        type="password" 
                        value={credentials.password} 
                        onChange={e => setCredentials({...credentials, password: e.target.value})} 
                        style={inputStyle} 
                        placeholder="Enter your password"
                        disabled={loading}
                        required 
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading} 
                    style={buttonStyle}
                >
                    {loading ? 'Authenticating...' : 'Login'}
                </button>
            </form>
            
            <p style={{ textAlign: 'center', marginTop: '20px', color: '#777', fontSize: '12px' }}>
                Contact admin if you forgot your credentials.
            </p>
        </div>
    );
};

export default Login;