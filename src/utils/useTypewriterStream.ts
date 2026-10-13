import { useState, useRef, useEffect, useCallback } from 'react';
import { typewriterAudio } from './typewriterAudio';

export type TypewriterSpeed = 'slow' | 'normal' | 'fast';

interface UseTypewriterOptions {
  initialSpeed?: TypewriterSpeed;
  initialEnabled?: boolean;
}

// 真实人类打字动力学参数模型 (Human-like Typing Kinetics)
const SPEED_CONFIG: Record<
  TypewriterSpeed,
  {
    label: string;
    charInterval: number; // 基础按键间隔 (ms)
    burstChance: number; // 词组连击概率
    burstCharInterval: number; // 词组内连敲间隔 (ms)
    burstPause: number; // 词组打完后的微停顿/选词思索 (ms)
    pauseComma: number; // 逗号顿号微呼吸停顿 (ms)
    pausePeriod: number; // 句号叹号问号深思停顿 (ms)
    pauseNewline: number; // 段落换行构思停顿 (ms)
    jitter: number; // 自然生理微抖动范围 (±ms)
  }
> = {
  slow: {
    label: '沉思',
    charInterval: 130, // 约 7~8 字/秒：沉静推敲，逐字细品
    burstChance: 0.35,
    burstCharInterval: 65,
    burstPause: 260,
    pauseComma: 300,
    pausePeriod: 580,
    pauseNewline: 750,
    jitter: 35,
  },
  normal: {
    label: '作家',
    charInterval: 72, // 约 13~15 字/秒：专业作者键盘心流，阅读跟随感极佳
    burstChance: 0.45,
    burstCharInterval: 38,
    burstPause: 140,
    pauseComma: 180,
    pausePeriod: 380,
    pauseNewline: 500,
    jitter: 20,
  },
  fast: {
    label: '泉涌',
    charInterval: 36, // 约 25~30 字/秒：文思泉涌，飞速铺陈
    burstChance: 0.55,
    burstCharInterval: 22,
    burstPause: 75,
    pauseComma: 80,
    pausePeriod: 180,
    pauseNewline: 240,
    jitter: 10,
  },
};

export function useTypewriterStream(options?: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [speed, setSpeed] = useState<TypewriterSpeed>(() => {
    return (
      (localStorage.getItem('novelforge_typewriter_speed') as TypewriterSpeed) ||
      options?.initialSpeed ||
      'normal'
    );
  });
  const [enabled, setEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('novelforge_typewriter_enabled');
    return saved !== null ? saved === 'true' : (options?.initialEnabled ?? true);
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return !typewriterAudio.getMuted();
  });

  // State refs for animation loop
  const queueRef = useRef<string[]>([]);
  const fullTextRef = useRef('');
  const isStreamDoneRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCallbackRef = useRef<(() => void) | null>(null);
  const burstRemainingRef = useRef(0); // 当前连击词组剩余字符计数

  const handleSetSpeed = useCallback((s: TypewriterSpeed) => {
    setSpeed(s);
    localStorage.setItem('novelforge_typewriter_speed', s);
  }, []);

  const handleSetEnabled = useCallback((val: boolean) => {
    setEnabled(val);
    localStorage.setItem('novelforge_typewriter_enabled', String(val));
    if (!val) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setDisplayedText(fullTextRef.current);
      queueRef.current = [];
      burstRemainingRef.current = 0;
      if (isStreamDoneRef.current) {
        setIsTyping(false);
      }
    }
  }, []);

  const handleToggleSound = useCallback(() => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    typewriterAudio.setMuted(!nextVal);
  }, [soundEnabled]);

  // Tick loop simulating organic human writing
  const processNextTick = useCallback(() => {
    if (queueRef.current.length === 0) {
      burstRemainingRef.current = 0;
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

    // 严谨温和的背压控制：绝不轻易破坏逐字敲击的真实感
    let step = 1;
    if (qLen > 450) {
      step = 3; // 极端堆积时每次最多 3 字
    } else if (qLen > 220) {
      step = 2; // 较大堆积时每次 2 字
    } else {
      step = 1; // 常规状态坚定保持单字敲击
    }

    const charsToTake = Math.min(step, qLen);
    const takenChars = queueRef.current.splice(0, charsToTake).join('');
    setDisplayedText((prev) => prev + takenChars);

    // 播放轻微触感音（换行发出低频回车音）
    const isNewline = takenChars.includes('\n');
    typewriterAudio.playKeyClick(isNewline);

    // 计算下一个按键动作的人类学有机延迟
    const lastChar = takenChars.slice(-1);
    const jitter = Math.floor((Math.random() * 2 - 1) * cfg.jitter);
    let delay = cfg.charInterval + jitter;

    // 1. 词组脉冲模式处理 (Word Burst)
    if (burstRemainingRef.current > 0) {
      burstRemainingRef.current -= 1;
      delay = cfg.burstCharInterval + jitter;
      if (burstRemainingRef.current === 0) {
        // 词组输出完毕，插入选词/思考停顿
        delay += cfg.burstPause;
      }
    } else {
      // 随机开启新词组连击 (2~4 字)
      if (Math.random() < cfg.burstChance && !isNewline) {
        burstRemainingRef.current = Math.floor(Math.random() * 3) + 2;
        delay = cfg.burstCharInterval + jitter;
      }
    }

    // 2. 文学停顿优先级：标点与换行深思熟虑停顿
    if (lastChar === '。' || lastChar === '！' || lastChar === '？' || lastChar === '”' || lastChar === '…' || lastChar === '—') {
      burstRemainingRef.current = 0;
      delay += cfg.pausePeriod;
    } else if (lastChar === '，' || lastChar === '；' || lastChar === '、' || lastChar === '：') {
      burstRemainingRef.current = 0;
      delay += cfg.pauseComma;
    } else if (isNewline) {
      burstRemainingRef.current = 0;
      delay += cfg.pauseNewline;
    }

    // 3. 适度队列压缩（如果积压 > 100 字，按比例温和加速，但下限不低于 16ms）
    if (qLen > 100) {
      const compression = Math.max(0.65, 1 - (qLen - 100) / 600);
      delay = Math.round(delay * compression);
    }

    timerRef.current = setTimeout(processNextTick, Math.max(14, delay));
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

      const chars = Array.from(chunk);
      queueRef.current.push(...chars);
      setIsTyping(true);

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
    burstRemainingRef.current = 0;
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
    burstRemainingRef.current = 0;
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
    soundEnabled,
    toggleSound: handleToggleSound,
    pushChunk,
    markStreamDone,
    flushAll,
    reset,
    fullText: fullTextRef.current,
  };
}
