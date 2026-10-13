import { useState, useRef, useEffect, useCallback } from 'react';

export type TypewriterSpeed = 'slow' | 'normal' | 'fast';

interface UseTypewriterOptions {
  initialSpeed?: TypewriterSpeed;
  initialEnabled?: boolean;
}

const SPEED_CONFIG: Record<TypewriterSpeed, { baseInterval: number; maxStep: number; pauseComma: number; pausePeriod: number; pauseNewline: number }> = {
  slow: {
    baseInterval: 35,
    maxStep: 1,
    pauseComma: 90,
    pausePeriod: 160,
    pauseNewline: 220,
  },
  normal: {
    baseInterval: 18,
    maxStep: 2,
    pauseComma: 60,
    pausePeriod: 110,
    pauseNewline: 150,
  },
  fast: {
    baseInterval: 9,
    maxStep: 4,
    pauseComma: 25,
    pausePeriod: 50,
    pauseNewline: 70,
  },
};

export function useTypewriterStream(options?: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [speed, setSpeed] = useState<TypewriterSpeed>(() => {
    return (localStorage.getItem('novelforge_typewriter_speed') as TypewriterSpeed) || options?.initialSpeed || 'normal';
  });
  const [enabled, setEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('novelforge_typewriter_enabled');
    return saved !== null ? saved === 'true' : (options?.initialEnabled ?? true);
  });

  // State refs for animation loop
  const queueRef = useRef<string[]>([]);
  const fullTextRef = useRef('');
  const isStreamDoneRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCallbackRef = useRef<(() => void) | null>(null);

  const handleSetSpeed = useCallback((s: TypewriterSpeed) => {
    setSpeed(s);
    localStorage.setItem('novelforge_typewriter_speed', s);
  }, []);

  const handleSetEnabled = useCallback((val: boolean) => {
    setEnabled(val);
    localStorage.setItem('novelforge_typewriter_enabled', String(val));
    if (!val) {
      // If disabled mid-stream, flush everything immediately
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setDisplayedText(fullTextRef.current);
      queueRef.current = [];
      if (isStreamDoneRef.current) {
        setIsTyping(false);
      }
    }
  }, []);

  // Tick step loop
  const processNextTick = useCallback(() => {
    if (queueRef.current.length === 0) {
      if (isStreamDoneRef.current) {
        setIsTyping(false);
        if (activeCallbackRef.current) {
          activeCallbackRef.current();
          activeCallbackRef.current = null;
        }
      }
      timerRef.current = null;
      return;
    }

    const cfg = SPEED_CONFIG[speed];
    const qLen = queueRef.current.length;

    // Adaptive step size based on queue backlog
    let step = 1;
    if (qLen > 120) {
      step = cfg.maxStep * 2;
    } else if (qLen > 50) {
      step = cfg.maxStep;
    } else {
      step = 1;
    }

    // Take characters from queue
    const charsToTake = Math.min(step, qLen);
    const takenChars = queueRef.current.splice(0, charsToTake).join('');
    setDisplayedText((prev) => prev + takenChars);

    // Calculate delay with realistic punctuation pause
    let delay = cfg.baseInterval + Math.floor(Math.random() * 6 - 3); // subtle natural jitter
    const lastChar = takenChars.slice(-1);

    if (qLen < 60) {
      if (lastChar === '。' || lastChar === '！' || lastChar === '？' || lastChar === '”' || lastChar === '…') {
        delay += cfg.pausePeriod;
      } else if (lastChar === '，' || lastChar === '；' || lastChar === '、') {
        delay += cfg.pauseComma;
      } else if (lastChar === '\n') {
        delay += cfg.pauseNewline;
      }
    }

    timerRef.current = setTimeout(processNextTick, Math.max(4, delay));
  }, [speed]);

  // Push incoming chunk from stream
  const pushChunk = useCallback(
    (chunk: string) => {
      if (!chunk) return;
      fullTextRef.current += chunk;

      if (!enabled) {
        // Direct output when typewriter is off
        setDisplayedText(fullTextRef.current);
        return;
      }

      // Break chunk into individual characters and enqueue
      const chars = Array.from(chunk);
      queueRef.current.push(...chars);
      setIsTyping(true);

      // Start ticker if idle
      if (!timerRef.current) {
        processNextTick();
      }
    },
    [enabled, processNextTick]
  );

  // Mark stream as complete
  const markStreamDone = useCallback(
    (onComplete?: () => void) => {
      isStreamDoneRef.current = true;
      if (onComplete) {
        activeCallbackRef.current = onComplete;
      }

      if (!enabled || queueRef.current.length === 0) {
        setIsTyping(false);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setDisplayedText(fullTextRef.current);
        if (onComplete) onComplete();
      }
    },
    [enabled]
  );

  // Fast forward / Skip all animations immediately
  const flushAll = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    queueRef.current = [];
    setDisplayedText(fullTextRef.current);
    if (isStreamDoneRef.current) {
      setIsTyping(false);
    }
    if (activeCallbackRef.current) {
      activeCallbackRef.current();
      activeCallbackRef.current = null;
    }
  }, []);

  // Reset all
  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    queueRef.current = [];
    fullTextRef.current = '';
    isStreamDoneRef.current = false;
    activeCallbackRef.current = null;
    setDisplayedText('');
    setIsTyping(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    displayedText,
    isTyping,
    speed,
    setSpeed: handleSetSpeed,
    enabled,
    setEnabled: handleSetEnabled,
    pushChunk,
    markStreamDone,
    flushAll,
    reset,
    fullText: fullTextRef.current,
  };
}
