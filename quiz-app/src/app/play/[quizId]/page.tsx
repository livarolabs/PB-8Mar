'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { subscribeToQuiz, joinQuiz, submitVote } from '@/lib/db';
import { Quiz, Player, Person } from '@/lib/types';
import Countdown from '@/components/Countdown';
import Leaderboard from '@/components/Leaderboard';

export default function PlayerPage() {
    const params = useParams();
    const quizId = params.quizId as string;

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [player, setPlayer] = useState<Player | null>(null);
    const [nickname, setNickname] = useState('');
    const [joining, setJoining] = useState(false);
    const [votedThisRound, setVotedThisRound] = useState(false);
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [votingEnded, setVotingEnded] = useState(false);

    // Shuffle person names for voting (random for each player, but consistent for the round)
    const shuffledPersonNames = useMemo(() => {
        if (!quiz || !quiz.persons) return [];
        return [...quiz.persons].sort(() => Math.random() - 0.5);
    }, [quiz?.id, quiz?.currentRoundIndex, quiz?.persons]);

    // Restore player from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`player_${quizId}`);
        if (saved) {
            try {
                setPlayer(JSON.parse(saved));
            } catch { }
        }
    }, [quizId]);

    // Subscribe to Firebase RTDB for quiz state
    useEffect(() => {
        if (!quizId) return;

        const unsubscribe = subscribeToQuiz(quizId, (q: Quiz | null) => {
            setQuiz(prev => {
                // Detect round change → reset vote state
                if (prev && q) {
                    if (
                        prev.currentRoundIndex !== q.currentRoundIndex ||
                        (prev.rounds[prev.currentRoundIndex]?.status === 'revealed' &&
                            q.rounds[q.currentRoundIndex]?.status === 'pending')
                    ) {
                        setVotedThisRound(false);
                        setSelectedPersonId(null);
                        setVotingEnded(false);
                    }
                }
                return q;
            });
        });

        return () => unsubscribe();
    }, [quizId]);

    // Check if current round voting has ended
    useEffect(() => {
        if (!quiz) return;
        const round = quiz.rounds[quiz.currentRoundIndex];
        if (!round || round.status !== 'voting' || !round.votingEndsAt) {
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

    // Update player score from quiz state
    useEffect(() => {
        if (!quiz || !player) return;
        const updatedPlayer = quiz.players.find(p => p.id === player.id);
        if (updatedPlayer && updatedPlayer.score !== player.score) {
            const newPlayer = { ...player, score: updatedPlayer.score };
            setPlayer(newPlayer);
            localStorage.setItem(`player_${quizId}`, JSON.stringify(newPlayer));
        }
    }, [quiz, player, quizId]);

    const handleJoin = useCallback(async () => {
        if (!nickname.trim()) return;
        setJoining(true);
        try {
            const newPlayer = await joinQuiz(nickname.trim(), quizId);
            setPlayer(newPlayer);
            localStorage.setItem(`player_${quizId}`, JSON.stringify(newPlayer));
        } catch (e) {
            console.error("Failed to join:", e);
        } finally {
            setJoining(false);
        }
    }, [nickname, quizId]);

    const handleVote = useCallback(async (personId: string) => {
        if (!player || votedThisRound || votingEnded) return;
        setSelectedPersonId(personId);
        setVotedThisRound(true);
        try {
            await submitVote(quizId, player.id, personId);
        } catch (e) {
            console.error("Failed to vote:", e);
            setVotedThisRound(false);
            setSelectedPersonId(null);
        }
    }, [quizId, player, votedThisRound, votingEnded]);

    // ── JOIN screen ─────────────────────────────────────────────
    if (!player) {
        return (
            <div className="player-screen">
                <div className="player-join animate-in">
                    <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 48 }}>💐</span>
                    </div>
                    <h1 className="player-join-title">Guess Who?</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 280 }}>
                        Enter your name to join the quiz!
                    </p>
                    <div style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <input
                            className="input"
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            placeholder="Your name..."
                            onKeyDown={e => e.key === 'Enter' && handleJoin()}
                            autoFocus
                            style={{ textAlign: 'center', fontSize: 18, padding: '16px' }}
                        />
                        <button
                            className="btn btn-primary btn-large"
                            style={{ width: '100%' }}
                            onClick={handleJoin}
                            disabled={!nickname.trim() || joining}
                        >
                            {joining ? 'Joining...' : '🎉 Join Quiz'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Not live yet ────────────────────────────────────────────
    if (!quiz || quiz.status === 'draft') {
        return (
            <div className="player-screen">
                <div className="waiting-state">
                    <span style={{ fontSize: 48 }}>⏳</span>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 700 }}>
                        Hi, {player.displayName}!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Waiting for the quiz to start...
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

    // ── FINISHED state ──────────────────────────────────────────
    if (quiz.status === 'finished') {
        return (
            <div className="player-screen">
                <div className="animate-in" style={{ paddingTop: 20 }}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <span style={{ fontSize: 48 }}>🎉</span>
                        <h2 style={{
                            fontFamily: 'Outfit',
                            fontSize: 24,
                            fontWeight: 800,
                            marginTop: 8,
                        }}>
                            <span className="text-gradient">Quiz Complete!</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                            Your final score: <strong className="text-gradient">{player.score}</strong> points
                        </p>
                    </div>
                    <Leaderboard
                        players={quiz.players}
                        currentPlayerId={player.id}
                        showAll
                    />
                </div>
            </div>
        );
    }

    // ── WAITING for round ───────────────────────────────────────
    if (!currentRound || currentRound.status === 'pending') {
        return (
            <div className="player-screen">
                <div className="waiting-state">
                    <span style={{ fontSize: 48 }}>🎯</span>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: 20, fontWeight: 700 }}>
                        Round {quiz.currentRoundIndex + 1} of {quiz.rounds.length}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Waiting for the host to start...
                    </p>
                    <div style={{
                        padding: '12px 20px',
                        background: 'var(--bg-card)',
                        borderRadius: 12,
                        border: '1px solid var(--border-color)',
                        marginTop: 8,
                    }}>
                        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Your score: </span>
                        <span className="text-gradient" style={{ fontWeight: 800, fontSize: 18 }}>
                            {player.score}
                        </span>
                    </div>
                    <div className="waiting-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        );
    }

    // ── VOTING state ────────────────────────────────────────────
    if (currentRound.status === 'voting' && currentPerson) {
        return (
            <div className="player-screen">
                <div className="animate-in">
                    <div className="player-header">
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                            Round {quiz.currentRoundIndex + 1} of {quiz.rounds.length}
                        </p>
                        <h2 style={{
                            fontFamily: 'Outfit',
                            fontSize: 20,
                            fontWeight: 700,
                            marginTop: 4,
                        }}>
                            Who is this? 🤔
                        </h2>
                    </div>

                    <div className="player-caricature">
                        <img src={currentPerson.caricatureUrl} alt="Guess who?" />
                    </div>

                    {!votedThisRound && !votingEnded && currentRound.votingEndsAt && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                            <div style={{ transform: 'scale(0.6)' }}>
                                <Countdown endsAt={currentRound.votingEndsAt} onComplete={() => setVotingEnded(true)} />
                            </div>
                        </div>
                    )}

                    {votedThisRound ? (
                        <div className="vote-locked animate-in">
                            <p>✅ Vote locked!</p>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                                Waiting for reveal...
                            </p>
                        </div>
                    ) : votingEnded ? (
                        <div style={{
                            textAlign: 'center',
                            padding: 24,
                            background: 'rgba(251, 191, 36, 0.1)',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            borderRadius: 16,
                            color: 'var(--gold)',
                            fontWeight: 600,
                        }}>
                            ⏰ Time&apos;s up! You didn&apos;t vote this round.
                        </div>
                    ) : (
                        <div className="vote-grid">
                            {shuffledPersonNames.map((person: Person) => (
                                <button
                                    key={person.id}
                                    className={`btn-vote ${selectedPersonId === person.id ? 'selected' : ''}`}
                                    onClick={() => handleVote(person.id)}
                                >
                                    {person.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── REVEALED state ──────────────────────────────────────────
    if (currentRound.status === 'revealed' && currentPerson) {
        // Find player's vote
        const myVoteId = Object.keys(currentRound.votes || {}).find(
            key => currentRound.votes?.[key]?.playerId === player.id
        );
        const myVote = myVoteId && currentRound.votes ? currentRound.votes[myVoteId] : null;

        const isCorrect = myVote?.guessedPersonId === currentPerson.id;
        const didVote = !!myVote;

        return (
            <div className="player-screen">
                <div className="animate-in">
                    <div className="player-header">
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                            Round {quiz.currentRoundIndex + 1} of {quiz.rounds.length}
                        </p>
                    </div>

                    <div className="player-result">
                        {didVote ? (
                            <>
                                <div className="player-result-icon">
                                    {isCorrect ? '🎉' : '😅'}
                                </div>
                                <p className="player-result-text">
                                    {isCorrect ? 'Correct!' : 'Not quite!'}
                                </p>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                                    It was <strong className="text-gradient">{currentPerson.name}</strong>
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="player-result-icon">😶</div>
                                <p className="player-result-text">No vote</p>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                                    It was <strong className="text-gradient">{currentPerson.name}</strong>
                                </p>
                            </>
                        )}
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                        marginBottom: 20,
                    }}>
                        <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '3/4' }}>
                            <img
                                src={currentPerson.caricatureUrl}
                                alt="Caricature"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '3/4', border: '2px solid var(--pink)' }}>
                            <img
                                src={currentPerson.realPhotoUrl}
                                alt="Real"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                    </div>

                    <div className="player-score-display" style={{
                        textAlign: 'center',
                        padding: '16px',
                        background: 'var(--bg-card)',
                        borderRadius: 14,
                        border: '1px solid var(--border-color)',
                    }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Your Score</p>
                        <p className="text-gradient" style={{
                            fontFamily: 'Outfit',
                            fontSize: 32,
                            fontWeight: 900,
                        }}>
                            {player.score}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Fallback
    return (
        <div className="player-screen">
            <div className="waiting-state">
                <div className="waiting-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        </div>
    );
}
