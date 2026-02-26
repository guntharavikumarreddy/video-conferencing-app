import { Link } from 'react-router-dom';

export default function Landing() {
    return (
        <div className="page-container animate-fade-in" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '800px', width: '100%' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Connect Anywhere, Anytime
                </h1>
                <p className="text-muted" style={{ fontSize: '1.25rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                    Experience premium video conferencing with crystal clear audio,
                    real-time collaboration, and secure file sharing. All in one place.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link to="/register" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '12px 28px' }}>
                        Get Started Free
                    </Link>
                    <Link to="/login" className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '12px 28px' }}>
                        Sign In
                    </Link>
                </div>

                <div style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '0.5rem', color: '#60a5fa' }}>HD Video</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Crystal clear 1080p video calls with ultra-low latency.</p>
                    </div>
                    <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '0.5rem', color: '#60a5fa' }}>Secure Sharing</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Share files seamlessly with unique, time-limited access keys.</p>
                    </div>
                    <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '0.5rem', color: '#60a5fa' }}>Real-time Chat</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Collaborate effectively with integrated meeting chat.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
