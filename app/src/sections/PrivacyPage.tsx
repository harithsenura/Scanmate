import React from 'react';
import { Shield, EyeOff, Lock, Database, Globe, FileText, CheckCircle2 } from 'lucide-react';
import type { AppView } from '../App';
import Navigation from '../components/Navigation';

interface PrivacyPageProps {
  onNavigate: (view: AppView) => void;
}

export default function PrivacyPage({ onNavigate }: PrivacyPageProps) {
  return (
    <div className="bg-[#0c0c0e] min-h-screen text-white">
      <Navigation onNavigate={onNavigate} />
      
      <div className="h-20" />

      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-4 text-emerald font-mono text-sm uppercase tracking-widest">
          <Lock className="w-5 h-5" />
          Last Updated: May 2026
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">Privacy Policy</h1>
        <p className="text-lg text-muted-foreground mb-16 font-light leading-relaxed">
          Your code is your most valuable asset. Our privacy policy is built on a single principle: <span className="text-white font-medium">We don't want your code, we only want to make it secure.</span>
        </p>

        <div className="space-y-16">
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              <EyeOff className="w-6 h-6 text-emerald" />
              1. Zero Code Retention
            </h2>
            <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
              <p className="mb-4">
                Scanmate follows a strict <strong>Ephemeral Analysis Model</strong>. When you scan a repository:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
                <li>Files are pulled into a volatile sandbox container.</li>
                <li>The AI engine performs analysis in real-time.</li>
                <li>Once the report is generated, all source code is permanently deleted from our servers.</li>
              </ul>
              <p>We do not store your code for AI training purposes.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              <Database className="w-6 h-6 text-emerald" />
              2. Data We Collect
            </h2>
            <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
              <p className="mb-4">We only collect minimum necessary data to provide our service:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Account Information: Name and email from your GitHub/GitLab login.</li>
                <li>Metadata: Project names, vulnerability counts, and scan timestamps.</li>
                <li>Analytics: Basic usage patterns to improve platform performance.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              <Shield className="w-6 h-6 text-emerald" />
              3. Security Measures
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              We employ SOC2-compliant security measures to protect your metadata. All communication is encrypted via TLS 1.3, and database records are encrypted at rest using AES-256.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald" />
                <span className="text-sm">End-to-End Encryption</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald" />
                <span className="text-sm">Isolated Sandbox Execution</span>
              </div>
            </div>
          </section>

          <section className="bg-emerald/5 border border-emerald/20 p-8 rounded-[32px]">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald" />
              Third-Party AI Providers
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our AI analysis is powered by Groq and Google Gemini. When you use our default engine, code fragments are sent to these providers via secure APIs. For maximum privacy, we recommend using your own <strong>Private API Keys</strong> so data goes directly to the provider under your own agreement.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
