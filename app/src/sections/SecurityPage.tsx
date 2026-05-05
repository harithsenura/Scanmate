import React from 'react';
import { Shield, Lock, Eye, Server, Cpu, CheckCircle2, AlertTriangle, FileCheck } from 'lucide-react';
import type { AppView } from '../App';
import Navigation from '../components/Navigation';

interface SecurityPageProps {
  onNavigate: (view: AppView) => void;
}

export default function SecurityPage({ onNavigate }: SecurityPageProps) {
  return (
    <div className="bg-[#0c0c0e] min-h-screen text-white">
      <Navigation onNavigate={onNavigate} />
      
      <div className="h-20" />

      <main className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <div className="w-20 h-20 rounded-[2rem] bg-emerald/10 border border-emerald/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <Shield className="w-10 h-10 text-emerald" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Security at our Core</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            At Scanmate, we take the security of your code as seriously as the vulnerabilities we find. Here's how we protect your data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="glass-card p-10 rounded-[40px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <Lock className="w-10 h-10 text-emerald mb-6" />
            <h3 className="text-2xl font-bold mb-4">Zero-Retention Policy</h3>
            <p className="text-muted-foreground leading-relaxed">
              We never store your source code permanently. Once a scan is completed, the analyzed files are immediately purged from our volatile memory. Only the vulnerability meta-data is retained for your history.
            </p>
          </div>

          <div className="glass-card p-10 rounded-[40px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <Eye className="w-10 h-10 text-emerald mb-6" />
            <h3 className="text-2xl font-bold mb-4">End-to-End Encryption</h3>
            <p className="text-muted-foreground leading-relaxed">
              All data transmitted between your local environment and our scanning engine is protected by AES-256 encryption. We use secure TLS 1.3 tunnels for all API communications.
            </p>
          </div>

          <div className="glass-card p-10 rounded-[40px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <Server className="w-10 h-10 text-emerald mb-6" />
            <h3 className="text-2xl font-bold mb-4">Isolated Environments</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every scan is executed in a fresh, isolated Docker container sandbox. This ensures no cross-contamination between different projects and prevents any lateral movement risk.
            </p>
          </div>

          <div className="glass-card p-10 rounded-[40px] border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <Cpu className="w-10 h-10 text-emerald mb-6" />
            <h3 className="text-2xl font-bold mb-4">Private API Tunneling</h3>
            <p className="text-muted-foreground leading-relaxed">
              By using your own Private API keys, your sensitive code data is sent directly to the AI provider (Groq/Google), bypassing shared global pools for maximum privacy.
            </p>
          </div>
        </div>

        {/* Compliance Section */}
        <section className="bg-emerald/5 border border-emerald/20 rounded-[3rem] p-12 text-center overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-8">Compliance Standards</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {[
                { label: 'SOC2 Ready', icon: FileCheck },
                { label: 'GDPR Compliant', icon: CheckCircle2 },
                { label: 'ISO 27001', icon: Lock },
                { label: 'OWASP Aligned', icon: AlertTriangle }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
                  <item.icon className="w-5 h-5 text-emerald" />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
