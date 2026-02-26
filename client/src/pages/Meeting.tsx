import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Share, Paperclip } from 'lucide-react';

export default function Meeting() {
    const { id: roomId } = useParams<{ id: string }>();
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [peers] = useState<{ [key: string]: MediaStream }>({});
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [messages, setMessages] = useState<{ sender: string, text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');

    const myVideoRef = useRef<HTMLVideoElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
            return;
        }

        const initMeeting = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = mediaStream;
                }

                socketRef.current = io('http://localhost:5000');

                socketRef.current.emit('join-room', roomId, user?.id || Math.random().toString());

                socketRef.current.on('user-connected', (userId: string) => {
                    console.log('User connected', userId);
                    // In a real app we'd initiate WebRTC connection here
                    // For now we setup the signaling handler structure
                });

                socketRef.current.on('receive-message', (message: any) => {
                    setMessages(prev => [...prev, message]);
                });

            } catch (err) {
                console.error('Error accessing media devices.', err);
            }
        };

        if (user) {
            initMeeting();
        }

        return () => {
            stream?.getTracks().forEach(track => track.stop());
            socketRef.current?.disconnect();
            Object.values(peersRef.current).forEach(pc => pc.close());
        };
    }, [roomId, user, loading, navigate]);

    const toggleMute = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const leaveMeeting = () => {
        navigate('/dashboard');
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim() && socketRef.current && user) {
            const msg = { sender: user.name, text: chatInput };
            socketRef.current.emit('send-message', roomId, msg);
            setMessages(prev => [...prev, msg]);
            setChatInput('');
        }
    };

    if (loading || !user) {
        return <div className="page-container justify-center items-center">Loading...</div>;
    }

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-gradient-start)' }}>
            {/* Main Video Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <header style={{ padding: '1rem', background: 'rgba(0,0,0,0.5)', zIndex: 10 }}>
                    <h2 style={{ margin: 0 }}>Meeting Room: {roomId}</h2>
                </header>

                <div style={{ flex: 1, padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem', overflowY: 'auto' }}>
                    {/* Local Video */}
                    <div className="glass-card" style={{ position: 'relative', overflow: 'hidden', background: '#000', borderRadius: '12px' }}>
                        <video
                            ref={myVideoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: '16px' }}>
                            You ({user.name})
                        </div>
                    </div>

                    {/* Remote Videos would go here */}
                    {Object.entries(peers).map(([peerId, peerStream]) => (
                        <div key={peerId} className="glass-card" style={{ position: 'relative', overflow: 'hidden', background: '#000', borderRadius: '12px' }}>
                            <video
                                autoPlay
                                playsInline
                                ref={el => { if (el) el.srcObject = peerStream; }}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: '16px' }}>
                                {peerId}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls Bar */}
                <div style={{ height: '80px', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '0 2rem' }}>
                    <button onClick={toggleMute} className={`btn ${isMuted ? 'btn-danger' : 'btn-secondary'}`} style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0 }}>
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    <button onClick={toggleVideo} className={`btn ${isVideoOff ? 'btn-danger' : 'btn-secondary'}`} style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0 }}>
                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>

                    <button onClick={leaveMeeting} className="btn btn-danger" style={{ borderRadius: '24px', padding: '12px 24px', display: 'flex', gap: '0.5rem' }}>
                        <PhoneOff size={20} /> Leave
                    </button>
                </div>
            </div>

            {/* Sidebar Area */}
            <div className="glass-panel" style={{ width: '350px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--glass-border)', borderRadius: 0 }}>

                {/* Tabs */}
                <div className="flex" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <button className="flex items-center justify-center" style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' }}>
                        <MessageSquare size={18} style={{ marginRight: '8px' }} /> Chat
                    </button>
                    <button className="flex items-center justify-center" style={{ flex: 1, padding: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                        <Share size={18} style={{ marginRight: '8px' }} /> Files
                    </button>
                </div>

                {/* Chat Area */}
                <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.length === 0 && (
                        <p className="text-center text-muted mt-4">No messages yet. Start the conversation!</p>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} style={{ background: msg.sender === user.name ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px', alignSelf: msg.sender === user.name ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                            <div style={{ fontSize: '0.8rem', color: msg.sender === user.name ? '#60a5fa' : 'var(--text-muted)', marginBottom: '4px' }}>{msg.sender}</div>
                            <div>{msg.text}</div>
                        </div>
                    ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn btn-secondary" style={{ padding: '8px' }}>
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }} disabled={!chatInput.trim()}>
                        Send
                    </button>
                </form>

            </div>
        </div>
    );
}
