'use client';

import { useEffect, useState } from 'react';

interface CountdownProps {
    endsAt: number;
    onComplete?: () => void;
}

export default function Countdown({ endsAt, onComplete }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [totalTime] = useState<number>(() => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));

    useEffect(() => {
        const update = () => {
            const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) {
                onComplete?.();
                return;
            }
        };

        update();
        const interval = setInterval(update, 100);
        return () => clearInterval(interval);
    }, [endsAt, onComplete]);

    const progress = totalTime > 0 ? timeLeft / totalTime : 0;
    const circumference = 2 * Math.PI * 54;
    const offset = circumference * (1 - progress);

    return (
        <div className="countdown-container">
            <svg className="countdown-ring" viewBox="0 0 120 120">
                {/* Background ring */}
                <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="6"
                />
                {/* Progress ring */}
                <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#countdown-gradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                        transition: 'stroke-dashoffset 0.1s linear',
                    }}
                />
                <defs>
                    <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
            </svg>
            <div className={`countdown-number ${timeLeft <= 3 ? 'countdown-urgent' : ''}`}>
                {timeLeft}
            </div>
        </div>
    );
}
