
import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';

import { supabase } from './supabaseClient';
import PRIZES_DATA from './data/prizes.json';

export default function AdminDashboard({ onBack }) {
    const [history, setHistory] = useState([]);
    const [emergencyMode, setEmergencyMode] = useState(false);

    // Helper: Calculate Remaining Stock
    const getRemainingStock = (prizeName) => {
        if (!prizeName) return 0;
        const totalParams = PRIZES_DATA.find(p => p.name === prizeName);
        if (!totalParams) return '-';

        const usedCount = history.filter(h => h.win && h.prize === prizeName).length;
        return totalParams.total - usedCount;
    };

    const loadSettings = async () => {
        const { data } = await supabase.from('app_settings').select('emergency_mode').eq('id', 1).single();
        if (data) setEmergencyMode(data.emergency_mode);
    };

    const toggleEmergency = async () => {
        const newState = !emergencyMode;
        setEmergencyMode(newState); // Optimistic

        const { error } = await supabase
            .from('app_settings')
            .update({ 'emergency_mode': newState })
            .eq('id', 1);

        if (error) {
            console.error("Error updating settings", error);
            setEmergencyMode(!newState); // Revert
            alert("Error al cambiar modo: " + error.message);
        }
    };

    const loadHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('game_history')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error loading history:", error);
                return;
            }

            const mappedHistory = data.map(item => ({
                timestamp: item.created_at,
                employeeId: item.employee_id,
                employeeName: item.employee_name,
                tenureDays: item.tenure_days,
                win: item.win,
                prize: item.prize
            }));

            setHistory(mappedHistory);
        } catch (e) {
            console.error("Connection error", e);
        }
    };

    useEffect(() => {
        loadSettings();
        loadHistory();
        const interval = setInterval(() => {
            loadHistory();
            loadSettings();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const downloadCSV = () => {
        if (history.length === 0) return;

        const headers = ['Fecha/Hora', 'ID Empleado', 'Nombre', 'Resultado', 'Premio'];
        const rows = history.map(item => [
            new Date(item.timestamp).toLocaleString(),
            item.employeeId,
            `"${item.employeeName}"`,
            item.win ? 'GANADOR' : 'NO GANADOR',
            `"${item.prize || ''}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        // prepend headers
        const fullCsv = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(fullCsv);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_rifa_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const clearHistory = async () => {
        if (confirm("⚠️ ¡PELIGRO! ESTÁS A PUNTO DE REINICIAR TODO EL EVENTO.\n\n- Se borrará TODO el historial de ganadores.\n- El inventario de premios volverá al 100%.\n- Todos los empleados podrán volver a jugar.\n\n¿ESTÁS SEGURO?")) {
            const { error } = await supabase
                .from('game_history')
                .delete()
                .neq('id', 0);

            if (error) {
                alert("Error borrando historial: " + error.message);
            } else {
                setHistory([]);
                alert("Evento reiniciado correctamente. ¡Listo para comenzar!");
            }
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-yellow-100 font-sans p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-serif tracking-widest text-sm">VOLVER</span>
                        </button>
                        <h1 className="text-3xl font-serif text-yellow-100 uppercase tracking-widest">Dashboard</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleEmergency}
                            className={`
                                px-4 py-2 rounded font-bold uppercase tracking-widest text-sm border flex items-center gap-2 transition-all
                                ${emergencyMode
                                    ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-[0_0_15px_red]'
                                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}
                            `}
                        >
                            <AlertCircle size={16} />
                            {emergencyMode ? "MODO EMERGENCIA: ACTIVO" : "MODO EMERGENCIA: OFF"}
                        </button>

                        <button onClick={loadHistory} className="p-2 text-yellow-500 hover:bg-white/10 rounded-full transition-colors" title="Actualizar">
                            <RefreshCw size={20} />
                        </button>
                        <button onClick={downloadCSV} className="flex items-center gap-2 bg-yellow-700 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-serif tracking-wide transition-colors">
                            <Download size={18} />
                            CSV
                        </button>
                        <button onClick={clearHistory} className="px-4 py-2 text-red-500 hover:bg-red-900/20 rounded border border-red-900/50 text-xs tracking-widest uppercase">
                            REINICIAR SORTEO
                        </button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
                        <div className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Total Jugadas</div>
                        <div className="text-4xl font-mono text-white">{history.length}</div>
                    </div>
                    <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
                        <div className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Ganadores</div>
                        <div className="text-4xl font-mono text-yellow-400">
                            {history.filter(h => h.win).length}
                        </div>
                    </div>
                    <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
                        <div className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Premios Entregados</div>
                        <div className="text-4xl font-mono text-purple-400">
                            {history.filter(h => h.prize).length}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-zinc-900 rounded-xl border border-white/5 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-black/50 text-yellow-600 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="p-4">Hora</th>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Nombre</th>
                                    <th className="p-4">Antigüedad</th>
                                    <th className="p-4">Resultado</th>
                                    <th className="p-4">Premio</th>
                                    <th className="p-4">Inventario Actual</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-zinc-500 italic">
                                            No hay registros todavía.
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((row, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-mono text-zinc-400">
                                                {new Date(row.timestamp).toLocaleTimeString()} <span className="text-xs opacity-50">{new Date(row.timestamp).toLocaleDateString()}</span>
                                            </td>
                                            <td className="p-4 font-mono">{row.employeeId}</td>
                                            <td className="p-4 font-medium">{row.employeeName}</td>
                                            <td className="p-4 text-zinc-400">{row.tenureDays ? `${row.tenureDays} días` : '-'}</td>
                                            <td className="p-4">
                                                {row.win ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-900/30 text-yellow-500 border border-yellow-700/50 text-xs font-bold uppercase">
                                                        Ganador
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-zinc-800 text-zinc-500 text-xs font-bold uppercase">
                                                        Suerte
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-purple-300 font-medium">
                                                {row.prize || '-'}
                                            </td>
                                            <td className="p-4 text-zinc-500 font-mono text-xs">
                                                {row.win && row.prize ? (
                                                    <span className="text-yellow-500/80 font-bold">
                                                        Quedan {Math.max(0, getRemainingStock(row.prize))}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
