import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Factory, TrendingUp } from 'lucide-react';
import { PollutionSource } from '../types';
import { getPollutionSources } from '../services/anomalyService';

const PollutionSourceWidget: React.FC = () => {
    const [data, setData] = useState<PollutionSource[]>([]);

    useEffect(() => {
        setData(getPollutionSources());
    }, []);

    return (
        <div className="bg-white p-5 rounded-xl border border-pink-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h3 className="text-sm font-bold text-slate-800 flex items-center">
                    <Factory className="w-4 h-4 mr-2 text-pink-500" />
                    Source Breakdown
                </h3>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">Real-Time</span>
            </div>
            
            <div className="flex-1 flex items-center min-h-0">
                <div className="w-1/2 h-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data as any[]}
                                cx="50%"
                                cy="50%"
                                innerRadius="55%"
                                outerRadius="75%"
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '10px' }}
                                itemStyle={{ color: '#1e293b' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <div className="text-xs font-bold text-slate-800">PM2.5</div>
                    </div>
                </div>
                
                <div className="w-1/2 space-y-2 pl-2 overflow-y-auto max-h-full custom-scrollbar">
                    {data.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-xs">
                            <div className="flex items-center text-slate-600">
                                <div className="w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                                {item.source}
                            </div>
                            <div className="flex items-center font-bold text-slate-800">
                                {item.value}%
                                {item.trend === 'up' && <TrendingUp className="w-2 h-2 ml-1 text-red-500" />}
                                {item.trend === 'down' && <TrendingUp className="w-2 h-2 ml-1 text-green-500 transform rotate-180" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-slate-100 flex-shrink-0">
                <p className="text-[10px] text-slate-400 leading-tight">
                    Machine Learning analysis separates <strong>Industrial</strong> emission signatures from <strong>Traffic</strong> exhaust.
                </p>
            </div>
        </div>
    );
};

export default PollutionSourceWidget;