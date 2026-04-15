
import React, { useState, useEffect } from 'react';
import { 
  Settings, Bell, Moon, Shield, Globe, Lock, Mail, Eye, Smartphone, Check
} from 'lucide-react';

interface SettingsProps {
    darkMode?: boolean;
    onToggleTheme?: () => void;
}

export const TomTomTest: React.FC<SettingsProps> = ({ darkMode = false, onToggleTheme }) => {
  // Local settings state
  const [settings, setSettings] = useState({
    notifications: true,
    emailDigest: false,
    locationTracking: true,
    dataSharing: false,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleManageClick = () => {
      alert("Account Management Portal coming soon in v3.0");
  };

  const sections = [
    {
      title: 'Appearance & Interface',
      icon: <Moon className="w-5 h-5 text-purple-500" />,
      items: [
        { 
          id: 'darkMode', 
          label: 'Dark Mode', 
          desc: 'Switch to a darker theme for low-light environments.',
          icon: <Moon className="w-4 h-4" />,
          isExternal: true, // Controlled by parent prop
          value: darkMode,
          action: onToggleTheme
        }
      ]
    },
    {
      title: 'Notifications',
      icon: <Bell className="w-5 h-5 text-pink-500" />,
      items: [
        { 
          id: 'notifications', 
          label: 'Push Alerts', 
          desc: 'Receive real-time alerts about AQI spikes and traffic incidents.',
          icon: <Smartphone className="w-4 h-4" />
        },
        { 
          id: 'emailDigest', 
          label: 'Weekly Digest', 
          desc: 'Get a weekly summary of your eco-impact and exposure stats.',
          icon: <Mail className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'Privacy & Data',
      icon: <Shield className="w-5 h-5 text-green-500" />,
      items: [
        { 
          id: 'locationTracking', 
          label: 'Precise Location', 
          desc: 'Allow app to use high-accuracy GPS for better routing.',
          icon: <Globe className="w-4 h-4" />
        },
        { 
          id: 'dataSharing', 
          label: 'Share Anonymous Data', 
          desc: 'Contribute your anonymized travel data to improve city planning.',
          icon: <Eye className="w-4 h-4" />
        }
      ]
    }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <div className="bg-pink-100 p-3 rounded-full">
          <Settings className="w-8 h-8 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">App Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your preferences and privacy controls</p>
        </div>
      </div>

      <div className="grid gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center">
              {section.icon}
              <h3 className="ml-3 font-bold text-slate-700 dark:text-slate-200">{section.title}</h3>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {section.items.map((item: any) => {
                // Determine active state based on whether it's local or external (darkMode)
                const isActive = item.isExternal ? item.value : settings[item.id as keyof typeof settings];
                const clickHandler = item.isExternal ? item.action : () => toggle(item.id);

                return (
                    <div key={item.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-start max-w-lg">
                        <div className="mt-1 mr-4 text-slate-400 bg-white dark:bg-slate-700 p-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                        {item.icon}
                        </div>
                        <div>
                        <div className="font-bold text-slate-800 dark:text-white text-sm mb-1">{item.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</div>
                        </div>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button 
                        onClick={clickHandler}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                        isActive ? 'bg-pink-600' : 'bg-slate-200 dark:bg-slate-600'
                        }`}
                    >
                        <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                        />
                    </button>
                    </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex justify-between items-center">
           <div className="flex items-center">
              <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg mr-4">
                 <Lock className="w-5 h-5 text-red-500" />
              </div>
              <div>
                 <h3 className="font-bold text-slate-800 dark:text-white text-sm">Account Security</h3>
                 <p className="text-xs text-slate-500 dark:text-slate-400">Change password or delete account</p>
              </div>
           </div>
           <button 
            onClick={handleManageClick}
            className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
           >
              Manage
           </button>
        </div>
      </div>
      
      <div className="text-center text-xs text-slate-400 pt-8 pb-4">
        UrbanPulse v2.5.0 • Build 2025.05.15
      </div>
    </div>
  );
};
