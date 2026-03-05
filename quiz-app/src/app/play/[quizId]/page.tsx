'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { subscribeToQuiz, joinQuiz, submitVote } from '@/lib/db';
import { Quiz, Player, Person } from '@/lib/types';
import Countdown from '@/components/Countdown';
import Leaderboard from '@/components/Leaderboard';
import { Language, translations } from '@/lib/translations';

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
    const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');

    // Translation helper
    const t = useMemo(() => {
        const lang = player?.language || selectedLanguage;
        return translations[lang];
    }, [player?.language, selectedLanguage]);

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
                    <div style={{ marginBottom: 16 }}>
                        <span style={{ fontSize: 48 }}>🌍</span>
                    </div>
                    <h1 className="player-join-title">{t.welcomeTitle}</h1>

                    <div style={{ marginBottom: 24, textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {t.chooseLanguage}
                        </p>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            {(['en', 'hu', 'ua', 'ru'] as Language[]).map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => setSelectedLanguage(lang)}
                                    className={`btn ${selectedLanguage === lang ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ padding: '6px 12px', minWidth: '45px', fontSize: 12 }}
                                >
                                    {lang.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <input
                            className="input"
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            placeholder={t.enterName + "..."}
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
                            {joining ? t.joining : t.joinButton}
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
                        {t.hi}, {player.displayName}!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {t.waitingForHost}
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

    const votesCount = currentRound?.votes ? Object.keys(currentRound.votes).length : 0;

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
                            {t.quizFinished}
                        </h2>
                    </div>

                    <div className="player-score-display" style={{ textAlign: 'center', marginBottom: 32 }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {t.finalScore}
                        </p>
                        <p className="text-gradient" style={{
                            fontFamily: 'Outfit',
                            fontSize: 64,
                            fontWeight: 900,
                            lineHeight: 1,
                        }}>
                            {player.score}
                        </p>
                    </div>

                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 15 }}>
                        {t.checkHostScreen}
                    </p>
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
                            {t.round} {quiz.currentRoundIndex + 1} {t.of} {quiz.rounds.length}
                        </p>
                        <h2 style={{
                            fontFamily: 'Outfit',
                            fontSize: 20,
                            fontWeight: 700,
                            marginTop: 4,
                        }}>
                            {t.whoIsThis}
                        </h2>
                    </div>

                    <div className="player-caricature">
                        <img src={currentPerson.caricatureUrl1} alt="Guess who?" />
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
                            <p>✅ {t.voteLocked}</p>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                                {t.waitingForReveal}
                            </p>
                        </div>
                    ) : votingEnded ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '16px',
                            background: 'rgba(236, 72, 153, 0.1)',
                            borderRadius: 14,
                            border: '1px solid var(--pink)',
                        }}>
                            <p style={{ color: 'var(--pink)', fontWeight: 700 }}>
                                {votesCount >= quiz.players.length && quiz.players.length > 0
                                    ? t.everyoneVoted
                                    : t.timesUp}
                            </p>
                        </div>
                    ) : (
                        <div className="player-options">
                            {shuffledPersonNames.map((person: Person) => (
                                <button
                                    key={person.id}
                                    className={`btn ${selectedPersonId === person.id ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => handleVote(person.id)}
                                    disabled={votedThisRound}
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
                            {t.round} {quiz.currentRoundIndex + 1} {t.of} {quiz.rounds.length}
                        </p>
                    </div>

                    <div className="player-result">
                        {didVote ? (
                            <>
                                <div className="player-result-icon">
                                    {isCorrect ? '🎉' : '😅'}
                                </div>
                                <p className="player-result-text">
                                    {isCorrect ? t.correct : t.notQuite}
                                </p>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                                    {t.itWas} <strong className="text-gradient">{currentPerson.name}</strong>
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="player-result-icon">😶</div>
                                <p className="player-result-text">{t.noVote}</p>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                                    {t.itWas} <strong className="text-gradient">{currentPerson.name}</strong>
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
                                src={currentPerson.caricatureUrl1}
                                alt="Caricature 1"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '3/4', border: '2px solid var(--pink)' }}>
                            <img
                                src={currentPerson.caricatureUrl2}
                                alt="Caricature 2"
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
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.yourScore}</p>
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
