'use client';

import { Player } from '@/lib/types';

interface LeaderboardProps {
    players: Player[];
    currentPlayerId?: string;
    showAll?: boolean;
}

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_COLORS = [
    'linear-gradient(135deg, #ffd700, #ffb800)',
    'linear-gradient(135deg, #c0c0c0, #a8a8a8)',
    'linear-gradient(135deg, #cd7f32, #b87333)',
];

export default function Leaderboard({ players, currentPlayerId, showAll = true }: LeaderboardProps) {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const displayPlayers = showAll ? sorted : sorted.slice(0, 5);

    if (sorted.length === 0) {
        return (
            <div className="leaderboard-empty">
                <p>No players yet</p>
            </div>
        );
    }

    return (
        <div className="leaderboard">
            <h2 className="leaderboard-title">🏆 Leaderboard</h2>
            <div className="leaderboard-list">
                {displayPlayers.map((player, index) => {
                    const isCurrentPlayer = player.id === currentPlayerId;
                    const rank = index + 1;
                    const isPodium = rank <= 3;

                    return (
                        <div
                            key={player.id}
                            className={`leaderboard-item ${isPodium ? 'leaderboard-podium' : ''} ${isCurrentPlayer ? 'leaderboard-current' : ''}`}
                            style={isPodium ? { '--podium-bg': PODIUM_COLORS[index] } as React.CSSProperties : undefined}
                        >
                            <div className="leaderboard-rank">
                                {isPodium ? (
                                    <span className="leaderboard-medal">{MEDALS[index]}</span>
                                ) : (
                                    <span className="leaderboard-rank-number">{rank}</span>
                                )}
                            </div>
                            <div className="leaderboard-name">
                                {player.displayName}
                                {isCurrentPlayer && <span className="leaderboard-you"> (You)</span>}
                            </div>
                            <div className="leaderboard-score">
                                <span className="leaderboard-score-value">{player.score}</span>
                                <span className="leaderboard-score-label">pts</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
