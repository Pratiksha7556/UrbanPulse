import React, { useState } from 'react';
import { Incident } from '../types';
import { AlertTriangle, ThumbsUp, MapPin, Plus, ShieldAlert } from 'lucide-react';

interface IncidentListProps {
    incidents: Incident[];
    onReportIncident: (type: Incident['type'], desc: string) => void;
    onRedirect: (target: string, loc: {lat: number, lng: number}) => void;
    allowReporting?: boolean;
}

const IncidentList: React.FC<IncidentListProps> = ({ incidents, onReportIncident, onRedirect, allowReporting = true }) => {
    const [isReporting, setIsReporting] = useState(false);
    const [newDesc, setNewDesc] = useState('');
    const [newType, setNewType] = useState<Incident['type']>('hazard');

    const handleReport = () => {
        if (!newDesc) return;
        onReportIncident(newType, newDesc);
        setIsReporting(false);
        setNewDesc('');
    };

    return (
        <div className="bg-white rounded-xl border border-pink-200 shadow-lg flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-pink-100 flex justify-between items-center bg-pink-50">
                <h3 className="font-bold text-slate-800 flex items-center">
                    <ShieldAlert className="w-5 h-5 mr-2 text-red-500" />
                    Live Incidents
                </h3>
                {allowReporting && (
                    <button 
                        onClick={() => setIsReporting(!isReporting)}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded flex items-center shadow-sm"
                    >
                        <Plus className="w-3 h-3 mr-1" /> Report
                    </button>
                )}
            </div>

            {allowReporting && isReporting && (
                <div className="p-4 bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top">
                    <div className="text-xs text-slate-500 mb-2 font-bold">REPORT NEW INCIDENT</div>
                    <select 
                        className="w-full bg-white text-slate-800 text-sm p-2 rounded mb-2 border border-slate-300 focus:border-pink-500 outline-none"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as Incident['type'])}
                    >
                        <option value="accident">Accident / Collision</option>
                        <option value="hazard">Road Hazard / Debris</option>
                        <option value="closure">Road Closure</option>
                        <option value="police">Police Activity</option>
                    </select>
                    <input 
                        type="text" 
                        className="w-full bg-white text-slate-800 text-sm p-2 rounded mb-2 border border-slate-300 focus:border-pink-500 outline-none"
                        placeholder="Description (e.g. Stalled Truck)"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button onClick={handleReport} className="flex-1 bg-pink-600 text-white text-xs py-2 rounded font-bold hover:bg-pink-700">SUBMIT</button>
                        <button onClick={() => setIsReporting(false)} className="flex-1 bg-slate-200 text-slate-700 text-xs py-2 rounded hover:bg-slate-300">CANCEL</button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {incidents.map((inc) => (
                    <div key={inc.id} className="bg-white p-3 rounded-lg border border-pink-100 hover:border-pink-300 transition-colors group shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="flex items-start">
                                <div className={`p-2 rounded-lg mr-3 ${
                                    inc.type === 'accident' ? 'bg-red-50 text-red-600' : 
                                    inc.type === 'closure' ? 'bg-orange-50 text-orange-600' : 
                                    'bg-yellow-50 text-yellow-600'
                                }`}>
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800">{inc.type.toUpperCase()}</div>
                                    <div className="text-xs text-slate-500">{inc.locationName}</div>
                                    <div className="text-xs text-slate-600 mt-1 italic">"{inc.description}"</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-[10px] text-slate-400">{new Date(inc.reportedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                <div className="flex items-center text-xs text-slate-500 mt-2 bg-slate-50 px-2 py-1 rounded">
                                    <ThumbsUp className="w-3 h-3 mr-1" /> {inc.upvotes}
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={() => onRedirect("Safe Zone", {lat: inc.coordinates.lat + 0.01, lng: inc.coordinates.lng + 0.01})}
                                className="text-[10px] text-pink-600 flex items-center hover:underline"
                             >
                                 <MapPin className="w-3 h-3 mr-1" /> View Nearby Safe Zone
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IncidentList;