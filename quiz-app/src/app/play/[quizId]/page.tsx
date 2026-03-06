'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { subscribeToQuiz, joinQuiz, submitVote, setPlayerReady, setTutorialFinished } from '@/lib/db';
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
    const [showTutorial, setShowTutorial] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [demoScore, setDemoScore] = useState(0);
    const [demoVoted, setDemoVoted] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);

    // Translation helper
    const t = useMemo(() => {
        const lang = player?.language || selectedLanguage;
        return translations[lang];
    }, [player?.language, selectedLanguage]);

    // Shuffle person names for voting (random for each player, but consistent for the round)
    const [shuffledPersonNames, setShuffledPersonNames] = useState<Person[]>([]);

    useEffect(() => {
        if (!quiz || !quiz.persons) return;
        setShuffledPersonNames([...quiz.persons].sort(() => Math.random() - 0.5));
    }, [quiz?.id, quiz?.currentRoundIndex]);

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
                if (prev && q) {
                    const prevRound = prev.rounds[prev.currentRoundIndex];
                    const newRound = q.rounds[q.currentRoundIndex];
                    // Detect round change → reset vote state
                    if (
                        prev.currentRoundIndex !== q.currentRoundIndex ||
                        (prevRound?.status === 'revealed' && newRound?.status === 'pending')
                    ) {
                        setVotedThisRound(false);
                        setSelectedPersonId(null);
                        setVotingEnded(false);
                    } else if (prevRound?.status !== newRound?.status) {
                        // Reset timer overlay for phase transitions within the same round
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
        if (!round || !['voting_words', 'voting_1', 'voting_2'].includes(round.status) || !round.votingEndsAt) {
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

    // Hydrate vote state from backend
    useEffect(() => {
        if (!quiz || !player) return;
        const currentRound = quiz.rounds[quiz.currentRoundIndex];
        if (!currentRound) return;

        const myVoteId = Object.keys(currentRound.votes || {}).find(
            key => currentRound.votes?.[key]?.playerId === player.id
        );
        const myVote = myVoteId && currentRound.votes ? currentRound.votes[myVoteId] : null;

        if (myVote && !votedThisRound) {
            setVotedThisRound(true);
            setSelectedPersonId(myVote.guessedPersonId);
        }
    }, [quiz, player, votedThisRound]);

    const handleJoin = useCallback(async () => {
        if (!nickname.trim()) return;
        setJoining(true);
        setJoinError(null);
        try {
            // Timeout wrapper — don't let the user hang forever
            const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Connection timed out. Please check your internet and try again.')), 10000)
            );
            const newPlayer = await Promise.race([
                joinQuiz(nickname.trim(), quizId, selectedLanguage),
                timeoutPromise,
            ]);
            if (newPlayer) {
                setPlayer(newPlayer);
                localStorage.setItem(`player_${quizId}`, JSON.stringify(newPlayer));
                if (!newPlayer.isTutorialFinished) {
                    setShowTutorial(true);
                }
            } else {
                setJoinError('Quiz not found. Please check the link and try again.');
            }
        } catch (e: any) {
            console.error('Failed to join:', e);
            setJoinError(e?.message || 'Failed to join. Please try again.');
        } finally {
            setJoining(false);
        }
    }, [nickname, quizId, selectedLanguage]);

    const handleVote = useCallback(async (personId: string) => {
        if (!player || votedThisRound) return;
        // Block votes if the current phase's timer has ended
        const currentRd = quiz?.rounds[quiz.currentRoundIndex];
        if (currentRd && ['voting_words', 'voting_1', 'voting_2'].includes(currentRd.status) && votingEnded) return;

        setSelectedPersonId(personId);
        setVotedThisRound(true);
        try {
            await submitVote(quizId, player.id, personId);
        } catch (e) {
            console.error("Failed to vote:", e);
            setVotedThisRound(false);
            setSelectedPersonId(null);
        }
    }, [quizId, player, votedThisRound, votingEnded, quiz]);

    const handleTutorialNext = () => {
        setTutorialStep(prev => prev + 1);
    };

    const handleDemoVote = (isCorrect: boolean) => {
        if (demoVoted) return;
        setDemoVoted(true);
        if (isCorrect) setDemoScore(2);
        setTimeout(() => setTutorialStep(8), 1500);
    };

    const handleReady = async () => {
        if (!player) return;
        try {
            await setTutorialFinished(quizId, player.id);
            await setPlayerReady(quizId, player.id, true);
            setPlayer(prev => prev ? { ...prev, isTutorialFinished: true, isReady: true } : null);
            setShowTutorial(false);
        } catch (e) {
            console.error(e);
        }
    };

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
                        {joinError && (
                            <p style={{
                                color: 'var(--pink)',
                                fontSize: 13,
                                textAlign: 'center',
                                marginTop: 8,
                                padding: '8px 12px',
                                background: 'rgba(236, 72, 153, 0.1)',
                                borderRadius: 8,
                            }}>
                                ⚠️ {joinError}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── TUTORIAL screen ─────────────────────────────────────────
    if (showTutorial) {
        return (
            <div className="player-screen">
                <div className="animate-in" style={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
                    <h2 className="text-gradient" style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
                        {t.tutorialTitle}
                    </h2>

                    <div className="glass-card" style={{ padding: 24, minHeight: 350, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {tutorialStep === 0 && (
                            <div className="animate-in">
                                <span style={{ fontSize: 64 }}>🌺</span>
                                <p style={{ fontSize: 18, marginTop: 24, fontWeight: 600 }}>{t.tutorialStep1}</p>
                            </div>
                        )}
                        {tutorialStep === 1 && (
                            <div className="animate-in">
                                <span style={{ fontSize: 64 }}>🕵️‍♂️</span>
                                <p style={{ fontSize: 18, marginTop: 24, fontWeight: 600 }}>{t.tutorialStep2}</p>
                            </div>
                        )}
                        {tutorialStep === 2 && (
                            <div className="animate-in">
                                <span style={{ fontSize: 64 }}>🤖</span>
                                <p style={{ fontSize: 18, marginTop: 24, fontWeight: 600 }}>{t.tutorialStep3}</p>
                            </div>
                        )}
                        {tutorialStep === 3 && (
                            <div className="animate-in">
                                <span style={{ fontSize: 64 }}>🎨</span>
                                <p style={{ fontSize: 18, marginTop: 24, fontWeight: 600 }}>{t.tutorialStep4}</p>
                            </div>
                        )}
                        {tutorialStep === 4 && (
                            <div className="animate-in">
                                <span style={{ fontSize: 64 }}>✨</span>
                                <p style={{ fontSize: 18, marginTop: 24, fontWeight: 600 }}>{t.tutorialStep5}</p>
                            </div>
                        )}
                        {tutorialStep === 5 && (
                            <div className="animate-in">
                                <span style={{ fontSize: 64 }}>🏆</span>
                                <p style={{ fontSize: 18, marginTop: 24, fontWeight: 600 }}>{t.tutorialStep6}</p>
                            </div>
                        )}
                        {tutorialStep === 6 && (
                            <div className="animate-in">
                                <span style={{ fontSize: 64 }}>🎮</span>
                                <p style={{ fontSize: 18, marginTop: 24, fontWeight: 600 }}>{t.tutorialStep7}</p>
                            </div>
                        )}
                        {tutorialStep === 7 && (
                            <div className="animate-in">
                                <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--text-secondary)' }}>{t.tutorialStep7}</p>
                                <div className="player-caricature" style={{ marginBottom: 16, maxWidth: 140, margin: '0 auto 16px' }}>
                                    <img src="/Kostya.png" alt="Demo" style={{ borderRadius: 12, width: '100%', height: 'auto', objectFit: 'cover' }} />
                                </div>
                                <div className="player-options" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    <button className={`btn ${demoVoted ? 'btn-secondary' : 'btn-primary'}`} style={{ fontSize: 12 }} onClick={() => handleDemoVote(true)}>{t.tutorialDemoOptionA}</button>
                                    <button className={`btn ${demoVoted ? 'btn-secondary' : 'btn-primary'}`} style={{ fontSize: 12 }} onClick={() => handleDemoVote(false)}>{t.tutorialDemoOptionB}</button>
                                </div>
                                {demoVoted && (
                                    <p className="animate-in" style={{ marginTop: 12, color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>
                                        {demoScore > 0 ? t.tutorialDemoCorrect : t.tutorialDemoWrong}
                                    </p>
                                )}
                            </div>
                        )}
                        {tutorialStep === 8 && (
                            <div className="animate-in">
                                <span style={{ fontSize: 64 }}>🚀</span>
                                <h3 style={{ fontSize: 22, marginTop: 20, fontWeight: 800 }}>{t.tutorialComplete}</h3>
                                <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>{t.tutorialCompleteDesc}</p>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 32 }}>
                        {tutorialStep < 8 ? (
                            tutorialStep !== 7 && (
                                <button className="btn btn-primary btn-large" style={{ width: '100%' }} onClick={handleTutorialNext}>
                                    {t.tutorialNext} →
                                </button>
                            )
                        ) : (
                            <button className="btn btn-primary btn-large" style={{ width: '100%', background: 'linear-gradient(135deg, var(--gold), var(--pink))' }} onClick={handleReady}>
                                {t.imReady}
                            </button>
                        )}
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
                        {t.round} {quiz.currentRoundIndex + 1} {t.of} {quiz.rounds.length}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {t.waitingForHostToStart}
                    </p>
                    <div style={{
                        padding: '12px 20px',
                        background: 'var(--bg-card)',
                        borderRadius: 12,
                        border: '1px solid var(--border-color)',
                        marginTop: 8,
                    }}>
                        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{t.yourScore}: </span>
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

    // ── VOTING state (Words / Img1 / Img2) ───────────────────────────
    if (['voting_1', 'voting_2'].includes(currentRound.status) && currentPerson) {
        const pointsText = currentRound.status === 'voting_1' ? t.votePoints2 :
            t.votePoints1;

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

                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                        <span className="host-badge" style={{ background: 'var(--gold)', color: '#000', fontSize: 11 }}>
                            {pointsText}
                        </span>
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
                        <div style={{
                            maxHeight: '35vh',
                            overflowY: 'auto',
                            padding: '4px 0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            WebkitOverflowScrolling: 'touch',
                        }}>
                            {shuffledPersonNames.map((person: Person, i: number) => (
                                <button
                                    key={person.id}
                                    onClick={() => handleVote(person.id)}
                                    disabled={votedThisRound}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        width: '100%',
                                        padding: '14px 18px',
                                        borderRadius: 14,
                                        border: selectedPersonId === person.id
                                            ? '2px solid var(--pink)'
                                            : '2px solid rgba(255,255,255,0.1)',
                                        background: selectedPersonId === person.id
                                            ? 'rgba(236, 72, 153, 0.15)'
                                            : 'rgba(255,255,255,0.05)',
                                        color: 'var(--text-primary)',
                                        fontSize: 15,
                                        fontWeight: 600,
                                        fontFamily: 'Outfit, sans-serif',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'left',
                                    }}
                                >
                                    <span style={{
                                        width: 28, height: 28,
                                        borderRadius: '50%',
                                        background: selectedPersonId === person.id
                                            ? 'var(--pink)'
                                            : 'rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: selectedPersonId === person.id ? '#fff' : 'var(--text-muted)',
                                        flexShrink: 0,
                                    }}>
                                        {String.fromCharCode(65 + i)}
                                    </span>
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
                                <div className="player-result-icon" style={isCorrect ? { border: 'none', background: 'transparent', height: 'auto', width: 'auto' } : {}}>
                                    {isCorrect ? (
                                        <div className="animate-bounce" style={{ display: 'inline-block' }}>
                                            <img
                                                src="/Kostya.png"
                                                alt="Kostya celebrating"
                                                style={{
                                                    width: 120,
                                                    height: 120,
                                                    objectFit: 'cover',
                                                    borderRadius: '50%',
                                                    border: '4px solid var(--gold)',
                                                    boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)'
                                                }}
                                            />
                                        </div>
                                    ) : '😅'}
                                </div>
                                <p className="player-result-text">
                                    {isCorrect ? `${t.correct} (+${myVote?.points || 0})` : t.notQuite}
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
