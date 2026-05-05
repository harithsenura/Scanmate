import React from 'react';
import { FileText, Scale, AlertCircle, Gavel, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { AppView } from '../App';
import Navigation from '../components/Navigation';

interface TermsPageProps {
  onNavigate: (view: AppView) => void;
}

export default function TermsPage({ onNavigate }: TermsPageProps) {
  return (
    <div className="bg-[#0c0c0e] min-h-screen text-white">
      <Navigation onNavigate={onNavigate} />
      
      <div className="h-20" />

      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-4 text-emerald font-mono text-sm uppercase tracking-widest">
          <Scale className="w-5 h-5" />
          Service Agreement v1.2
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">Terms of Service</h1>
        <p className="text-lg text-muted-foreground mb-16 font-light leading-relaxed">
          By using Scanmate, you agree to these terms. Please read them carefully as they contain important information about your legal rights and obligations.
        </p>

        <div className="space-y-12">
          <section className="glass-card p-8 md:p-10 rounded-[40px] border border-white/10 bg-white/[0.02]">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              <ShieldCheck className="w-6 h-6 text-emerald" />
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Scanmate provides an AI-powered security scanning service. By accessing or using our platform, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to all these terms, you may not use the service.
            </p>
          </section>

          <section className="glass-card p-8 md:p-10 rounded-[40px] border border-white/10 bg-white/[0.02]">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              <CheckCircle2 className="w-6 h-6 text-emerald" />
              2. User Obligations
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>You agree not to use the service to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Scan code that you do not have authorized access to.</li>
                <li>Attempt to bypass our rate limits or security measures.</li>
                <li>Use the AI fixes to generate malicious software.</li>
                <li>Reverse engineer the Scanmate engine or analysis logic.</li>
              </ul>
            </div>
          </section>

          <section className="glass-card p-8 md:p-10 rounded-[40px] border border-white/10 bg-white/[0.02]">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              <AlertCircle className="w-6 h-6 text-ruby" />
              3. Disclaimer of Warranty
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The service and AI-generated fixes are provided "as is" without warranty of any kind. While our AI is highly accurate, it is your responsibility to review all suggested code changes before applying them to a production environment. Scanmate is not liable for any issues arising from the use of AI-generated suggestions.
            </p>
          </section>

          <section className="glass-card p-8 md:p-10 rounded-[40px] border border-white/10 bg-white/[0.02]">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              <Gavel className="w-6 h-6 text-emerald" />
              4. Termination
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your access to the service at any time, without notice, for any conduct that we believe violates these Terms or is harmful to other users or the service.
            </p>
          </section>
        </div>

        <div className="mt-16 p-8 rounded-3xl bg-white/5 border border-white/10 text-center">
          <p className="text-sm text-muted-foreground">
            Questions about our Terms? Contact us at <a href="mailto:legal@scanmate.ai" className="text-emerald hover:underline">legal@scanmate.ai</a>
          </p>
        </div>
      </main>
    </div>
  );
}
