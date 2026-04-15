
import React, { useState, useRef, useEffect } from 'react';
import { handleAgentSOS } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, AlertTriangle, Mic, MapPin, X, Bot } from 'lucide-react';

interface AgentAssistProps {
  currentLocation: { lat: number, lng: number };
  onRedirect: (target: string, loc?: {lat: number, lng: number}) => void;
}

const AgentAssist: React.FC<AgentAssistProps> = ({ currentLocation, onRedirect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: 'I am UrbanPulse Agent. I can help with emergencies, routing, or environmental insights.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        const response = await handleAgentSOS(input, currentLocation);
        
        const aiMsg: ChatMessage = { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          text: response.text,
          action: response.action
        };

        setMessages(prev => [...prev, aiMsg]);
        
        if (response.action && response.action.location) {
            onRedirect(response.action.target || "Destination", response.action.location);
        }
    } catch (e) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I'm having trouble connecting to the network." }]);
    } finally {
        setLoading(false);
    }
  };

  const togglePanic = async () => {
      setIsOpen(true);
      const panicText = "EMERGENCY: Panic Mode Activated! Find nearest help.";
      const panicMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: panicText, isSOS: true };
      setMessages(prev => [...prev, panicMsg]);
      setLoading(true);
      
      try {
          // Simulate panic response immediately without waiting for full AI if needed
          const response = await handleAgentSOS("EMERGENCY HELP NEEDED", currentLocation);
          const aiMsg: ChatMessage = { 
            id: (Date.now() + 1).toString(), 
            role: 'model', 
            text: response.text || "Locating nearest emergency services...",
            action: response.action
          };
          setMessages(prev => [...prev, aiMsg]);
          
          if (response.action && response.action.location) {
              onRedirect(response.action.target || "Emergency", response.action.location);
          }
      } catch (e) {
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Emergency Protocol: Dial 911/112 immediately." }]);
      } finally {
          setLoading(false);
      }
  };

  return (
    <>
      {/* Panic Button - Bottom Right */}
      <button 
        onClick={togglePanic}
        className="fixed bottom-6 right-20 lg:right-24 z-[9999] bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full shadow-2xl flex items-center animate-pulse border-4 border-red-400/50 transition-all hover:scale-105 active:scale-95"
      >
        <AlertTriangle className="w-5 h-5 mr-2" /> SOS
      </button>

      {/* Chat Button - Bottom Right Corner */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] bg-urban-blue hover:bg-blue-600 text-white p-4 rounded-full shadow-xl transition-transform transform hover:scale-110 border border-blue-400"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col z-[9999] overflow-hidden animate-in slide-in-from-bottom-10 fade-in">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                UrbanPulse AI
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-900">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? (msg.isSOS ? 'bg-red-600 text-white font-bold shadow-red-glow' : 'bg-urban-blue text-white rounded-br-none')
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                }`}>
                  {msg.text}
                  {msg.action && (
                      <div className="mt-2 text-xs bg-white/90 dark:bg-black/20 p-2 rounded text-urban-green font-bold cursor-pointer hover:underline flex items-center"
                           onClick={() => msg.action?.location && onRedirect(msg.action.target || 'Target', msg.action.location)}>
                          <MapPin className="w-3 h-3 mr-1" /> Locate: {msg.action.target}
                      </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none text-slate-500 text-xs flex items-center">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce mr-1"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce mr-1 delay-100"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about traffic, safety..."
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-urban-green"
            />
            <button onClick={handleSend} disabled={!input.trim()} className="bg-urban-green text-white p-2 rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AgentAssist;
