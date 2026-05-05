import React from 'react';
import { Shield, Users, Target, Rocket, Heart, Zap, Award } from 'lucide-react';
import type { AppView } from '../App';
import Navigation from '../components/Navigation';

interface AboutPageProps {
  onNavigate: (view: AppView) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="bg-[#0c0c0e] min-h-screen text-white">
      <Navigation onNavigate={onNavigate} />
      
      <div className="h-20" />

      <main className="max-w-6xl mx-auto px-6 py-20">
        {/* Mission Section */}
        <section className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald/10 border border-emerald/20 text-emerald text-xs font-mono uppercase tracking-widest mb-8">
            <Target className="w-4 h-4" /> Our Mission
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">Making the web secure,<br />one line of code at a time.</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            Scanmate was founded with a simple goal: to empower developers with enterprise-grade security tools that don't slow down innovation. We believe security should be proactive, automated, and accessible to everyone.
          </p>
        </section>

        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
          <div className="relative group">
            <div className="absolute -inset-4 bg-emerald/20 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative aspect-square rounded-[40px] border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center">
              <Shield className="w-32 h-32 text-emerald/20 absolute" />
              <div className="z-10 text-center p-10">
                <div className="text-6xl font-bold text-white mb-2">2024</div>
                <div className="text-emerald font-mono uppercase tracking-widest text-sm">Founded in Colombo</div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              What started as a tool to automate internal security audits for a small team of engineers quickly grew into a mission-critical platform for developers worldwide. 
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Today, Scanmate uses state-of-the-art AI to analyze millions of lines of code, helping teams identify critical vulnerabilities before they ever reach production.
            </p>
          </div>
        </div>

        {/* Values Grid */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-10 rounded-[32px] border border-white/10 bg-white/[0.02]">
              <div className="w-12 h-12 rounded-2xl bg-emerald/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-emerald" />
              </div>
              <h3 className="text-xl font-bold mb-4">Community First</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">We build for developers. Our community guides our roadmap and ensures we're solving real-world problems.</p>
            </div>
            <div className="glass-card p-10 rounded-[32px] border border-white/10 bg-white/[0.02]">
              <div className="w-12 h-12 rounded-2xl bg-emerald/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-emerald" />
              </div>
              <h3 className="text-xl font-bold mb-4">Innovation Speed</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Security shouldn't be a bottleneck. We focus on providing lightning-fast analysis and instant AI fixes.</p>
            </div>
            <div className="glass-card p-10 rounded-[32px] border border-white/10 bg-white/[0.02]">
              <div className="w-12 h-12 rounded-2xl bg-emerald/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-emerald" />
              </div>
              <h3 className="text-xl font-bold mb-4">Absolute Security</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Your code privacy is our priority. We maintain a zero-retention policy to keep your data safe.</p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 border-t border-white/5 flex flex-wrap justify-center gap-16 md:gap-32">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">5M+</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Lines Scanned</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">10k+</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Threats Fixed</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">99.9%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Uptime</div>
          </div>
        </section>
      </main>
    </div>
  );
}
