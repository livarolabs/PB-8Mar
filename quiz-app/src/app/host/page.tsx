'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { subscribeToQuiz, startRound, revealRound, nextRound, finishQuiz, resetQuiz } from '@/lib/db';
import { Quiz } from '@/lib/types';
import Countdown from '@/components/Countdown';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import Leaderboard from '@/components/Leaderboard';

function Confetti() {
    const pieces = useMemo(() => {
        const colors = ['#ec4899', '#8b5cf6', '#f472b6', '#a78bfa', '#fbbf24', '#34d399', '#f87171'];
        return Array.from({ length: 60 }, (_, i) => ({
            id: i,
            color: colors[i % colors.length],
            left: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 2 + Math.random() * 2,
            size: 6 + Math.random() * 8,
            rotation: Math.random() * 360,
        }));
    }, []);

    return (
        <div className="confetti-container">
            {pieces.map(p => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: `${p.left}%`,
                        width: p.size,
                        height: p.size * 0.6,
                        backgroundColor: p.color,
                        borderRadius: '2px',
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        transform: `rotate(${p.rotation}deg)`,
                    }}
                />
            ))}
        </div>
    );
}

function HostDashboard() {
    const searchParams = useSearchParams();
    const quizId = searchParams.get('quizId');

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [baseUrl, setBaseUrl] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const [votingEnded, setVotingEnded] = useState(false);

    useEffect(() => {
        setBaseUrl(window.location.origin);
        if (!quizId) return;

        const unsubscribe = subscribeToQuiz(quizId, (q) => {
            setQuiz(q);
        });
        return () => unsubscribe();
    }, [quizId]);

    // Check if voting has ended for current round
    useEffect(() => {
        if (!quiz) return;
        const round = quiz.rounds[quiz.currentRoundIndex];
        if (!round || round.status !== 'voting' || !round.votingEndsAt) {
            setVotingEnded(false);
            return;
        }

        const check = () => {
            if (round.votingEndsAt && Date.now() > round.votingEndsAt) {
                setVotingEnded(true);
            }
        };
        check();
        const interval = setInterval(check, 200);
        return () => clearInterval(interval);
    }, [quiz]);

    const handleStartRound = useCallback(async () => {
        if (!quizId) return;
        setVotingEnded(false);
        try {
            await startRound(quizId);
        } catch (e) {
            console.error(e);
        }
    }, [quizId]);

    const handleReveal = useCallback(async () => {
        if (!quizId) return;
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
        try {
            await revealRound(quizId);
        } catch (e) {
            console.error(e);
        }
    }, [quizId]);

    const handleNext = useCallback(async () => {
        if (!quizId) return;
        try {
            await nextRound(quizId);
        } catch (e) {
            console.error(e);
        }
    }, [quizId]);

    const handleFinish = useCallback(async () => {
        if (!quizId) return;
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 6000);
        try {
            await finishQuiz(quizId);
        } catch (e) {
            console.error(e);
        }
    }, [quizId]);

    const handleReset = useCallback(async () => {
        if (!quizId) return;
        if (!confirm('Reset all rounds and scores?')) return;
        try {
            await resetQuiz(quizId);
        } catch (e) {
            console.error(e);
        }
    }, [quizId]);

    if (!quizId) {
        return (
            <div className="host-screen">
                <div className="waiting-state">
                    <h1 style={{ fontFamily: 'Outfit', fontSize: 36, fontWeight: 800 }}>
                        <span className="text-gradient">Error</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        No Quiz ID provided. Please open the host screen from the admin panel.
                    </p>
                </div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="host-screen">
                <div className="waiting-state">
                    <h1 style={{ fontFamily: 'Outfit', fontSize: 36, fontWeight: 800 }}>
                        <span className="text-gradient">Loading...</span>
                    </h1>
                    <div className="waiting-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        );
    }

    if (quiz.status === 'draft') {
        return (
            <div className="host-screen">
                <div className="waiting-state">
                    <h1 style={{ fontFamily: 'Outfit', fontSize: 36, fontWeight: 800 }}>
                        <span className="text-gradient">{quiz.title}</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Quiz is still being set up. Waiting for publish...
                    </p>
                    <div className="waiting-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        );
    }

    const currentRound = quiz.rounds[quiz.currentRoundIndex];
    const currentPerson = currentRound
        ? quiz.persons.find(p => p.id === currentRound.personId)
        : null;
    const isLastRound = quiz.currentRoundIndex >= quiz.rounds.length - 1;
    const joinUrl = baseUrl ? `${baseUrl}/play/${quiz.id}` : '';

    // ── FINISHED state ──────────────────────────────────────────
    if (quiz.status === 'finished') {
        return (
            <div className="host-screen">
                {showConfetti && <Confetti />}
                <h1 style={{
                    fontFamily: 'Outfit',
                    fontSize: 42,
                    fontWeight: 900,
                    textAlign: 'center',
                    marginBottom: 32,
                }}>
                    🎉 <span className="text-gradient">Final Results</span> 🎉
                </h1>
                <Leaderboard players={quiz.players} showAll />
                <div className="host-controls">
                    <button className="btn btn-secondary" onClick={handleReset}>
                        🔄 Reset Quiz
                    </button>
                </div>
            </div>
        );
    }

    // ── WAITING for first round ─────────────────────────────────
    if (!currentRound || (currentRound.status === 'pending' && quiz.currentRoundIndex === 0)) {
        return (
            <div className="host-screen">
                <h1 style={{
                    fontFamily: 'Outfit',
                    fontSize: 48,
                    fontWeight: 900,
                    textAlign: 'center',
                    marginBottom: 8,
                }}>
                    💐 <span className="text-gradient">{quiz.title}</span>
                </h1>
                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: 20,
                    textAlign: 'center',
                    marginBottom: 40,
                }}>
                    {quiz.rounds.length} rounds • {quiz.players.length} player{quiz.players.length !== 1 ? 's' : ''} joined
                </p>

                {joinUrl && (
                    <QRCodeDisplay url={joinUrl} size={250} label="Scan to Join!" />
                )}

                <div className="host-controls">
                    <button
                        className="btn btn-primary btn-large"
                        onClick={handleStartRound}
                        disabled={quiz.players.length === 0}
                    >
                        🎬 Start First Round
                    </button>
                </div>

                <div className="host-info-bar">
                    <div className="host-badge">
                        👥 {quiz.players.length} players
                    </div>
                </div>
            </div>
        );
    }

    // ── PENDING state (between rounds) ──────────────────────────
    if (currentRound.status === 'pending') {
        return (
            <div className="host-screen">
                <h2 style={{
                    fontFamily: 'Outfit',
                    fontSize: 28,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: 16,
                }}>
                    Round {quiz.currentRoundIndex + 1} of {quiz.rounds.length}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 18, marginBottom: 32 }}>
                    Ready for the next caricature?
                </p>
                <div className="host-controls">
                    <button className="btn btn-primary btn-large" onClick={handleStartRound}>
                        ▶️ Start Round
                    </button>
                </div>
                <div className="host-info-bar">
                    <div className="host-badge">
                        👥 {quiz.players.length} players
                    </div>
                    <div className="host-badge">
                        🎯 Round {quiz.currentRoundIndex + 1}/{quiz.rounds.length}
                    </div>
                </div>
            </div>
        );
    }

    // ── VOTING state ────────────────────────────────────────────
    if (currentRound.status === 'voting' && currentPerson) {
        const votesCount = currentRound.votes ? Object.keys(currentRound.votes).length : 0;

        return (
            <div className="host-screen">
                {showConfetti && <Confetti />}

                <div className="host-info-bar">
                    <div className="host-badge">
                        👥 {quiz.players.length} players
                    </div>
                    <div className="host-badge">
                        🎯 Round {quiz.currentRoundIndex + 1}/{quiz.rounds.length}
                    </div>
                    <div className="host-badge">
                        ✅ {votesCount} votes
                    </div>
                </div>

                <h2 style={{
                    fontFamily: 'Outfit',
                    fontSize: 28,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: 24,
                }}>
                    Who is this? 🤔
                </h2>

                <div className="host-caricature">
                    <img src={currentPerson.caricatureUrl} alt="Caricature" />
                </div>

                <div style={{ marginTop: 32 }}>
                    {!votingEnded && currentRound.votingEndsAt ? (
                        <input
                            type="hidden" // Just to trigger re-render
                            value={votingEnded ? '1' : '0'}
                        />
                    ) : null}
                    {!votingEnded && currentRound.votingEndsAt && (
                        <Countdown
                            endsAt={currentRound.votingEndsAt}
                            onComplete={() => setVotingEnded(true)}
                        />
                    )}
                    {votingEnded && (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{
                                fontSize: 20,
                                fontWeight: 700,
                                color: 'var(--gold)',
                                marginBottom: 8,
                            }}>
                                ⏰ Time&apos;s up! {votesCount} votes received
                            </p>
                        </div>
                    )}
                </div>

                <div className="host-controls">
                    {votingEnded && (
                        <button className="btn btn-primary btn-large" onClick={handleReveal}>
                            ✨ Reveal Answer
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── REVEALED state ──────────────────────────────────────────
    if (currentRound.status === 'revealed' && currentPerson) {
        const votesArray = currentRound.votes ? Object.values(currentRound.votes) : [];
        const correctVotes = votesArray.filter((v: any) => v.guessedPersonId === currentPerson.id).length;
        const totalVotes = votesArray.length;
        const percentage = totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0;

        return (
            <div className="host-screen">
                {showConfetti && <Confetti />}

                <div className="host-info-bar">
                    <div className="host-badge">
                        🎯 Round {quiz.currentRoundIndex + 1}/{quiz.rounds.length}
                    </div>
                </div>

                <div className="host-reveal-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div className="host-caricature">
                            <img src={currentPerson.caricatureUrl} alt="Caricature" />
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Caricature</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div className="host-real-photo">
                            <img src={currentPerson.realPhotoUrl} alt="Real" />
                        </div>
                        <h2 className="host-reveal-name">{currentPerson.name}</h2>
                    </div>
                </div>

                <div className="host-stats">
                    <p>
                        {correctVotes} of {totalVotes} guessed correctly ({percentage}%)
                    </p>
                </div>

                <div className="host-controls">
                    {isLastRound ? (
                        <button className="btn btn-primary btn-large" onClick={handleFinish}>
                            🏆 Show Final Results
                        </button>
                    ) : (
                        <button className="btn btn-primary btn-large" onClick={handleNext}>
                            ➡️ Next Round
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={handleReset}>
                        🔄 Reset
                    </button>
                </div>
            </div>
        );
    }

    // Fallback
    return (
        <div className="host-screen">
            <div className="waiting-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    );
}

export default function HostPage() {
    return (
        <Suspense fallback={
            <div className="host-screen">
                <div className="waiting-state">
                    <div className="waiting-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        }>
            <HostDashboard />
        </Suspense>
    );
}
