
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Video, MapPin, UploadCloud, AlertTriangle, Loader2 } from 'lucide-react';
import { Coordinate, Incident, Suggestion } from '../types';
import { reverseGeocodeDetailed, getPlaceSuggestions } from '../services/tomtomService';

interface ReportIncidentModalProps {
  currentLocation: Coordinate;
  onClose: () => void;
  onSubmit: (data: Partial<Incident>) => void;
}

const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({ currentLocation, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Incident['type']>('accident');
  const [severity, setSeverity] = useState<Incident['severity']>('medium');
  const [description, setDescription] = useState('');
  
  // New State for Readable Location & Coordinates
  const [locationName, setLocationName] = useState('Fetching address...');
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinate>(currentLocation);
  const [isGeocoding, setIsGeocoding] = useState(true);
  
  // Search / Suggestion States
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locationWrapperRef = useRef<HTMLDivElement>(null);

  // Fetch address on mount
  useEffect(() => {
    let active = true;
    const fetchAddress = async () => {
        setIsGeocoding(true);
        try {
            const address = await reverseGeocodeDetailed(currentLocation.lat, currentLocation.lng);
            if (active) {
                setLocationName(address);
                setSelectedCoordinates(currentLocation);
            }
        } catch (e) {
            if (active) setLocationName("Selected Map Location");
        } finally {
            if (active) setIsGeocoding(false);
        }
    };
    fetchAddress();
    return () => { active = false; };
  }, [currentLocation]);

  // Handle Location Search Suggestions
  useEffect(() => {
      const timer = setTimeout(async () => {
          if (locationName.length > 2 && showSuggestions) {
              const results = await getPlaceSuggestions(locationName);
              setSuggestions(results);
          }
      }, 300);
      return () => clearTimeout(timer);
  }, [locationName, showSuggestions]);

  // Close suggestions on outside click
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (locationWrapperRef.current && !locationWrapperRef.current.contains(event.target as Node)) {
              setShowSuggestions(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionSelect = (s: Suggestion) => {
      setLocationName(s.label);
      setSelectedCoordinates(s.coordinate);
      setShowSuggestions(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!title || !description) return;

    onSubmit({
      title,
      type,
      severity,
      description,
      locationName, 
      coordinates: selectedCoordinates, // Use the updated coordinates (from GPS or Search)
      media: mediaPreview && mediaType ? { type: mediaType, url: mediaPreview } : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Report an Incident</h2>
            <p className="text-xs text-slate-500 mt-1">Help your community by reporting accidents, hazards, or civic issues</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Title *</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all placeholder:text-slate-400"
              placeholder="Brief description of the incident"
            />
          </div>

          {/* Type & Severity Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Type *</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as Incident['type'])}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all appearance-none cursor-pointer"
              >
                <option value="accident">Accident</option>
                <option value="hazard">Road Hazard</option>
                <option value="closure">Road Closure</option>
                <option value="pothole">Pothole</option>
                <option value="police">Police Activity</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Severity *</label>
              <select 
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Incident['severity'])}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all appearance-none cursor-pointer font-semibold ${
                  severity === 'critical' ? 'bg-red-50 border-red-200 text-red-700' :
                  severity === 'high' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                  'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="low">Low Impact</option>
                <option value="medium">Medium</option>
                <option value="high">High Severity</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Description *</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all placeholder:text-slate-400 resize-none"
              placeholder="Detailed description of what happened..."
            />
          </div>

          {/* Location Input (Searchable) */}
          <div ref={locationWrapperRef} className="relative">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Location *</label>
            <div className="relative">
                <MapPin className={`absolute left-3 top-3.5 w-5 h-5 ${isGeocoding ? 'text-pink-300 animate-pulse' : 'text-pink-500'}`} />
                <input 
                    type="text" 
                    value={locationName}
                    onChange={(e) => {
                        setLocationName(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                    placeholder="Search or enter address"
                />
                {isGeocoding && (
                    <div className="absolute right-3 top-3.5">
                        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    </div>
                )}
            </div>
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-xl max-h-48 overflow-y-auto">
                    {suggestions.map(s => (
                        <div 
                            key={s.id}
                            onClick={() => handleSuggestionSelect(s)}
                            className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-start"
                        >
                            <MapPin className="w-4 h-4 mt-0.5 mr-2 text-slate-400" />
                            <div>
                                <div className="text-sm font-bold text-slate-700">{s.label}</div>
                                <div className="text-xs text-slate-500">{s.subLabel}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center ml-1">
                Coordinates: {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
            </p>
          </div>

          {/* Media Upload Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Evidence (Photo/Video)</label>
            <div 
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                mediaPreview ? 'border-pink-300 bg-pink-50' : 'border-slate-300 hover:border-pink-400 hover:bg-slate-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
              
              {mediaPreview ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden group">
                  {mediaType === 'video' ? (
                    <video src={mediaPreview} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold flex items-center"><Camera className="w-4 h-4 mr-1"/> Change</span>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">Click to upload media</p>
                  <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, MP4</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-200 transition-all transform active:scale-95 flex items-center"
          >
            Submit Report
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReportIncidentModal;
