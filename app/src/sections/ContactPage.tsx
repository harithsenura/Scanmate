import React, { useState } from 'react';
import { Mail, MessageSquare, MapPin, Send, Check, Phone, Globe, Github } from 'lucide-react';
import type { AppView } from '../App';
import Navigation from '../components/Navigation';

interface ContactPageProps {
  onNavigate: (view: AppView) => void;
}

export default function ContactPage({ onNavigate }: ContactPageProps) {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="bg-[#0c0c0e] min-h-screen text-white">
      <Navigation onNavigate={onNavigate} />
      
      <div className="h-20" />

      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Column: Info */}
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Let's secure your<br />next project.</h1>
            <p className="text-xl text-muted-foreground mb-12 font-light leading-relaxed">
              Have questions about enterprise plans, custom integrations, or just want to say hi? We'd love to hear from you.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald/10 border border-emerald/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6 text-emerald" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Email Us</h4>
                  <p className="text-muted-foreground text-sm mb-1">General Inquiries: hello@scanmate.ai</p>
                  <p className="text-muted-foreground text-sm">Support: support@scanmate.ai</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald/10 border border-emerald/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-emerald" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Live Chat</h4>
                  <p className="text-muted-foreground text-sm">Average response time: 2 hours</p>
                  <button className="text-emerald text-sm font-semibold mt-2 hover:underline">Start a conversation &rarr;</button>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald/10 border border-emerald/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-emerald" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Office</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">Level 12, World Trade Center<br />Colombo 00100, Sri Lanka</p>
                </div>
              </div>
            </div>

            <div className="mt-16 pt-16 border-t border-white/5 flex gap-6">
              <Github className="w-6 h-6 text-muted-foreground hover:text-white transition-colors cursor-pointer" />
              <Globe className="w-6 h-6 text-muted-foreground hover:text-white transition-colors cursor-pointer" />
              <Phone className="w-6 h-6 text-muted-foreground hover:text-white transition-colors cursor-pointer" />
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="relative">
            <div className="absolute -inset-1 bg-emerald/20 rounded-[40px] blur-3xl opacity-20"></div>
            <div className="relative glass-card p-8 md:p-12 rounded-[40px] border border-white/10 bg-obsidian/40 backdrop-blur-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                    <input type="text" placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald/50 transition-colors text-white" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                    <input type="email" placeholder="john@example.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald/50 transition-colors text-white" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald/50 transition-colors text-white appearance-none">
                    <option className="bg-obsidian">General Inquiry</option>
                    <option className="bg-obsidian">Enterprise Plans</option>
                    <option className="bg-obsidian">Security Vulnerability Report</option>
                    <option className="bg-obsidian">Partnership</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</label>
                  <textarea placeholder="How can we help?" rows={5} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald/50 transition-colors text-white resize-none" required></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={sent}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
                    sent 
                      ? 'bg-emerald/20 text-emerald border border-emerald/50' 
                      : 'bg-emerald text-obsidian hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  }`}
                >
                  {sent ? (
                    <>
                      <Check className="w-5 h-5" /> Message Sent Successfully
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
