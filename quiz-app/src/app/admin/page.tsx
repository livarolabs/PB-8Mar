'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { subscribeToQuiz, createQuiz, addPerson, removePerson, publishQuiz, deleteQuiz, uploadImage } from '@/lib/db';
import { Quiz } from '@/lib/types';
import QRCodeDisplay from '@/components/QRCodeDisplay';

export default function AdminPage() {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [baseUrl, setBaseUrl] = useState('');
    const [quizTitle, setQuizTitle] = useState('Women\'s Day 2026 💐');
    const [personName, setPersonName] = useState('');
    const [caricatureUrl, setCaricatureUrl] = useState('');
    const [realPhotoUrl, setRealPhotoUrl] = useState('');
    const [uploading, setUploading] = useState<'caricature' | 'real' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const caricatureInputRef = useRef<HTMLInputElement>(null);
    const realPhotoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setBaseUrl(window.location.origin);
        const unsubscribe = subscribeToQuiz((q) => {
            setQuiz(q);
        });
        return () => unsubscribe();
    }, []);

    const showError = (msg: string) => {
        setError(msg);
        setTimeout(() => setError(null), 4000);
    };

    const handleCreateQuiz = useCallback(async () => {
        if (!quizTitle.trim()) return;
        try {
            await createQuiz(quizTitle.trim());
        } catch (err: any) {
            showError(`Failed to create quiz: ${err.message}`);
        }
    }, [quizTitle]);

    const handleUpload = useCallback(async (file: File, type: 'caricature' | 'real') => {
        setUploading(type);
        try {
            const url = await uploadImage(file);
            if (type === 'caricature') {
                setCaricatureUrl(url);
            } else {
                setRealPhotoUrl(url);
            }
        } catch (err: any) {
            showError(`Upload failed: ${err.message}`);
        } finally {
            setUploading(null);
        }
    }, []);

    const handleAddPerson = useCallback(async () => {
        if (!personName.trim() || !caricatureUrl || !realPhotoUrl) return;
        try {
            await addPerson(personName.trim(), caricatureUrl, realPhotoUrl);
            setPersonName('');
            setCaricatureUrl('');
            setRealPhotoUrl('');
            if (caricatureInputRef.current) caricatureInputRef.current.value = '';
            if (realPhotoInputRef.current) realPhotoInputRef.current.value = '';
        } catch (err: any) {
            showError(`Failed to add person: ${err.message}`);
        }
    }, [personName, caricatureUrl, realPhotoUrl]);

    const handleRemovePerson = useCallback(async (personId: string) => {
        try {
            await removePerson(personId);
        } catch (err: any) {
            showError(`Failed to remove person: ${err.message}`);
        }
    }, []);

    const handlePublish = useCallback(async () => {
        try {
            await publishQuiz();
        } catch (err: any) {
            showError(`Failed to publish: ${err.message}`);
        }
    }, []);

    const handleDeleteQuiz = useCallback(async () => {
        if (!confirm('Delete this quiz and start over?')) return;
        try {
            await deleteQuiz();
        } catch (err: any) {
            showError(`Failed to delete quiz: ${err.message}`);
        }
    }, []);

    const joinUrl = quiz && baseUrl
        ? `${baseUrl}/play/${quiz.id}`
        : '';

    const hostUrl = baseUrl
        ? `${baseUrl}/host`
        : '';

    return (
        <div className="page-container">
            <div className="animate-in">
                <h1 className="page-title">👑 Quiz Admin</h1>
                <p className="page-subtitle">Set up your Women&apos;s Day &quot;Guess Who&quot; quiz (Firebase Sync)</p>

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

                {/* Step 1: Create Quiz */}
                {!quiz && (
                    <div className="glass-card" style={{ maxWidth: 500 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                            Step 1: Create a Quiz
                        </h2>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <input
                                className="input"
                                value={quizTitle}
                                onChange={e => setQuizTitle(e.target.value)}
                                placeholder="Quiz title..."
                                onKeyDown={e => e.key === 'Enter' && handleCreateQuiz()}
                            />
                            <button className="btn btn-primary" onClick={handleCreateQuiz}>
                                Create
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Add Persons */}
                {quiz && quiz.status === 'draft' && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                                    &quot;{quiz.title}&quot;
                                </h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                                    {quiz.persons.length} {quiz.persons.length === 1 ? 'person' : 'persons'} added
                                </p>
                            </div>
                            <button className="btn btn-danger" onClick={handleDeleteQuiz} style={{ fontSize: 12 }}>
                                Delete Quiz
                            </button>
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
                                {/* Caricature Upload */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Caricature
                                    </label>
                                    <div
                                        className={`upload-zone ${caricatureUrl ? 'has-image' : ''}`}
                                        onClick={() => caricatureInputRef.current?.click()}
                                        style={{ aspectRatio: '3/4' }}
                                    >
                                        {caricatureUrl ? (
                                            <img src={caricatureUrl} alt="Caricature" />
                                        ) : uploading === 'caricature' ? (
                                            <div className="waiting-dots"><span></span><span></span><span></span></div>
                                        ) : (
                                            <>
                                                <span className="upload-icon">🎨</span>
                                                <span className="upload-text">Drop or click</span>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        ref={caricatureInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUpload(file, 'caricature');
                                        }}
                                    />
                                </div>

                                {/* Real Photo Upload */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Real Photo
                                    </label>
                                    <div
                                        className={`upload-zone ${realPhotoUrl ? 'has-image' : ''}`}
                                        onClick={() => realPhotoInputRef.current?.click()}
                                        style={{ aspectRatio: '3/4' }}
                                    >
                                        {realPhotoUrl ? (
                                            <img src={realPhotoUrl} alt="Real Photo" />
                                        ) : uploading === 'real' ? (
                                            <div className="waiting-dots"><span></span><span></span><span></span></div>
                                        ) : (
                                            <>
                                                <span className="upload-icon">📷</span>
                                                <span className="upload-text">Drop or click</span>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        ref={realPhotoInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUpload(file, 'real');
                                        }}
                                    />
                                </div>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                onClick={handleAddPerson}
                                disabled={!personName.trim() || !caricatureUrl || !realPhotoUrl}
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
                                            <div className="person-card-images">
                                                <div>
                                                    <div className="person-card-image">
                                                        <img src={person.caricatureUrl} alt="Caricature" />
                                                    </div>
                                                    <p className="person-card-image-label">Caricature</p>
                                                </div>
                                                <div>
                                                    <div className="person-card-image">
                                                        <img src={person.realPhotoUrl} alt="Real" />
                                                    </div>
                                                    <p className="person-card-image-label">Real Photo</p>
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

                {/* Step 3: Published — Show QR + Links */}
                {quiz && quiz.status !== 'draft' && (
                    <div style={{ textAlign: 'center' }}>
                        <div className="glass-card" style={{ display: 'inline-block', marginBottom: 24 }}>
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
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
