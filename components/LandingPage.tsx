
import React from 'react';
import Logo from './Logo';
import { ArrowRight, Activity, Globe, Shield, User, Car, CloudLightning, Zap, BarChart, ChevronDown } from 'lucide-react';
import { UserProfile } from '../types';

interface LandingPageProps {
  onLoginClick: () => void;
  user: UserProfile | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, user }) => {
  
  // Data for the sliding ticker
  const trafficUpdates = [
      { id: 1, loc: "Downtown Sector 4", status: "Heavy Congestion", speed: "12 km/h", color: "text-red-500" },
      { id: 2, loc: "Western Highway", status: "Clear Flow", speed: "75 km/h", color: "text-green-500" },
      { id: 3, loc: "Industrial Zone", status: "High PM2.5 (165 AQI)", speed: "30 km/h", color: "text-orange-500" },
      { id: 4, loc: "Airport Road", status: "Moderate Traffic", speed: "45 km/h", color: "text-yellow-500" },
      { id: 5, loc: "Tech Park", status: "Accident Reported", speed: "Stopped", color: "text-red-600" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative flex flex-col font-sans overflow-x-hidden">
      
      {/* CSS for Infinite Scroll Animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-urban-blue/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-urban-green/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      {/* Nav */}
      <nav className="w-full px-8 py-6 flex justify-between items-center z-20 absolute top-0 left-0">
        <Logo className="w-10 h-10" />
        <div className="flex gap-4 items-center">
          {user ? (
            // Logged In State
            <>
                <div className="hidden md:flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 mr-2">
                    <div className="w-8 h-8 rounded-full bg-urban-green/20 text-urban-green flex items-center justify-center font-bold mr-2">
                        {user.displayName ? user.displayName[0].toUpperCase() : <User className="w-4 h-4"/>}
                    </div>
                    <span>{user.displayName || user.email}</span>
                </div>
                <button onClick={onLoginClick} className="px-5 py-2 rounded-full bg-urban-blue text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center">
                    Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </button>
            </>
          ) : (
            // Guest State
            <>
                <button onClick={onLoginClick} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-urban-blue transition-colors">Login</button>
                <button onClick={onLoginClick} className="px-5 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    Sign Up
                </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Content */}
      <header className="min-h-screen flex flex-col justify-center items-center text-center px-4 relative z-10 pt-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 backdrop-blur-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-2 h-2 rounded-full bg-urban-green animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Live Geo-Intelligence System</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 leading-[1.1]">
          The Pulse of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-urban-green to-urban-blue">Modern Cities</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Analyze real-time traffic, air pollution, and environmental impact with AI-driven precision. Building a greener tomorrow through data.
        </p>

        <button 
          onClick={onLoginClick}
          className="group relative px-8 py-4 bg-gradient-to-r from-urban-green to-urban-blue rounded-full text-white font-bold text-lg shadow-glow hover:shadow-lg transition-all hover:scale-105 animate-in fade-in zoom-in duration-500 delay-300"
        >
          <span className="flex items-center">
            {user ? 'Return to Dashboard' : 'Get Started Now'} <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        {/* Sliding Traffic Cards (Infinite Marquee) */}
        <div className="w-full max-w-[90vw] mt-16 overflow-hidden relative fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent z-10"></div>
            
            <div className="flex w-[200%] animate-marquee">
                {[...trafficUpdates, ...trafficUpdates].map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex-shrink-0 w-64 mx-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center">
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg mr-3">
                            <Car className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="text-left">
                            <div className="text-xs font-bold text-slate-800 dark:text-white">{item.loc}</div>
                            <div className={`text-[10px] font-bold ${item.color}`}>{item.status}</div>
                            <div className="text-[10px] text-slate-400">{item.speed}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-slate-400">
            <ChevronDown className="w-6 h-6" />
        </div>
      </header>

      {/* Feature Section */}
      <section className="py-20 px-6 bg-white dark:bg-slate-800 relative z-10">
          <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Why UrbanPulse?</h2>
                  <p className="text-slate-500 max-w-2xl mx-auto">Our platform fuses hyper-local sensors with global satellite data to provide the most accurate urban insights available.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { icon: <Activity className="w-8 h-8 text-urban-blue" />, title: "Real-Time Traffic", desc: "Live congestion tracking and flow analysis using advanced sensor fusion." },
                    { icon: <Globe className="w-8 h-8 text-urban-green" />, title: "Environmental AI", desc: "AQI monitoring and carbon footprint reduction strategies powered by ML." },
                    { icon: <Shield className="w-8 h-8 text-purple-500" />, title: "Smart Safety", desc: "Incident reporting and safe route planning for better urban security." }
                ].map((feature, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-6 inline-block">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{feature.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
              </div>
          </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900 relative z-10 border-t border-slate-200 dark:border-slate-700">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Powered by Advanced AI & TomTom Maps</h2>
                  <div className="space-y-6">
                      <div className="flex">
                          <div className="mr-4 mt-1 bg-urban-blue/10 p-2 rounded-lg text-urban-blue"><CloudLightning className="w-5 h-5"/></div>
                          <div>
                              <h4 className="font-bold text-lg text-slate-800 dark:text-white">Data Ingestion</h4>
                              <p className="text-slate-500 text-sm">We aggregate millions of data points from traffic cameras, air sensors, and satellites.</p>
                          </div>
                      </div>
                      <div className="flex">
                          <div className="mr-4 mt-1 bg-urban-green/10 p-2 rounded-lg text-urban-green"><Zap className="w-5 h-5"/></div>
                          <div>
                              <h4 className="font-bold text-lg text-slate-800 dark:text-white">Real-Time Processing</h4>
                              <p className="text-slate-500 text-sm">Our engines process data in milliseconds to provide instant alerts and routing.</p>
                          </div>
                      </div>
                      <div className="flex">
                          <div className="mr-4 mt-1 bg-purple-500/10 p-2 rounded-lg text-purple-500"><BarChart className="w-5 h-5"/></div>
                          <div>
                              <h4 className="font-bold text-lg text-slate-800 dark:text-white">Predictive Analytics</h4>
                              <p className="text-slate-500 text-sm">Forecasting models predict traffic jams and pollution spikes before they happen.</p>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="flex-1 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-urban-green to-urban-blue rounded-3xl transform rotate-3 opacity-20 blur-xl"></div>
                  <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                          <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                          <span className="text-xs font-mono text-slate-400">System Status: Active</span>
                      </div>
                      <div className="space-y-3">
                          <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                          <div className="h-32 bg-slate-100 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                          <div className="grid grid-cols-2 gap-3">
                              <div className="h-20 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
                              <div className="h-20 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-urban-blue text-white text-center">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                  <div className="text-4xl font-black mb-2">50+</div>
                  <div className="text-sm opacity-80 uppercase tracking-widest">Cities Monitored</div>
              </div>
              <div>
                  <div className="text-4xl font-black mb-2">2M+</div>
                  <div className="text-sm opacity-80 uppercase tracking-widest">Data Points / Day</div>
              </div>
              <div>
                  <div className="text-4xl font-black mb-2">15%</div>
                  <div className="text-sm opacity-80 uppercase tracking-widest">Emissions Reduced</div>
              </div>
              <div>
                  <div className="text-4xl font-black mb-2">24/7</div>
                  <div className="text-sm opacity-80 uppercase tracking-widest">Live Uptime</div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 text-sm">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                  <Logo className="w-8 h-8 mb-4 opacity-80" showText={false} />
                  <p>Smart Traffic for a Greener Tomorrow.</p>
              </div>
              <div>
                  <h4 className="text-white font-bold mb-4">Platform</h4>
                  <ul className="space-y-2">
                      <li><a href="#" className="hover:text-white">Live Map</a></li>
                      <li><a href="#" className="hover:text-white">Analytics</a></li>
                      <li><a href="#" className="hover:text-white">API Access</a></li>
                  </ul>
              </div>
              <div>
                  <h4 className="text-white font-bold mb-4">Company</h4>
                  <ul className="space-y-2">
                      <li><a href="#" className="hover:text-white">About Us</a></li>
                      <li><a href="#" className="hover:text-white">Careers</a></li>
                      <li><a href="#" className="hover:text-white">Contact</a></li>
                  </ul>
              </div>
              <div>
                  <h4 className="text-white font-bold mb-4">Legal</h4>
                  <ul className="space-y-2">
                      <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                      <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                  </ul>
              </div>
          </div>
          <div className="text-center border-t border-slate-800 pt-8">
              &copy; 2025 UrbanPulse Inc. All rights reserved.
          </div>
      </footer>
    </div>
  );
};

export default LandingPage;
