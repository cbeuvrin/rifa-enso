import React, { useState, useEffect } from 'react';
import { User, Briefcase, Coffee, Award, Star, Zap, AlertCircle } from 'lucide-react';

// --- VISUAL ASSETS ---
const MultivaLogo = ({ className }) => (
  <img src="/multiva-logo-new.png" alt="M" className={`${className} object-contain`} />
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

// --- MOCK DATA & CONFIGURATION ---
const generateEmployees = () => {
  const employees = {};
  for (let i = 1000; i < 2200; i++) {
    const isDirector = i % 20 === 0;
    employees[i.toString()] = {
      id: i.toString(),
      name: `Empleado ${i}`,
      role: isDirector ? 'director' : 'empleado'
    };
  }
  return employees;
};

const MOCK_EMPLOYEES = generateEmployees();

const PRIZES_LIST = [
  "Bono $500 MXN", "Día Libre", "Tarjeta Amazon $200", "Kit Corporativo",
  "Audífonos Bluetooth", "Cena para dos", "Termo Premium", "Smartwatch Básico"
];

const BATCH_SIZE = 250;
const PRIZES_PER_BATCH = 20;
const WIN_PROBABILITY = 0.15;

export default function App() {
  // --- STATE ---
  const [currentScreen, setCurrentScreen] = useState('login');
  const [employeeId, setEmployeeId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  const [isSpinning, setIsSpinning] = useState(false);
  // Initialize slots with non-winning icons
  const [slots, setSlots] = useState([ICONS[1], ICONS[2], ICONS[3], ICONS[4], ICONS[5]]);
  const [gameResult, setGameResult] = useState(null);

  const [totemStats, setTotemStats] = useState({
    totalPlays: 0,
    currentBatchWins: 0,
    lastResetBatch: 0
  });

  const [playedEmployees, setPlayedEmployees] = useState(() => {
    const saved = localStorage.getItem('played_employees');
    return saved ? JSON.parse(saved) : [];
  });

  // --- EFFECTS ---
  useEffect(() => {
    const savedStats = localStorage.getItem('totem_stats');
    if (savedStats) setTotemStats(JSON.parse(savedStats));
  }, []);

  useEffect(() => {
    localStorage.setItem('totem_stats', JSON.stringify(totemStats));
  }, [totemStats]);

  useEffect(() => {
    localStorage.setItem('played_employees', JSON.stringify(playedEmployees));
  }, [playedEmployees]);

  // --- LOGIC ---
  const handleKeypadClick = (value) => {
    if (currentScreen !== 'login') return;

    if (value === 'C') {
      setEmployeeId('');
      setError('');
    } else if (value === 'Enter') {
      handleLogin();
    } else if (employeeId.length < 4) {
      setEmployeeId(prev => prev + value);
    }
  };

  const handleLogin = () => {
    if (!employeeId) {
      setError("INGRESE ID");
      return;
    }
    const user = MOCK_EMPLOYEES[employeeId];
    if (!user) {
      setError("ID INVÁLIDO");
      return;
    }
    if (playedEmployees.includes(user.id)) {
      setError("YA PARTICIPÓ");
      return;
    }

    setCurrentUser(user);
    setError('');
    setCurrentScreen('game');
    setSlots([ICONS[1], ICONS[2], ICONS[3], ICONS[4], ICONS[5]]); // Reset slots on entry
    setGameResult(null);
  };

  const spin = () => {
    if (isSpinning) return;
    if (!currentUser) return; // Safety check

    // Mark as played
    if (!playedEmployees.includes(currentUser.id)) {
      setPlayedEmployees(prev => [...prev, currentUser.id]);
    }

    setIsSpinning(true);

    // Animation loop
    let iterations = 0;
    const maxIterations = 20;
    const interval = setInterval(() => {
      setSlots(prev => prev.map(() => ICONS[Math.floor(Math.random() * ICONS.length)]));
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        finalizeSpin();
      }
    }, 100);
  };

  const finalizeSpin = () => {
    setIsSpinning(false);

    // Determine Logic
    let isWinner = false;

    // 1. Director check (Always lose)
    if (currentUser.role === 'director') {
      isWinner = false;
    } else {
      // 2. Batch limit check
      const currentBatchIndex = Math.floor(totemStats.totalPlays / BATCH_SIZE);
      let winsInCurrentBatch = totemStats.currentBatchWins;
      if (currentBatchIndex > totemStats.lastResetBatch) winsInCurrentBatch = 0; // New batch reset logic implicitly

      if (winsInCurrentBatch >= PRIZES_PER_BATCH) {
        isWinner = false;
      } else {
        // 3. Probability Check
        isWinner = Math.random() < WIN_PROBABILITY;
      }
    }

    let finalSlots = [];
    let prize = null;

    if (isWinner) {
      // WIN: 5 Multiva Logos
      finalSlots = [ICONS[0], ICONS[0], ICONS[0], ICONS[0], ICONS[0]];
      prize = PRIZES_LIST[Math.floor(Math.random() * PRIZES_LIST.length)];

      // Update stats
      setTotemStats(prev => ({
        ...prev,
        totalPlays: prev.totalPlays + 1,
        currentBatchWins: prev.currentBatchWins + 1,
        lastResetBatch: Math.floor((prev.totalPlays + 1) / BATCH_SIZE) // Track batch index
      }));
    } else {
      // LOSE: Random
      finalSlots = [0, 1, 2, 3, 4].map(() => ICONS[Math.floor(Math.random() * ICONS.length)]);
      // Ensure no accidental win
      if (finalSlots.every(s => s.id === 'logo')) {
        finalSlots[4] = ICONS[1];
      }

      // Update stats
      setTotemStats(prev => ({
        ...prev,
        totalPlays: prev.totalPlays + 1
      }));
    }

    setSlots(finalSlots);
    setGameResult({ win: isWinner, prize: prize });
  };

  const resetGame = () => {
    setEmployeeId('');
    setCurrentUser(null);
    setGameResult(null);
    setCurrentScreen('login');
    setSlots([ICONS[1], ICONS[2], ICONS[3], ICONS[4], ICONS[5]]);
  };

  // --- SUB-COMPONENTS ---

  // REALISTIC "GEL" BUTTON
  const KeypadButton = ({ value, label, onClick, color = "bg-zinc-900" }) => (
    <button onClick={() => onClick(value)}
      className={`
        relative w-16 h-16 rounded-full 
        flex items-center justify-center
        transform transition-all active:scale-95 duration-100
        group
     `}>
      {/* Button Base & Shadow */}
      <div className={`absolute inset-0 rounded-full shadow-[0_5px_10px_rgba(0,0,0,0.8),inset_0_-2px_5px_rgba(0,0,0,0.5)] ${color} border border-black`}></div>

      {/* Metallic Ring */}
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-yellow-100 via-yellow-600 to-yellow-900 p-[2px]">
        <div className={`w-full h-full rounded-full ${color} shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]`}></div>
      </div>

      {/* Gloss/Reflection */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none mb-6 mx-2"></div>

      {/* Text/Value */}
      <div className="relative z-10 font-serif text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] group-active:text-yellow-100">
        {label || value}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 overflow-hidden relative selection:bg-yellow-500/20 font-serif">

      {/* GLOBAL BACKGROUND: Elegant Deco Pattern */}
      <div className="absolute inset-0 bg-[#050505] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#443300_0%,_#000_100%)] opacity-40"></div>
        {/* Subtle Art Deco rays pattern effect (Static) */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #FFD700 0px, #FFD700 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, #FFD700 0px, #FFD700 1px, transparent 1px, transparent 20px)' }}></div>

        {/* NEW: POTENT LIGHT RAYS (Spinning) */}
        <div className="absolute inset-[-50%] opacity-50 animate-[spin_60s_linear_infinite] pointer-events-none mix-blend-screen">
          <div className="w-full h-full bg-[repeating-conic-gradient(from_0deg_at_50%_50%,_rgba(255,255,255,0.2)_0deg,_rgba(255,255,255,0.2)_5deg,_transparent_5deg,_transparent_15deg)]"></div>
        </div>
      </div>

      {/* THE CABINET (Pure CSS Construction) */}
      <div className="relative z-10 flex flex-col items-center">

        {/* TOP DECORATION / TOPPER */}
        <div className="w-[450px] h-12 bg-gradient-to-tb from-yellow-700 via-yellow-400 to-yellow-800 rounded-t-full flex items-center justify-center border-b-4 border-black shadow-[0_-5px_20px_rgba(255,215,0,0.3)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_20%,#ffffff80_50%,transparent_80%)] animate-[shimmer_3s_infinite] pointer-events-none"></div>
          <div className="font-bold tracking-[0.3em] text-black text-xs uppercase drop-shadow-sm">Fortuna Multiva</div>
        </div>

        {/* MAIN CHASSIS */}
        <div className="w-[500px] bg-black rounded-3xl p-3 shadow-[0_30px_60px_-10px_rgba(0,0,0,1),0_0_0_2px_#332200] relative">
          {/* Gold Border / Frame Gradient */}
          <div className="absolute inset-0 rounded-3xl border-[8px] border-transparent bg-gradient-to-br from-yellow-600 via-yellow-200 to-yellow-800 [mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] z-20 pointer-events-none shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]"></div>

          {/* Cabinet Material / Texture */}
          <div className="absolute inset-0 bg-zinc-900 rounded-3xl opacity-95 noise-bg"></div>

          {/* --- CONTENT CONTAINER --- */}
          <div className="relative z-30 flex flex-col h-full bg-zinc-950 rounded-2xl border-4 border-zinc-800 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] overflow-hidden">

            {/* LOGO MARQUEE AREA */}
            <div className="h-20 bg-gradient-to-b from-black via-zinc-900 to-black border-b-2 border-yellow-600/30 flex items-center justify-center relative p-2 shadow-lg">
              {/* Decorative side lights */}
              <div className="absolute left-4 w-2 h-12 rounded-full bg-yellow-900 shadow-[0_0_10px_orange]"></div>
              <div className="absolute right-4 w-2 h-12 rounded-full bg-yellow-900 shadow-[0_0_10px_orange]"></div>

              <img src="/multiva-logo-new.png" alt="MultiVa" className="h-full object-contain drop-shadow-[0_0_15px_rgba(255,200,0,0.3)] filter brightness-110" />
            </div>

            {/* SCREEN AREA */}
            <div className="p-6 relative min-h-[500px] flex flex-col">

              {/* Glass Reflection Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-0"></div>

              {/* --- LOGIN VIEW --- */}
              {currentScreen === 'login' && (
                <div className="flex-1 flex flex-col items-center justify-center z-10 animate-in fade-in duration-500">
                  <h2 className="text-yellow-500 font-serif text-xs tracking-[0.4em] uppercase mb-6 drop-shadow-md">Panel de Acceso</h2>

                  <div className="mb-8 relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative bg-black border border-yellow-700/50 rounded-lg py-4 px-10 shadow-[inset_0_0_15px_black]">
                      <div className="text-center font-mono text-3xl text-yellow-100 tracking-[0.3em] font-bold drop-shadow-[0_0_8px_rgba(253,224,71,0.5)] min-w-[120px]">
                        {employeeId || <span className="text-zinc-800">----</span>}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="absolute top-[35%] w-full text-center">
                      <div className="inline-block bg-red-950/80 text-red-300 px-4 py-1 rounded text-xs font-bold uppercase tracking-widest border border-red-500/30 animate-pulse shadow-[0_0_10px_red]">
                        {error}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-900/50 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-sm">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                      <KeypadButton key={n} value={n} onClick={handleKeypadClick} />
                    ))}
                    <KeypadButton value="C" label="DEL" onClick={handleKeypadClick} color="bg-red-950" />
                    <KeypadButton value={0} onClick={handleKeypadClick} />
                    <KeypadButton value="Enter" label="OK" onClick={handleKeypadClick} color="bg-green-950" />
                  </div>
                </div>
              )}

              {/* --- GAME VIEW --- */}
              {currentScreen !== 'login' && (
                <div className="flex-1 flex flex-col z-10 animate-in zoom-in duration-300">
                  {/* Reels Frame */}
                  <div className="flex-1 bg-black border-4 border-yellow-700/40 rounded-lg p-1 relative shadow-[inset_0_0_30px_rgba(0,0,0,1)] flex gap-1 mb-6">
                    {/* Payline */}
                    <div className="absolute top-[50%] left-0 right-0 h-[2px] bg-red-500/60 z-20 shadow-[0_0_6px_red] pointer-events-none"></div>

                    {slots.map((slot, i) => (
                      <div key={i} className="flex-1 rounded bg-zinc-100 relative overflow-hidden shadow-inner border-x border-black">
                        {/* Reel Lighting/Shadow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-80 z-10 pointer-events-none"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 z-10 pointer-events-none"></div>

                        {/* Symbol */}
                        <div className={`h-full flex items-center justify-center bg-zinc-200 ${isSpinning ? 'blur-[2px] animate-pulse' : ''}`}>
                          <slot.component className={`w-12 h-12 md:w-16 md:h-16 ${slot.color} drop-shadow-md`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Status / Result Display */}
                  <div className="h-16 bg-zinc-900 rounded-lg border border-yellow-800/30 flex items-center justify-center mb-6 shadow-[inset_0_2px_10px_black] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#000_2px,#000_4px)] opacity-20"></div>
                    {gameResult ? (
                      <div className="text-center animate-bounce">
                        <div className="text-xs text-yellow-500 uppercase tracking-widest mb-1">Resultado</div>
                        <div className={`text-xl font-bold uppercase ${gameResult.win ? 'text-yellow-300 drop-shadow-[0_0_10px_gold]' : 'text-gray-400'}`}>
                          {gameResult.win ? gameResult.prize : "Suerte para la próxima"}
                        </div>
                      </div>
                    ) : (
                      <div className="text-yellow-600/70 text-sm font-bold uppercase tracking-[0.3em] animate-pulse">
                        {isSpinning ? "Girando..." : "Listo para jugar"}
                      </div>
                    )}
                  </div>

                  {/* Big Physical Action Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={gameResult ? resetGame : spin}
                      disabled={isSpinning}
                      className={`
                                            relative w-full max-w-[200px] h-16 rounded-full
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
              )}
            </div>

            {/* BOTTOM DECORATION */}
            <div className="h-8 bg-zinc-950 border-t border-white/5 flex items-center justify-between px-6">
              <div className="w-16 h-1 bg-yellow-900/50 rounded-full"></div>
              <div className="text-[10px] text-zinc-700 font-mono">SERIES: 2024-GATSBY-01</div>
              <div className="w-16 h-1 bg-yellow-900/50 rounded-full"></div>
            </div>

          </div>
        </div>

        {/* BASE / FOOTER REFLECTION */}
        <div className="w-[400px] h-8 bg-black/50 rounded-[100%] blur-xl -mt-4 z-0"></div>

      </div>
    </div>
  );
}
