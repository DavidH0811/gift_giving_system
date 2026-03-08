import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  hideNav?: boolean;
}

export default function Layout({ children, activeTab, onTabChange, hideNav = false }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-white shadow-xl overflow-hidden relative">
      <div className="flex-1 overflow-y-auto pb-24">
        {children}
      </div>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-md border-t border-slate-100 px-6 py-3 z-50">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => onTabChange('home')}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-primary' : 'text-slate-400'}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'home' ? "'FILL' 1" : "'FILL' 0" }}>
                event_note
              </span>
              <span className="text-[10px] font-medium">活动</span>
            </button>
            <button 
              onClick={() => onTabChange('search')}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'search' ? 'text-primary' : 'text-slate-400'}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'search' ? "'FILL' 1" : "'FILL' 0" }}>
                search
              </span>
              <span className="text-[10px] font-medium">搜索</span>
            </button>
            <button 
              onClick={() => onTabChange('stats')}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-primary' : 'text-slate-400'}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'stats' ? "'FILL' 1" : "'FILL' 0" }}>
                bar_chart
              </span>
              <span className="text-[10px] font-medium">统计</span>
            </button>
            <button 
              onClick={() => onTabChange('profile')}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-primary' : 'text-slate-400'}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}>
                settings
              </span>
              <span className="text-[10px] font-medium">设置</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
