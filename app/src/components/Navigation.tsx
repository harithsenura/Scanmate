import { Shield, User, LogOut, Settings, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { AppView } from '../App';

interface NavigationProps {
  onNavigate: (view: AppView) => void;
  transparent?: boolean;
  isLoggedIn?: boolean;
  user?: any;
}



export default function Navigation({ onNavigate, transparent = false, isLoggedIn = false, user = null }: NavigationProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('landing');
    setDropdownOpen(false);
  };



  return (
    <nav
      className={`absolute top-0 left-0 right-0 pt-[env(safe-area-inset-top)] min-h-[80px] flex items-center transition-all duration-300 z-50 ${
        transparent
          ? 'bg-transparent'
          : 'bg-[#0c0c0e]/80 backdrop-blur-xl border-b border-white/5'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 group"
        >
          <Shield className="w-6 h-6 text-emerald transition-transform duration-200 group-hover:scale-110" />
          <span className="text-lg font-semibold tracking-tight">
            Scanmate<span className="text-emerald"></span>
          </span>
        </button>

        {/* Desktop Links - Removed */}
        <div className="hidden md:flex items-center gap-8">
        </div>

        {/* CTA Section */}
        <div className="flex items-center gap-4">
          {!isLoggedIn ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('login')}
                className="text-xs md:text-sm font-medium text-muted-foreground hover:text-white transition-colors duration-200"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="bg-emerald text-obsidian text-[10px] md:text-sm font-bold px-4 md:px-5 py-2 md:py-2.5 rounded-full hover:scale-105 transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-emerald/20 flex items-center justify-center overflow-hidden border border-emerald/20">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-emerald" />
                  )}
                </div>
                <span className="text-sm font-medium text-white max-w-[80px] truncate">
                  {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-obsidian/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-2 z-[100] animate-in fade-in zoom-in duration-200">
                  <div className="px-4 py-3 border-b border-white/5 mb-1">
                    <p className="text-xs text-muted-foreground">Signed in as</p>
                    <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                  </div>
                  
                  <button
                    onClick={() => { onNavigate('user-dashboard'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => { onNavigate('settings'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  
                  <div className="h-px bg-white/5 my-1" />
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ruby hover:bg-ruby/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
