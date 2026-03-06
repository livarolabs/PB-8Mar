'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { subscribeToQuiz, startRound, advancePhase, revealName, nextRound, finishQuiz, resetQuiz } from '@/lib/db';
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
        if (!round || !['voting_words', 'voting_1', 'voting_2'].includes(round.status)) {
            setVotingEnded(false);
            return;
        }

        const isWaitForAll = quiz.settings?.votingMode === 'all_voted';
        const votesCount = round.votes ? Object.keys(round.votes).length : 0;
        const playersCount = quiz.players.length;

        if (isWaitForAll) {
            // Mode: Wait until all players have voted
            if (playersCount > 0 && votesCount >= playersCount) {
                setVotingEnded(true);
            } else {
                setVotingEnded(false);
            }
            return;
        }

        // Mode: Countdown
        const everyoneVoted = playersCount > 0 && votesCount >= playersCount;
        if (everyoneVoted) {
            setVotingEnded(true);
            return;
        }

        if (!round.votingEndsAt) {
            setVotingEnded(false);
            return;
        }

        const check = () => {
            const now = Date.now();
            // Re-check votes from the latest round object in closure (effectively same as quiz since it depends on it)
            if (round.votingEndsAt && now > round.votingEndsAt) {
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

    const handleAdvancePhase = useCallback(async () => {
        if (!quizId) return;
        setVotingEnded(false);
        try {
            await advancePhase(quizId);
        } catch (e) {
            console.error(e);
        }
    }, [quizId]);

    const handleRevealName = useCallback(async () => {
        if (!quizId) return;
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
        try {
            await revealName(quizId);
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
                    <QRCodeDisplay url={joinUrl} size={220} label="Scan to Join!" />
                )}

                <div style={{
                    width: '100%',
                    maxWidth: 800,
                    margin: '40px auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 16,
                }}>
                    {quiz.players.map(p => (
                        <div key={p.id} className="player-lobby-card animate-in" style={{
                            padding: '16px',
                            background: 'var(--bg-card)',
                            borderRadius: 16,
                            border: `2px solid ${p.isReady ? 'var(--gold)' : 'var(--border-color)'}`,
                            textAlign: 'center',
                            position: 'relative'
                        }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>{p.isReady ? '👤' : '⌛'}</div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{p.displayName}</div>
                            <div style={{
                                fontSize: 10,
                                marginTop: 4,
                                color: p.isReady ? 'var(--gold)' : 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: 1
                            }}>
                                {p.isReady ? 'Ready' : 'In Tutorial'}
                            </div>
                        </div>
                    ))}
                </div>

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

    // ── VOTING state (Words / Img1 / Img2) ───────────────────────────
    if (['voting_1', 'voting_2'].includes(currentRound.status) && currentPerson) {
        const votesCount = currentRound.votes ? Object.keys(currentRound.votes).length : 0;
        const phaseTitle = currentRound.status === 'voting_1' ? '1st Caricature — Who is this? 🧐' :
            '2nd Caricature — Last chance! ⏳';

        const phasePoints = currentRound.status === 'voting_1' ? '2 points' :
            '1 point';

        const nextButtonText = currentRound.status === 'voting_1' ? '👀 Reveal 2nd Caricature' :
            '✨ Reveal The Name!';

        const skipButtonText = currentRound.status === 'voting_1' ? '⏭️ Skip and Reveal 2nd Pic' :
            '⏭️ Skip and Reveal Name';

        const isLastVotingPhase = currentRound.status === 'voting_2';

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
                    marginBottom: 8,
                }}>
                    {phaseTitle}
                </h2>

                {currentRound.status === 'voting_1' && (
                    <div className="host-caricature">
                        <img src={currentPerson.caricatureUrl1} alt="Caricature 1" />
                    </div>
                )
                }

                {
                    currentRound.status === 'voting_2' && (
                        <>
                            <style>{`
                            @keyframes zoomReveal {
                                0% { transform: scale(0); opacity: 0; }
                                50% { transform: scale(1.12); opacity: 1; }
                                70% { transform: scale(0.97); }
                                85% { transform: scale(1.06); }
                                100% { transform: scale(1.05); }
                            }
                            @keyframes glowPulse {
                                0%, 100% { box-shadow: 0 0 20px rgba(236, 72, 153, 0.4), 0 20px 40px rgba(0,0,0,0.3); }
                                50% { box-shadow: 0 0 50px rgba(236, 72, 153, 0.8), 0 20px 60px rgba(0,0,0,0.4); }
                            }
                            @keyframes borderShimmer {
                                0% { border-color: var(--pink); }
                                50% { border-color: var(--gold); }
                                100% { border-color: var(--pink); }
                            }
                        `}</style>
                            <div className="host-caricature" style={{
                                border: '3px solid var(--pink)',
                                animation: 'zoomReveal 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, glowPulse 2s ease-in-out 0.7s infinite, borderShimmer 3s ease-in-out 0.7s infinite',
                            }}>
                                <img src={currentPerson.caricatureUrl2} alt="Caricature 2" />
                            </div>
                        </>
                    )
                }

                <div style={{ marginTop: 32 }}>
                    {quiz.settings?.votingMode === 'all_voted' ? (
                        <div style={{ textAlign: 'center' }}>
                            <div className="glass-card" style={{ display: 'inline-block', padding: '16px 32px' }}>
                                <div style={{ fontSize: 24, fontWeight: 800, color: votingEnded ? 'var(--pink)' : 'var(--gold)', marginBottom: 8 }}>
                                    {votesCount} / {quiz.players.length}
                                </div>
                                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                                    {votingEnded ? '🙌 Everyone has voted!' : 'Waiting for more votes...'}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
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
                                        {votesCount >= quiz.players.length && quiz.players.length > 0
                                            ? "🙌 Everyone has voted!"
                                            : "⏰ Time's up!"}
                                    </p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                                        {votesCount} votes received
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="host-controls">
                    <button
                        className={`btn ${votingEnded ? 'btn-primary' : 'btn-secondary'} btn-large`}
                        onClick={isLastVotingPhase ? handleRevealName : handleAdvancePhase}
                        style={{ opacity: votingEnded ? 1 : 0.8 }}
                    >
                        {votingEnded ? nextButtonText : skipButtonText}
                    </button>
                </div>
            </div >
        );
    }

    // ── REVEALED state (Full reveal) ────────────────────────────
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

                <h2 className="host-reveal-name" style={{ marginBottom: 24 }}>{currentPerson.name}</h2>

                <div className="host-reveal-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div className="host-caricature">
                            <img src={currentPerson.caricatureUrl1} alt="Caricature 1" />
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Caricature 1</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div className="host-caricature" style={{ border: '3px solid var(--pink)' }}>
                            <img src={currentPerson.caricatureUrl2} alt="Caricature 2" />
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Caricature 2</p>
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
