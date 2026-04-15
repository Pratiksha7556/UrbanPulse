import React, { useEffect, useState } from 'react';
import { Sparkles, AlertTriangle, TrendingDown, TrendingUp, Cpu } from 'lucide-react';
import { Anomaly } from '../types';
import { detectAnomalies } from '../services/anomalyService';

const AnomalyInsights: React.FC = () => {
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnomalies = async () => {
            setLoading(true);
            const data = await detectAnomalies();
            setAnomalies(data);
            setLoading(false);
        };
        fetchAnomalies();
    }, []);

    if (loading) {
        return (
            <div className="bg-white p-5 rounded-xl border border-pink-200 h-full flex items-center justify-center">
                <div className="text-slate-500 text-xs flex items-center">
                    <Cpu className="w-4 h-4 mr-2 animate-pulse text-pink-500" /> Scanning for Anomalies...
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-pink-50 to-white p-5 rounded-xl border border-pink-200 shadow-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-pink-500" />
                    AI Anomalies & Insights
                </h3>
                <span className="text-[10px] text-pink-700 bg-pink-100 px-2 py-0.5 rounded border border-pink-200">
                    {anomalies.length} New
                </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                {anomalies.map(anom => (
                    <div key={anom.id} className="bg-white p-3 rounded-lg border border-pink-100 hover:border-pink-300 transition-colors shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="text-xs font-bold text-slate-800">{anom.title}</h4>
                            {anom.severity === 'high' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                            {anom.severity === 'medium' && <TrendingUp className="w-3 h-3 text-orange-400" />}
                            {anom.severity === 'low' && <TrendingDown className="w-3 h-3 text-green-400" />}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed mb-1">
                            {anom.description}
                        </p>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider bg-slate-50 px-1 rounded border border-slate-100">
                                {anom.metric} Analysis
                            </span>
                            <span className="text-[9px] text-slate-500">
                                {anom.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnomalyInsights;