import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Video, Users, LogOut, Clock, Plus } from 'lucide-react';

export default function Dashboard() {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [meetingIdToJoin, setMeetingIdToJoin] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    const handleStartMeeting = () => {
        // Generate a unique room ID
        const newMeetingId = Math.random().toString(36).substring(2, 10);
        navigate(`/meeting/${newMeetingId}`);
    };

    const handleJoinMeeting = (e: React.FormEvent) => {
        e.preventDefault();
        if (meetingIdToJoin.trim()) {
            navigate(`/meeting/${meetingIdToJoin.trim()}`);
        }
    };

    if (loading || !user) {
        return (
            <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            <header className="flex justify-between items-center mb-6 py-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <div className="flex items-center" style={{ gap: '1rem' }}>
                    <Video color="var(--primary-color)" size={32} />
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>VideoVerse</h2>
                </div>
                <div className="flex items-center" style={{ gap: '1.5rem' }}>
                    <div className="flex items-center" style={{ gap: '0.5rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{user.name}</span>
                    </div>
                    <button onClick={() => { logout(); navigate('/'); }} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            <main style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '2rem', marginTop: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={24} color="var(--primary-color)" /> Start a Meeting
                    </h3>
                    <p className="text-muted mb-6">Create a new secure meeting instantly and invite others to join.</p>
                    <button onClick={handleStartMeeting} className="btn btn-primary w-full justify-center" style={{ padding: '14px', fontSize: '1.1rem' }}>
                        Start New Meeting
                    </button>
                </div>

                <div className="glass-panel" style={{ padding: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={24} color="#10b981" /> Join a Meeting
                    </h3>
                    <p className="text-muted mb-6">Enter a meeting ID or link to join an existing session.</p>
                    <form onSubmit={handleJoinMeeting} className="flex" style={{ gap: '1rem' }}>
                        <input
                            type="text"
                            placeholder="e.g. abc-123"
                            value={meetingIdToJoin}
                            onChange={(e) => setMeetingIdToJoin(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn btn-secondary" disabled={!meetingIdToJoin.trim()}>
                            Join
                        </button>
                    </form>
                </div>
            </main>

            <div className="glass-panel mt-6" style={{ padding: '2rem' }}>
                <h3 className="mb-4 flex items-center" style={{ gap: '0.5rem' }}>
                    <Clock size={20} /> Recent Activities
                </h3>
                <p className="text-muted text-center" style={{ padding: '2rem' }}>No recent meetings found.</p>
            </div>
        </div>
    );
}
