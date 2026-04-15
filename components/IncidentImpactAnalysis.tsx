
import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertOctagon, ArrowRight } from 'lucide-react';
import { Incident } from '../types';

interface ImpactEvent {
    id: string;
    name: string;
    count: number;
    impact: number; // % increase
    baseAqi: number;
    peakAqi: number;
    trigger: string;
    recommendation: string;
}

interface Props {
    incidents: Incident[];
}

const IncidentImpactAnalysis: React.FC<Props> = ({ incidents }) => {
    const [patterns, setPatterns] = useState<ImpactEvent[]>([]);

    useEffect(() => {
        // Aggregation Map to deduplicate events by type
        const patternMap = new Map<string, ImpactEvent>();

        incidents.forEach(inc => {
            let key = '';
            let template: Partial<ImpactEvent> = {};

            // 1. Detect Stadium/Events
            if (inc.description.toLowerCase().includes('match') || inc.locationName.toLowerCase().includes('stadium')) {
                key = 'stadium';
                template = {
                    name: 'Stadium Event Surge',
                    impact: 65,
                    baseAqi: 110,
                    peakAqi: 182,
                    trigger: 'High density gathering & traffic',
                    recommendation: 'Traffic regulation active. Reroute advised.'
                };
            }
            // 2. Detect Construction
            else if (inc.type === 'closure' || inc.description.toLowerCase().includes('construction')) {
                key = 'construction';
                template = {
                    name: 'Construction Dust Haze',
                    impact: 35,
                    baseAqi: 130,
                    peakAqi: 175,
                    trigger: 'Road works / Heavy machinery',
                    recommendation: 'Mist cannons deployed. Keep windows closed nearby.'
                };
            }
            // 3. Detect Accidents
            else if (inc.type === 'accident') {
                key = 'accident';
                template = {
                    name: 'Traffic Idle Pollution',
                    impact: 15,
                    baseAqi: 120,
                    peakAqi: 138,
                    trigger: 'Congestion exhaust accumulation',
                    recommendation: 'Avoid area to prevent inhalation of exhaust fumes.'
                };
            }

            if (key && template.name) {
                if (patternMap.has(key)) {
                    // Update existing
                    const existing = patternMap.get(key)!;
                    existing.count += 1;
                } else {
                    // Create new
                    patternMap.set(key, {
                        id: `pat-${key}`,
                        name: template.name!,
                        count: 1,
                        impact: template.impact!,
                        baseAqi: template.baseAqi!,
                        peakAqi: template.peakAqi!,
                        trigger: template.trigger!,
                        recommendation: template.recommendation!
                    });
                }
            }
        });

        setPatterns(Array.from(patternMap.values()));
    }, [incidents]);

    if (patterns.length === 0) {
        return (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-pink-200 dark:border-slate-700 shadow-sm h-full flex flex-col items-center justify-center text-slate-400">
                <AlertOctagon className="w-8 h-8 mb-2 opacity-50" />
                <div className="text-xs">No Incident Patterns Detected</div>
                <div className="text-[10px] mt-1">Real-time incident feed active</div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-pink-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                    <AlertOctagon className="w-5 h-5 mr-2 text-pink-600" />
                    Pollution Tracking
                </h3>
                <span className="text-[10px] bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 px-2 py-1 rounded border border-pink-200 dark:border-pink-800 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> Patterns Detected
                </span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                {patterns.map(pat => (
                    <div key={pat.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600 relative overflow-hidden group hover:border-pink-300 transition-colors">
                        <div className="flex justify-between items-start z-10 relative mb-2">
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center">
                                    {pat.name}
                                    {pat.count > 1 && (
                                        <span className="ml-2 text-[10px] bg-white dark:bg-slate-600 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-500 text-slate-500 dark:text-slate-300">
                                            {pat.count} Reports
                                        </span>
                                    )}
                                </h4>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center italic">
                                    Trigger: {pat.trigger}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-red-500">+{pat.impact}%</div>
                                <div className="text-[9px] text-slate-400 uppercase font-bold">AQI Surge</div>
                            </div>
                        </div>

                        {/* Visual Bar Representation */}
                        <div className="mt-3 mb-3">
                             <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                                <span>Avg: {pat.baseAqi} AQI</span>
                                <span className="text-red-600 font-bold">Event: {pat.peakAqi} AQI</span>
                             </div>
                             <div className="w-full bg-slate-200 dark:bg-slate-600 h-2 rounded-full overflow-hidden flex relative">
                                 {/* Base */}
                                 <div 
                                    className="bg-green-400 h-full" 
                                    style={{ width: `${(pat.baseAqi / 300) * 100}%` }}
                                 ></div>
                                 {/* Surge */}
                                 <div 
                                    className="bg-red-500 h-full animate-pulse" 
                                    style={{ width: `${((pat.peakAqi - pat.baseAqi) / 300) * 100}%` }}
                                 ></div>
                             </div>
                        </div>

                        <div className="flex items-start bg-white dark:bg-slate-800 p-2 rounded border border-pink-100 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300">
                             <ArrowRight className="w-4 h-4 mr-2 text-pink-500 flex-shrink-0 mt-0.5" />
                             {pat.recommendation}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IncidentImpactAnalysis;
