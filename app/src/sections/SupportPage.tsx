import { HelpCircle, Mail, MessageSquare, BookOpen, ArrowRight, LifeBuoy } from 'lucide-react';
import type { AppView } from '../App';
import Navigation from '../components/Navigation';

interface SupportPageProps {
  onNavigate: (view: AppView) => void;
}

export default function SupportPage({ onNavigate }: SupportPageProps) {
  return (
    <div className="bg-[#0c0c0e] min-h-screen text-white">
      <Navigation onNavigate={onNavigate} />
      
      <div className="h-20" />

      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4 text-emerald font-mono text-sm uppercase tracking-widest">
            <LifeBuoy className="w-5 h-5" />
            Scanmate Support Center
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">How can we help you?</h1>
          <p className="text-xl text-muted-foreground max-w-2xl font-light leading-relaxed">
            Whether you're troubleshooting a scan, setting up CI/CD, or have questions about security reports, our team and resources are here to support you.
          </p>
        </div>

        {/* Support Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="glass-card p-8 rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col items-start group hover:border-emerald/50 transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-emerald/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-emerald" />
            </div>
            <h3 className="text-xl font-bold mb-3">Self-Service Docs</h3>
            <p className="text-sm text-muted-foreground mb-8 flex-grow">Search our comprehensive guides for quick answers to common setup questions and feature usage.</p>
            <button 
              onClick={() => onNavigate('docs')}
              className="flex items-center gap-2 text-emerald font-semibold text-sm group"
            >
              Read Docs <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col items-start group hover:border-emerald/50 transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-emerald/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6 text-emerald" />
            </div>
            <h3 className="text-xl font-bold mb-3">Community Discord</h3>
            <p className="text-sm text-muted-foreground mb-8 flex-grow">Join 5,000+ developers in our Discord. Share custom scanning rules and get community-driven support.</p>
            <a href="#" className="flex items-center gap-2 text-emerald font-semibold text-sm group">
              Join Discord <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col items-start group hover:border-emerald/50 transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-emerald/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6 text-emerald" />
            </div>
            <h3 className="text-xl font-bold mb-3">Email Support</h3>
            <p className="text-sm text-muted-foreground mb-8 flex-grow">For billing, enterprise inquiries, or critical issues, our security experts respond within 24 hours.</p>
            <a href="mailto:support@scanmate.ai" className="flex items-center gap-2 text-emerald font-semibold text-sm group">
              Contact Us <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "Is Scanmate free for open source?",
                a: "Yes! Scanmate is free for all public repositories. You can scan unlimited public projects on the Free plan."
              },
              {
                q: "Which languages are supported?",
                a: "Currently we provide deep AI analysis for Python, JavaScript, TypeScript, Go, and Java. More languages are added weekly."
              },
              {
                q: "How do I upgrade to the Pro plan?",
                a: "Plan switching is currently under development. You can use Private API keys to unlock all premium scanning features today."
              }
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors">
                <h4 className="font-bold mb-2 flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-emerald" />
                  {faq.q}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed pl-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
