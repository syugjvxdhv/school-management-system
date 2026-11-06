import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('classes');
    const [loading, setLoading] = useState(false);
    const { user } = useContext(AuthContext);

    // --- DARK MODE STATES & THEMES ---
    const [darkMode, setDarkMode] = useState(false);
    const toggleDarkMode = () => setDarkMode(!darkMode);

    const theme = {
        bg: darkMode ? '#1a202c' : '#f7fafc',
        sidebarBg: darkMode ? '#2d3748' : '#ffffff',
        sidebarText: darkMode ? '#e2e8f0' : '#4a5568',
        cardBg: darkMode ? '#2d3748' : '#ffffff',
        textMain: darkMode ? '#ffffff' : '#2d3748',
        textSub: darkMode ? '#a0aec0' : '#718096',
        border: darkMode ? '#4a5568' : '#e2e8f0',
        inputBg: darkMode ? '#1a202c' : '#ffffff'
    };

    // Data states
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [exams, setExams] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [feeRecords, setFeeRecords] = useState([]);

    // Class Click Features
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [showClassStudents, setShowClassStudents] = useState(false);
    const [examSelectedClass, setExamSelectedClass] = useState('');
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);

    // Automated Finances
    const [feeSelectedClass, setFeeSelectedClass] = useState('');
    const [feeFilteredStudents, setFeeFilteredStudents] = useState([]);

    // Form States
    const [newFee, setNewFee] = useState({ student: '', month: 1, year: 2026, amount: '' });
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [attendanceData, setAttendanceData] = useState([]);
    const [newClass, setNewClass] = useState({ name: '', section: '' });
    const [newStudent, setNewStudent] = useState({ username: '', password: '', roll_number: '', classroom: '' });
    const [newSubject, setNewSubject] = useState({ name: '', classroom: '', teacher: '' });
    const [newTeacher, setNewTeacher] = useState({ username: '', password: '' });
    const [selectedTeacherId, setSelectedTeacherId] = useState(null);
    const [showTeacherDetails, setShowTeacherDetails] = useState(false);
    const [newPeriod, setNewPeriod] = useState({ day: 1, period: 1, subject: '', classroom: '' });
    const [newExam, setNewExam] = useState({ student: '', subject: '', exam_name: '', marks_obtained: '', total_marks: '' });

    const navItems = [
        { id: 'classes', label: 'Classes', icon: '🏫' },
        { id: 'students', label: 'Students', icon: '👥' },
        { id: 'teachers', label: 'Teachers', icon: '👨‍🏫' },
        { id: 'subjects', label: 'Subjects', icon: '📚' },
        { id: 'periods', label: 'Periods', icon: '🕒' },
        { id: 'exams', label: 'Exams', icon: '📝' },
        { id: 'attendance', label: 'Attendance', icon: '📅' },
        { id: 'finances', label: 'Finances', icon: '💰' },
    ];

    useEffect(() => {
        if (user) {
            fetchAllData();
        }
    }, [user]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
            };

            const [classesRes, studentsRes, subjectsRes, periodsRes, examsRes, usersRes, feesRes] = await Promise.all([
                axios.get('classes/', config),
                axios.get('student-profile/', config),
                axios.get('subjects/', config),
                axios.get('timetable/', config),
                axios.get('exams/', config),
                axios.get('users/', config),
                axios.get('fees/', config)
            ]);
            
            setClasses(classesRes.data);
            setStudents(studentsRes.data);
            setSubjects(subjectsRes.data);
            setPeriods(periodsRes.data);
            setExams(examsRes.data);
            setUsersList(usersRes.data);
            setFeeRecords(feesRes.data);
        } catch (error) {
            console.error('Dashboard data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (endpoint, data, resetState, successMsg) => {
        try {
            setLoading(true);
            await axios.post(endpoint, data, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
            });
            alert(successMsg || 'Action Successful!');
            if (typeof resetState === 'function') resetState();
            fetchAllData();
        } catch (error) {
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : "Action failed";
            alert('Error: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const markAsPaid = async (id) => {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } };
        try {
            await axios.post(`fees/${id}/mark_paid/`, {}, config);
            alert("✅ Fee marked as paid!");
            fetchAllData(); 
        } catch (err) { alert("Error updating fee"); }
    };

    const printVoucher = (record) => {
        const printContent = `
            <div style="border:2px solid black; padding:20px; width:400px; font-family:Arial; margin: 20px auto;">
                <h2 style="text-align:center;">SCHOOL FEE VOUCHER</h2>
                <hr/>
                <p><strong>Student:</strong> ${record.student_name}</p>
                <p><strong>Month:</strong> ${record.month_name} ${record.year}</p>
                <p><strong>Amount:</strong> Rs. ${record.amount}</p>
                <p><strong>Status:</strong> ${record.is_paid ? 'PAID' : 'UNPAID'}</p>
                <br/><br/>
                <p style="text-align:center;">___________________<br/>Principal Signature</p>
            </div>
        `;
        const win = window.open('', '', 'height=500,width=500');
        win.document.write(printContent);
        win.print();
        win.close();
    };

    useEffect(() => {
        if (selectedClass) {
            const filteredStudents = students.filter(s => s.classroom === parseInt(selectedClass));
            setAttendanceData(filteredStudents.map(s => ({
                student_id: s.id,
                name: s.user_details?.username || "Unknown",
                roll: s.roll_number,
                is_present: false
            })));
        }
    }, [selectedClass, students]);

    const submitAttendance = async () => {
        if (!selectedClass || !selectedSubject) return alert("Select Class and Subject first!");
        const presentIds = attendanceData.filter(s => s.is_present).map(s => s.student_id);
        const payload = {
            class_id: parseInt(selectedClass),
            subject_id: parseInt(selectedSubject),
            date: new Date().toISOString().split('T')[0],
            present_students: presentIds
        };
        handleCreate('attendance/bulk_mark/', payload, () => {}, "✅ Attendance saved!");
    };

    const createTeacher = () => {
        if (!newTeacher.username || !newTeacher.password) return alert("Fill all fields");
        handleCreate('users/', { ...newTeacher, role: 2 }, () => setNewTeacher({ username: '', password: '' }), '✅ Teacher Created!');
    };

    const createStudent = async () => {
        if (!newStudent.username || !newStudent.password || !newStudent.classroom || !newStudent.roll_number) {
            return alert("Please fill all fields and select a Class!");
        }
        
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } };
            
            const userRes = await axios.post('users/', {
                username: newStudent.username,
                password: newStudent.password,
                role: 3
            }, config);
            
            if (userRes.data.id) {
                await axios.post('student-profile/', {
                    user: userRes.data.id,
                    classroom: parseInt(newStudent.classroom),
                    roll_number: newStudent.roll_number
                }, config);
                
                alert('🎉 Student Profile Created Successfully!');
                setNewStudent({ username: '', password: '', roll_number: '', classroom: '' });
                fetchAllData(); // 🌟 Yahan error fix kiya (fetchStudents ki jgah fetchAllData use kia)
            }
        } catch (error) {
            console.error("Student profile submission error:", error.response?.data);
            const errorDetail = error.response?.data ? JSON.stringify(error.response.data) : "Action failed";
            alert("Error: " + errorDetail);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div style={{ padding: '50px', textAlign: 'center', color: '#ff0000' }}>Please login to access dashboard.</div>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.bg, fontFamily: 'Arial, sans-serif', transition: 'all 0.3s' }}>
            
            {/* ==========================================
                1. MODERN SIDEBAR NAVIGATION
               ========================================== */}
            <aside style={{ width: '260px', backgroundColor: theme.sidebarBg, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 10, transition: 'all 0.3s' }}>
                <div style={{ padding: '24px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🏫</span>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: theme.textMain, margin: 0 }}>School System</h2>
                </div>

                <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {navItems.map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setShowClassStudents(false); 
                                    setShowTeacherDetails(false);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    textAlign: 'left',
                                    width: '100%',
                                    backgroundColor: isActive ? '#007bff' : 'transparent',
                                    color: isActive ? '#ffffff' : theme.sidebarText,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div style={{ padding: '20px', borderTop: `1px solid ${theme.border}`, backgroundColor: darkMode ? '#232d3d' : '#f8f9fa' }}>
                    <span style={{ fontSize: '11px', color: theme.textSub, fontWeight: 'bold', display: 'block' }}>LOGGED IN AS:</span>
                    <strong style={{ color: theme.textMain, fontSize: '14px' }}>{user?.username}</strong>
                </div>
            </aside>

            {/* ==========================================
                2. MAIN CONTENT WRAPPER
               ========================================== */}
            <div style={{ flex: 1, marginLeft: '260px', padding: '30px', minWidth: 0 }}>
                
                {/* HEADER CONTROL WITH DARK MODE SWITCH */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '15px' }}>
                    <div>
                        <span style={{ color: '#007bff', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Workspace</span>
                        <h1 style={{ fontSize: '1.75rem', color: theme.textMain, margin: '2px 0 0 0', textTransform: 'capitalize' }}>{activeTab} Management</h1>
                    </div>

                    <button 
                        onClick={toggleDarkMode}
                        style={{
                            padding: '10px 18px',
                            cursor: 'pointer',
                            borderRadius: '20px',
                            border: `1px solid ${theme.border}`,
                            background: theme.cardBg,
                            color: theme.textMain,
                            fontWeight: 'bold',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    >
                        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>
                </header>

                {/* DYNAMIC INNER BOX */}
                <div style={{ background: theme.cardBg, padding: '25px', borderRadius: '12px', border: `1px solid ${theme.border}`, minHeight: '450px' }}>
                    {loading && <p style={{ color: '#007bff', fontWeight: 'bold' }}>🔄 Synchronizing system data...</p>}

                    {/* === CLASSES TAB === */}
                      {activeTab === 'classes' && (
    <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        {!showClassStudents ? (
            <div>
                <h3 style={{ marginBottom: '20px', color: '#2d3748', fontSize: '1.4rem' }}>🏫 Manage Classes & Sections</h3>
                
                {/* --- ADD NEW CLASS FORM (UPDATED WITH MONTHLY FEE) --- */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center', background: '#f7fafc', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1', minWidth: '200px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Class Name</label>
                        <input 
                            placeholder="e.g., Class 10" 
                            value={newClass.name} 
                            onChange={e => setNewClass({...newClass, name: e.target.value})} 
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1', minWidth: '120px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Section</label>
                        <input 
                            placeholder="e.g., A" 
                            value={newClass.section} 
                            onChange={e => setNewClass({...newClass, section: e.target.value})} 
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                        />
                    </div>

                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1', minWidth: '150px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Monthly Fee (Rs.)</label>
                        <input 
                            type="number"
                            placeholder="e.g., 2500" 
                            value={newClass.monthly_fee || ''} 
                            onChange={e => setNewClass({...newClass, monthly_fee: e.target.value})} 
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                        />
                    </div>

                    <button 
                        onClick={() => {
                            if(!newClass.name || !newClass.section || !newClass.monthly_fee) {
                                return alert("Please fill in Class Name, Section, and Monthly Fee!");
                            }
                            
                            handleCreate(
                                'classes/', 
                                newClass, 
                                () => setNewClass({name: '', section: '', monthly_fee: ''}), 
                                '✅ Class Added Successfully!'
                            );
                        }}
                        style={{ 
                            backgroundColor: '#4c51bf', 
                            color: 'white', 
                            padding: '10px 24px', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold', 
                            alignSelf: 'flex-end', 
                            height: '38px',
                            fontSize: '14px',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#434190'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4c51bf'}
                    >
                        + Add Class
                    </button>
                </div>

                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                    {classes.map(c => (
                        <div 
                            key={c.id} 
                            onClick={() => {
                                setSelectedClassId(c.id);
                                setShowClassStudents(true);
                            }}
                            style={{ 
                                background: '#ffffff', 
                                padding: '25px 20px', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '12px', 
                                cursor: 'pointer',
                                textAlign: 'center',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)',
                                transition: 'all 0.2s ease-in-out',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)';
                                e.currentTarget.style.borderColor = '#4c51bf';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🏫</div>
                            <strong style={{ fontSize: '1.2rem', color: '#1a202c', display: 'block' }}>{c.name}</strong>
                            
                            <div style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <span style={{ background: '#ebf4ff', color: '#2b6cb0', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Section: {c.section}
                                </span>
                                
                                <span style={{ background: '#e6fffa', color: '#319795', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                    Rs. {c.monthly_fee || '0'}
                                </span>
                            </div>

                            <div style={{ color: '#4c51bf', marginTop: '15px', fontSize: '13px', fontWeight: '500' }}>
                                Click to view students →
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #edf2f7', paddingBottom: '15px' }}>
                    <h3 style={{ color: '#2d3748', fontSize: '1.3rem', margin: 0 }}>
                        👥 Students in <span style={{ color: '#4c51bf' }}>{classes.find(c => c.id === selectedClassId)?.name} ({classes.find(c => c.id === selectedClassId)?.section})</span>
                    </h3>
                    <button 
                        onClick={() => setShowClassStudents(false)}
                        style={{
                            padding: '8px 16px', cursor: 'pointer', background: '#718096', color: 'white', 
                            border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4a5568'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#718096'}
                    >
                        ← Back to Classes
                    </button>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#edf2f7', color: '#4a5568', borderBottom: '2px solid #cbd5e0' }}>
                                <th style={{ padding: '12px 20px', width: '25%' }}>Roll No</th>
                                <th style={{ padding: '12px 20px', width: '50%' }}>Student Username</th>
                                <th style={{ padding: '12px 20px', width: '25%', textAlign: 'center' }}>Database ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.filter(s => s.classroom === selectedClassId).length > 0 ? (
                                students.filter(s => s.classroom === selectedClassId).map(s => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #edf2f7', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '12px 20px', fontWeight: 'bold', color: '#4a5568' }}>
                                            🆔 {s.roll_number || s.roll || '---'}
                                        </td>
                                        <td style={{ padding: '12px 20px', fontWeight: 'bold', color: '#2d3748' }}>
                                            👤 {s.user_details?.username || s.name}
                                        </td>
                                        <td style={{ padding: '12px 20px', textAlign: 'center', color: '#a0aec0', fontSize: '14px' }}>
                                            <span style={{ background: '#edf2f7', padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                                #{s.id}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: '#a0aec0', fontStyle: 'italic' }}>
                                        No students registered in this class yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
)}

                    {/* === STUDENTS TAB === */}
                     {activeTab === 'students' && (
    <div>
        <h3 style={{ marginBottom: '15px', color: '#2d3748' }}>Register Student</h3>
        
        {/* --- REGISTER STUDENT FORM --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <input 
                placeholder="Username" 
                value={newStudent.username || ''} 
                onChange={e => setNewStudent({...newStudent, username: e.target.value})} 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }}
            />
            <input 
                type="password" 
                placeholder="Password" 
                value={newStudent.password || ''} 
                onChange={e => setNewStudent({...newStudent, password: e.target.value})} 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }}
            />
            <input 
                placeholder="Roll Number" 
                value={newStudent.roll_number || ''} 
                onChange={e => setNewStudent({...newStudent, roll_number: e.target.value})} 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }}
            />
            
            
            <select 
                value={newStudent.classroom || ''} 
                onChange={e => setNewStudent({...newStudent, classroom: e.target.value})}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', background: 'white', fontSize: '14px' }}
            >
                <option value="">Select Class</option>
                {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
                ))}
            </select>
            
            <button 
                onClick={createStudent} 
                style={{ gridColumn: 'span 2', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#0056b3'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#007bff'}
            >
                Create Student Profile
            </button>
        </div>

        {/* --- REGISTERED STUDENTS LIST (SORTED BY CLASS ONE TO TEN) --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            <h4 style={{ color: '#4a5568', margin: '10px 0 5px 0' }}>Registered Students ({students.length})</h4>
            
            {students
                .slice() // React structural safety state shallow copy
                .sort((a, b) => {
                    const getClassWeight = (className) => {
                        if (!className) return 999;
                        const name = className.toUpperCase();

                        // String literals handling (ONE, TWO, THREE... TEN)
                        if (name.startsWith('ONE')) return 1;
                        if (name.startsWith('TWO')) return 2;
                        if (name.startsWith('THREE')) return 3;
                        if (name.startsWith('FOUR')) return 4;
                        if (name.startsWith('FIVE')) return 5;
                        if (name.startsWith('SIX')) return 6;
                        if (name.startsWith('SEVEN')) return 7;
                        if (name.startsWith('EIGHT')) return 8;
                        if (name.startsWith('NINE')) return 9;
                        if (name.startsWith('TEN')) return 10;

                        // Alphanumeric numbers handling (1-A, 10-B)
                        const match = name.match(/^(\d+)/);
                        if (match) return parseInt(match[1], 10);

                        return 999;
                    };

                    const weightA = getClassWeight(a.class_name);
                    const weightB = getClassWeight(b.class_name);

                    if (weightA === weightB) {
                        const secA = a.class_section || '';
                        const secB = b.class_section || '';
                        return secA.localeCompare(secB);
                    }

                    return weightA - weightB; // Ascending sequential sort filter
                })
                .map(s => (
                    <div key={s.id} style={{ padding: '15px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            <span style={{ fontWeight: 'bold', color: '#2d3748' }}>👤 {s.user_details?.username}</span> 
                            <span style={{ color: '#4a5568', fontWeight: '500' }}> — Class: {s.class_name}-{s.class_section}</span>
                            <span style={{ color: '#718096', marginLeft: '10px', fontSize: '13px' }}>(ID: {s.id})</span>
                            <span style={{ color: '#007bff', marginLeft: '10px', fontWeight: 'bold' }}>[Roll: {s.roll_number}]</span>
                            
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#a0aec0' }}>ASSIGNED SUBJECTS:</span>
                                {s.assigned_subjects && s.assigned_subjects.length > 0 ? (
                                    s.assigned_subjects.map((subName, index) => (
                                        <span key={index} style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                                            {subName}
                                        </span>
                                    ))
                                ) : (
                                    <span style={{ color: '#e53e3e', fontSize: '12px', fontStyle: 'italic' }}>No subjects assigned to this class</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
        </div>
    </div>
)}

                    {/* === TEACHERS TAB === */}
                     {activeTab === 'teachers' && (
                    <div>
                        {!showTeacherDetails ? (
                            <div>
                                <h3>Add New Teacher</h3>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                    <input placeholder="Username" value={newTeacher.username} onChange={e => setNewTeacher({...newTeacher, username: e.target.value})} />
                                    <input type="password" placeholder="Password" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} />
                                    <button onClick={createTeacher} style={{cursor: 'pointer', padding: '5px 15px'}}>Add Teacher</button>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                    {usersList.filter(u => u.role === 2 || u.user?.role === 2).map(t => (
                                        <div 
                                            key={t.id} 
                                            onClick={() => {
                                                setSelectedTeacherId(t.id);
                                                setShowTeacherDetails(true);
                                            }}
                                            style={{ background: 'white', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f0f7ff'}
                                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
                                        >
                                            <span style={{fontSize: '24px'}}>👤</span>
                                            <div style={{fontWeight: 'bold', marginTop: '10px'}}>{t.username}</div>
                                            <div style={{color: '#007bff', fontSize: '12px', marginTop: '5px'}}>Click for Details</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                                    <h3>Profile: {usersList.find(u => u.id === selectedTeacherId)?.username}</h3>
                                    <button onClick={() => setShowTeacherDetails(false)} style={{padding: '8px 15px', cursor: 'pointer', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px'}}>← Back to Teachers</button>
                                </div>

                                <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px'}}>
                                    <div style={{background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd'}}>
                                        <h4 style={{borderBottom: '2px solid #007bff', paddingBottom: '5px'}}>Assigned Subjects</h4>
                                        {subjects.filter(sub => sub.teacher === selectedTeacherId).length > 0 ? (
                                            subjects.filter(sub => sub.teacher === selectedTeacherId).map(sub => (
                                                <div key={sub.id} style={{padding: '10px 0', borderBottom: '1px solid #eee'}}>
                                                    <strong>{sub.name}</strong> <br/>
                                                    <small style={{color: '#666'}}>Class: {sub.class_name}</small>
                                                </div>
                                            ))
                                        ) : <p style={{color: '#999'}}>No subjects assigned.</p>}
                                    </div>

                                    <div style={{background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd'}}>
                                        <h4 style={{borderBottom: '2px solid #28a745', paddingBottom: '5px'}}>Students List (by Class)</h4>
                                        {[...new Set(subjects.filter(sub => sub.teacher === selectedTeacherId).map(sub => sub.classroom))].map(classId => (
                                            <div key={classId} style={{marginBottom: '20px'}}>
                                                <h5 style={{background: '#f8f9fa', padding: '5px 10px', borderRadius: '4px'}}>Class: {classes.find(c => c.id === classId)?.name}</h5>
                                                <ul style={{listStyle: 'none', padding: '0'}}>
                                                    {students.filter(s => s.classroom === classId).map(std => (
                                                        <li key={std.id} style={{padding: '5px 10px', borderBottom: '1px dotted #ccc', fontSize: '14px'}}>
                                                            {std.user_details?.username} <span style={{float: 'right', color: '#888'}}>Roll: {std.roll_number}</span>
                                                        </li>
                                                    ))}
                                                    {students.filter(s => s.classroom === classId).length === 0 && <li style={{fontSize: '12px', color: '#999'}}>No students in this class.</li>}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                    {/* === SUBJECTS TAB === */}
                    {activeTab === 'subjects' && (
    <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '20px', color: '#2d3748', fontSize: '1.4rem' }}>📚 Manage Subjects & Course Allocation</h3>
        
        {/* --- FORM CONTROLS / INPUTS --- */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center', background: '#f7fafc', padding: '15px', borderRadius: '8px' }}>
            
            {/* Subject Name Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1', minWidth: '180px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Subject Name</label>
                <input 
                    placeholder="e.g., Mathematics" 
                    value={newSubject.name} 
                    onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                />
            </div>

            {/* NEW: Select Classroom / Class Link Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1', minWidth: '180px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Assign to Class</label>
                <select 
                    value={newSubject.classroom} 
                    onChange={e => setNewSubject({...newSubject, classroom: e.target.value})}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px', background: '#fff' }}
                >
                    <option value="">Select Class & Section</option>
                    {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                    ))}
                </select>
            </div>

            {/* Assign Teacher Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1', minWidth: '180px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Assign Teacher</label>
                <select 
                    value={newSubject.teacher} 
                    onChange={e => setNewSubject({...newSubject, teacher: e.target.value})}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px', background: '#fff' }}
                >
                    <option value="">Select Teacher</option>
                    {usersList.filter(u => u.role === 2).map(t => (
                        <option key={t.id} value={t.id}>{t.username}</option>
                    ))}
                </select>
            </div>

            {/* Add Subject Button */}
            <button 
                onClick={() => {
                    if(!newSubject.name || !newSubject.classroom) return alert("Please fill in both Subject Name and Target Class!");
                    handleCreate('subjects/', newSubject, () => setNewSubject({name: '', classroom: '', teacher: ''}), '✅ Subject Created & Linked Successfully!');
                }}
                style={{ 
                    backgroundColor: '#4c51bf', 
                    color: 'white', 
                    padding: '10px 24px', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold', 
                    alignSelf: 'flex-end', 
                    height: '38px',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#434190'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4c51bf'}
            >
                + Add Subject
            </button>
        </div>

        {/* --- SUBJECTS LIST TABLE --- */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ backgroundColor: '#edf2f7', color: '#4a5568', borderBottom: '2px solid #cbd5e0' }}>
                        <th style={{ padding: '12px 15px', width: '40%' }}>Subject Name</th>
                        <th style={{ padding: '12px 15px', width: '30%' }}>Linked Class & Section</th>
                        <th style={{ padding: '12px 15px', width: '30%' }}>Assigned Faculty</th>
                    </tr>
                </thead>
                <tbody>
                    {subjects.map(sub => {
                        // Dynamic checking to find matched class info from dashboard states
                        const matchedClass = classes.find(c => c.id === parseInt(sub.classroom));
                        return (
                            <tr key={sub.id} style={{ borderBottom: '1px solid #edf2f7', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#2d3748' }}>
                                    📚 {sub.name}
                                </td>
                                <td style={{ padding: '12px 15px', color: '#4a5568' }}>
                                    {matchedClass ? (
                                        <span style={{ background: '#ebf4ff', color: '#2b6cb0', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                                            🏫 {matchedClass.name} - {matchedClass.section}
                                        </span>
                                    ) : (
                                        <span style={{ background: '#e2e8f0', color: '#4a5568', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontFamily: 'monospace' }}>
                                            Room/ID: {sub.classroom}
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '12px 15px', color: '#718096', fontSize: '14px' }}>
                                    {sub.teacher ? (
                                        <span style={{ fontWeight: '500', color: '#2d3748' }}>
                                            👤 {usersList.find(u => u.id === parseInt(sub.teacher))?.username || `Teacher ID: ${sub.teacher}`}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#e53e3e', fontStyle: 'italic', fontWeight: '500' }}>Not Assigned</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {subjects.length === 0 && (
                        <tr>
                            <td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: '#a0aec0', fontStyle: 'italic' }}>
                                No subjects added yet. Fill the form above to allocate one!
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
)}

                    {/* === TIMETABLE PERIODS TAB === */}
                     {activeTab === 'periods' && (
    <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '20px', color: '#2d3748', fontSize: '1.4rem' }}>🗓️ Class Timetable Scheduling</h3>
        
        {/* Form Controls */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center', background: '#f7fafc', padding: '15px', borderRadius: '8px' }}>
            
            {/* 1. Day Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Select Day</label>
                <select 
                    value={newPeriod.day || 1} 
                    onChange={e => setNewPeriod({...newPeriod, day: parseInt(e.target.value)})}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff' }}
                >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                </select>
            </div>

            {/* 2. Period Number */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Period Number</label>
                <select 
                    value={newPeriod.period || 1} 
                    onChange={e => setNewPeriod({...newPeriod, period: parseInt(e.target.value)})}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff' }}
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>Period {num}</option>
                    ))}
                    <option value={99}>Break / Recess</option>
                </select>
            </div>

            {/* 3. Select Class FIRST for Period */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Classroom</label>
                <select 
                    value={newPeriod.classroom || ''} 
                    onChange={e => setNewPeriod({...newPeriod, classroom: e.target.value, subject: ''})} // Reset subject on class change
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff', minWidth: '130px' }}
                >
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                </select>
            </div>

            {/* 4. Filtered Subjects Dropdown for Timetable */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Subject</label>
                <select 
                    value={newPeriod.subject || ''} 
                    onChange={e => setNewPeriod({...newPeriod, subject: e.target.value})}
                    disabled={!newPeriod.classroom}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', minWidth: '150px', background: newPeriod.classroom ? '#fff' : '#edf2f7' }}
                >
                    <option value="">Select Subject</option>
                    {subjects && subjects
                        .filter(sub => sub.classroom === parseInt(newPeriod.classroom))
                        .map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    }
                    <option value="BREAK">☕ Interval / Break</option>
                </select>
            </div>

            {/* 5. Timings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Start Time</label>
                <input 
                    type="time" 
                    value={newPeriod.start_time || ''} 
                    onChange={e => setNewPeriod({...newPeriod, start_time: e.target.value})}
                    style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>End Time</label>
                <input 
                    type="time" 
                    value={newPeriod.end_time || ''} 
                    onChange={e => setNewPeriod({...newPeriod, end_time: e.target.value})}
                    style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                />
            </div>

            <button 
                onClick={() => {
                    if(!newPeriod.classroom || !newPeriod.subject) return alert("Please select both Class and Subject/Break!");
                    handleCreate('timetable/', newPeriod, () => setNewPeriod({day: 1, period: 1, classroom: '', subject: '', start_time: '', end_time: ''}), '✅ Slot Scheduled!');
                }}
                style={{ backgroundColor: '#3182ce', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-end', height: '40px' }}
            >
                Add Timetable Slot
            </button>
        </div>

        {/* Timetable View */}
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ backgroundColor: '#ebf8ff', color: '#2b6cb0', borderBottom: '2px solid #bee3f8' }}>
                        <th style={{ padding: '12px' }}>Day</th>
                        <th style={{ padding: '12px' }}>Period</th>
                        <th style={{ padding: '12px' }}>Class</th>
                        <th style={{ padding: '12px' }}>Subject / Activity</th>
                        <th style={{ padding: '12px' }}>Timing</th>
                    </tr>
                </thead>
                <tbody>
                    {periods.sort((a,b) => a.day - b.day || a.period - b.period).map(p => {
                        const daysMapping = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
                        const isBreak = p.period === 99 || p.subject === 'BREAK' || p.subject_name?.toLowerCase().includes('break');
                        
                        return (
                            <tr key={p.id} style={{ 
                                borderBottom: '1px solid #e2e8f0',
                                backgroundColor: isBreak ? '#fffaf0' : 'transparent',
                                fontWeight: isBreak ? 'bold' : 'normal'
                            }}>
                                <td style={{ padding: '12px', color: '#4a5568' }}>{daysMapping[p.day] || `Day ${p.day}`}</td>
                                <td style={{ padding: '12px' }}>
                                    {isBreak ? <span style={{ color: '#dd6b20', background: '#feebc8', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>BREAK</span> : `Period ${p.period}`}
                                </td>
                                <td style={{ padding: '12px', color: '#4a5568' }}>{p.class_name}-{p.class_section}</td>
                                <td style={{ padding: '12px', color: isBreak ? '#dd6b20' : '#2d3748' }}>
                                    {isBreak ? '☕ Recess / Rest Time' : p.subject_name}
                                </td>
                                <td style={{ padding: '12px', color: '#718096', fontSize: '14px' }}>
                                    {p.start_time && p.end_time ? `${p.start_time} - ${p.end_time}` : '---'}
                                </td>
                            </tr>
                        );
                    })}
                    {periods.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#a0aec0' }}>No timetable slots added yet.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
)}
                    {/* === EXAMS TAB === */}
    {activeTab === 'exams' && (
    <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        {/* React-safe dynamic print handling CSS block */}
        <style dangerouslySetInnerHTML={{__html: `
            @media print {
                body * { visibility: hidden !important; background: transparent !important; box-shadow: none !important; }
                #report-card-print-area, #report-card-print-area * { visibility: visible !important; }
                #report-card-print-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; border: none !important; padding: 0 !important; }
                .no-print { display: none !important; }
            }
        `}} />

        <h3 className="no-print" style={{ marginBottom: '20px', color: '#2d3748', fontSize: '1.4rem' }}>🏆 Manage Exam Results</h3>

        {/* --- 1. DATA INPUT SECTION --- */}
        <div className="no-print" style={{ 
            background: '#f8fafc', padding: '25px', borderRadius: '12px', 
            border: '1px solid #e2e8f0', marginBottom: '30px'
        }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#4a5568' }}>➕ Add/Update Marks Matrix</h4>
            
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end', marginBottom: '25px'
            }}>
                {/* Selector Box: Class */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>1. Select Class</label>
                    <select 
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff' }} 
                        value={examSelectedClass} 
                        onChange={e => {
                            const classId = e.target.value;
                            setExamSelectedClass(classId);
                            setNewExam({ student: '', exam_type: newExam.exam_type || 'Final' });
                            
                            if(classId) {
                                const classSt = students.filter(st => st.classroom === parseInt(classId));
                                setFilteredStudents(classSt);
                                const classSub = subjects.filter(sub => sub.classroom === parseInt(classId));
                                setFilteredSubjects(classSub);
                            } else {
                                setFilteredStudents([]);
                                setFilteredSubjects([]);
                            }
                        }}
                    >
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                    </select>
                </div>

                {/* Selector Box: Student */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>2. Select Student</label>
                    <select 
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', background: examSelectedClass ? '#fff' : '#edf2f7' }} 
                        value={newExam.student || ''} 
                        onChange={e => {
                            const studentId = e.target.value;
                            if (studentId && filteredSubjects.length > 0) {
                                const initializedMatrix = filteredSubjects.map(sub => ({
                                    subject: sub.id,
                                    subject_name: sub.name,
                                    marks_obtained: '',
                                    total_marks: 100
                                }));
                                setNewExam({ ...newExam, student: studentId, marksMatrix: initializedMatrix });
                            } else {
                                setNewExam({ ...newExam, student: studentId, marksMatrix: [] });
                            }
                        }}
                        disabled={!examSelectedClass}
                    >
                        <option value="">Select Student</option>
                        {filteredStudents.map(s => (
                            <option key={s.id} value={s.id}>{s.user_details?.username || s.name} (Roll: {s.roll_number || s.roll})</option>
                        ))}
                    </select>
                </div>

                {/* Selector Box: Exam Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Exam Type</label>
                    <select 
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff' }} 
                        value={newExam.exam_type || 'Final'} 
                        onChange={e => setNewExam({...newExam, exam_type: e.target.value})}
                    >
                        <option value="Final">Final</option>
                        <option value="Midterm">Midterm</option>
                    </select>
                </div>
            </div>

            {/* Matrix Form Subject Inputs */}
            {examSelectedClass && newExam.student && newExam.marksMatrix && newExam.marksMatrix.length > 0 && (
                <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {newExam.marksMatrix.map((item, idx) => (
                            <div key={item.subject} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', alignItems: 'center' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748' }}>📖 {item.subject_name}</div>
                                <input 
                                    type="number" placeholder="Obtained" 
                                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                                    value={item.marks_obtained}
                                    onChange={e => {
                                        const updatedMatrix = [...newExam.marksMatrix];
                                        updatedMatrix[idx].marks_obtained = e.target.value !== '' ? parseInt(e.target.value) : '';
                                        setNewExam({ ...newExam, marksMatrix: updatedMatrix });
                                    }}
                                />
                                <input 
                                    type="number" placeholder="Total" 
                                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#f7fafc' }}
                                    value={item.total_marks}
                                    onChange={e => {
                                        const updatedMatrix = [...newExam.marksMatrix];
                                        updatedMatrix[idx].total_marks = e.target.value !== '' ? parseInt(e.target.value) : 100;
                                        setNewExam({ ...newExam, marksMatrix: updatedMatrix });
                                    }}
                                />
                            </div>
                        ))}
                    </div>
    <button 
    onClick={async () => {
        const recordsToSubmit = newExam.marksMatrix.filter(m => m.marks_obtained !== '');
        if(recordsToSubmit.length === 0) return alert("Please enter marks!");
        
        try {
            // Backend me data save karne ke liye call
            await Promise.all(recordsToSubmit.map(record => {
                return handleCreate('exams/', {
                    student: parseInt(newExam.student),
                    exam_type: newExam.exam_type || 'Final',
                    subject: record.subject,
                    marks_obtained: record.marks_obtained,
                    total_marks: record.total_marks
                }, () => {}, ''); 
            }));
            
            alert('🎉 Marks Saved Successfully!');
            
            // 1. Local state update taake naye marks niche table aur report card me foran show ho jayein
            if (typeof setExams === 'function') {
                setExams(prevExams => [
                    ...prevExams,
                    ...recordsToSubmit.map((record, index) => ({
                        id: Date.now() + index,
                        student: parseInt(newExam.student),
                        exam_type: newExam.exam_type || 'Final',
                        subject: record.subject,
                        subject_name: record.subject_name,
                        marks_obtained: record.marks_obtained,
                        total_marks: record.total_marks
                    }))
                ]);
            }

            // 2. 🔥 FIX: Class aur Student ko change nahi karenge taake report card khula rahe!
            // Sirf marks matrix ke input boxes ko empty (reset) karenge.
            setNewExam(prev => {
                const clearedMatrix = prev.marksMatrix ? prev.marksMatrix.map(item => ({
                    ...item,
                    marks_obtained: '' // Sirf obtained marks clear honge taake naya data enter ho sake
                })) : [];
                
                return {
                    ...prev,
                    marksMatrix: clearedMatrix
                };
            });

        } catch (err) { 
            console.error(err);
            alert('Something went wrong while saving marks.'); 
        }
    }}
    style={{ background: '#4c51bf', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', padding: '12px', marginTop: '20px', width: '100%' }}
>
     Submit All Marks
</button>
                </div>
            )}
        </div>

        {/* --- 2. REPORT CARD SHEET DESIGN LOGIC --- */}
        {examSelectedClass && newExam.student ? (
            <div style={{ marginTop: '20px' }}>
                <button 
                    onClick={() => window.print()}
                    className="no-print"
                    style={{ 
                        background: '#38a169', color: 'white', border: 'none', padding: '10px 20px', 
                        borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    🖨️ Print Result Card / Save PDF
                </button>

                <div id="report-card-print-area" style={{ 
                    border: '3px double #cbd5e0', padding: '40px', borderRadius: '8px', 
                    background: '#ffffff', maxWidth: '800px', margin: '0 auto', color: '#1a202c' 
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #2d3748', paddingBottom: '15px' }}>
                        <h1 style={{ margin: '0 0 5px 0', fontSize: '2rem', color: '#2b6cb0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            🏫 NATIONAL PUBLIC SCHOOL
                        </h1>
                        <p style={{ margin: '0', fontSize: '13px', color: '#718096', fontWeight: '500' }}>
                            Official Student Examination Progress Report Card
                        </p>
                    </div>

                    {(() => {
                        const activeStudentObj = students.find(s => String(s.id) === String(newExam.student));
                        const activeClassObj = classes.find(c => String(c.id) === String(examSelectedClass));
                        
                        return (
                            <div style={{ 
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', 
                                marginBottom: '30px', background: '#f7fafc', padding: '15px', 
                                borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px'
                            }}>
                                <div><strong>Student Name:</strong> {activeStudentObj?.user_details?.username || activeStudentObj?.name || 'N/A'}</div>
                                <div><strong>Roll Number:</strong> {activeStudentObj?.roll_number || activeStudentObj?.roll || 'N/A'}</div>
                                <div><strong>Class & Section:</strong> {activeClassObj?.name || 'N/A'} - {activeClassObj?.section || 'N/A'}</div>
                                <div><strong>Term / Assessment:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#4c51bf' }}>{newExam.exam_type || 'Final'}</span></div>
                            </div>
                        );
                    })()}

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#2d3748', color: '#ffffff' }}>
                                <th style={{ border: '1px solid #cbd5e0', padding: '12px', textAlign: 'left' }}>Subject Component</th>
                                <th style={{ border: '1px solid #cbd5e0', padding: '12px', textAlign: 'center' }}>Total Marks</th>
                                <th style={{ border: '1px solid #cbd5e0', padding: '12px', textAlign: 'center' }}>Marks Obtained</th>
                                <th style={{ border: '1px solid #cbd5e0', padding: '12px', textAlign: 'center' }}>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const studentRecords = exams.filter(ex => 
                                    String(ex.student) === String(newExam.student) && 
                                    (ex.exam_type || 'Final') === (newExam.exam_type || 'Final')
                                );

                                if(studentRecords.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan="4" style={{ border: '1px solid #cbd5e0', padding: '20px', textAlign: 'center', color: '#a0aec0', fontStyle: 'italic' }}>
                                                No verified exam marks sheets indexed for this selection yet. Please submit marks above.
                                            </td>
                                        </tr>
                                    );
                                }

                                let totalMaxSum = 0;
                                let totalObtainedSum = 0;

                                const rows = studentRecords.map(rec => {
                                    totalMaxSum += rec.total_marks;
                                    totalObtainedSum += rec.marks_obtained;
                                    const subPercentage = rec.total_marks > 0 ? ((rec.marks_obtained / rec.total_marks) * 100).toFixed(1) : '0.0';
                                    
                                    return (
                                        <tr key={rec.id}>
                                            <td style={{ border: '1px solid #cbd5e0', padding: '10px', fontWeight: '600' }}>📚 {rec.subject_name || `Subject Code #${rec.subject}`}</td>
                                            <td style={{ border: '1px solid #cbd5e0', padding: '10px', textAlign: 'center' }}>{rec.total_marks}</td>
                                            <td style={{ border: '1px solid #cbd5e0', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{rec.marks_obtained}</td>
                                            <td style={{ border: '1px solid #cbd5e0', padding: '10px', textAlign: 'center' }}>{subPercentage}%</td>
                                        </tr>
                                    );
                                });

                                const totalOverallPercentage = totalMaxSum > 0 ? ((totalObtainedSum / totalMaxSum) * 100).toFixed(1) : '0.0';

                                rows.push(
                                    <tr key="summary-totals-row" style={{ background: '#edf2f7', fontWeight: 'bold' }}>
                                        <td style={{ border: '1px solid #cbd5e0', padding: '12px', fontSize: '15px' }}>📊 GRAND TOTAL SUMMATION</td>
                                        <td style={{ border: '1px solid #cbd5e0', padding: '12px', textAlign: 'center', color: '#4a5568' }}>{totalMaxSum}</td>
                                        <td style={{ border: '1px solid #cbd5e0', padding: '12px', textAlign: 'center', color: '#2b6cb0' }}>{totalObtainedSum}</td>
                                        <td style={{ border: '1px solid #cbd5e0', padding: '12px', textAlign: 'center', fontSize: '15px', color: parseFloat(totalOverallPercentage) >= 40 ? '#38a169' : '#e53e3e' }}>
                                            {totalOverallPercentage}%
                                        </td>
                                    </tr>
                                );

                                return rows;
                            })()}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', padding: '0 10px' }}>
                        <div style={{ textAlign: 'center', width: '150px', borderTop: '1px dashed #718096', paddingTop: '8px', fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>
                            Class Teacher
                        </div>
                        <div style={{ textAlign: 'center', width: '150px', borderTop: '1px dashed #718096', paddingTop: '8px', fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>
                            Principal Stamp
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="no-print" style={{ textAlign: 'center', padding: '30px', color: '#718096', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e0' }}>
                 Please choose a valid Class and Student from the filter drop-downs above to auto-generate their individual official Result Card.
            </div>
        )}
    </div>
)}
                    {/* === ATTENDANCE TAB === */}
                    {activeTab === 'attendance' && (
    <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '20px', color: '#2d3748', fontSize: '1.4rem' }}>📝 Mark & Manage Attendance</h3>
        
        {/* Controls Layout */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center', background: '#f7fafc', padding: '15px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Select Class</label>
                <select 
                    value={selectedClass} 
                    onChange={e => { 
                        setSelectedClass(e.target.value); 
                        setSelectedSubject(''); // Reset subject whenever class changes
                    }}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', minWidth: '150px', background: '#fff' }}
                >
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Select Subject</label>
                <select 
                    value={selectedSubject} 
                    onChange={e => setSelectedSubject(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', minWidth: '150px', background: selectedClass ? '#fff' : '#edf2f7' }}
                    disabled={!selectedClass}
                >
                    <option value="">Select Subject</option>
                    {/* Fixed Filtering: maps only subjects linked directly to selected class */}
                    {subjects.filter(s => s.classroom === parseInt(selectedClass)).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            <button 
                onClick={submitAttendance} 
                disabled={!selectedClass || !selectedSubject || attendanceData.length === 0}
                style={{ 
                    background: (!selectedClass || !selectedSubject) ? '#a0aec0' : '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    padding: '10px 20px', 
                    borderRadius: '6px', 
                    cursor: (!selectedClass || !selectedSubject) ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    alignSelf: 'flex-end',
                    height: '40px',
                    transition: 'background 0.2s'
                }}
            >
                💾 Save Attendance
            </button>
        </div>

        {/* Attendance Sheet Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px', width: '15%' }}>Roll No</th>
                        <th style={{ padding: '12px', width: '45%' }}>Student Name</th>
                        <th style={{ padding: '12px', width: '40%', textAlign: 'center' }}>Attendance Status</th>
                    </tr>
                </thead>
                <tbody>
                    {attendanceData.map(s => (
                        <tr key={s.student_id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <td style={{ padding: '12px', fontWeight: '500', color: '#64748b' }}>{s.roll || '---'}</td>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>{s.name}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e0' }}>
                                    
                                    {/* Present Button (Syncs with state 'Present') */}
                                    <button
                                        type="button"
                                        onClick={() => setAttendanceData(prev => prev.map(item => item.student_id === s.student_id ? { ...item, status: 'Present' } : item))}
                                        style={{
                                            padding: '6px 16px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                                            background: s.status === 'Present' ? '#48bb78' : '#fff',
                                            color: s.status === 'Present' ? '#fff' : '#4a5568',
                                            transition: 'all 0.1s'
                                        }}
                                    >
                                        P
                                    </button>

                                    {/* Absent Button (Syncs with state 'Absent') */}
                                    <button
                                        type="button"
                                        onClick={() => setAttendanceData(prev => prev.map(item => item.student_id === s.student_id ? { ...item, status: 'Absent' } : item))}
                                        style={{
                                            padding: '6px 16px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                                            background: s.status === 'Absent' ? '#f56565' : '#fff',
                                            color: s.status === 'Absent' ? '#fff' : '#4a5568',
                                            transition: 'all 0.1s'
                                        }}
                                    >
                                        A
                                    </button>

                                    {/* Leave Button (Syncs with state 'Leave') */}
                                    <button
                                        type="button"
                                        onClick={() => setAttendanceData(prev => prev.map(item => item.student_id === s.student_id ? { ...item, status: 'Leave' } : item))}
                                        style={{
                                            padding: '6px 16px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                                            background: s.status === 'Leave' ? '#ed8936' : '#fff',
                                            color: s.status === 'Leave' ? '#fff' : '#4a5568',
                                            transition: 'all 0.1s'
                                        }}
                                    >
                                        L
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {attendanceData.length === 0 && (
                        <tr>
                            <td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                Please select a Class and Subject to load the student attendance sheet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
)}
                    {/* === FINANCES TAB === */}
                      {activeTab === 'finances' && (
                    <div>
                        <h3>Fee Management</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', background: '#f0f4f8', padding: '15px', borderRadius: '8px' }}>
                            
                            {/* Step 1: Select Class Dropdown */}
                            <select 
                                value={feeSelectedClass} 
                                onChange={e => {
                                    const classId = e.target.value;
                                    setFeeSelectedClass(classId);
                                    
                                    // Form dynamic reset
                                    setNewFee(prev => ({ ...prev, student: '', amount: '' }));

                                    if (classId) {
                                        // 1. Filter students of this class
                                        const classSt = students.filter(st => st.classroom === parseInt(classId));
                                        setFeeFilteredStudents(classSt);

                                        // 2. Auto-populate fixed class monthly fee
                                        const targetClass = classes.find(c => c.id === parseInt(classId));
                                        if (targetClass && targetClass.monthly_fee) {
                                            setNewFee(prev => ({ ...prev, amount: targetClass.monthly_fee }));
                                        }
                                    } else {
                                        setFeeFilteredStudents([]);
                                    }
                                }}
                            >
                                <option value="">-- Select Class --</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                                ))}
                            </select>

                            {/* Step 2: Select Student Dropdown (Filtered Based on Class selection) */}
                            <select 
                                value={newFee.student} 
                                onChange={e => setNewFee({...newFee, student: e.target.value})}
                                disabled={!feeSelectedClass}
                                style={{ background: feeSelectedClass ? '#fff' : '#e2e8f0' }}
                            >
                                <option value="">Select Student</option>
                                {feeFilteredStudents.map(s => (
                                    <option key={s.id} value={s.id}>{s.user_details?.username} ({s.roll_number})</option>
                                ))}
                            </select>

                            {/* Month Selector */}
                            <select value={newFee.month} onChange={e => setNewFee({...newFee, month: parseInt(e.target.value)})}>
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Month {m}</option>)}
                            </select>

                            {/* Dynamic/Auto-filled Fixed Amount Input field */}
                            <input 
                                type="number" 
                                placeholder="Amount" 
                                value={newFee.amount} 
                                onChange={e => setNewFee({...newFee, amount: e.target.value})} 
                                style={{ fontWeight: 'bold', background: '#fff' }}
                            />

                            <button 
                                onClick={() => {
                                    if (!feeSelectedClass || !newFee.student || !newFee.amount) {
                                        return alert("Please select Class, Student and verify Fee amount first!");
                                    }
                                    handleCreate('fees/', newFee, () => {
                                        setNewFee({student:'', month:1, year:2026, amount:''});
                                        setFeeSelectedClass('');
                                        setFeeFilteredStudents([]);
                                    }, '✅ Fee Record Created Successfully!');
                                }}
                            >
                                Generate Fee
                            </button>
                        </div>

                        <table style={{ width: '100%', background: 'white', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#eee' }}><th>Student</th><th>Month</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {feeRecords.map(f => (
                                    <tr key={f.id} style={{ borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                                        <td>{f.student_name}</td><td>{f.month_display}</td><td>Rs. {f.amount}</td>
                                        <td style={{ color: f.is_paid ? 'green' : 'red', fontWeight: 'bold' }}>{f.is_paid ? 'Paid' : 'Unpaid'}</td>
                                        <td>
                                            {!f.is_paid && <button onClick={() => markAsPaid(f.id)}>Mark Paid</button>}
                                            <button onClick={() => printVoucher(f)} style={{ marginLeft: '5px' }}>Print</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;