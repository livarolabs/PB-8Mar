'use React';

export default function EmojiText({ text, className }: { text: string; className?: string }) {
    if (!text) return null;

    // Regex to match emojis
    // This handles standard emojis, variation selectors, and skin tones
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;

    const parts = text.split(emojiRegex);

    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (part.match(emojiRegex)) {
                    return (
                        <span key={i} className="native-emoji">
                            {part}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
}
