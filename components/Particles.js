'use client';

import { useEffect, useState } from 'react';

// Gen Z Hội Xuân themed emojis
const FESTIVE_EMOJIS = ['🧧', '🎊', '✨', '🎆', '🌸', '🏮', '💫', '🎉'];

export default function Particles() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="particles" />;

    // Fewer particles for performance
    const particleCount = 8;

    return (
        <div className="particles" aria-hidden="true">
            {Array.from({ length: particleCount }).map((_, i) => {
                const emoji = FESTIVE_EMOJIS[i % FESTIVE_EMOJIS.length];
                const style = {
                    left: `${10 + (i * 12) % 80}%`,
                    top: `${5 + (i * 15) % 90}%`,
                    fontSize: `${16 + (i % 3) * 6}px`,
                    opacity: 0.4,
                    filter: 'blur(0.5px)'
                };

                return (
                    <div key={i} className="particle" style={style}>
                        {emoji}
                    </div>
                );
            })}
        </div>
    );
}
