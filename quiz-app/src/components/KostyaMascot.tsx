'use client';
import { useState, useEffect } from 'react';

const ANIMATIONS = [
    'mascot-pop-bottom',
    'mascot-peek-left',
    'mascot-peek-right',
    'mascot-spin-across'
];

export default function KostyaMascot() {
    const [activeAnimation, setActiveAnimation] = useState<string | null>(null);

    useEffect(() => {
        // Randomly trigger the mascot every 20 to 60 seconds
        const triggerMascot = () => {
            // Pick random animation
            const randomAnim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
            setActiveAnimation(randomAnim);

            // Animation durations typically max out around 6s. Clear it after 7s.
            setTimeout(() => {
                setActiveAnimation(null);
            }, 7000);

            // Schedule next trigger
            const nextInterval = Math.floor(Math.random() * 40000) + 20000;
            setTimeout(triggerMascot, nextInterval);
        };

        // First trigger after 15 seconds
        const initialTimeout = setTimeout(triggerMascot, 15000);

        return () => {
            clearTimeout(initialTimeout);
        };
    }, []);

    if (!activeAnimation) return null;

    return (
        <div className={`mascot-container ${activeAnimation}`}>
            <img
                src="/Kostya.png"
                alt="Kostya Mascot"
                style={{ width: 180, height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' }}
            />
        </div>
    );
}
