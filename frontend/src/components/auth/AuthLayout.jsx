import React from 'react';
import { Building2, CalendarCheck, AlertCircle, Bell } from 'lucide-react';

const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-inter selection:bg-indigo-100 selection:text-indigo-900">
      {/* Dynamic Left Panel (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Animated Mesh Gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
        
        {/* Logo Section */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg">
            <Building2 className="w-8 h-8 text-indigo-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            SmartCampus
          </span>
        </div>

        {/* Content Section */}
        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            System Online
          </div>
          
          <h1 className="text-5xl font-extrabold mb-8 leading-[1.1] tracking-tight">
            Manage your campus.<br />
            <span className="text-indigo-400 drop-shadow-sm">Effortlessly.</span>
          </h1>
          
          <div className="space-y-8 mt-12">
            {[
              { 
                icon: CalendarCheck, 
                title: "Book rooms and labs", 
                desc: "Real-time availability and instant booking for all campus facilities." 
              },
              { 
                icon: AlertCircle, 
                title: "Maintenance tracking", 
                desc: "Report issues instantly and track resolution progress in real-time." 
              },
              { 
                icon: Bell, 
                title: "Stay notified", 
                desc: "Get instant alerts for class changes, event updates, and news." 
              }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-5 group">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all duration-300">
                  <item.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-slate-100 mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Section */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-[0.2em]">
            SLIIT — Excellence in IT
          </p>
          <div className="flex gap-4">
            <div className="w-8 h-1 bg-indigo-600 rounded-full"></div>
            <div className="w-8 h-1 bg-slate-800 rounded-full"></div>
            <div className="w-8 h-1 bg-slate-800 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Panel - Glassmorphism Container */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 lg:p-16 relative bg-white lg:bg-transparent">
        {/* Background elements for the right side (visible only on desktop split) */}
        <div className="hidden lg:block absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-100/50 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-sm lg:max-w-2xl">
          <div className="bg-white/80 lg:backdrop-blur-2xl lg:shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border-0 lg:border border-white/40 rounded-[2.5rem] p-8 lg:p-12 transition-all duration-500 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.12)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
