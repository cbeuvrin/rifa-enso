import React, { useState, useEffect } from 'react';
import { User, Briefcase, Coffee, Award, Star, Zap, AlertCircle } from 'lucide-react';
import EMPLOYEES_DATA from './data/employees.json';
import PRIZES_DATA from './data/prizes.json';
import AdminDashboard from './AdminDashboard';
import { supabase } from './supabaseClient';


// --- VISUAL ASSETS ---
const MultivaLogo = ({ className }) => (
  <img src="/multiva-icon.png" alt="M" className={`${className} object-contain`} />
);


const ICONS = [
  { id: 'logo', component: MultivaLogo, color: '', label: 'MULTIVA' }, // Winning symbol

  { id: 'user', component: User, color: 'text-yellow-200', label: 'User' },
  { id: 'briefcase', component: Briefcase, color: 'text-yellow-600', label: 'Work' },
  { id: 'coffee', component: Coffee, color: 'text-amber-700', label: 'Break' },
  { id: 'award', component: Award, color: 'text-purple-400', label: 'Prize' },
  { id: 'star', component: Star, color: 'text-yellow-100', label: 'Star' },
  { id: 'zap', component: Zap, color: 'text-orange-400', label: 'Zap' },
];

const BATCH_SIZE = 27;
const PRIZES_PER_BATCH = 3;
const WIN_PROBABILITY = 0.18; // Slightly higher than 3/27 (0.11) to ensure prizes drop randomly but cap at 3
// 4 Rows x 6 Columns = 24 Slots
const REEL_COUNT = 5;
const ROW_COUNT = 3;

const VirtualKeypad = ({ mode, onInput, className }) => {
  const numericKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'DEL', '0', 'OK'];
  const qwertyKeys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  if (mode === 'numeric') {
    return (
      <div className={`grid grid-cols-3 gap-6 w-full max-w-[400px] mx-auto p-8 bg-[#121212] rounded-[3rem] shadow-[inset_0_0_20px_rgba(0,0,0,1),0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 ${className}`}>
        {numericKeys.map(key => {
          const isDel = key === 'DEL';
          const isOk = key === 'OK';
          const isNumber = !isDel && !isOk;

          // Refined Palette
          const goldBorder = '#b8860b';

          return (
            <button
              key={key}
              onClick={() => onInput(key === 'OK' ? 'ENTER' : key)}
              className={`
                  relative w-24 h-24 rounded-full flex items-center justify-center
                  text-2xl font-serif font-bold transition-all active:scale-95 active:shadow-none
                  group
                  
                  /* 
                    ULTRA REALISTIC SHADOWS:
                    1. 0 15px 35px rgba(0,0,0,0.9) -> The main deep drop shadow spreading far.
                    2. 0 5px 15px rgba(0,0,0,1) -> The tighter, darker shadow underneath.
                    3. inset 0 1px 0 rgba(255,255,255,0.15) -> Top edge highlight (lighting).
                  */
                  shadow-[0_15px_35px_-5px_rgba(0,0,0,1),0_8px_10px_-6px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.15)]
                  border-[2px]
                  
                  /* Dynamic Backgrounds & Borders */
                  ${isNumber ? `bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#000] border-[#b8860b] text-[#e6c200]` : ''}
                  ${isDel ? `bg-gradient-to-b from-[#3a0000] via-[#200000] to-[#100000] border-[#b8860b] text-[#e6c200]` : ''}
                  ${isOk ? `bg-gradient-to-b from-[#003300] via-[#001a00] to-[#000f00] border-[#b8860b] text-[#e6c200]` : ''}
                `}
              style={{ borderColor: goldBorder }}
            >
              {/* 1. Gloss / Sheen (Top half) - Sharper for realism */}
              <div className="absolute top-[2px] inset-x-[2px] h-[40%] bg-gradient-to-b from-white/10 to-transparent rounded-t-full"></div>

              {/* 2. Inner Shadow Ring (The "dished" part of the button look) */}
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] pointer-events-none"></div>

              <span className="relative z-10 drop-shadow-[0_2px_4px_black] text-4xl" style={{ color: '#e6c200' }}>
                {key}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // QWERTY Mode
  return (
    <div className={`flex flex-col gap-4 w-full max-w-[95%] mx-auto p-8 bg-[#121212] rounded-[3rem] shadow-[inset_0_0_30px_rgba(0,0,0,1)] border border-white/5 ${className}`}>
      {qwertyKeys.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1.5">
          {row.map(key => (
            <button
              key={key}
              onClick={() => onInput(key)}
              className="
                  relative w-14 h-14 md:w-20 md:h-20 rounded-full 
                  bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#000]
                  border-[1px] border-[#b8860b]
                  text-[#e6c200] font-serif font-bold text-2xl md:text-3xl
                  shadow-[0_8px_15px_-4px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.1)]
                  active:scale-95 transition-transform flex items-center justify-center
                  overflow-hidden group
                "
            >
              <div className="absolute top-[1px] inset-x-[1px] h-[40%] bg-gradient-to-b from-white/10 to-transparent rounded-t-full"></div>
              {key}
            </button>
          ))}
        </div>
      ))}
      {/* Space / Del / Enter Row */}
      <div className="flex justify-center gap-3 mt-4">
        <button onClick={() => onInput('DEL')} className="px-8 h-20 rounded-full bg-gradient-to-b from-[#3a0000] via-[#200000] to-[#100000] border-[1px] border-[#b8860b] text-[#e6c200] font-serif font-bold tracking-widest active:scale-95 shadow-[0_8px_15px_-4px_rgba(0,0,0,1)] relative overflow-hidden text-xl">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-20"></div>
          BORRAR
        </button>
        <button onClick={() => onInput(' ')} className="flex-1 max-w-[350px] h-20 rounded-full bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#000] border-[1px] border-[#b8860b] text-[#e6c200] font-serif font-bold active:scale-95 shadow-[0_8px_15px_-4px_rgba(0,0,0,1)] relative overflow-hidden text-xl">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-20"></div>
          ESPACIO
        </button>
        <button onClick={() => onInput('ENTER')} className="px-8 h-20 rounded-full bg-gradient-to-b from-[#003300] via-[#001a00] to-[#000f00] border-[1px] border-[#b8860b] text-[#e6c200] font-serif font-bold tracking-widest active:scale-95 shadow-[0_8px_15px_-4px_rgba(0,0,0,1)] relative overflow-hidden text-xl">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-20"></div>
          ENTRAR
        </button>
      </div>
    </div>
  );
};

export default function App() {
  // --- STATE ---
  // Screens: 'login-id', 'login-name', 'game'
  const [currentScreen, setCurrentScreen] = useState('login-id');

  // Login Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    surname: ''
  });

  // Track which field is active for the keyboard in Step 2
  const [activeField, setActiveField] = useState('name'); // 'name' or 'surname'

  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  const [isSpinning, setIsSpinning] = useState(false);
  // States: 'waiting' | 'spinning' | 'stopping' | 'stopped'
  const [reelStatuses, setReelStatuses] = useState(['waiting', 'waiting', 'waiting', 'waiting', 'waiting']);

  // Initialize 5 Reels with 3 Rows each
  const [reels, setReels] = useState(() =>
    Array(REEL_COUNT).fill(null).map(() =>
      Array(ROW_COUNT).fill(null).map(() => ICONS[Math.floor(Math.random() * (ICONS.length - 1)) + 1])
    )
  );

  const [gameResult, setGameResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Local stats for batching (still local, but history is global)
  const [totemStats, setTotemStats] = useState({
    totalPlays: 0,
    currentBatchWins: 0,
    lastResetBatch: 0
  });

  // --- EFFECTS ---
  useEffect(() => {
    const savedStats = localStorage.getItem('totem_stats');
    if (savedStats) setTotemStats(JSON.parse(savedStats));

    // Check for Admin Mode via URL (e.g. ?admin=true or #admin)
    const checkAdmin = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true' || window.location.hash === '#admin') {
        setCurrentScreen('admin');
      }
    };
    checkAdmin();
  }, []);


  useEffect(() => {
    localStorage.setItem('totem_stats', JSON.stringify(totemStats));
  }, [totemStats]);

  // --- LOGIC ---

  // Safety: If HMR keeps old state 'login', switch to 'login-id'
  useEffect(() => {
    if (currentScreen === 'login') {
      setCurrentScreen('login-id');
    }
  }, [currentScreen]);

  // Virtual Keypad Handlers
  const handleKeypadInput = (key) => {
    setError('');
    if (key === 'DEL') {
      if (currentScreen === 'login-id') {
        setFormData(prev => ({ ...prev, id: prev.id.slice(0, -1) }));
      } else if (currentScreen === 'login-name') {
        setFormData(prev => ({ ...prev, [activeField]: prev[activeField].slice(0, -1) }));
      }
    } else if (key === 'ENTER') {
      if (currentScreen === 'login-id') handleCheckId();
      else if (currentScreen === 'login-name') handleFinalLogin();
    } else if (key === 'CLEAR') {
      // Optional clear all
      if (currentScreen === 'login-id') {
        setFormData(prev => ({ ...prev, id: '' }));
      }
    } else {
      // Regular character input
      if (currentScreen === 'login-id') {
        // Limit ID length if needed, e.g. 10 chars
        if (formData.id.length < 10) {
          setFormData(prev => ({ ...prev, id: prev.id + key }));
        }
      } else if (currentScreen === 'login-name') {
        setFormData(prev => ({ ...prev, [activeField]: prev[activeField] + key }));
      }
    }
  };

  const handleCheckId = async () => {
    const { id } = formData;
    if (!id) {
      setError("INGRESA TU NÚMERO DE EMPLEADO");
      return;
    }

    const user = EMPLOYEES_DATA.find(emp => emp.id === String(id));
    if (!user) {
      setError("ID NO ENCONTRADO");
      return;
    }

    // CHECK DB FOR PREVIOUS PLAY
    // Exception for Test IDs
    if (user.id !== '9999' && user.id !== '32') {
      try {
        const { data, error: dbError } = await supabase
          .from('game_history')
          .select('id')
          .eq('employee_id', String(id))
          .limit(1);

        if (dbError) {
          console.error("Error checking history:", dbError);
          // Optional: Allow play if DB fails? Or block?
          // setError("ERROR DE CONEXIÓN"); return;
        }

        if (data && data.length > 0) {
          setError("YA JUGASTE");
          return;
        }
      } catch (e) {
        console.error("Connection failed", e);
      }
    }

    // Found valid user, move to next step
    setError('');
    setCurrentScreen('login-name');
  };

  const handleFinalLogin = () => {
    const { id, name, surname } = formData;

    if (!name || !surname) {
      setError("INGRESA NOMBRE Y APELLIDOS");
      return;
    }

    // Find employee again (safety)
    const user = EMPLOYEES_DATA.find(emp => emp.id === String(id));

    // Check match (Robust Token logic)
    // Allows matching any part of the name (e.g. "Virginia" matches "Amalia Virginia")
    // Ignores order (e.g. "Virginia Amalia" matches "Amalia Virginia")
    const checkMatch = (dbStr, inputStr) => {
      if (!dbStr || !inputStr) return false;
      const dbTokens = dbStr.trim().toUpperCase().split(/\s+/);
      const inputTokens = inputStr.trim().toUpperCase().split(/\s+/);
      // Pass if every word typed by user exists in the database record
      return inputTokens.every(token => dbTokens.includes(token));
    };

    const isNameValid = checkMatch(user.name, name);
    const isSurnameValid = checkMatch(user.surname, surname);

    if (!isNameValid || !isSurnameValid) {
      // Fallback: Try matching against the Full Name (handles mixed fields)
      if (!checkMatch(user.fullName, `${name} ${surname}`)) {
        setError("DATOS INCORRECTOS");
        return;
      }
    }

    setCurrentUser(user);
    setError('');
    setCurrentScreen('game');
    // Reset slots to mix
    setReels(Array(REEL_COUNT).fill(null).map(() =>
      Array(ROW_COUNT).fill(null).map(() => ICONS[Math.floor(Math.random() * (ICONS.length - 1)) + 1])
    ));
    setGameResult(null);
  };

  const spin = async () => {
    if (isSpinning) return;
    if (!currentUser) return;

    setIsSpinning(true);
    setReelStatuses(['spinning', 'spinning', 'spinning', 'spinning', 'spinning']);

    // --- DETERMINE WIN/LOSS IMMEDIATELY ---

    let isWinner = false;
    let emergencyMode = false;

    // 0. CHECK EMERGENCY MODE (Globally enabled?)
    try {
      const { data: settings } = await supabase
        .from('app_settings')
        .select('emergency_mode')
        .eq('id', 1)
        .single();

      if (settings) {
        emergencyMode = settings.emergency_mode;
      }
    } catch (e) {
      console.warn("Could not fetch emergency settings (table might be missing)", e);
    }

    // 1. Logic Check (Director & Tenure)
    const isDirector = currentUser.role === 'director';
    let isNewEmployee = false;
    let diffDays = 0; // calculated below

    if (currentUser.hiringDate) {
      const hiringDate = new Date(currentUser.hiringDate);
      const today = new Date();
      const diffTime = Math.abs(today - hiringDate);
      diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 90) {
        isNewEmployee = true;
      }
    }

    // --- INVENTORY CHECK ---
    let availablePrizes = [];
    try {
      // Fetch all winning prizes given so far
      const { data: prizeHistory, error: prizeError } = await supabase
        .from('game_history')
        .select('prize')
        .eq('win', true);

      if (!prizeError && prizeHistory) {
        // Count distributed prizes
        const distributedCounts = {};
        prizeHistory.forEach(row => {
          if (row.prize) distributedCounts[row.prize] = (distributedCounts[row.prize] || 0) + 1;
        });

        // Filter prizes that still have inventory
        // Filter out "Total" row if present in JSON
        availablePrizes = PRIZES_DATA.filter(p => p.name !== 'Total').filter(p => {
          const used = distributedCounts[p.name] || 0;
          return used < p.total;
        });
      }
    } catch (e) {
      console.error("Inventory check failed", e);
    }

    // WIN CONDITION:
    if (isDirector || isNewEmployee) {
      isWinner = false;
    } else {
      // 2. Batch limit check
      const currentBatchIndex = Math.floor(totemStats.totalPlays / BATCH_SIZE);
      let winsInCurrentBatch = totemStats.currentBatchWins;
      if (currentBatchIndex > totemStats.lastResetBatch) winsInCurrentBatch = 0;

      // PRIZE AVAILABILITY CHECK
      if (winsInCurrentBatch >= PRIZES_PER_BATCH) {
        // No prizes left in this batch -> LOSE
        isWinner = false;
      } else if (availablePrizes.length === 0) {
        // GLOBAL INVENTORY EMPTY -> LOSE (Safety)
        console.warn("Inventory Exhausted!");
        isWinner = false;
      } else if (emergencyMode) {
        // EMERGENCY MODE ON + PRIZES AVAILABLE in Batch & Global -> FORCE WIN
        isWinner = true;
      } else {
        // 3. Normal Probability Check
        isWinner = Math.random() < WIN_PROBABILITY;
      }
    }

    // FORCE WIN FOR TESTING
    if (currentUser.id === '9999') isWinner = true;

    // Safety check again: If supposed to win but no prizes available globally
    if (isWinner && availablePrizes.length === 0) {
      isWinner = false;
    }

    // Generate result reels
    let finalReels = Array(REEL_COUNT).fill(null).map(() =>
      Array(ROW_COUNT).fill(null).map(() => ICONS[Math.floor(Math.random() * ICONS.length)])
    );

    let prize = null;

    if (isWinner) {
      // WIN: Set Middle Row (Around Index 1) to LOGO
      finalReels = finalReels.map(reel => {
        const newReel = [...reel];
        newReel[1] = ICONS[0]; // Center is Logo
        return newReel;
      });

      // SELECT PRIZE FROM AVAILABLE POOL
      const randomIdx = Math.floor(Math.random() * availablePrizes.length);
      prize = availablePrizes[randomIdx].name;

      setTotemStats(prev => ({
        ...prev,
        totalPlays: prev.totalPlays + 1,
        currentBatchWins: prev.currentBatchWins + 1,
        lastResetBatch: Math.floor((prev.totalPlays + 1) / BATCH_SIZE)
      }));
    } else {
      // LOSE
      const middleRow = finalReels.map(r => r[1]);
      const accidentalWin = middleRow.every(s => s.id === 'logo');
      if (accidentalWin) {
        finalReels[0][1] = ICONS[1];
      }

      setTotemStats(prev => ({
        ...prev,
        totalPlays: prev.totalPlays + 1
      }));
    }

    // UPDATE REELS IMMEDIATELY (Hidden by spin overlay)
    setReels(finalReels);

    // --- SAVE TO SUPABASE ---
    try {
      const { error: insertError } = await supabase.from('game_history').insert([{
        employee_id: currentUser.id,
        employee_name: currentUser.fullName,
        tenure_days: isNewEmployee ? diffDays : null,
        win: isWinner,
        prize: prize
      }]);

      if (insertError) {
        console.error("Error saving game:", insertError);
      }
    } catch (e) {
      console.error("Supabase insert exception:", e);
    }


    // --- ANIMATION SEQUENCE ---

    // Timings for staggered stops (0.5s apart starting at 2s)
    const stopTimings = [2000, 2500, 3000, 3500, 4000];

    stopTimings.forEach((time, index) => {
      // 1. TRIGGER STOPPING (Landing Animation - Slides result in)
      setTimeout(() => {
        setReelStatuses(prev => {
          const newStatus = [...prev];
          newStatus[index] = 'stopping';
          return newStatus;
        });

        // 2. TRIGGER STOPPED (Static Lock) after animation duration
        setTimeout(() => {
          setReelStatuses(prev => {
            const newStatus = [...prev];
            newStatus[index] = 'stopped';
            return newStatus;
          });
        }, 400); // Matches .animate-reel-land duration

      }, time);
    });

    // Finalize UI after animation
    setTimeout(() => {
      setIsSpinning(false);
      setGameResult({ win: isWinner, prize: prize });
      // Show Modal shortly after
      setTimeout(() => {
        setShowResultModal(true);
      }, 1500);
    }, 4600);
  };


  const resetGame = () => {
    setFormData({ id: '', name: '', surname: '' });
    setCurrentUser(null);
    setGameResult(null);
    setShowResultModal(false);
    setCurrentScreen('login-id');
    setReels(Array(REEL_COUNT).fill(null).map(() =>
      Array(ROW_COUNT).fill(null).map(() => ICONS[Math.floor(Math.random() * (ICONS.length - 1)) + 1])
    ));
    setError('');
  };

  return (
    <div className="h-screen md:h-auto md:min-h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center relative selection:bg-yellow-500/20 font-serif overflow-hidden md:overflow-y-auto md:py-10">

      {/* ADMIN DASHBOARD VIEW */}
      {currentScreen === 'admin' ? (
        <AdminDashboard onBack={() => {
          // Clear query param to return
          window.history.pushState({}, document.title, window.location.pathname);
          setCurrentScreen('login-id');
        }} />
      ) : (
        <>
          {/* GLOBAL BACKGROUND: Elegant Deco Pattern */}
          <div className="absolute inset-0 bg-[#050505] overflow-hidden fixed">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#443300_0%,_#000_100%)] opacity-40"></div>
            {/* Subtle Art Deco rays pattern effect (Static) - REMOVED SQUARES/GRID TEXTURE */}

            {/* POTENT LIGHT RAYS (Spinning background) */}
            <div className="absolute inset-[-50%] opacity-50 animate-[spin_60s_linear_infinite] pointer-events-none mix-blend-screen">
              <div className="w-full h-full bg-[repeating-conic-gradient(from_0deg_at_50%_50%,_rgba(255,255,255,0.2)_0deg,_rgba(255,255,255,0.2)_5deg,_transparent_5deg,_transparent_15deg)]"></div>
            </div>
          </div>

          {/* THE CABINET - FULL SCREEN VERTICAL */}
          {/* Responsive Fix: On desktop/landscape (md), auto height + limited width to simulate totem + allow scroll */}
          <div className="relative z-10 flex flex-col items-center w-full h-full md:h-auto md:w-full md:landscape:w-[500px] md:portrait:w-full md:portrait:max-w-none md:aspect-auto transition-all duration-300">

            {/* TOPPER */}
            <div className="w-[80%] md:w-[60%] h-12 bg-gradient-to-tb from-yellow-700 via-yellow-400 to-yellow-800 rounded-t-full flex items-center justify-center border-b-4 border-black shadow-[0_-5px_20px_rgba(255,215,0,0.3)] relative overflow-hidden -mb-1 z-0">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_20%,#ffffff80_50%,transparent_80%)] animate-[shimmer_3s_infinite] pointer-events-none"></div>
            </div>

            {/* MAIN CHASSIS */}
            <div className="w-full h-full flex-1 bg-black rounded-3xl p-3 shadow-[0_30px_60px_-10px_rgba(0,0,0,1),0_0_0_2px_#332200] relative flex flex-col z-10">
              <div className="absolute inset-0 rounded-3xl border-[8px] border-transparent bg-gradient-to-br from-yellow-600 via-yellow-200 to-yellow-800 [mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] z-20 pointer-events-none shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]"></div>
              <div className="absolute inset-0 bg-zinc-900 rounded-3xl opacity-95 noise-bg"></div>

              {/* SCREEN CONTAINER */}
              <div className="relative z-30 flex flex-col h-full bg-zinc-950 rounded-2xl border-4 border-zinc-800 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] overflow-hidden">

                {/* HEADER */}
                <div className="h-44 bg-gradient-to-b from-black via-zinc-900 to-black border-b-2 border-yellow-600/30 flex items-center justify-center relative p-2 shadow-lg shrink-0">
                  <div className="absolute left-4 w-2 h-32 rounded-full bg-yellow-900 shadow-[0_0_10px_orange]"></div>
                  <div className="absolute right-4 w-2 h-32 rounded-full bg-yellow-900 shadow-[0_0_10px_orange]"></div>
                  <img src="/gatsby-logo.png" alt="Navidad Gatsby" className="h-full object-contain drop-shadow-[0_0_15px_rgba(255,200,0,0.3)] filter brightness-110 py-2" />
                </div>

                {/* SCREEN CONTENT */}
                <div className="p-6 relative flex-1 flex flex-col">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-0"></div>

                  {/* === LOGIN VIEW WRAPPER === */}
                  {(currentScreen === 'login-id' || currentScreen === 'login-name') && (
                    <div className="flex-1 flex flex-col items-center justify-center z-10 animate-in fade-in duration-500 w-full max-w-4xl mx-auto h-full">

                      {/* STEP 1: ID INPUT */}
                      {currentScreen === 'login-id' && (
                        <div className="w-full max-w-md flex flex-col items-center gap-8">
                          <h2 className="text-yellow-500 font-serif text-sm tracking-[0.4em] uppercase drop-shadow-md text-center">Identificaci&oacute;n de Colaborador</h2>

                          <div className="relative group w-full">
                            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                            <input
                              type="text"
                              value={formData.id}
                              readOnly
                              placeholder="NÚMERO DE EMPLEADO"
                              className="relative w-full bg-black border-2 border-yellow-600 rounded-lg py-6 px-6 text-yellow-100 font-mono text-3xl text-center tracking-[0.5em] focus:outline-none focus:border-yellow-400 placeholder:text-zinc-800 uppercase shadow-[inset_0_2px_10px_rgba(0,0,0,1)]"
                            />
                          </div>

                          <VirtualKeypad mode="numeric" onInput={handleKeypadInput} className="mt-4" />
                        </div>
                      )}

                      {/* STEP 2: NAME INPUT */}
                      {currentScreen === 'login-name' && (
                        <div className="w-full flex flex-col items-center gap-4 h-full pt-4">
                          <h2 className="text-yellow-500 font-serif text-sm tracking-[0.4em] uppercase drop-shadow-md text-center">Confirmaci&oacute;n de Identidad</h2>

                          <div className="flex gap-4 w-full max-w-2xl">
                            {/* ID Display */}
                            <div
                              className={`relative group flex-1 opacity-70 cursor-not-allowed`}
                            >
                              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-lg blur opacity-0"></div>
                              <input
                                type="text"
                                value={formData.id}
                                readOnly
                                className="relative w-full bg-black border-2 border-yellow-800/30 rounded-lg py-4 px-4 text-yellow-100 font-serif text-xl text-center tracking-widest focus:outline-none uppercase shadow-[inset_0_2px_10px_rgba(0,0,0,1)]"
                              />
                              <div className="flex justify-between items-center mt-1 px-1">
                                <div className="text-[10px] text-yellow-600 tracking-widest uppercase">ID EMPLEADO</div>
                                <button
                                  onClick={() => {
                                    setCurrentScreen('login-id');
                                    setFormData(prev => ({ ...prev, id: '' }));
                                  }}
                                  className="text-[10px] text-yellow-600/70 hover:text-yellow-400 uppercase tracking-widest underline decoration-yellow-800/50 hover:decoration-yellow-400 transition-all"
                                >
                                  (Corregir)
                                </button>
                              </div>
                            </div>

                            {/* Name Input */}
                            <div
                              className={`relative group flex-1 cursor-pointer transition-all ${activeField === 'name' ? 'scale-105' : 'opacity-70'}`}
                              onClick={() => setActiveField('name')}
                            >
                              <div className={`absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-lg blur opacity-20 transition duration-1000 ${activeField === 'name' ? 'opacity-50' : 'opacity-0'}`}></div>
                              <input
                                type="text"
                                value={formData.name}
                                readOnly
                                placeholder="NOMBRE(S)"
                                className={`relative w-full bg-black border-2 rounded-lg py-4 px-4 text-yellow-100 font-serif text-xl text-center tracking-widest focus:outline-none placeholder:text-zinc-800 uppercase shadow-[inset_0_2px_10px_rgba(0,0,0,1)] ${activeField === 'name' ? 'border-yellow-400 bg-yellow-900/10' : 'border-yellow-800/30'}`}
                              />
                              <div className="text-center text-[10px] text-yellow-600 mt-1 tracking-widest uppercase">NOMBRE</div>
                            </div>

                            {/* Surname Input */}
                            <div
                              className={`relative group flex-1 cursor-pointer transition-all ${activeField === 'surname' ? 'scale-105' : 'opacity-70'}`}
                              onClick={() => setActiveField('surname')}
                            >
                              <div className={`absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-lg blur opacity-20 transition duration-1000 ${activeField === 'surname' ? 'opacity-50' : 'opacity-0'}`}></div>
                              <input
                                type="text"
                                value={formData.surname}
                                readOnly
                                placeholder="APELLIDOS"
                                className={`relative w-full bg-black border-2 rounded-lg py-4 px-4 text-yellow-100 font-serif text-xl text-center tracking-widest focus:outline-none placeholder:text-zinc-800 uppercase shadow-[inset_0_2px_10px_rgba(0,0,0,1)] ${activeField === 'surname' ? 'border-yellow-400 bg-yellow-900/10' : 'border-yellow-800/30'}`}
                              />
                              <div className="text-center text-[10px] text-yellow-600 mt-1 tracking-widest uppercase">APELLIDOS</div>
                            </div>
                          </div>

                          <VirtualKeypad mode="alpha" onInput={handleKeypadInput} className="mt-auto mb-4" />
                        </div>
                      )}

                      {error && (
                        <div className="mt-4 w-full text-center animate-pulse">
                          <div className="inline-block bg-red-950/90 text-red-200 px-6 py-2 rounded border border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                            <span className="font-bold tracking-widest text-xs uppercase">{error}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* === GAME VIEW (5-REEL SLOT MACHINE) === */}
                  {currentScreen === 'game' && (
                    <div className="flex-1 flex flex-col z-10 animate-in zoom-in duration-300 h-full">

                      {/* SLOT MACHINE CONTAINER */}
                      <div className="flex-1 bg-[#050505] border-4 border-yellow-700/40 rounded-lg p-4 relative shadow-[inset_0_0_30px_rgba(0,0,0,1)] mb-6 overflow-hidden flex flex-col justify-center">

                        {/* REELS CONTAINER */}
                        <div className="flex justify-between gap-3 h-full w-full max-w-6xl mx-auto relative z-10 px-4">
                          {/* RED PAYLINE LASER - Moved inside to center on REELS */}
                          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-red-600/90 z-40 shadow-[0_0_10px_#f00,0_0_20px_#f00] pointer-events-none transform -translate-y-1/2"></div>

                          {reels.map((reel, reelIndex) => (
                            <div key={reelIndex} className="flex-1 rounded-lg overflow-hidden relative shadow-[inset_0_0_20px_black] border-x border-[#333]">
                              {/* CYLINDER BACKGROUND EFFECT */}
                              <div className="absolute inset-0 bg-gradient-to-r from-black via-[#1a1a1a] to-black z-0"></div>

                              {/* SYMBOLS CONTAINER */}
                              <div className="relative z-10 h-full overflow-hidden">
                                {(() => {
                                  const status = reelStatuses[reelIndex]; // 'waiting', 'spinning', 'stopping', 'stopped'
                                  const isAnimating = status === 'spinning' || status === 'stopping';

                                  return (
                                    <>
                                      {/* 1. BASE STATIC LAYER (Always rendered for layout) 
                                           - Visually hidden (opacity-0) if animating to prevent bleed-through 
                                           - But keeps the 'flex-1' space filled
                                        */}
                                      <div className={`flex flex-col justify-center gap-0 h-full transition-opacity duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                                        {reel.map((symbol, symbolIndex) => (
                                          <div key={symbolIndex} className="flex-1 flex items-center justify-center">
                                            <symbol.component
                                              className={`
                                                  w-[70%] h-[70%] drop-shadow-lg filter 
                                                  ${symbolIndex === 1 && gameResult?.win ? 'drop-shadow-[0_0_15px_gold] brightness-125 scale-110' : ''}
                                                  ${symbol.color}
                                                `}
                                            />
                                          </div>
                                        ))}
                                      </div>

                                      {/* 2. SPINNING OVERLAY */}
                                      {status === 'spinning' && (
                                        <div
                                          className="absolute top-0 left-0 w-full h-[200%] flex flex-col animate-reel-spin z-20"
                                          style={{ animationDelay: `${-(reelIndex * 0.15 + Math.random() * 0.2)}s` }}
                                        >
                                          {/* Mixed Icons for spin variety */}
                                          {[ICONS[0], ICONS[4], ICONS[2], ICONS[0], ICONS[5], ICONS[0]].map((icon, idx) => (
                                            <div key={`spin-${idx}`} className="flex-1 flex items-center justify-center">
                                              <icon.component className={`w-[70%] h-[70%] ${icon.color} opacity-90 blur-[1px]`} />
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* 3. LANDING OVERLAY */}
                                      {status === 'stopping' && (
                                        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center py-0 animate-reel-land z-30 bg-[#050505]">
                                          {reel.map((symbol, symbolIndex) => (
                                            <div key={`land-${symbolIndex}`} className="flex-1 flex items-center justify-center">
                                              <symbol.component className={`w-[70%] h-[70%] ${symbol.color} drop-shadow-md`} />
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}

                                {/* GLOSS OVERLAY */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none z-20"></div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* STATUS / RESULT */}
                        <div className="h-20 bg-zinc-900 rounded-lg border border-yellow-800/30 flex items-center justify-center mb-6 shadow-[inset_0_0_10px_black] relative overflow-hidden shrink-0">
                          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#000_2px,#000_4px)] opacity-20"></div>
                          {gameResult ? (
                            <div className="text-center animate-bounce z-10 p-2">
                              {gameResult.win ? (
                                <>
                                  <div className="text-yellow-500 font-bold uppercase tracking-widest text-lg drop-shadow-[0_2px_2px_black]">¡GANADOR!</div>
                                  <div className="text-white font-mono text-xs">{gameResult.prize.name}</div>
                                </>
                              ) : (
                                <div className="text-gray-400 font-bold uppercase tracking-widest text-lg">INTENTA DE NUEVO</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-yellow-600/70 text-sm font-bold uppercase tracking-[0.3em] animate-pulse">
                              {isSpinning ? "GIRANDO..." : `¡HOLA, ${currentUser?.name.split(' ')[0]}!`}
                            </div>
                          )}
                        </div>

                        {/* ACTION BUTTON */}
                        <div className="flex justify-center shrink-0">
                          <button
                            onClick={gameResult ? resetGame : spin}
                            disabled={isSpinning}
                            className={`
                          relative w-full max-w-[240px] h-16 rounded-full
                          border-b-4 border-r-4 border-black
                          active:border-b-0 active:border-r-0 active:translate-y-1 active:translate-x-1
                          shadow-[0_10px_20px_rgba(0,0,0,0.5)]
                          transition-all group overflow-hidden
                      `}
                          >
                            <div className={`absolute inset-0 ${gameResult ? 'bg-gradient-to-t from-yellow-800 to-yellow-500' : 'bg-gradient-to-t from-red-800 to-red-500'}`}></div>
                            <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/40 to-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-white font-black uppercase text-xl tracking-widest drop-shadow-md group-hover:scale-105 transition-transform">
                                {gameResult ? "SALIR" : "GIRAR"}
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FOOTER */}
                  <div className="h-8 bg-zinc-950 border-t border-white/5 flex items-center justify-between px-6 shrink-0">
                    <div className="w-16 h-1 bg-yellow-900/50 rounded-full"></div>
                    <div className="text-[10px] text-zinc-700 font-mono">SERIES: 2024-GATSBY-01</div>
                    <div className="w-16 h-1 bg-yellow-900/50 rounded-full"></div>
                  </div>

                </div>
              </div>

              {/* REFLECTION */}
              <div className="w-[80%] h-8 bg-black/50 rounded-[100%] blur-xl -mt-4 z-0"></div>

            </div>
          </div>
        </>
      )}

      {/* === RESULT MODAL === */}
      {showResultModal && gameResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-in fade-in duration-300 p-4">
          <div className="relative bg-[#1a1a1a] border-2 border-[#b8860b] rounded-3xl p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(184,134,11,0.3)] flex flex-col items-center overflow-hidden">

            {/* Modal Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#443300_0%,_transparent_70%)] opacity-20 pointer-events-none"></div>
            {gameResult.win && (
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse pointer-events-none"></div>
            )}

            {/* HEADER LOGOS */}
            <div className="relative z-10 flex flex-col items-center gap-4 mb-6 w-full">
              <img src="/gatsby-logo.png" alt="Navidad Gatsby" className="h-32 object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
            </div>

            {/* CONTENT */}
            <div className="relative z-10 mb-8">
              {gameResult.win ? (
                <>
                  <h2 className="text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-[#ffd700] to-[#b8860b] drop-shadow-[0_2px_4px_black] mb-2 animate-bounce">
                    ¡GANASTE!
                  </h2>
                  <div className="text-yellow-100/90 font-mono tracking-widest uppercase mb-4 text-sm">TU PREMIO ES:</div>
                  <div className="text-3xl md:text-4xl font-bold text-white uppercase drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] border-2 border-[#b8860b] bg-black/50 rounded-xl py-4 px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                    {gameResult.prize}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-serif text-gray-400 mb-4 tracking-widest uppercase">
                    ¡CASI... CASI!
                  </h2>
                  <p className="text-yellow-600/80 font-mono text-lg uppercase">
                    SUERTE PARA LA PRÓXIMA
                  </p>
                </>
              )}
            </div>

            {/* BUTTON */}
            <button
              onClick={resetGame}
              className="relative z-10 bg-gradient-to-b from-[#b8860b] to-[#805d00] text-white font-bold font-serif uppercase tracking-[0.2em] py-4 px-12 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.5)] active:scale-95 transition-transform hover:brightness-110 border border-[#ffd700]/30"
            >
              ACEPTAR
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
