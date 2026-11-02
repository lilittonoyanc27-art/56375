import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Volume2,
  VolumeX,
  RotateCw,
  Sparkles,
  MessageSquare,
  ListFilter,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Languages,
  Mic,
  RefreshCw,
} from 'lucide-react';
import { QUESTIONS_DATA, CONVERSATION_PROMPTS, WHEEL_SECTORS, SECRET_WORD } from './questionsData.ts';
import { WheelSector } from './types.ts';
import { soundEffects } from './soundEffects.ts';
import { fireConfetti } from './confetti.ts';

export default function App() {
  // Game state
  const [score, setScore] = useState<number>(0);
  const [revealedLetters, setRevealedLetters] = useState<string[]>([]);
  const [triedLetters, setTriedLetters] = useState<string[]>([]);
  const [isWordSolved, setIsWordSolved] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Translation mode: 'click-to-reveal' | 'always-show'
  const [translationMode, setTranslationMode] = useState<'click-to-reveal' | 'always-show'>('click-to-reveal');
  const [revealedTranslations, setRevealedTranslations] = useState<Record<string, boolean>>({});

  // Wheel state
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [selectedSector, setSelectedSector] = useState<WheelSector | null>(null);
  const [wheelMessage, setWheelMessage] = useState<{ es: string; am: string } | null>(null);

  // Active quiz question
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswerKey, setSelectedAnswerKey] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState<boolean>(false);
  const [quizHistory, setQuizHistory] = useState<Record<number, { selected: 'A' | 'B' | 'C' | 'D'; correct: boolean }>>({});

  // Active tab: 'game' | 'quiz' | 'conversation' | 'answers'
  const [activeTab, setActiveTab] = useState<'game' | 'quiz' | 'conversation' | 'answers'>('game');

  // Full word guess modal
  const [showWordGuessModal, setShowWordGuessModal] = useState<boolean>(false);
  const [wordGuessInput, setWordGuessInput] = useState<string>('');
  const [wordGuessError, setWordGuessError] = useState<string | null>(null);

  // Filter for Answers Tab
  const [answersPartFilter, setAnswersPartFilter] = useState<number>(0);

  // Wheel canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentQuestion = QUESTIONS_DATA[currentQuestionIndex] || QUESTIONS_DATA[0];

  // Alphabet for Spanish letter keyboard
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Check if word is fully revealed
  useEffect(() => {
    const uniqueWordLetters = Array.from(new Set(SECRET_WORD.split('')));
    const allFound = uniqueWordLetters.every((char) => revealedLetters.includes(char));
    if (allFound && !isWordSolved) {
      setIsWordSolved(true);
      if (soundEnabled) soundEffects.playVictoryFanfare();
      fireConfetti();
    }
  }, [revealedLetters, isWordSolved, soundEnabled]);

  // Audio helper
  const playSound = (soundFn: () => void) => {
    if (soundEnabled) {
      soundFn();
    }
  };

  // Translation toggle helper
  const toggleTranslation = (key: string) => {
    playSound(soundEffects.playClick);
    setRevealedTranslations((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isTranslated = (key: string) => {
    if (translationMode === 'always-show') return true;
    return !!revealedTranslations[key];
  };

  // Draw wheel on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 320;
    const center = size / 2;
    const radius = size / 2 - 8;
    const sectorAngle = (2 * Math.PI) / WHEEL_SECTORS.length;

    ctx.clearRect(0, 0, size, size);

    // Save and rotate canvas by wheelRotation
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((wheelRotation * Math.PI) / 180);

    // Draw sectors
    WHEEL_SECTORS.forEach((sec, idx) => {
      const startAngle = idx * sectorAngle;
      const endAngle = startAngle + sectorAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = sec.color;
      ctx.fill();

      // Sector border
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sector text
      ctx.save();
      ctx.rotate(startAngle + sectorAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = sec.textColor;
      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(sec.labelEs, radius - 18, 4);
      ctx.restore();
    });

    // Outer ring with golden accents and studs
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.stroke();

    for (let i = 0; i < WHEEL_SECTORS.length; i++) {
      const angle = i * sectorAngle;
      const pinX = Math.cos(angle) * (radius - 2);
      const pinY = Math.sin(angle) * (radius - 2);
      ctx.beginPath();
      ctx.arc(pinX, pinY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();

    // Center hub (doesn't rotate)
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner soccer ball icon in center
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '18px sans-serif';
    ctx.fillText('⚽', center, center);
  }, [wheelRotation]);

  // Spin the Pole Chudes wheel
  const handleSpinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSelectedSector(null);
    setWheelMessage(null);
    playSound(soundEffects.playClick);

    // Audio ticking sound interval during spin
    let tickCounter = 0;
    const tickInterval = setInterval(() => {
      playSound(soundEffects.playWheelTick);
      tickCounter++;
      if (tickCounter > 30) clearInterval(tickInterval);
    }, 100);

    const extraSpins = 4 + Math.floor(Math.random() * 3);
    const randomExtraDegrees = Math.floor(Math.random() * 360);
    const targetDegrees = wheelRotation + extraSpins * 360 + randomExtraDegrees;

    const startRot = wheelRotation;
    const distance = targetDegrees - startRot;
    const duration = 3800;
    const startTime = performance.now();

    function animate(time: number) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentDeg = startRot + distance * easeOut;

      setWheelRotation(currentDeg);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        clearInterval(tickInterval);
        setIsSpinning(false);

        const finalNormalizedDeg = ((currentDeg % 360) + 360) % 360;
        const pointerAngle = (270 - finalNormalizedDeg + 360) % 360;
        const sectorAngle = 360 / WHEEL_SECTORS.length;
        const sectorIndex = Math.floor(pointerAngle / sectorAngle) % WHEEL_SECTORS.length;
        const sector = WHEEL_SECTORS[sectorIndex];
        setSelectedSector(sector);

        handleSectorOutcome(sector);
      }
    }

    requestAnimationFrame(animate);
  };

  // Outcome of wheel sector
  const handleSectorOutcome = (sec: WheelSector) => {
    if (sec.type === 'bankrupt') {
      playSound(soundEffects.playIncorrect);
      setScore(0);
      setWheelMessage({
        es: '¡Bancarrota! Tus puntos se han reiniciado, pero puedes continuar jugando y abrir letras.',
        am: 'Սնանկացում: Քո միավորները զրոյացան, բայց կարող ես շարունակել խաղալ և բացել տառեր։',
      });
    } else if (sec.type === 'double') {
      playSound(soundEffects.playWhistle);
      setScore((prev) => Math.max(100, prev * 2));
      setWheelMessage({
        es: '¡Sector x2 Doble! ¡Puntuación duplicada! Ahora responde a la situación de fútbol.',
        am: 'x2 Կրկնակի սեկտոր: Միավորները կրկնապատկվեցին: Այժմ պատասխանիր ֆուտբոլային հարցին։',
      });
    } else if (sec.type === 'plus') {
      playSound(soundEffects.playLetterReveal);
      setScore((prev) => prev + sec.value);
      const unrevealed = SECRET_WORD.split('').filter((c) => !revealedLetters.includes(c));
      if (unrevealed.length > 0) {
        const randomChar = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        revealLetter(randomChar, false);
        setWheelMessage({
          es: `¡Sector Plus (+)! Has ganado ${sec.value} puntos y se ha abierto automáticamente la letra "${randomChar}".`,
          am: `Սեկտոր Պլյուս (+): Ստացար ${sec.value} միավոր և ավտոմատ բացվեց «${randomChar}» տառը։`,
        });
      } else {
        setWheelMessage({
          es: `¡Sector Plus (+)! Has ganado ${sec.value} puntos extra.`,
          am: `Սեկտոր Պլյուս (+): Ստացար ${sec.value} լրացուցիչ միավոր։`,
        });
      }
    } else {
      playSound(soundEffects.playWhistle);
      setScore((prev) => prev + sec.value);
      setWheelMessage({
        es: `¡Ha caído en ${sec.labelEs}! Responde a la situación o abre una letra del abecedario.`,
        am: `Ընկավ ${sec.labelAm}: Պատասխանիր հարցին կամ ինքնուրույն բացիր տառ այբուբենից։`,
      });
    }
  };

  // Letter reveal directly from alphabet keyboard
  const handleLetterClick = (letter: string) => {
    if (triedLetters.includes(letter)) return;
    playSound(soundEffects.playClick);
    revealLetter(letter, true);
  };

  const revealLetter = (letter: string, notify: boolean) => {
    setTriedLetters((prev) => (prev.includes(letter) ? prev : [...prev, letter]));

    if (SECRET_WORD.includes(letter)) {
      playSound(soundEffects.playLetterReveal);
      setRevealedLetters((prev) => (prev.includes(letter) ? prev : [...prev, letter]));
      const count = SECRET_WORD.split('').filter((c) => c === letter).length;
      const pts = count * 200;
      setScore((prev) => prev + pts);

      if (notify) {
        setWheelMessage({
          es: `¡Excelente! La letra "${letter}" está en la palabra secreta (${count} vez${count > 1 ? 'es' : ''}) +${pts} pts.`,
          am: `Հիանալի է: «${letter}» տառը կա գաղտնի բառում (${count} անգամ) +${pts} միավոր։`,
        });
      }
    } else {
      playSound(soundEffects.playIncorrect);
      if (notify) {
        setWheelMessage({
          es: `La letra "${letter}" no está en el nombre. ¡No te preocupes, sigue jugando y prueba con otra letra!`,
          am: `«${letter}» տառը չկա անվան մեջ: Մի՛ անհանգստացիր, շարունակիր խաղալ և փորձիր այլ տառ։`,
        });
      }
    }
  };

  // Quiz answer submission
  const handleAnswerOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (hasAnsweredCurrent) return;
    setSelectedAnswerKey(key);
    setHasAnsweredCurrent(true);

    const isCorrect = key === currentQuestion.correctOptionKey;
    setQuizHistory((prev) => ({
      ...prev,
      [currentQuestion.id]: { selected: key, correct: isCorrect },
    }));

    if (isCorrect) {
      playSound(soundEffects.playWhistle);
      setScore((prev) => prev + 300);
      setWheelMessage({
        es: '¡Golazo! Respuesta correcta (+300 pts). Ahora elige una letra del abecedario o gira la rueda.',
        am: 'Գոլ: Ճիշտ պատասխան (+300 միավոր): Այժմ ընտրիր տառ այբուբենից կամ պտտիր թմբուկը։',
      });
    } else {
      playSound(soundEffects.playIncorrect);
      setWheelMessage({
        es: '¡Respuesta incorrecta, pero el fútbol te da revancha! Sigue jugando libremente y abre una letra del abecedario.',
        am: 'Պատասխանը սխալ էր, բայց ֆուտբոլը նոր հնարավորություն է տալիս։ Շարունակիր խաղալ և բացիր տառ այբուբենից։',
      });
    }
  };

  // Next question
  const handleNextQuestion = () => {
    playSound(soundEffects.playClick);
    const nextIdx = (currentQuestionIndex + 1) % QUESTIONS_DATA.length;
    setCurrentQuestionIndex(nextIdx);
    setSelectedAnswerKey(null);
    setHasAnsweredCurrent(false);
  };

  // Previous question
  const handlePrevQuestion = () => {
    playSound(soundEffects.playClick);
    const prevIdx = (currentQuestionIndex - 1 + QUESTIONS_DATA.length) % QUESTIONS_DATA.length;
    setCurrentQuestionIndex(prevIdx);
    setSelectedAnswerKey(null);
    setHasAnsweredCurrent(false);
  };

  // Guess whole word
  const handleWordGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = wordGuessInput.trim().toUpperCase();
    if (!cleaned) return;

    if (cleaned === SECRET_WORD) {
      setRevealedLetters(Array.from(new Set(SECRET_WORD.split(''))));
      setIsWordSolved(true);
      setShowWordGuessModal(false);
      setScore((prev) => prev + 1500);
      playSound(soundEffects.playVictoryFanfare);
      fireConfetti();
      setWheelMessage({
        es: '¡¡¡EXTRAORDINARIO!!! ¡Has adivinado la palabra RONALDO! (+1500 pts)',
        am: 'ԱՐՏԱԿԱՐԳ Է: Դու գուշակեցիր ՌՈՆԱԼԴՈՒ բառը (+1500 միավոր)։',
      });
    } else {
      playSound(soundEffects.playIncorrect);
      setWordGuessError('¡Palabra incorrecta! Pero puedes continuar jugando y adivinando letra por letra.');
    }
  };

  // Reset entire game
  const handleRestartGame = () => {
    playSound(soundEffects.playClick);
    setScore(0);
    setRevealedLetters([]);
    setTriedLetters([]);
    setIsWordSolved(false);
    setSelectedSector(null);
    setWheelMessage(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswerKey(null);
    setHasAnsweredCurrent(false);
    setQuizHistory({});
    setShowWordGuessModal(false);
    setWordGuessInput('');
  };

  // Text to Speech for Spanish pronunciation practice
  const speakSpanish = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech suppression
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col w-full max-w-full overflow-x-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* 1. Header with Top Bar Contract (Adapted for zero overflow) */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-3 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-3 sm:gap-6 flex-wrap md:flex-nowrap w-full max-w-full">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 border border-emerald-500 flex items-center justify-center font-bold text-white shadow-sm text-lg">
            ⚽
          </div>
          <span className="font-['Outfit'] font-black text-xl md:text-2xl tracking-tight text-white">
            Polé Chudes <span className="text-amber-400">·</span> Ronaldo
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-base font-semibold text-slate-300">
          <button
            onClick={() => {
              setActiveTab('game');
              playSound(soundEffects.playClick);
            }}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 'game' ? 'text-amber-400 font-bold border-b-2 border-amber-400 pb-0.5' : 'text-slate-400'
            }`}
          >
            Rueda &amp; Tablero (Հրաշքների Դաշտ)
          </button>
          <button
            onClick={() => {
              setActiveTab('quiz');
              playSound(soundEffects.playClick);
            }}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 'quiz' ? 'text-amber-400 font-bold border-b-2 border-amber-400 pb-0.5' : 'text-slate-400'
            }`}
          >
            20 Situaciones (20 Իրավիճակ)
          </button>
          <button
            onClick={() => {
              setActiveTab('conversation');
              playSound(soundEffects.playClick);
            }}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 'conversation' ? 'text-amber-400 font-bold border-b-2 border-amber-400 pb-0.5' : 'text-slate-400'
            }`}
          >
            Conversación (Խոսակցական)
          </button>
          <button
            onClick={() => {
              setActiveTab('answers');
              playSound(soundEffects.playClick);
            }}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 'answers' ? 'text-amber-400 font-bold border-b-2 border-amber-400 pb-0.5' : 'text-slate-400'
            }`}
          >
            Respuestas (Պատասխաններ)
          </button>
        </nav>

        {/* Zone 3: Quick Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-base font-mono tabular-nums text-amber-400 font-black">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{score} pts</span>
          </div>

          <button
            onClick={() => {
              setTranslationMode(translationMode === 'click-to-reveal' ? 'always-show' : 'click-to-reveal');
              playSound(soundEffects.playClick);
            }}
            title={translationMode === 'click-to-reveal' ? 'Click español para ver armenio' : 'Traducción siempre visible'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-100 transition-colors whitespace-nowrap"
          >
            <Languages className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">
              {translationMode === 'click-to-reveal' ? 'Click: Traducir ES→AM' : 'AM Siempre visible'}
            </span>
          </button>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) soundEffects.playClick();
            }}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors shrink-0"
            title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
            aria-label="Toggle sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center justify-around border-b border-slate-800 bg-slate-900 px-2 py-2.5 text-xs sm:text-sm w-full max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('game')}
          className={`py-1.5 px-3 rounded-lg font-bold whitespace-nowrap ${activeTab === 'game' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'}`}
        >
          Rueda &amp; Palabra
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`py-1.5 px-3 rounded-lg font-bold whitespace-nowrap ${activeTab === 'quiz' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'}`}
        >
          20 Situaciones
        </button>
        <button
          onClick={() => setActiveTab('conversation')}
          className={`py-1.5 px-3 rounded-lg font-bold whitespace-nowrap ${activeTab === 'conversation' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'}`}
        >
          Conversación
        </button>
        <button
          onClick={() => setActiveTab('answers')}
          className={`py-1.5 px-3 rounded-lg font-bold whitespace-nowrap ${activeTab === 'answers' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'}`}
        >
          Respuestas
        </button>
      </div>

      {/* Main Content Area (Safely constrained to max-w-6xl and 100% width) */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5 md:p-6 flex flex-col gap-5 md:gap-6 overflow-x-hidden">
        {/* Banner with Rules & Mode */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-800/60 bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-slate-900/95 p-4 sm:p-5 shadow-lg w-full max-w-full">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-400 font-bold mb-1.5 flex-wrap">
                <span>⚽ ¿Qué harías en esta situación?</span>
                <span aria-hidden="true">·</span>
                <span>Ի՞նչ կանեիր տարբեր ֆուտբոլային իրավիճակներում</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-400">Nivel A2–B1</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-['Outfit'] text-white tracking-tight">
                Juego Polé Chudes: Adivina la palabra <span className="text-amber-400">«RONALDO»</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
                💡 <span className="text-amber-300 font-bold">Կանոններ:</span> Պտտիր թմբուկը, պատասխանիր 20 ֆուտբոլային իրավիճակներին։ Եթե սխալ պատասխանես, <span className="text-amber-300 font-semibold">միևնույն է՝ կշարունակես խաղալ</span> և կարող ես ինքնուրույն բացել տառերը ցանկից։ Սեղմիր իսպաներեն ցանկացած տեքստին՝ հայերեն թարգմանությունը տեսնելու համար։
              </p>
            </div>

            <button
              onClick={() => setShowWordGuessModal(true)}
              className="px-4 py-2.5 text-sm sm:text-base font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md hover:shadow-amber-500/20 whitespace-nowrap shrink-0 flex items-center gap-2 self-stretch md:self-auto justify-center"
            >
              <Sparkles className="w-5 h-5 shrink-0" />
              <span>Adivinar palabra / Գուշակել բառը</span>
            </button>
          </div>
        </div>

        {/* 2. THE SECRET WORD BOARD (Golden letter tiles, responsive to never overflow) */}
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/95 p-4 sm:p-6 shadow-xl relative overflow-hidden w-full max-w-full">
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between w-full mb-3 gap-2 text-sm sm:text-base text-slate-300">
              <span className="font-extrabold text-amber-400 uppercase tracking-wider text-center sm:text-left">
                🏆 Palabra Secreta · Գաղտնի բառ (7 letras / 7 տառ)
              </span>
              <span className="text-slate-300 text-sm sm:text-base">
                Pistas descubiertas: <span className="text-white font-black">{revealedLetters.length}</span> / 6 únicas
              </span>
            </div>

            {/* Letter Tiles Container (Responsive tiles with flexible wrap) */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3 py-2 w-full max-w-full">
              {SECRET_WORD.split('').map((char, index) => {
                const isRevealed = revealedLetters.includes(char) || isWordSolved;
                return (
                  <div
                    key={index}
                    className="perspective-1000 w-10 h-13 sm:w-13 sm:h-16 md:w-16 md:h-20 shrink-0"
                  >
                    <div
                      className={`relative w-full h-full rounded-xl shadow-lg border-2 font-['Outfit'] font-black text-2xl sm:text-3xl md:text-4xl flex items-center justify-center transition-all duration-700 transform-style-preserve-3d ${
                        isRevealed
                          ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 text-slate-950 border-amber-200 scale-100 shadow-amber-500/30'
                          : 'bg-gradient-to-b from-slate-800 to-slate-900 text-slate-500 border-slate-700/80'
                      }`}
                    >
                      {isRevealed ? (
                        <span className="drop-shadow-sm animate-in fade-in zoom-in duration-300">
                          {char}
                        </span>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[11px] sm:text-xs text-slate-500 font-mono font-medium">#{index + 1}</span>
                          <span className="text-slate-600 text-base sm:text-xl font-bold">?</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hint & Status */}
            <div className="mt-3.5 text-center w-full px-2">
              {isWordSolved ? (
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-base sm:text-lg animate-bounce">
                  <span>⚽ ¡¡¡SIUUUU!!! ¡HAS DESCUBIERTO A CRISTIANO RONALDO! 🇵🇹</span>
                </div>
              ) : (
                <p className="text-sm sm:text-base text-slate-300">
                  <span className="text-amber-400 font-bold">Pista / Հուշում:</span>{' '}
                  <span
                    onClick={() => toggleTranslation('word-hint')}
                    className="cursor-pointer underline decoration-dotted decoration-amber-400 hover:text-white transition-colors text-amber-200"
                  >
                    {isTranslated('word-hint')
                      ? '«Աշխարհի լավագույն ֆուտբոլիստներից մեկը, Չեմպիոնների լիգայի 5-ակի հաղթող» (Ռոնալդու)'
                      : '«Uno de los mejores futbolistas de la historia, 5 veces campeón de Champions League» (Toca para ver en armenio)'}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 3. GAME VIEW (WHEEL + ALPHABET BOARD + INTERACTIVE QUESTION STAGE) */}
        {activeTab === 'game' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 w-full max-w-full">
            {/* Left Column: The Wheel of Fortune Drum */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 flex flex-col items-center justify-between w-full max-w-full overflow-hidden">
              <div className="w-full flex items-center justify-between mb-2">
                <h2 className="font-['Outfit'] font-black text-base sm:text-lg text-white flex items-center gap-2">
                  <RotateCw className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Rueda de la Fortuna (Հրաշքների Թմբուկ)</span>
                </h2>
                {selectedSector && (
                  <span className="text-sm font-mono font-black text-amber-400">
                    {selectedSector.labelEs}
                  </span>
                )}
              </div>

              {/* Wheel Container with Pointer (Responsive max-width to avoid boundary clipping) */}
              <div className="relative my-2 sm:my-3 flex items-center justify-center w-full max-w-[280px] sm:max-w-[320px] aspect-square mx-auto">
                {/* Pointer Flapper at top */}
                <div className="absolute -top-3 z-20 flex flex-col items-center pointer-events-none">
                  <div className="w-5 h-7 bg-gradient-to-b from-amber-300 to-amber-500 rounded-b shadow-lg transform rotate-180 border border-amber-200"></div>
                </div>

                {/* Canvas Drum (Fluid width and height) */}
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={320}
                  className="w-full h-full max-w-full max-h-full rounded-full shadow-2xl transition-transform"
                />
              </div>

              {/* Spin Button */}
              <button
                onClick={handleSpinWheel}
                disabled={isSpinning}
                className={`w-full py-3.5 px-6 rounded-xl font-['Outfit'] font-black text-base sm:text-lg transition-all flex items-center justify-center gap-2 shadow-lg mt-2 ${
                  isSpinning
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30 active:scale-98'
                }`}
              >
                <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'Girando el tambor...' : '¡Girar la Rueda! / Պտտել Թմբուկը'}</span>
              </button>

              {/* Message Banner under wheel */}
              {wheelMessage && (
                <div className="w-full mt-3.5 p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm leading-relaxed">
                  <p className="text-slate-100 font-bold">{wheelMessage.es}</p>
                  <p className="text-amber-300 font-medium mt-1">{wheelMessage.am}</p>
                </div>
              )}
            </div>

            {/* Right Column: Letter Picker & Immediate Situation Question */}
            <div className="lg:col-span-7 flex flex-col gap-5 w-full max-w-full overflow-hidden">
              {/* Alphabet Letter Grid ("букву открыть самому из списка букв") */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 w-full max-w-full overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-['Outfit'] font-black text-base sm:text-lg text-white flex items-center gap-2">
                    <ListFilter className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Abre una letra del abecedario / Բացիր տառ</span>
                  </h3>
                  <span className="text-xs sm:text-sm text-slate-400 font-medium">
                    A–Z
                  </span>
                </div>

                <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 sm:gap-2 w-full max-w-full">
                  {ALPHABET.map((char) => {
                    const isTried = triedLetters.includes(char);
                    const isInWord = SECRET_WORD.includes(char);

                    let btnStyle = 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 hover:border-amber-400';
                    if (isTried && isInWord) {
                      btnStyle = 'bg-emerald-600 text-white border-emerald-400 font-black';
                    } else if (isTried && !isInWord) {
                      btnStyle = 'bg-slate-900/60 text-slate-600 border-slate-800 cursor-not-allowed';
                    }

                    return (
                      <button
                        key={char}
                        onClick={() => handleLetterClick(char)}
                        disabled={isTried}
                        className={`h-10 sm:h-11 md:h-12 rounded-xl border font-['Outfit'] font-black text-base sm:text-lg transition-all flex items-center justify-center shadow-sm ${btnStyle}`}
                      >
                        {char}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
                  ✅ <span className="text-emerald-400 font-bold">Կանաչ:</span> տառը կա անվան մեջ։ ❌ <span className="text-slate-500 font-bold">Մոխրագույն:</span> տառը չկա։ Կարող եք ցանկացած պահի ընտրել տառեր։
                </p>
              </div>

              {/* Current Football Situation Question Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 flex-1 flex flex-col justify-between w-full max-w-full overflow-hidden">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs sm:text-sm text-emerald-400 font-extrabold tracking-wide">
                      {currentQuestion.partTitleEs} · {currentQuestion.partTitleAm}
                    </span>
                    <span className="text-xs sm:text-sm text-amber-400 font-mono font-bold">
                      #{currentQuestion.id} / 20
                    </span>
                  </div>

                  {/* Question Title in Spanish (Clickable for Armenian translation with larger font) */}
                  <div
                    onClick={() => toggleTranslation(`q-${currentQuestion.id}`)}
                    className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-400/60 cursor-pointer transition-all mb-3.5 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-['Outfit'] font-extrabold text-lg sm:text-xl md:text-2xl text-white group-hover:text-amber-300 transition-colors leading-snug">
                        {currentQuestion.id}. {currentQuestion.questionEs}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakSpanish(currentQuestion.questionEs);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
                        title="Escuchar pronunciación"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Armenian Translation */}
                    {isTranslated(`q-${currentQuestion.id}`) ? (
                      <p className="text-base sm:text-lg text-amber-300 font-medium mt-2.5 pt-2.5 border-t border-slate-800 animate-in fade-in duration-200 leading-snug">
                        🇦🇲 {currentQuestion.questionAm}
                      </p>
                    ) : (
                      <span className="inline-block mt-2 text-xs sm:text-sm text-amber-400/90 italic font-medium">
                        👆 Toca aquí para ver traducción en armenio / Սեղմիր թարգմանության համար
                      </span>
                    )}
                  </div>

                  {/* 4 Options with larger text and clear layout */}
                  <div className="grid grid-cols-1 gap-2.5 w-full">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = selectedAnswerKey === opt.key;
                      const isCorrect = opt.key === currentQuestion.correctOptionKey;
                      const showResult = hasAnsweredCurrent;

                      let optClasses = 'border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-100 hover:border-slate-700';
                      if (showResult) {
                        if (isCorrect) {
                          optClasses = 'border-emerald-500 bg-emerald-950/50 text-emerald-100 font-bold';
                        } else if (isSelected) {
                          optClasses = 'border-rose-500 bg-rose-950/40 text-rose-100';
                        }
                      } else if (isSelected) {
                        optClasses = 'border-amber-400 bg-amber-500/10 text-white font-bold';
                      }

                      return (
                        <div
                          key={opt.key}
                          onClick={() => handleAnswerOption(opt.key)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 w-full max-w-full overflow-hidden ${optClasses}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 text-base sm:text-lg font-medium leading-snug">
                              <span className="font-black text-amber-400 shrink-0 text-lg sm:text-xl">{opt.key})</span>
                              <span className="break-words">{opt.textEs}</span>
                            </div>
                            {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                            {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                          </div>

                          {/* Armenian translation of option */}
                          {(isTranslated(`q-${currentQuestion.id}`) || isTranslated(`opt-${currentQuestion.id}-${opt.key}`)) && (
                            <span className="text-sm sm:text-base text-amber-300/95 pl-7 sm:pl-8 leading-snug break-words">
                              {opt.textAm}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Tactical Explanation after answering */}
                  {hasAnsweredCurrent && (
                    <div className="mt-3.5 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm sm:text-base leading-relaxed">
                      <p className="text-slate-200">
                        <span className="text-emerald-400 font-black">Táctica de fútbol:</span> {currentQuestion.explanationEs}
                      </p>
                      <p className="text-amber-300 font-medium mt-1.5">
                        <span className="font-bold">Ֆուտբոլային վերլուծություն:</span> {currentQuestion.explanationAm}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Controls for Situation Question */}
                <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between gap-3">
                  <button
                    onClick={handlePrevQuestion}
                    className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 transition-colors"
                  >
                    ← Anterior
                  </button>

                  <span className="text-xs sm:text-sm text-slate-300 font-semibold">
                    Pregunta {currentQuestionIndex + 1} de 20
                  </span>

                  <button
                    onClick={handleNextQuestion}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. ALL 20 SITUATIONS QUIZ BROWSER TAB */}
        {activeTab === 'quiz' && (
          <div className="flex flex-col gap-5 w-full max-w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-['Outfit'] text-white">
                  20 Situaciones de Fútbol · 20 Ֆուտբոլային Իրավիճակներ
                </h2>
                <p className="text-sm sm:text-base text-slate-300 mt-1">
                  Ընտրիր իրավիճակը և սեղմիր իսպաներեն տեքստին՝ հայերեն թարգմանությունը տեսնելու համար։
                </p>
              </div>

              {/* Part selector */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs sm:text-sm overflow-x-auto max-w-full">
                {[
                  { num: 0, label: 'Todas (Բոլորը)' },
                  { num: 1, label: 'Parte 1 (1-5)' },
                  { num: 2, label: 'Parte 2 (6-10)' },
                  { num: 3, label: 'Parte 3 (11-15)' },
                  { num: 4, label: 'Parte 4 (16-20)' },
                ].map((item) => (
                  <button
                    key={item.num}
                    onClick={() => setAnswersPartFilter(item.num)}
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-bold ${
                      answersPartFilter === item.num
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {QUESTIONS_DATA.filter((q) => answersPartFilter === 0 || q.part === answersPartFilter).map((q) => {
                const isSelectedCurrent = q.id === currentQuestion.id;
                const answeredRecord = quizHistory[q.id];

                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(q.id - 1);
                      setActiveTab('game');
                      playSound(soundEffects.playClick);
                    }}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between w-full ${
                      isSelectedCurrent
                        ? 'border-amber-400 bg-slate-900 shadow-md shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm text-emerald-400 font-extrabold">
                          #{q.id} · {q.partTitleEs}
                        </span>
                        {answeredRecord && (
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-lg font-mono font-bold ${
                              answeredRecord.correct
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {answeredRecord.correct ? '✓ Resuelta' : '✗ Intentada'}
                          </span>
                        )}
                      </div>

                      <p className="font-['Outfit'] font-bold text-base sm:text-lg text-white mb-2 leading-snug">
                        {q.questionEs}
                      </p>
                      <p className="text-sm sm:text-base text-amber-300 font-medium mb-3 leading-snug">
                        {q.questionAm}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs sm:text-sm text-slate-300">
                      <span>4 opciones · 1 correcta</span>
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        Jugar esta situación <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. CONVERSATION PRACTICE TAB (Para practicar la conversación — Խոսակցական պրակտիկայի համար) */}
        {activeTab === 'conversation' && (
          <div className="flex flex-col gap-6 w-full max-w-full">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 w-full">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-400 font-extrabold mb-1">
                <MessageSquare className="w-5 h-5" />
                <span>Para practicar la conversación — Խոսակցական պրակտիկայի համար</span>
              </div>
              <h2 className="font-['Outfit'] font-black text-xl sm:text-2xl text-white">
                Entrena tu expresión oral en fútbol (Իսպաներեն խոսակցական մարզում)
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Յուրաքանչյուր պատասխանից հետո օգտագործիր այս հարցերը խոսակցություն ծավալելու համար։ Սեղմիր բարձրախոսին՝ բարձրաձայն արտասանությունը լսելու համար։
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
              {CONVERSATION_PROMPTS.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between w-full"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-mono text-amber-400 font-black">
                        Pregunta #{item.id}
                      </span>
                      <button
                        onClick={() => speakSpanish(item.promptEs)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Escuchar en español"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    </div>

                    <div
                      onClick={() => toggleTranslation(`conv-${item.id}`)}
                      className="cursor-pointer mb-4"
                    >
                      <h3 className="font-['Outfit'] font-black text-lg sm:text-xl text-white hover:text-amber-300 transition-colors leading-snug">
                        {item.promptEs}
                      </h3>
                      <p className="text-sm sm:text-base text-amber-300 mt-1.5 font-bold">
                        🇦🇲 {item.promptAm}
                      </p>
                    </div>

                    <div className="mb-3">
                      <span className="text-xs sm:text-sm text-slate-300 font-bold block mb-2">
                        Frases para responder / Պատասխանի կաղապարներ:
                      </span>
                      <div className="flex flex-col gap-2.5">
                        {item.helpfulStartersEs.map((starter, sIdx) => (
                          <div
                            key={sIdx}
                            onClick={() => speakSpanish(starter)}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400/60 cursor-pointer text-sm sm:text-base transition-all group"
                          >
                            <p className="text-slate-100 group-hover:text-amber-300 font-semibold leading-snug">
                              🗣️ {starter}
                            </p>
                            <p className="text-slate-400 text-xs sm:text-sm mt-1">
                              {item.helpfulStartersAm[sIdx]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 pt-3 border-t border-slate-800 mt-2 leading-relaxed">
                    💡 {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. COMPLETE ANSWERS REVIEW TAB (Mostrar respuestas — Պատասխաններ) */}
        {activeTab === 'answers' && (
          <div className="flex flex-col gap-5 w-full max-w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-['Outfit'] font-black text-xl sm:text-2xl text-white">
                  Respuestas Oficiales — Պատասխաններ
                </h2>
                <p className="text-sm sm:text-base text-slate-300 mt-1">
                  Բոլոր 20 առաջարկվող պատասխանները տակտիկական վերլուծությամբ իսպաներեն և հայերեն լեզուներով։
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allKeys: Record<string, boolean> = {};
                    QUESTIONS_DATA.forEach((q) => {
                      allKeys[`ans-${q.id}`] = true;
                    });
                    setRevealedTranslations((prev) => ({ ...prev, ...allKeys }));
                    playSound(soundEffects.playClick);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-800 text-slate-100 hover:text-white border border-slate-700 font-bold"
                >
                  Revelar todo en armenio
                </button>
              </div>
            </div>

            <div className="space-y-3.5 w-full">
              {QUESTIONS_DATA.map((q) => {
                const correctOpt = q.options.find((o) => o.key === q.correctOptionKey);

                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 transition-all w-full"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-400">
                        {q.id}. {q.partTitleEs}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-black text-xs sm:text-sm border border-emerald-500/30">
                        Opción correcta: {q.correctOptionKey}
                      </span>
                    </div>

                    <div
                      onClick={() => toggleTranslation(`ans-${q.id}`)}
                      className="cursor-pointer mb-2.5"
                    >
                      <p className="font-bold text-white text-base sm:text-lg leading-snug">
                        {q.questionEs}
                      </p>
                      {isTranslated(`ans-${q.id}`) && (
                        <p className="text-sm sm:text-base text-amber-300 font-medium mt-1 leading-snug">
                          🇦🇲 {q.questionAm}
                        </p>
                      )}
                    </div>

                    {correctOpt && (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-sm sm:text-base text-emerald-200">
                        <span className="font-black text-amber-400 mr-2">{correctOpt.key})</span>
                        {correctOpt.textEs} — <span className="text-emerald-300 font-semibold">{correctOpt.textAm}</span>
                      </div>
                    )}

                    <div className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      <span className="text-slate-200 font-bold">Explicación:</span> {q.explanationEs}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: GUESS ENTIRE WORD */}
      {showWordGuessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl border border-amber-500/50 bg-slate-900 max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-['Outfit'] font-black text-xl sm:text-2xl text-white mb-1.5">
              ¿Sabes la palabra secreta? / Գիտե՞ս գաղտնի բառը:
            </h3>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Si adivinas la palabra completa de 7 letras, ganarás un bonus masivo de <span className="text-amber-400 font-bold">+1500 puntos</span>.
            </p>

            <form onSubmit={handleWordGuessSubmit} className="flex flex-col gap-3.5">
              <input
                type="text"
                maxLength={10}
                placeholder="Escribe la palabra (ej. RONALDO)..."
                value={wordGuessInput}
                onChange={(e) => {
                  setWordGuessInput(e.target.value);
                  setWordGuessError(null);
                }}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-['Outfit'] font-black text-center tracking-widest uppercase text-2xl focus:outline-none focus:border-amber-400"
                autoFocus
              />

              {wordGuessError && (
                <p className="text-sm text-rose-400 font-semibold text-center">
                  {wordGuessError}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowWordGuessModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-bold"
                >
                  Cancelar / Չեղարկել
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-black transition-colors"
                >
                  Comprobar / Ստուգել
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VICTORY CELEBRATION MODAL */}
      {isWordSolved && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="rounded-2xl border border-amber-400 bg-slate-900 max-w-lg w-full p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center mx-auto mb-4 text-4xl">
              ⚽
            </div>

            <h2 className="font-['Outfit'] font-black text-3xl sm:text-4xl text-white tracking-tight">
              ¡¡¡SIUUUU!!! ¡VICTORIA!
            </h2>
            <p className="text-amber-400 font-extrabold text-xl sm:text-2xl mt-1.5">
              ՀԱՂԹԱՆԱԿ: ԴՈՒ ԳՈՒՇԱԿԵՑԻՐ ՌՈՆԱԼԴՈՒԻՆ
            </p>

            <div className="my-5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm sm:text-base">
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                <span>Puntuación final / Վերջնական միավոր:</span>
                <span className="text-amber-400 font-mono font-black text-lg">{score} pts</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                <span>Palabra descubierta / Գուշակված բառ:</span>
                <span className="text-white font-mono font-black tracking-widest text-lg">RONALDO</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-300">
                <span>Situaciones respondidas / Լուծված իրավիճակներ:</span>
                <span className="text-emerald-400 font-mono font-black">
                  {Object.keys(quizHistory).length} / 20
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsWordSolved(false);
                  fireConfetti();
                }}
                className="flex-1 py-3.5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-200 font-bold text-sm sm:text-base"
              >
                Seguir explorando
              </button>
              <button
                onClick={handleRestartGame}
                className="flex-1 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm sm:text-base transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Reiniciar juego</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs sm:text-sm text-slate-500 w-full">
        <span>Rueda de Fútbol (Polé Chudes) · Español desde el Armenio · A2–B1 Fútbol Quiz</span>
      </footer>
    </div>
  );
}
