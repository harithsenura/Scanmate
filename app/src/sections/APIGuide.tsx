import React from 'react';
import { Terminal, Copy, Check, Shield, Zap, Code2, Globe, Lock } from 'lucide-react';
import type { AppView } from '../App';
import Navigation from '../components/Navigation';

interface APIGuideProps {
  onNavigate: (view: AppView) => void;
}

export default function APIGuide({ onNavigate }: APIGuideProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0c0c0e] min-h-screen text-white">
      <Navigation onNavigate={onNavigate} />
      
      <div className="h-20" />

      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald/10 border border-emerald/20 flex items-center justify-center">
            <Code2 className="w-6 h-6 text-emerald" />
          </div>
          <span className="text-xs font-mono text-emerald uppercase tracking-widest">API Reference v2.0</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Integrate Scanmate into your workflow</h1>
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl font-light leading-relaxed">
          The Scanmate REST API allows you to automate security audits, fetch vulnerability reports, and trigger AI fixes programmatically.
        </p>

        {/* Authentication Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald" />
            Authentication
          </h2>
          <div className="glass-card p-8 rounded-3xl border border-white/10 bg-white/[0.02]">
            <p className="text-muted-foreground mb-6">
              All API requests must include your API key in the <code className="text-emerald">X-API-KEY</code> header. You can generate keys in your settings dashboard.
            </p>
            <div className="bg-black/40 rounded-xl p-4 font-mono text-sm border border-white/5 relative group">
              <code className="text-gray-300">curl -H "X-API-KEY: YOUR_API_KEY" https://api.scanmate.ai/v1/health</code>
              <button 
                onClick={() => copyToClipboard('curl -H "X-API-KEY: YOUR_API_KEY" https://api.scanmate.ai/v1/health')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Globe className="w-5 h-5 text-emerald" />
            Endpoints
          </h2>

          <div className="space-y-8">
            {/* Trigger Scan */}
            <div className="border-b border-white/5 pb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 bg-emerald/20 text-emerald text-[10px] font-bold rounded uppercase">POST</span>
                <code className="text-lg font-mono text-white">/v1/scan</code>
              </div>
              <p className="text-muted-foreground mb-4 text-sm">Initiate a deep security audit for a specific repository or local directory path.</p>
              <div className="bg-black/20 rounded-xl p-6 font-mono text-xs text-gray-400 border border-white/5">
                <p className="mb-2 text-gray-500">// Request Body</p>
                <pre>{JSON.stringify({
                  repo_url: "https://github.com/user/repo",
                  depth: "deep",
                  branch: "main"
                }, null, 2)}</pre>
              </div>
            </div>

            {/* Get Results */}
            <div className="border-b border-white/5 pb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded uppercase">GET</span>
                <code className="text-lg font-mono text-white">/v1/reports/&#123;id&#125;</code>
              </div>
              <p className="text-muted-foreground mb-4 text-sm">Fetch a detailed JSON report of all vulnerabilities found in a completed scan.</p>
            </div>
          </div>
        </section>

        {/* Rate Limits */}
        <section>
          <div className="p-8 rounded-[32px] bg-emerald/5 border border-emerald/20">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-emerald" />
              <h2 className="text-xl font-bold text-white">API Usage & Rate Limits</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Default users are limited to 100 requests per hour. For higher throughput, please add your own <span className="text-emerald font-semibold">Private API Keys</span> in the settings panel to bypass shared engine limits.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
