import React from 'react';
import { Incident } from '../types';
import { X, CheckCircle, AlertTriangle, ShieldCheck, Flag } from 'lucide-react';

interface IncidentMediaModalProps {
  incident: Incident;
  onClose: () => void;
  onVerify: (id: string) => void;
  onFlag: (id: string) => void;
}

const IncidentMediaModal: React.FC<IncidentMediaModalProps> = ({ incident, onClose, onVerify, onFlag }) => {
  if (!incident.media) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Media Section */}
        <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px]">
          {incident.media.type === 'video' ? (
            <video 
              src={incident.media.url} 
              controls 
              className="max-w-full max-h-full w-auto h-auto object-contain"
              autoPlay
            />
          ) : (
            <img 
              src={incident.media.url} 
              alt={incident.description} 
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          )}
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full md:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Details Section */}
        <div className="w-full md:w-96 bg-white flex flex-col border-l border-slate-200">
          <div className="p-4 border-b border-slate-100 flex justify-between items-start">
            <div>
               <h3 className="font-bold text-slate-800 text-lg flex items-center">
                 {incident.type === 'accident' && <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />}
                 {incident.type === 'hazard' && <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />}
                 {incident.type === 'police' && <ShieldCheck className="w-5 h-5 mr-2 text-blue-500" />}
                 {incident.type.toUpperCase()}
               </h3>
               <p className="text-sm text-slate-500">{incident.locationName}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hidden md:block"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
             <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-slate-700 leading-relaxed">
                  "{incident.description}"
                </p>
             </div>
             <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Details</h4>
                <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                   <span className="text-slate-500">Reported</span>
                   <span className="font-medium text-slate-800">{new Date(incident.reportedAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                   <span className="text-slate-500">Status</span>
                   <span className={`font-medium ${incident.verified ? 'text-green-600' : 'text-orange-500'}`}>
                     {incident.verified ? 'Verified' : 'Pending Verification'}
                   </span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                   <span className="text-slate-500">Upvotes</span>
                   <span className="font-medium text-slate-800">{incident.upvotes}</span>
                </div>
             </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
             <button 
                onClick={() => onVerify(incident.id)}
                className="w-full flex items-center justify-center py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all active:scale-95"
             >
                <CheckCircle className="w-5 h-5 mr-2" />
                Verify Incident
             </button>
             <button 
                onClick={() => onFlag(incident.id)}
                className="w-full flex items-center justify-center py-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold transition-all active:scale-95"
             >
                <Flag className="w-5 h-5 mr-2" />
                Report as False
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default IncidentMediaModal;
