
import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, ArrowLeft } from 'lucide-react';

export default function AdminDashboard({ onBack }) {
    const [history, setHistory] = useState([]);

    const loadHistory = () => {
        const saved = localStorage.getItem('game_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved).reverse()); // Newest first
            } catch (e) {
                console.error("Error parsing history", e);
            }
        }
    };

    useEffect(() => {
        loadHistory();
        // Optional: Poll for changes if needed in real-time across tabs
        const interval = setInterval(loadHistory, 2000);
        return () => clearInterval(interval);
    }, []);

    const downloadCSV = () => {
        if (history.length === 0) return;

        // Headers
        const headers = ['Fecha/Hora', 'ID Empleado', 'Nombre', 'Resultado', 'Premio'];

        // Rows
        const rows = history.map(item => [
            new Date(item.timestamp).toLocaleString(),
            item.employeeId,
            `"${item.employeeName}"`, // Quote name to handle commas
            item.win ? 'GANADOR' : 'NO GANADOR',
            `"${item.prize || ''}"`
        ]);

        // Combine
        const csvContent = "data:text/csv;charset=utf-8,"
            + filtersCSV([headers, ...rows]);

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_rifa_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Helper to join array to CSV string
    const filtersCSV = (rows) => {
        return rows.map(e => e.join(",")).join("\n");
    };

    const clearHistory = () => {
        if (confirm("¿Estás seguro de BORRAR todo el historial? Esto no se puede deshacer.")) {
            localStorage.removeItem('game_history');
            localStorage.removeItem('played_employees'); // Also reset played status? Maybe separate.
            localStorage.removeItem('totem_stats');
            setHistory([]);
            alert("Historial borrado.");
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-yellow-100 font-sans p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8 border-b border-yellow-800/30 pb-4">
                    <h1 className="text-3xl font-serif text-yellow-500 uppercase tracking-widest">
                        Panel de Control - Rifa
                    </h1>
                    <div className="flex gap-4">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-600 transition-colors"
                        >
                            <ArrowLeft size={16} /> Volver al Juego
                        </button>
                        <button
                            onClick={loadHistory}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-600 transition-colors"
                        >
                            <RefreshCw size={16} /> Actualizar
                        </button>
                        <button
                            onClick={downloadCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-black font-bold rounded shadow-[0_0_15px_rgba(255,200,0,0.2)] transition-colors"
                        >
                            <Download size={16} /> Exportar CSV
                        </button>
                        <button
                            onClick={clearHistory}
                            className="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-200 border border-red-800 rounded transition-colors text-xs"
                        >
                            Borrar Todo
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-zinc-500 italic">
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
