'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { subscribeToQuiz, createQuiz, addPerson, removePerson, publishQuiz, deleteQuiz, uploadImage, listQuizzes, onAuthChange, loginWithGoogle, logout, updateQuizSettings } from '@/lib/db';
import { Quiz } from '@/lib/types';
import { User } from 'firebase/auth';
import QRCodeDisplay from '@/components/QRCodeDisplay';

function AdminDashboard() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const quizId = searchParams.get('quizId');

    const [user, setUser] = useState<User | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [baseUrl, setBaseUrl] = useState('');
    const [newQuizTitle, setNewQuizTitle] = useState('New Quiz 💐');
    const [personName, setPersonName] = useState('');
    const [caricatureUrl1, setCaricatureUrl1] = useState('');
    const [caricatureUrl2, setCaricatureUrl2] = useState('');
    const [uploading, setUploading] = useState<'c1' | 'c2' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const c1InputRef = useRef<HTMLInputElement>(null);
    const c2InputRef = useRef<HTMLInputElement>(null);

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthChange((u) => {
            setUser(u);
            if (!u) {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Load quiz list or subscribe to specific quiz
    useEffect(() => {
        setBaseUrl(window.location.origin);
        if (!user) return;

        if (!quizId) {
            setLoading(true);
            listQuizzes(user.uid).then(list => {
                setQuizzes(list);
                setLoading(false);
            });
            return;
        }

        const unsubscribe = subscribeToQuiz(quizId, (q) => {
            // Basic security: Check if current user is owner
            if (q && q.ownerId && q.ownerId !== user.uid) {
                setError("You don't have permission to edit this quiz.");
                setQuiz(null);
            } else {
                setQuiz(q);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [quizId, user]);

    const showError = (msg: string) => {
        setError(msg);
        setTimeout(() => setError(null), 4000);
    };

    const handleLogin = async () => {
        try {
            setLoading(true);
            await loginWithGoogle();
        } catch (err: any) {
            showError(`Login failed: ${err.message}`);
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/admin');
        } catch (err: any) {
            showError(`Logout failed: ${err.message}`);
        }
    };

    const handleCreateQuiz = useCallback(async () => {
        if (!newQuizTitle.trim() || !user) return;
        try {
            const id = await createQuiz(newQuizTitle.trim(), user.uid);
            router.push(`/admin?quizId=${id}`);
        } catch (err: any) {
            showError(`Failed to create quiz: ${err.message}`);
        }
    }, [newQuizTitle, router, user]);

    const handleUpload = useCallback(async (file: File, type: 'c1' | 'c2') => {
        setUploading(type);
        try {
            const url = await uploadImage(file);
            if (type === 'c1') {
                setCaricatureUrl1(url);
            } else {
                setCaricatureUrl2(url);
            }
        } catch (err: any) {
            showError(`Upload failed: ${err.message}`);
        } finally {
            setUploading(null);
        }
    }, []);

    const handleAddPerson = useCallback(async () => {
        if (!quizId || !personName.trim() || !caricatureUrl1 || !caricatureUrl2) return;
        try {
            await addPerson(quizId, personName.trim(), caricatureUrl1, caricatureUrl2);
            setPersonName('');
            setCaricatureUrl1('');
            setCaricatureUrl2('');
            if (c1InputRef.current) c1InputRef.current.value = '';
            if (c2InputRef.current) c2InputRef.current.value = '';
        } catch (err: any) {
            showError(`Failed to add person: ${err.message}`);
        }
    }, [quizId, personName, caricatureUrl1, caricatureUrl2]);

    const handleRemovePerson = useCallback(async (personId: string) => {
        if (!quizId) return;
        try {
            await removePerson(quizId, personId);
        } catch (err: any) {
            showError(`Failed to remove person: ${err.message}`);
        }
    }, [quizId]);

    const handleUpdateSettings = useCallback(async (newDuration: number, mode?: 'countdown' | 'all_voted') => {
        if (!quizId || !quiz) return;
        try {
            await updateQuizSettings(quizId, {
                ...quiz.settings,
                votingDuration: newDuration,
                votingMode: mode || quiz.settings.votingMode || 'countdown'
            });
        } catch (err: any) {
            showError(`Failed to update settings: ${err.message}`);
        }
    }, [quizId, quiz]);

    const handlePublish = useCallback(async () => {
        if (!quizId) return;
        try {
            await publishQuiz(quizId);
        } catch (err: any) {
            showError(`Failed to publish: ${err.message}`);
        }
    }, [quizId]);

    const handleDeleteQuiz = useCallback(async (idToDelete?: string) => {
        const id = idToDelete || quizId;
        if (!id) return;
        if (!confirm('Delete this quiz and all its data?')) return;
        try {
            await deleteQuiz(id);
            if (id === quizId) {
                router.push('/admin');
            } else {
                setQuizzes(prev => prev.filter(q => q.id !== id));
            }
        } catch (err: any) {
            showError(`Failed to delete quiz: ${err.message}`);
        }
    }, [quizId, router]);

    const joinUrl = quiz && baseUrl
        ? `${baseUrl}/play/${quiz.id}`
        : '';

    const hostUrl = quiz && baseUrl
        ? `${baseUrl}/host?quizId=${quiz.id}`
        : '';

    // ── LOADING ──────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="page-container">
                <div className="waiting-dots"><span></span><span></span><span></span></div>
            </div>
        );
    }

    // ── AUTH SCREEN ──────────────────────────────────────────────
    if (!user) {
        return (
            <div className="page-container">
                <div className="animate-in" style={{ textAlign: 'center', marginTop: '10vh' }}>
                    <div style={{ marginBottom: 24 }}>
                        <span style={{ fontSize: 64 }}>💐</span>
                    </div>
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="page-subtitle">Please sign in with Google to manage your quizzes</p>
                    <button className="btn btn-primary btn-large" onClick={handleLogin} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                        Sign In with Google
                    </button>
                    {error && (
                        <p style={{ color: '#ef4444', marginTop: 16, fontSize: 14 }}>{error}</p>
                    )}
                </div>
            </div>
        );
    }

    // ── DASHBOARD (List Quizzes) ─────────────────────────────────
    if (!quizId) {
        return (
            <div className="page-container">
                <div className="animate-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                        <div>
                            <h1 className="page-title" style={{ marginBottom: 4 }}>👑 Quiz Management</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>Welcome back, <span className="text-gradient" style={{ fontWeight: 700 }}>{user.displayName}</span></p>
                        </div>
                        <button className="btn btn-secondary" onClick={handleLogout} style={{ fontSize: 13 }}>
                            Logout
                        </button>
                    </div>

                    <div className="glass-card" style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Create New Quiz</h2>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <input
                                className="input"
                                value={newQuizTitle}
                                onChange={e => setNewQuizTitle(e.target.value)}
                                placeholder="Quiz title..."
                                onKeyDown={e => e.key === 'Enter' && handleCreateQuiz()}
                            />
                            <button className="btn btn-primary" onClick={handleCreateQuiz}>
                                Create
                            </button>
                        </div>
                    </div>

                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Your Quizzes</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {quizzes.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No quizzes yet. Create your first one above!</p>
                        ) : (
                            quizzes.map(q => (
                                <div key={q.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{q.title}</h3>
                                            <span style={{
                                                fontSize: 10,
                                                padding: '2px 8px',
                                                borderRadius: 20,
                                                background: q.status === 'live' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.1)',
                                                color: q.status === 'live' ? '#34d399' : 'var(--text-muted)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1
                                            }}>
                                                {q.status}
                                            </span>
                                        </div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                                            {q.persons.length} rounds • {q.players.length} players
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-secondary" onClick={() => router.push(`/admin?quizId=${q.id}`)} style={{ flex: 1, fontSize: 13 }}>
                                            Manage
                                        </button>
                                        <button className="btn btn-danger" onClick={() => handleDeleteQuiz(q.id)} style={{ padding: '8px 12px', fontSize: 12 }}>
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── EDITOR (Manage Specific Quiz) ────────────────────────────
    if (!quiz) {
        return (
            <div className="page-container">
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <p style={{ marginBottom: 16 }}>{error || "Quiz not found or has been deleted."}</p>
                    <button className="btn btn-primary" onClick={() => router.push('/admin')}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="animate-in">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: 'var(--pink)', cursor: 'pointer', fontSize: 14 }}>
                        ← Dashboard
                    </button>
                    <button className="btn btn-secondary" onClick={handleLogout} style={{ fontSize: 12 }}>
                        Logout
                    </button>
                </div>
                <h1 className="page-title">👑 {quiz.title}</h1>
                <p className="page-subtitle">Configure rounds and manage publishing</p>

                {error && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        color: '#ef4444',
                        marginBottom: '20px',
                        fontSize: '14px',
                    }}>
                        {error}
                    </div>
                )}

                {quiz.status === 'draft' && (
                    <>
                        {/* Editor Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                                    Add Persons
                                </h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                                    {quiz.persons.length} {quiz.persons.length === 1 ? 'person' : 'persons'} added
                                </p>
                            </div>
                            <button className="btn btn-danger" onClick={() => handleDeleteQuiz()} style={{ fontSize: 12 }}>
                                Delete Quiz
                            </button>
                        </div>

                        {/* Quiz Settings */}
                        <div className="glass-card" style={{ marginBottom: 24 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                                Quiz Settings ⚙️
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {/* Mode Toggle */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Voting Mode
                                    </label>
                                    <div style={{
                                        display: 'flex',
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: 4,
                                        borderRadius: 12,
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <button
                                            className={`btn ${quiz.settings?.votingMode !== 'all_voted' ? 'btn-primary' : ''}`}
                                            style={{ flex: 1, height: 36, fontSize: 13, border: 'none', borderRadius: 8 }}
                                            onClick={() => handleUpdateSettings(quiz.settings?.votingDuration || 15, 'countdown')}
                                        >
                                            ⏱️ Countdown
                                        </button>
                                        <button
                                            className={`btn ${quiz.settings?.votingMode === 'all_voted' ? 'btn-primary' : ''}`}
                                            style={{ flex: 1, height: 36, fontSize: 13, border: 'none', borderRadius: 8 }}
                                            onClick={() => handleUpdateSettings(quiz.settings?.votingDuration || 15, 'all_voted')}
                                        >
                                            🤝 Wait for All
                                        </button>
                                    </div>
                                </div>

                                {/* Timer Slider (Visible only in countdown mode) */}
                                {quiz.settings?.votingMode !== 'all_voted' && (
                                    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <label style={{ fontSize: 14 }}>Voting Time</label>
                                            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--pink)' }}>
                                                {quiz.settings?.votingDuration || 15}s
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="5"
                                            max="60"
                                            step="5"
                                            value={quiz.settings?.votingDuration || 15}
                                            onChange={(e) => handleUpdateSettings(parseInt(e.target.value), 'countdown')}
                                            className="slider"
                                            style={{ width: '100%', cursor: 'pointer' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                                            <span>5s</span>
                                            <span>30s</span>
                                            <span>60s</span>
                                        </div>
                                    </div>
                                )}

                                {quiz.settings?.votingMode === 'all_voted' && (
                                    <div className="animate-in" style={{ padding: '8px 12px', background: 'rgba(236, 72, 153, 0.05)', borderRadius: 8, border: '1px solid rgba(236, 72, 153, 0.1)' }}>
                                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                            Rounds will stay open until every player has submitted their vote.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Add Person Form */}
                        <div className="glass-card" style={{ marginBottom: 24 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                                Add a Person
                            </h3>
                            <input
                                className="input"
                                value={personName}
                                onChange={e => setPersonName(e.target.value)}
                                placeholder="Name (e.g., Anna)"
                                style={{ marginBottom: 16 }}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                {/* Caricature 1 Upload */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Caricature 1 (Voting)
                                    </label>
                                    <div
                                        className={`upload-zone ${caricatureUrl1 ? 'has-image' : ''}`}
                                        onClick={() => c1InputRef.current?.click()}
                                        style={{ aspectRatio: '3/4' }}
                                    >
                                        {caricatureUrl1 ? (
                                            <img src={caricatureUrl1} alt="Caricature 1" />
                                        ) : uploading === 'c1' ? (
                                            <div className="waiting-dots"><span></span><span></span><span></span></div>
                                        ) : (
                                            <>
                                                <span className="upload-icon">🎨</span>
                                                <span className="upload-text">Drop or click</span>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        ref={c1InputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUpload(file, 'c1');
                                        }}
                                    />
                                </div>

                                {/* Caricature 2 Upload */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Caricature 2 (Reveal)
                                    </label>
                                    <div
                                        className={`upload-zone ${caricatureUrl2 ? 'has-image' : ''}`}
                                        onClick={() => c2InputRef.current?.click()}
                                        style={{ aspectRatio: '3/4' }}
                                    >
                                        {caricatureUrl2 ? (
                                            <img src={caricatureUrl2} alt="Caricature 2" />
                                        ) : uploading === 'c2' ? (
                                            <div className="waiting-dots"><span></span><span></span><span></span></div>
                                        ) : (
                                            <>
                                                <span className="upload-icon">✨</span>
                                                <span className="upload-text">Drop or click</span>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        ref={c2InputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUpload(file, 'c2');
                                        }}
                                    />
                                </div>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                onClick={handleAddPerson}
                                disabled={!personName.trim() || !caricatureUrl1 || !caricatureUrl2}
                            >
                                ➕ Add Person
                            </button>
                        </div>

                        {/* Persons List */}
                        {quiz.persons.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                                    Added ({quiz.persons.length})
                                </h3>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    {quiz.persons.map((person, index) => (
                                        <div key={person.id} className="person-card">
                                            <div className="person-card-header">
                                                <span className="person-card-name">
                                                    {index + 1}. {person.name}
                                                </span>
                                                <button
                                                    className="person-card-remove"
                                                    onClick={() => handleRemovePerson(person.id)}
                                                    title="Remove"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="admin-person-preview" style={{ padding: '0 16px 16px' }}>
                                                <div className="admin-thumb-pair">
                                                    <img src={person.caricatureUrl1} alt="C1" title="Caricature 1" />
                                                    <img src={person.caricatureUrl2} alt="C2" title="Caricature 2" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ fontWeight: 600, color: 'var(--gold)' }}>{person.name}</h4>
                                                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Round {index + 1}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Publish */}
                        {quiz.persons.length >= 2 && (
                            <button
                                className="btn btn-primary btn-large"
                                style={{ width: '100%' }}
                                onClick={handlePublish}
                            >
                                🚀 Publish Quiz ({quiz.persons.length} rounds)
                            </button>
                        )}
                        {quiz.persons.length < 2 && quiz.persons.length > 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
                                Add at least 2 persons to publish
                            </p>
                        )}
                    </>
                )}

                {/* Published — Show QR + Links */}
                {quiz && quiz.status !== 'draft' && (
                    <div style={{ textAlign: 'center' }}>
                        <div className="glass-card" style={{ display: 'inline-block', marginBottom: 24, width: '100%', maxWidth: 500 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                                ✅ Quiz is Live!
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                                {quiz.persons.length} rounds • {quiz.players.length} players joined
                            </p>
                            {joinUrl && (
                                <QRCodeDisplay url={joinUrl} size={220} label="Scan to Join" />
                            )}
                            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <a href={hostUrl} target="_blank" className="btn btn-primary btn-large">
                                    🖥️ Open Host Screen
                                </a>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        if (joinUrl) {
                                            navigator.clipboard.writeText(joinUrl);
                                        }
                                    }}
                                >
                                    📋 Copy Join Link
                                </button>
                                <button className="btn btn-danger" onClick={() => handleDeleteQuiz()} style={{ marginTop: 12, fontSize: 12 }}>
                                    Delete Quiz Data
                                </button>
                            </div>
                        </div>

                        <div className="glass-card" style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Players ({quiz.players.length})</h3>
                            <div style={{ display: 'grid', gap: 8 }}>
                                {quiz.players.map(p => (
                                    <div key={p.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 14px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: 10,
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span>{p.isReady ? '✅' : '⌛'}</span>
                                            <span style={{ fontWeight: 600 }}>{p.displayName}</span>
                                        </div>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.score} pts</span>
                                    </div>
                                ))}
                                {quiz.players.length === 0 && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No players yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={
            <div className="page-container">
                <div className="waiting-dots"><span></span><span></span><span></span></div>
            </div>
        }>
            <AdminDashboard />
        </Suspense>
    );
}
