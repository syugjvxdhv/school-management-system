import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [results, setResults] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [fees, setFees] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    
    // --- Dark Mode State Management ---
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('studentTheme') === 'dark';
    });

    useEffect(() => {
        localStorage.setItem('studentTheme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    // Theme Objects Matrix
    const theme = {
        bg: darkMode ? '#121212' : '#f4f6f9',
        sidebar: darkMode ? '#1e1e1e' : '#fff',
        card: darkMode ? '#1d1d1d' : '#fff',
        text: darkMode ? '#f5f5f5' : '#333',
        textMuted: darkMode ? '#aaa' : '#666',
        border: darkMode ? '#333' : '#e0e0e0',
        activeNav: '#007bff',
        activeNavText: '#fff'
    };

    useEffect(() => {
        const fetchStudentDashboardData = async () => {
            try {
                setLoading(true);
                const config = { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } };
                
                // Fetching all endpoint profiles parallelly
                const [prof, att, tt, res, sub, fee] = await Promise.all([
                    axios.get('student-profile/', config).catch(() => ({ data: [] })),
                    axios.get('attendance/', config).catch(() => ({ data: [] })),
                    axios.get('timetable/', config).catch(() => ({ data: [] })),
                    axios.get('exam-results/', config).catch(() => ({ data: [] })),
                    axios.get('student-subjects/', config).catch(() => ({ data: [] })),
                    axios.get('student-fees/', config).catch(() => ({ data: null }))
                ]);
                
                if (prof.data.length > 0) {
                    setProfile(prof.data[0]);
                } else if (prof.data && !Array.isArray(prof.data)) {
                    setProfile(prof.data);
                }
                
                setAttendance(Array.isArray(att.data) ? att.data : []);
                setTimetable(Array.isArray(tt.data) ? tt.data : []);
                setResults(Array.isArray(res.data) ? res.data : []);
                setSubjects(Array.isArray(sub.data) ? sub.data : []);
                setFees(fee.data);

            } catch (err) {
                console.error("Error loading Student Workspace metadata:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudentDashboardData();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg, color: theme.text }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '500' }}>Loading Student Workspace Profile...</div>
            </div>
        );
    }

    // Navigation Menu items definitions
    const menuItems = [
        { id: 'profile', label: 'My Dashboard', icon: '👤' },
        { id: 'subjects', label: 'My Subjects', icon: '📚' },
        { id: 'timetable', label: 'Timetable Schedule', icon: '📅' },
        { id: 'attendance', label: 'Attendance Sheet', icon: '📋' },
        { id: 'results', label: 'Exam Reports', icon: '🏆' },
        { id: 'fees', label: 'Finances & Fees', icon: '💰' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: 'Segoe UI, sans-serif', transition: 'all 0.3s' }}>
            
            {/* SIDEBAR NAVIGATION CONTROL PANEL */}
            <div style={{ width: '260px', backgroundColor: theme.sidebar, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 0' }}>
                <div>
                    {/* Brand Branding Header */}
                    <div style={{ padding: '0 20px 20px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.5rem' }}>🎓</span>
                        <h3 style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>Student Portal</h3>
                    </div>

                    {/* Navigation Links Loop */}
                    <nav style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {menuItems.map(item => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        width: '100%',
                                        padding: '12px 15px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                        fontWeight: isActive ? '600' : '500',
                                        textAlign: 'left',
                                        backgroundColor: isActive ? theme.activeNav : 'transparent',
                                        color: isActive ? theme.activeNavText : theme.text,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span>{item.icon}</span>
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Dark Mode Theme Controller Block */}
                <div style={{ padding: '0 20px' }}>
                    <button 
                        onClick={() => setDarkMode(!darkMode)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.border}`,
                            backgroundColor: theme.card,
                            color: theme.text,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            fontWeight: '500'
                        }}
                    >
                        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>
                </div>
            </div>

            {/* MAIN MAIN CONTENT WORKSPACE VIEW */}
            <div style={{ flex: 1, padding: '30px', overflowY: 'auto', maxHeight: '100vh' }}>
                
                {/* GLOBAL DASHBOARD CONTEXT BANNER */}
                <div style={{ 
                    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)', 
                    color: 'white', 
                    padding: '25px 30px', 
                    borderRadius: '12px', 
                    marginBottom: '30px',
                    boxShadow: '0 4px 12px rgba(0,123,255,0.15)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.6rem', fontWeight: '600' }}>Welcome back, {profile?.user_details?.username || 'Student'}!</h2>
                        <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
                            Roll Number: <strong>{profile?.roll_number || 'N/A'}</strong> | Registered Room Target: <strong>Class {profile?.class_name || 'Not Allocated'}</strong>
                        </p>
                    </div>
                    <div style={{ fontSize: '2.5rem', opacity: 0.85 }}>📖</div>
                </div>

                {/* DYNAMIC VIEWS COMPONENT RENDERING MATRIX */}
                
                {/* VIEW 1: MASTER OVERVIEW PROFILE CARD */}
                {activeTab === 'profile' && (
                    <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', borderBottom: `2px solid ${theme.border}`, paddingBottom: '10px' }}>Personal Academic File</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <p style={{ color: theme.textMuted, margin: '0 0 5px 0', fontSize: '0.85rem' }}>Full Registration Name</p>
                                <p style={{ margin: 0, fontWeight: '500' }}>{profile?.user_details?.username || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ color: theme.textMuted, margin: '0 0 5px 0', fontSize: '0.85rem' }}>Institutional Contact Email</p>
                                <p style={{ margin: 0, fontWeight: '500' }}>{profile?.user_details?.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ color: theme.textMuted, margin: '0 0 5px 0', fontSize: '0.85rem' }}>Assigned Class Identity</p>
                                <p style={{ margin: 0, fontWeight: '500' }}>Class {profile?.class_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ color: theme.textMuted, margin: '0 0 5px 0', fontSize: '0.85rem' }}>Roll Roster Index</p>
                                <p style={{ margin: 0, fontWeight: '500' }}>{profile?.roll_number || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW 2: COURSE SUBJECTS & RESPONSIBLE INSTRUCTORS */}
                {activeTab === 'subjects' && (
                    <div>
                        <h3 style={{ margin: '0 0 20px 0' }}>Enrolled Course Catalog & Faculty</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {subjects.length > 0 ? subjects.map((sub, i) => (
                                <div key={i} style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '10px', border: `1px solid ${theme.border}`, boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>📘</div>
                                    <h4 style={{ margin: '0 0 5px 0', color: theme.activeNav }}>{sub.name || sub.subject_name}</h4>
                                    <p style={{ margin: '0', fontSize: '0.85rem', color: theme.textMuted }}>Course Code: {sub.code || `#0${i+1}`}</p>
                                    <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: `1px solid ${theme.border}`, fontSize: '0.9rem' }}>
                                        <span style={{ color: theme.textMuted }}>Instructor: </span>
                                        <strong>{sub.teacher_name || 'Faculty Assigned'}</strong>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ color: theme.textMuted }}>No mapped active subjects assigned to your class structure.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW 3: WEEKLY PERIOD SCHEDULER MATRIX */}
                {activeTab === 'timetable' && (
                    <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                        <h3 style={{ margin: '0 0 20px 0' }}>Weekly Periodic Structural Timetable</h3>
                        {timetable.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: `2px solid ${theme.border}`, color: theme.textMuted }}>
                                            <th style={{ padding: '12px' }}>Day Session</th>
                                            <th style={{ padding: '12px' }}>Timing Slot Slot / Period</th>
                                            <th style={{ padding: '12px' }}>Subject Mapping</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {timetable.map((t, i) => (
                                            <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                                <td style={{ padding: '12px', fontWeight: '600' }}>{t.day_name}</td>
                                                <td style={{ padding: '12px' }}><span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: darkMode ? '#333' : '#e9ecef', fontSize: '0.85rem' }}>{t.period_name}</span></td>
                                                <td style={{ padding: '12px', color: theme.activeNav, fontWeight: '500' }}>{t.subject_name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p style={{ color: theme.textMuted, textAlign: 'center', padding: '20px' }}>Timetable routing catalog data currently unavailable.</p>
                        )}
                    </div>
                )}

                {/* VIEW 4: ATTENDANCE TRACKER LEDGER */}
                {activeTab === 'attendance' && (
                    <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                        <h3 style={{ margin: '0 0 20px 0' }}>Daily Attendance Log Registry</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {attendance.length > 0 ? attendance.map((a, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, padding: '12px 5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: theme.textMuted, fontSize: '0.9rem' }}>📅 {a.date}</span>
                                        <strong style={{ marginLeft: '15px' }}>{a.subject_name}</strong>
                                    </div>
                                    <span style={{ 
                                        padding: '5px 12px', 
                                        borderRadius: '20px', 
                                        fontSize: '0.85rem', 
                                        fontWeight: '600',
                                        backgroundColor: a.status ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)', 
                                        color: a.status ? '#28a745' : '#dc3545' 
                                    }}>
                                        {a.status ? '✓ Present' : '✗ Absent'}
                                    </span>
                                </div>
                            )) : (
                                <p style={{ color: theme.textMuted, textAlign: 'center', padding: '20px' }}>No recorded attendance parameters tracked yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW 5: ACADEMIC EXAM RESULT CARD REPORT */}
                {activeTab === 'results' && (
                    <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                        <h3 style={{ margin: '0 0 20px 0' }}>Official Examination Report Metrics</h3>
                        {results.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: `2px solid ${theme.border}`, color: theme.textMuted }}>
                                            <th style={{ padding: '12px' }}>Course/Subject</th>
                                            <th style={{ padding: '12px' }}>Term/Exam Context</th>
                                            <th style={{ padding: '12px' }}>Marks Obtained</th>
                                            <th style={{ padding: '12px' }}>Total Marks</th>
                                            <th style={{ padding: '12px' }}>Percentage Breakdown</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((res, i) => {
                                            const pct = ((res.marks_obtained / res.total_marks) * 100).toFixed(1);
                                            return (
                                                <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                                    <td style={{ padding: '12px', fontWeight: '500' }}>{res.subject_name || 'Academic Course'}</td>
                                                    <td style={{ padding: '12px' }}><span style={{ textTransform: 'uppercase', fontSize: '0.8rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#6c757d', color: 'white' }}>{res.exam_type}</span></td>
                                                    <td style={{ padding: '12px', fontWeight: 'bold', color: theme.activeNav }}>{res.marks_obtained}</td>
                                                    <td style={{ padding: '12px' }}>{res.total_marks}</td>
                                                    <td style={{ padding: '12px', fontWeight: '600', color: pct >= 50 ? '#28a745' : '#dc3545' }}>{pct}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p style={{ color: theme.textMuted, textAlign: 'center', padding: '20px' }}>Exam results matrices have not been issued/published yet.</p>
                        )}
                    </div>
                )}

                {/* VIEW 6: FINANCES & TUITION FEES DISBURSEMENT STATUS */}
                {activeTab === 'fees' && (
    <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Accounting & Challan Ledger</h3>
        
        {fees ? (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '20px', 
                borderRadius: '8px', 
                backgroundColor: darkMode ? '#252525' : '#f8f9fa', 
                borderLeft: `5px solid ${fees.is_paid ? '#28a745' : '#dc3545'}` 
            }}>
                <div>
                    <h4 style={{ margin: '0 0 5px 0', textTransform: 'capitalize' }}>
                        Fee Session: {fees.month || 'Current Month'} ({fees.year || '2026'})
                    </h4>
                    <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.9rem' }}>
                        Status Track: Verified Database Record
                    </p>
                    <h3 style={{ margin: '10px 0 0 0', color: theme.activeNav }}>
                        PKR {fees.amount !== undefined ? parseFloat(fees.amount).toLocaleString() : '0.00'}
                    </h3>
                </div>
                <div>
                    <span style={{
                        padding: '10px 24px',
                        borderRadius: '30px',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        backgroundColor: fees.is_paid ? 'rgba(40,167,69,0.15)' : 'rgba(220,53,69,0.15)',
                        color: fees.is_paid ? '#28a745' : '#dc3545'
                    }}>
                        {fees.is_paid ? '● Fully Paid' : '● Unpaid / Pending'}
                    </span>
                </div>
            </div>
        ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: theme.textMuted, backgroundColor: theme.bg, borderRadius: '8px' }}>
                ⚠️ No fee record found for your student profile in the database.
            </div>
        )}
    </div>
)}

            </div>
        </div>
    );
};

export default StudentDashboard;