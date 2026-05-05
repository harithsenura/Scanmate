import { useState, useEffect } from 'react';
import { 
  Settings, Key, AlertTriangle, CheckCircle2, Shield, 
  Cpu, Database, Activity, Save, Trash2, Eye, EyeOff, Info 
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import type { AppView } from '../App';
import Navigation from '../components/Navigation';
import { supabase } from '../lib/supabase';

interface SettingsPageProps {
  onNavigate: (view: AppView) => void;
  session: Session;
}

export default function SettingsPage({ onNavigate, session }: SettingsPageProps) {
  const user = session.user;
  
  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showGroq, setShowGroq] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  
  const [isSaved, setIsSaved] = useState(false);
  const [_isLoading, setIsLoading] = useState(true);
  const [globalStatus, setGlobalStatus] = useState<'healthy' | 'warning' | 'exhausted'>('warning');

  useEffect(() => {
    const loadKeys = async () => {
      setIsLoading(true);
      try {
        // 1. Try Supabase first
        if (session?.user?.id) {
          const { data, error } = await supabase
            .from('users')
            .select('preferences')
            .eq('id', session.user.id)
            .single();
            
          if (!error && data?.preferences?.api_keys) {
            const keys = data.preferences.api_keys;
            if (keys.groq) setGroqKey(keys.groq);
            if (keys.gemini) setGeminiKey(keys.gemini);
            // Sync to local storage
            localStorage.setItem('user_api_keys', JSON.stringify(keys));
          } else {
            // 2. Fallback to local storage
            const savedKeys = localStorage.getItem('user_api_keys');
            if (savedKeys) {
              const parsed = JSON.parse(savedKeys);
              if (parsed.groq) setGroqKey(parsed.groq);
              if (parsed.gemini) setGeminiKey(parsed.gemini);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load keys", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadKeys();

    // Simulate global API status check
    setGlobalStatus('warning');
  }, [session?.user?.id]);

  const handleSave = async () => {
    const keys = {
      groq: groqKey.trim(),
      gemini: geminiKey.trim()
    };
    
    // Save to local storage
    localStorage.setItem('user_api_keys', JSON.stringify(keys));
    
    // Save to Supabase for cross-device sync
    if (session?.user?.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', session.user.id)
        .single();
        
      const currentPrefs = userData?.preferences || {};
      
      await supabase
        .from('users')
        .update({ 
          preferences: { 
            ...currentPrefs, 
            api_keys: keys 
          } 
        })
        .eq('id', session.user.id);
    }
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleClear = async () => {
    localStorage.removeItem('user_api_keys');
    setGroqKey('');
    setGeminiKey('');
    
    if (session?.user?.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', session.user.id)
        .single();
        
      const currentPrefs = userData?.preferences || {};
      const { api_keys, ...otherPrefs } = currentPrefs;
      
      await supabase
        .from('users')
        .update({ preferences: otherPrefs })
        .eq('id', session.user.id);
    }
  };

  // Mocked Usage Stats based on if keys are present
  const usageStats = {
    groq: {
      requests: groqKey ? 142 : 0,
      limit: 14400,
      tokens: groqKey ? '2.4M' : '0'
    },
    gemini: {
      requests: geminiKey ? 38 : 0,
      limit: 1500,
      tokens: geminiKey ? '800K' : '0'
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white">
      <Navigation onNavigate={onNavigate} isLoggedIn={true} user={user} transparent={false} />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <Settings className="w-8 h-8 text-emerald" />
              Advanced Settings
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your API integrations and override global limits.
            </p>
          </div>
        </div>

        {/* Global API Health Alert */}
        <div className={`mb-10 p-5 rounded-2xl border flex items-start gap-4 ${
          globalStatus === 'warning' ? 'bg-yellow-400/10 border-yellow-400/20' : 
          globalStatus === 'exhausted' ? 'bg-ruby/10 border-ruby/20' : 
          'bg-emerald/10 border-emerald/20'
        }`}>
          {globalStatus === 'warning' && <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />}
          {globalStatus === 'exhausted' && <AlertTriangle className="w-6 h-6 text-ruby flex-shrink-0 mt-0.5" />}
          {globalStatus === 'healthy' && <CheckCircle2 className="w-6 h-6 text-emerald flex-shrink-0 mt-0.5" />}
          
          <div>
            <h3 className={`font-bold mb-1 ${
              globalStatus === 'warning' ? 'text-yellow-400' : 
              globalStatus === 'exhausted' ? 'text-ruby' : 'text-emerald'
            }`}>
              Global System APIs: High Traffic Warning
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">
              The default ScanMate AI API limits are currently experiencing heavy global load. You may face rate limits (429 errors) during deep audits. 
              <strong> We highly recommend adding your own API keys below to ensure uninterrupted, high-speed scanning.</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main API Settings Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <Key className="w-6 h-6 text-emerald" />
                <h2 className="text-xl font-bold">Personal AI API Keys</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                Your keys are securely stored in your browser's local storage. They are never saved to our databases and are only sent directly to the AI providers during a scan.
              </p>

              {/* Groq API Key Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Cpu className="w-4 h-4 text-orange-500" /> Groq API Key (Primary)</span>
                  <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-emerald hover:underline text-xs flex items-center gap-1">
                    Get a key <Info className="w-3 h-3" />
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showGroq ? 'text' : 'password'}
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm outline-none focus:border-emerald/50 focus:bg-black/60 transition-all font-mono"
                  />
                  <button 
                    onClick={() => setShowGroq(!showGroq)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  >
                    {showGroq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Used for high-speed primary code auditing (Llama-3 70B).</p>
              </div>

              {/* Gemini API Key Input */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-white mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Database className="w-4 h-4 text-blue-400" /> Google Gemini API Key (Fallback)</span>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald hover:underline text-xs flex items-center gap-1">
                    Get a key <Info className="w-3 h-3" />
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showGemini ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm outline-none focus:border-emerald/50 focus:bg-black/60 transition-all font-mono"
                  />
                  <button 
                    onClick={() => setShowGemini(!showGemini)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  >
                    {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Used as a fallback engine if Groq limits are reached (Gemini 1.5 Flash).</p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-emerald text-obsidian px-6 py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  {isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {isSaved ? 'Saved Successfully' : 'Save Configurations'}
                </button>
                
                {(groqKey || geminiKey) && (
                  <button
                    onClick={handleClear}
                    className="px-6 py-3 rounded-xl font-bold text-ruby hover:bg-ruby/10 border border-ruby/20 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Clear Keys
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Usage Monitoring Column */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-emerald" />
                <h3 className="font-bold text-lg">Realtime Usage</h3>
              </div>
              
              <div className="space-y-6">
                {/* Groq Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-orange-500" /> Groq
                    </span>
                    <span className="text-xs font-mono text-emerald">{groqKey ? 'Active' : 'Missing Key'}</span>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Requests (Daily)</span>
                      <span className="font-mono">{usageStats.groq.requests} / {usageStats.groq.limit}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-3">
                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${(usageStats.groq.requests / usageStats.groq.limit) * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Tokens Processed</span>
                      <span className="font-mono text-white">{usageStats.groq.tokens}</span>
                    </div>
                  </div>
                </div>

                {/* Gemini Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-400" /> Gemini
                    </span>
                    <span className="text-xs font-mono text-emerald">{geminiKey ? 'Active' : 'Missing Key'}</span>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Requests (Daily)</span>
                      <span className="font-mono">{usageStats.gemini.requests} / {usageStats.gemini.limit}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-3">
                      <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${(usageStats.gemini.requests / usageStats.gemini.limit) * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Tokens Processed</span>
                      <span className="font-mono text-white">{usageStats.gemini.tokens}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald/5 border border-emerald/20 rounded-2xl p-6 backdrop-blur-sm">
              <Shield className="w-6 h-6 text-emerald mb-3" />
              <h4 className="font-bold text-sm mb-2 text-white">Security Guarantee</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We use strict CORS policies. Your keys are injected directly into the secure AI backend over HTTPS and are never cached or logged by our servers. 
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
