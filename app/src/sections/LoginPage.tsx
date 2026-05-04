import React from 'react';
import { Shield, Github, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AppView } from '../App';

interface LoginPageProps {
  onNavigate: (view: AppView) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const handleGitHubLogin = async () => {
    // Dynamically get the current origin (Localhost or IP)
    const redirectTo = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: redirectTo,
        scopes: 'repo read:user',
        skipBrowserRedirect: false
      }
    });

    if (error) {
      console.error('Error logging in with GitHub:', error.message);
      alert(`Login failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        <button 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </button>

        <div className="glass-card p-10 rounded-[32px] border border-white/10 shadow-2xl text-center bg-obsidian/40 backdrop-blur-2xl">
          <div className="w-16 h-16 bg-emerald/10 border border-emerald/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-emerald" />
          </div>
          
          <h1 className="text-3xl font-medium text-white tracking-tight mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-10">Sign in to scan your repositories and fix vulnerabilities with AI.</p>

          <button
            onClick={handleGitHubLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-obsidian font-semibold py-4 rounded-2xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>

          <p className="text-xs text-muted-foreground mt-8 px-4">
            By continuing, you agree to Verstack's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
