
import React, { useState } from 'react';

// LOGIC:
// We attempt to load the image from multiple potential paths because file placement varies.
// 1. Try relative to component (modern bundlers)
// 2. Try root public folder (standard React apps)
// 3. Try /components/ folder in public (sometimes used)

interface LogoProps {
  className?: string;
  showText?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

const Logo: React.FC<LogoProps> = ({ 
  className = "w-12 h-12", 
  showText = true,
  orientation = 'horizontal',
}) => {
  // State to track which path we are trying
  // 0 = Relative/Module, 1 = Public Root, 2 = Public Components, 3 = Fallback to SVG
  const [loadStage, setLoadStage] = useState(0);

  const getSrc = () => {
      try {
          if (loadStage === 0 && import.meta && import.meta.url) {
              return new URL('./logo.png', import.meta.url).href;
          }
      } catch(e) {}
      
      if (loadStage <= 1) return '/logo.png';
      if (loadStage <= 2) return '/components/logo.png';
      return ''; // Trigger error to show SVG
  };

  const handleError = () => {
      setLoadStage(prev => prev + 1);
  };

  const showSvg = loadStage > 2;

  return (
    <div className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} items-center ${orientation === 'horizontal' ? 'gap-3' : 'gap-2'}`}>
      
      {/* Primary Image Logo - Tries multiple paths before giving up */}
      {!showSvg && (
          <img 
            src={getSrc()} 
            alt="UrbanPulse Logo" 
            className={`${className} object-contain`}
            onError={handleError}
          />
      )}

      {/* Fallback SVG (Leaf + Road) - Matches brand identity exactly */}
      {showSvg && (
          <div className={`${className} flex items-center justify-center`}>
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#84cc16" /> {/* Lime 500 */}
                        <stop offset="100%" stopColor="#0ea5e9" /> {/* Sky 500 */}
                    </linearGradient>
                </defs>
                
                {/* Winding Road - S Curve */}
                <path d="M45 45 C 20 60, 20 80, 50 95 L 65 90 C 40 75, 40 60, 55 45" 
                      fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                <path d="M48 55 C 30 65, 30 80, 52 91" 
                      stroke="white" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                
                {/* Road Edge Shadow */}
                <path d="M45 45 C 20 60, 20 80, 50 95" 
                      stroke="#0f172a" strokeWidth="2" strokeOpacity="0.2" fill="none" />

                {/* Gradient Leaf */}
                <path d="M50 45 Q 20 40 35 15 Q 60 5 65 35 Q 65 50 50 45 Z" 
                      fill="url(#leafGradient)" />
                
                {/* Leaf Veins */}
                <path d="M50 45 Q 45 25 65 5" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                <path d="M48 35 L 40 32" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                <path d="M52 25 L 45 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            </svg>
          </div>
      )}
      
      {/* Text Label */}
      {showText && (
        <div className={`flex flex-col ${orientation === 'vertical' ? 'items-center' : 'items-start'}`}>
          <div className={`font-bold tracking-tighter leading-none flex ${orientation === 'vertical' ? 'text-4xl mb-2' : 'text-2xl'}`}>
            <span className="text-[#4d7c0f] dark:text-[#84cc16]">Urban</span>
            <span className="text-[#0e7490] dark:text-[#06b6d4]">Pulse</span>
          </div>
          {orientation === 'vertical' && (
             <div className="text-[10px] text-slate-500 font-medium tracking-wide text-center uppercase">
               Smart Traffic for a Greener Tomorrow
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
