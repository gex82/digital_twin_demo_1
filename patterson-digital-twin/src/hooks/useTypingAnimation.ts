import { useState, useEffect, useRef } from 'react';

export function useTypingAnimation(text: string, enabled: boolean = true) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDisplayText(text);
      setIsComplete(true);
      return;
    }

    setDisplayText('');
    setIsComplete(false);
    let charIndex = 0;

    const typeChar = () => {
      if (charIndex < text.length) {
        const char = text[charIndex];
        setDisplayText(text.slice(0, charIndex + 1));
        charIndex++;
        const delay = char === '.' || char === '!' || char === '?' ? 80 :
                     char === ',' || char === ':' ? 40 : 18 + Math.random() * 12;
        timeoutRef.current = setTimeout(typeChar, delay);
      } else {
        setIsComplete(true);
      }
    };

    timeoutRef.current = setTimeout(typeChar, 100);
    return () => { if (timeoutRef.current != null) clearTimeout(timeoutRef.current); };
  }, [text, enabled]);

  return { displayText, isComplete };
}
