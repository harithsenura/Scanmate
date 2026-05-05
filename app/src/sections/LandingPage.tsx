import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Zap, Lock, ChevronRight, Github, Twitter, Linkedin, Shield, Search, Database, Fingerprint, FolderLock, Globe, PackageSearch, X, BookOpen, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import type { AppView } from '../App';
import Navigation from '../components/Navigation';


interface LandingPageProps {
  onNavigate: (view: AppView) => void;
  isLoggedIn?: boolean;
  user?: any;
}

const useCases = [
  {
    icon: Database,
    title: 'SQL Injection Detection',
    description: 'Identifies unsafe string concatenation and parameter interpolation in database queries. Automatically suggests parameterized query patterns to prevent unauthorized data access.',
    severity: 'critical' as const,
    cwe: 'CWE-89: SQL Injection',
    impact: 'Full database access, sensitive data exfiltration, and potential administrative takeover.',
  },
  {
    icon: Fingerprint,
    title: 'Hardcoded Secret Leak',
    description: 'Scans for API keys, passwords, tokens, and certificates embedded directly in source code. Uses entropy analysis to detect high-randomness strings that may be secrets.',
    severity: 'critical' as const,
    cwe: 'CWE-798: Hardcoded Credentials',
    impact: 'Unauthorized access to cloud infrastructure, third-party APIs, and private databases.',
  },
  {
    icon: FolderLock,
    title: 'Insecure File Permissions',
    description: 'Detects dangerous file operation patterns including path traversal, unrestricted uploads, and overly permissive access controls that could lead to data breaches.',
    severity: 'high' as const,
    cwe: 'CWE-22: Path Traversal',
    impact: 'System file modification, source code theft, and arbitrary file read/write vulnerabilities.',
  },
  {
    icon: Globe,
    title: 'Cross-Site Scripting (XSS)',
    description: 'Finds unsanitized user input rendered in HTML contexts. Tracks data flow from sources to sinks and recommends context-aware encoding functions.',
    severity: 'high' as const,
    cwe: 'CWE-79: Cross-site Scripting',
    impact: 'Session hijacking, credential theft, and malicious script execution in user browsers.',
  },
  {
    icon: Search,
    title: 'Deprecated API Usage',
    description: 'Flags usage of outdated cryptographic algorithms, insecure protocols, and deprecated framework functions known to contain security vulnerabilities.',
    severity: 'medium' as const,
    cwe: 'CWE-327: Broken Crypto',
    impact: 'Encryption bypass, man-in-the-middle attacks, and compliance failure (PCI-DSS, HIPAA).',
  },
  {
    icon: PackageSearch,
    title: 'Vulnerable Dependency',
    description: 'Analyzes package manifests against known vulnerability databases. Identifies outdated libraries with published CVEs and suggests secure upgrade paths.',
    severity: 'medium' as const,
    cwe: 'CWE-1035: Unmaintained',
    impact: 'Supply chain attacks, exploitation of known legacy bugs, and reduced system stability.',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for individual developers and open source projects.',
    features: [
      '100 Scans per month',
      'Basic Vulnerability Detection',
      'Public Repository Access',
      'Community Support',
    ],
    cta: 'Start for Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: 'per month',
    description: 'Advanced security for professional developers and scaling teams.',
    features: [
      'Unlimited Scans',
      'AI-Powered Code Fixes',
      'Private Repository Access',
      'Detailed Security Reports',
      'Priority Email Support',
    ],
    cta: 'Try Pro Free',
    popular: true,
  },
  {
    name: 'Ultra',
    price: '$199',
    period: 'per month',
    description: 'Enterprise-grade security and compliance for large organizations.',
    features: [
      'Custom Deployment',
      'SLA Guarantee',
      'Advanced API Access',
      'Unlimited Team Members',
      'Compliance Export',
      'Dedicated Manager',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const sampleCode = `import sqlite3
from flask import request

def get_user():
    user_id = request.args.get('id')
    conn = sqlite3.connect('db.sqlite')
    cursor = conn.cursor()
    
    # DANGER: String formatting allows SQL injection
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)
    
    return cursor.fetchall()`;

const _fixedCode = `import sqlite3
from flask import request

def get_user():
    user_id = request.args.get('id')
    conn = sqlite3.connect('db.sqlite')
    cursor = conn.cursor()
    
    # SECURE: Parameterized query prevents injection
    query = "SELECT * FROM users WHERE id = ?"
    cursor.execute(query, (user_id,))
    
    return cursor.fetchall()`;

export default function LandingPage({ onNavigate, isLoggedIn = false, user = null }: LandingPageProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedCase, setSelectedCase] = useState<typeof useCases[0] | null>(null);
  const [activeEditorTab, _setActiveEditorTab] = useState<'code' | 'results'>('code');

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animations
      const tl = gsap.timeline({ delay: 0.1 });
      tl.fromTo('.hero-badge', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
        .fromTo('.hero-title', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.4')
        .fromTo('.hero-desc', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.6')
        .fromTo('.hero-actions', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.4');

      // Scanning line animation
      gsap.to('.scanning-line', {
        top: '100%',
        duration: 4,
        repeat: -1,
        ease: 'none',
      });

      // Neural mesh particles
      gsap.to('.neural-particle', {
        x: 'random(-40, 40)',
        y: 'random(-40, 40)',
        duration: 'random(2, 4)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.1,
      });

      // Features Animations
      gsap.fromTo('.features-header',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: featuresRef.current, start: 'top 75%' } }
      );
      
      gsap.fromTo('.features-editor',
        { y: 60, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power4.out', scrollTrigger: { trigger: editorRef.current, start: 'top 85%' } }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-[#0c0c0e] min-h-screen">
      {/* Navigation */}
      <Navigation onNavigate={onNavigate} isLoggedIn={isLoggedIn} user={user} transparent={true} />

      {/* Spacer Removed */}

      {/* Main Content Wrapper - scrolls over nav bar */}
      <div className="relative z-10">
        <section ref={heroRef} className="relative min-h-screen bg-[#0c0c0e] flex items-center justify-center overflow-hidden border-white/5">
          {/* Neural Mesh Background Effect - Updated for Starvy Style */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[1px] h-[1px] bg-emerald/40 shadow-[0_0_80px_60px_rgba(16,185,129,0.05)] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[1px] h-[1px] bg-emerald/40 shadow-[0_0_80px_60px_rgba(16,185,129,0.05)] rounded-full animate-pulse delay-1000" />
          
          {/* Subtle Cross Accents */}
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="absolute text-emerald/20 font-thin text-2xl select-none"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${10 + Math.random() * 80}%`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            >
              +
            </div>
          ))}
        </div>

        {/* Scanning Line Effect */}
        <div className="scanning-line absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald/20 to-transparent z-10 pointer-events-none" />

        {/* Modern Grid Overlay - Faded */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none opacity-50" />
        
        {/* Central Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[800px] h-[500px] bg-emerald/5 rounded-full blur-[150px] pointer-events-none" />

        {/* Content Overlay */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-32 md:pt-40">
          <div className="hero-badge inline-flex items-center gap-2 bg-emerald/[0.03] border border-emerald/20 rounded-full px-4 py-1.5 mb-10 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
            <span className="text-[10px] font-mono text-emerald uppercase tracking-[0.25em] font-bold">
              Your AI Security Assistant
            </span>
          </div>

          <h1 className="hero-title text-4xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            Secure Your Codebase with <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-emerald via-emerald/80 to-emerald/40 bg-clip-text text-transparent">AI-Powered Precision</span>
          </h1>

          <p className="hero-desc text-base md:text-xl text-muted-foreground/60 max-w-2xl mx-auto mb-12 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Effortlessly detect vulnerabilities, suggest fixes, and maintain 
            <br className="hidden md:block" /> a secure codebase with our intelligent security engine.
          </p>

          <div className="hero-actions flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <button
              onClick={() => onNavigate(isLoggedIn ? 'repos' : 'login')}
              className="group relative bg-emerald text-obsidian font-bold px-10 py-4 rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(16,185,129,0.3)] text-sm overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </span>
            </button>

            <button
              onClick={() => onNavigate('docs')}
              className="flex items-center gap-2 text-[10px] font-mono text-emerald/40 hover:text-emerald transition-colors tracking-[0.25em] uppercase font-bold"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Documentation
            </button>
          </div>

          {/* Ultra-Modern Product Preview Mockup */}
          <div className="mt-20 md:mt-36 relative group -mx-4 sm:mx-0 text-left scale-[0.9] md:scale-100 transition-transform duration-700">
            {/* Ambient Background Mesh Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald/5 blur-[140px] pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
            
            <div className="relative flex flex-col md:flex-row gap-8 items-start md:perspective-[2000px]">
              {/* Floating Sidebar Panel (Explorer) - High Depth */}
              <div className="hidden md:block w-72 shrink-0 h-full animate-in fade-in slide-in-from-left-12 duration-1000 delay-500 md:rotate-y-[15deg] md:hover:rotate-y-0 transition-transform duration-700 origin-right">
                <div className="bg-white/[0.02] backdrop-blur-[40px] border border-white/10 rounded-[32px] p-8 h-[520px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] flex flex-col group/sidebar hover:border-emerald/30">
                  <div className="flex items-center gap-3 mb-10 text-emerald/40 text-[9px] font-mono tracking-[0.4em] uppercase border-b border-white/5 pb-5">
                    <Database className="w-4 h-4" />
                    Source Hub
                  </div>
                  <div className="space-y-6">
                    {[
                      { name: 'auth_service.py', status: 'secure' },
                      { name: 'proxy_layer.py', status: 'secure' },
                      { name: 'secure_queries.py', status: 'scanning' },
                      { name: 'api_handler.py', status: 'queued' }
                    ].map((file) => (
                      <div key={file.name} className="flex items-center justify-between group/item cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className={`w-1.5 h-1.5 rounded-full ${file.status === 'scanning' ? 'bg-emerald animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]' : 'bg-white/10'}`} />
                          <span className={`text-[11px] font-mono transition-colors ${file.status === 'scanning' ? 'text-emerald' : 'text-white/30 group-hover/item:text-white/60'}`}>{file.name}</span>
                        </div>
                        {file.status === 'secure' && <Shield className="w-3 h-3 text-emerald/20" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Intelligence Dashboard Area */}
              <div className="flex-1 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700 md:rotate-y-[-10deg] md:hover:rotate-y-0 transition-transform duration-700 origin-left">
                {/* Command Center: Live Scanning Header */}
                <div className="relative bg-white/[0.01] backdrop-blur-[60px] border border-emerald/10 rounded-[32px] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl group/header hover:border-emerald/30 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald/[0.02] to-transparent opacity-0 group-hover/header:opacity-100 transition-opacity" />
                  
                  <div className="flex items-center gap-8 relative z-10 w-full md:w-auto mb-8 md:mb-0">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-[28px] bg-emerald/5 border border-emerald/10 flex items-center justify-center shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] group-hover/header:bg-emerald/10 transition-colors">
                        <Search className="w-8 h-8 text-emerald animate-pulse" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-obsidian border border-emerald/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-emerald" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-light text-2xl tracking-tighter mb-2">Omniscient Engine</h4>
                      <p className="text-[10px] font-mono text-emerald uppercase tracking-[0.3em] font-bold opacity-60">Scanning Neural Patterns</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center md:items-end gap-5 relative z-10 w-full md:w-auto">
                    <div className="flex items-baseline gap-2">
                      <span className="text-white font-mono text-4xl font-light tracking-tighter">85.4</span>
                      <span className="text-emerald text-sm font-bold tracking-widest">%</span>
                    </div>
                    <div className="w-full md:w-80 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                      <div className="absolute inset-0 bg-emerald/10 blur-[4px]" />
                      <div className="relative w-[85%] h-full bg-emerald shadow-[0_0_20px_rgba(16,185,129,0.8)] transition-all duration-1000" />
                    </div>
                  </div>
                </div>

                {/* Intelligent Findings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {/* Panel: Critical Threat */}
                  <div className="relative bg-white/[0.01] backdrop-blur-[40px] border border-ruby/10 rounded-[32px] p-6 md:p-8 hover:bg-ruby/[0.03] transition-all duration-500 shadow-2xl group/finding hover:border-ruby/40 hover:-translate-y-2">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-ruby/5 border border-ruby/10 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-ruby" />
                        </div>
                        <div>
                          <p className="text-ruby text-[9px] font-bold tracking-[0.2em] uppercase">Critical Impact</p>
                          <p className="text-white/40 text-[9px] font-mono">ID: SEC-892</p>
                        </div>
                      </div>
                    </div>
                    <h5 className="text-white font-light text-xl mb-5 tracking-tight">SQL Injection discovered</h5>
                    <div className="bg-black/60 rounded-[20px] p-5 border border-white/5 font-mono text-[10px] leading-relaxed mb-6 group-hover/finding:border-ruby/20 transition-colors">
                      <div className="text-ruby/30 line-through mb-2 opacity-50 italic"># query = "SELECT * FROM ... " + id</div>
                      <div className="text-emerald font-medium">+ cursor.execute(query, (id,))</div>
                    </div>
                    <div className="flex items-center gap-4 opacity-40">
                      {['Database', 'Auth'].map(t => (
                        <span key={t} className="text-[8px] font-mono uppercase tracking-widest text-white">{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Panel: Security Warning */}
                  <div className="relative bg-white/[0.01] backdrop-blur-[40px] border border-amber/10 rounded-[32px] p-6 md:p-8 hover:bg-amber/[0.03] transition-all duration-500 shadow-2xl group/warning hover:border-amber/40 hover:-translate-y-2">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber/5 border border-amber/10 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-amber" />
                        </div>
                        <div>
                          <p className="text-amber text-[9px] font-bold tracking-[0.2em] uppercase">Security Alert</p>
                          <p className="text-white/40 text-[9px] font-mono">ID: SEC-112</p>
                        </div>
                      </div>
                    </div>
                    <h5 className="text-white font-light text-xl mb-5 tracking-tight">Hardcoded Credentials</h5>
                    <p className="text-[12px] text-muted-foreground/60 leading-relaxed mb-8 font-light">
                      High entropy secret discovered in global configuration. Possible exposed AWS key.
                    </p>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-amber/40">
                      <div className="w-2 h-2 rounded-full bg-amber shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      config.json:12
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logo Cloud Section */}
          <div className="mt-20 py-10 border-t border-white/5">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em] mb-10">Trusted by modern engineering teams</p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-30 grayscale hover:grayscale-0 transition-all">
              {['GITHUB', 'VERCEL', 'DOCKER', 'SUPABASE'].map((logo, i) => (
                <span key={i} className="text-xl font-bold tracking-tighter text-white italic">{logo}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom gradient fade - Updated to dark theme */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/80 to-transparent z-10 pointer-events-none" />
      </section>

      {/* ===== EDITOR SHOWCASE SECTION ===== */}
      <section ref={featuresRef} id="features" className="relative bg-[#0c0c0e] pt-12 pb-24 md:pt-16 md:pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="features-header text-center mb-16 md:mb-24">
            <div className="inline-flex items-center gap-2 bg-emerald/5 border border-emerald/20 px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
              <span className="text-[10px] font-mono text-emerald uppercase tracking-widest font-bold">
                Advanced Code Analysis
              </span>
            </div>
            <h2 className="text-3xl md:text-6xl font-medium text-white tracking-tighter mb-6 leading-tight">
              Detect and Refactor <br className="hidden md:block" /> with AI Intelligence
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground/60 max-w-2xl mx-auto font-light leading-relaxed">
              Our engine goes beyond simple detection. It understands the context, 
              evaluates the impact, and writes secure code so you don't have to.
            </p>
          </div>

          {/* Ultra-Modern Editor Showcase */}
          <div ref={editorRef} className="features-editor relative">
            {/* Background Glows for Depth */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[300px] bg-emerald/10 blur-[120px] pointer-events-none opacity-40" />
            <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[400px] h-[300px] bg-ruby/5 blur-[120px] pointer-events-none opacity-40" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Panel: Source Code (Desktop Only) */}
              <div className="hidden lg:block lg:col-span-7 group">
                <div className="relative bg-[#08080a]/60 backdrop-blur-3xl border border-white/10 rounded-[24px] overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-white/20 group-hover:bg-[#08080a]/80">
                  {/* Window Controls */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                      </div>
                      <div className="h-3 w-px bg-white/10 mx-1" />
                      <span className="text-[9px] font-mono text-white/30 tracking-[0.3em] uppercase">auth_service.py</span>
                    </div>
                  </div>

                  <div className="p-6 h-[480px] overflow-y-auto custom-scrollbar">
                    <pre className="font-mono text-[13px] leading-7">
                      <code>
                        {sampleCode.split('\n').map((line, i) => (
                          <div key={i} className={`flex transition-colors duration-300 ${line.includes('DANGER') ? 'bg-ruby/10 -mx-6 px-6 border-l-2 border-ruby' : 'hover:bg-white/[0.02] -mx-6 px-6'}`}>
                            <span className="text-white/10 w-8 text-left mr-4 select-none font-light italic">{String(i + 1).padStart(2, '0')}</span>
                            <span className="whitespace-pre">
                              {line.includes('import') && (
                                <><span className="text-emerald/60 italic mr-2">import</span><span className="text-white/90">{line.replace('import', '')}</span></>
                              )}
                              {line.includes('from') && (
                                <><span className="text-emerald/60 italic mr-2">from</span><span className="text-white/90">{line.replace('from', '').replace('import', '')}</span><span className="text-emerald/60 italic ml-2">import</span></>
                              )}
                              {line.includes('def ') && (
                                <><span className="text-emerald/40 italic mr-2">def</span><span className="text-emerald font-medium underline decoration-emerald/20 underline-offset-4">{line.split('def ')[1]?.split('(')[0]}</span><span className="text-white/40">{'('}{line.split('(')[1]}</span></>
                              )}
                              {line.includes("'") && !['import', 'from', 'def'].some(k => line.includes(k)) && (
                                line.split("'").map((part, j) => (
                                  <span key={j} className={j % 2 === 1 ? 'text-amber-200/60 font-medium' : 'text-white/70'}>
                                    {j % 2 === 1 ? `'${part}'` : part}
                                  </span>
                                ))
                              )}
                              {!['import', 'from', 'def', "'"].some(k => line.includes(k)) && (
                                <span className={line.includes('DANGER') ? 'text-ruby font-bold' : 'text-white/50'}>{line}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Right Panel: Intelligence Hub (Always Visible) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Security Score Card - NEW */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] p-6 flex items-center justify-between group/score hover:border-emerald/30 transition-all duration-500">
                  <div>
                    <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.3em] mb-1">Security Status</div>
                    <div className="text-2xl font-medium text-white tracking-tighter">Critical Risk</div>
                  </div>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="176" strokeDashoffset="140" className="text-ruby" />
                    </svg>
                    <span className="absolute text-ruby font-mono text-[10px] font-bold">24%</span>
                  </div>
                </div>

                {/* Finding Detail Card */}
                <div className="bg-ruby/5 backdrop-blur-xl border border-ruby/20 rounded-[24px] p-6 group/finding hover:bg-ruby/[0.08] transition-all duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-ruby/10 border border-ruby/20 flex items-center justify-center">
                      <Shield className="w-4.5 h-4.5 text-ruby" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm tracking-tight">SQL Injection</h4>
                      <p className="text-[9px] font-mono text-ruby/50 uppercase tracking-widest">CWE-89 • High Priority</p>
                    </div>
                  </div>
                  <p className="text-[13px] text-muted-foreground/80 leading-relaxed mb-4 font-light">
                    Direct user input interpolation detected. This allows unauthorized 
                    database access and potential system takeover.
                  </p>
                  <div className="flex gap-3">
                    {['Data Leak', 'RCE'].map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-white/[0.02] border border-white/10 text-[8px] text-white/40 uppercase tracking-widest">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* AI Resolution Center */}
                <div className="relative bg-emerald/[0.02] backdrop-blur-3xl border border-emerald/20 rounded-[24px] p-6 overflow-hidden group/ai hover:border-emerald/40 transition-all duration-500 shadow-2xl">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald/10 blur-[50px] rounded-full" />
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald/10 border border-emerald/20 flex items-center justify-center">
                        <Zap className="w-4.5 h-4.5 text-emerald animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm tracking-tight">AI Auto-Fix</h4>
                        <p className="text-[9px] font-mono text-emerald uppercase tracking-widest font-bold">98% Confidence</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-xl p-4 mb-6 border border-white/5 font-mono text-[11px] leading-relaxed group-hover/ai:border-emerald/20 transition-colors">
                    <div className="flex items-center gap-2 mb-3 text-emerald/40">
                      <div className="w-1 h-1 rounded-full bg-emerald" />
                      Suggested Refactor
                    </div>
                    <code className="text-white/90">
                      {`query = "SELECT * FROM users WHERE id = ?"`}
                      <br />
                      <span className="text-emerald">{`cursor.execute(query, (user_id,))`}</span>
                    </code>
                  </div>

                  <button
                    onClick={() => onNavigate('scanner')}
                    className="w-full relative group/btn bg-emerald text-obsidian font-bold py-4 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.01] active:scale-95 shadow-xl"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                    <span className="relative flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em]">
                      Secure Code Now
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== USE CASE GALLERY ===== */}
      <section id="use-cases" className="relative bg-obsidian py-24 md:py-32 overflow-hidden">
        {/* Glow effect matching dashboard */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-emerald/5 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="text-xs font-mono text-emerald bg-emerald/10 border border-emerald/20 px-3 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Vulnerability Database
            </span>
            <h2 className="text-3xl md:text-5xl font-medium text-white tracking-tight mt-6 mb-4 px-4 md:px-0">
              Security scenarios, covered.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto px-4 md:px-0">
              From injection attacks to insecure dependencies, Scanmate detects
              the full spectrum of application security vulnerabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <div 
                key={useCase.title} 
                onClick={() => setSelectedCase(useCase)}
                className="glass-card rounded-2xl overflow-hidden group border border-white/10 hover:border-emerald/50 transition-all duration-500 cursor-pointer p-8 relative flex flex-col h-full bg-[#0c0c0e]/40 hover:bg-emerald/[0.02]"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                   <useCase.icon className="w-24 h-24 text-emerald" />
                </div>

                <div className="mb-8">
                  <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6 ${
                    useCase.severity === 'critical' ? 'bg-ruby/10 text-ruby border border-ruby/20' :
                    useCase.severity === 'high' ? 'bg-amber/10 text-amber border border-amber/20' :
                    'bg-emerald/10 text-emerald border border-emerald/20'
                  }`}>
                    {useCase.severity}
                  </div>
                  
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <useCase.icon className="w-6 h-6 text-emerald" />
                  </div>

                  <h3 className="text-xl font-medium text-white tracking-tight mb-3 group-hover:text-emerald transition-colors">
                    {useCase.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {useCase.description}
                  </p>
                </div>
                
                <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {useCase.cwe}
                  </span>
                  <span className="text-xs font-medium text-emerald flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-300">
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Use Case Details Modal */}
        {selectedCase && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => setSelectedCase(null)}
            />
            <div className="relative w-full max-w-2xl bg-obsidian border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8 md:p-12">
                <button 
                  onClick={() => setSelectedCase(null)}
                  className="absolute top-8 right-8 p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-emerald/10 border border-emerald/20 flex items-center justify-center">
                    <selectedCase.icon className="w-8 h-8 text-emerald" />
                  </div>
                  <div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
                      selectedCase.severity === 'critical' ? 'bg-ruby/10 text-ruby' :
                      selectedCase.severity === 'high' ? 'bg-amber/10 text-amber' :
                      'bg-emerald/10 text-emerald'
                    }`}>
                      {selectedCase.severity} Severity
                    </div>
                    <h3 className="text-2xl md:text-3xl font-medium text-white tracking-tight">
                      {selectedCase.title}
                    </h3>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="text-xs font-mono text-emerald uppercase tracking-widest mb-3">Overview</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedCase.description}
                    </p>
                  </div>

                  {/* Sections removed as requested */}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Removed Stats Section */}

      {/* ===== PRICING SECTION ===== */}
      <section id="pricing" className="relative bg-[#0c0c0e] py-32 md:py-40 overflow-hidden border-t border-white/5">
        {/* Modern background elements */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-emerald/5 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-medium text-white tracking-tighter mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light">
              Choose the plan that fits your security needs. All plans include 
              access to our core AI vulnerability scanner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <div 
                key={plan.name}
                className={`relative p-8 rounded-[32px] border transition-all duration-500 flex flex-col h-full ${
                  plan.popular 
                    ? 'bg-white/[0.03] border-emerald/50 shadow-[0_0_40px_rgba(16,185,129,0.1)] scale-105 z-10' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald text-obsidian text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-medium text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl md:text-5xl font-medium text-white">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-4 mb-10 flex-grow">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <div className="mt-1 w-4 h-4 rounded-full bg-emerald/10 border border-emerald/20 flex items-center justify-center flex-shrink-0">
                        <ChevronRight className="w-2.5 h-2.5 text-emerald" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (plan.name === 'Pro' || plan.name === 'Ultra') {
                      alert('This plan is currently under development. Stay tuned for the official launch!');
                    } else {
                      onNavigate('login');
                    }
                  }}
                  className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-emerald text-obsidian hover:bg-emerald-400 hover:scale-[1.02] shadow-xl'
                      : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:scale-[1.02]'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ===== NEWSLETTER SECTION ===== */}
      <section className="py-24 relative overflow-hidden border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-white">Stay ahead of threats.</h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl font-light">
              Get weekly security insights and AI-powered patch updates delivered to your inbox.
            </p>
            
            <form className="w-full max-w-md relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald/50 to-emerald/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 focus-within:border-emerald/50 transition-colors">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-transparent border-none px-4 py-3 text-white outline-none placeholder:text-muted-foreground text-sm"
                />
                <button 
                  type="submit"
                  onClick={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }}
                  className="bg-emerald text-obsidian px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] text-sm"
                >
                  Subscribe
                </button>
              </div>
            </form>
            
            <p className="mt-8 text-[11px] text-muted-foreground flex items-center gap-2 uppercase tracking-widest font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald" /> Join 10,000+ developers securing their code
            </p>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald/5 rounded-full blur-[120px] pointer-events-none"></div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-obsidian border-t border-white/5 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8 mb-16">
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-2.5 mb-6">
                <Shield className="w-6 h-6 text-emerald drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-xl font-semibold tracking-tight text-white">
                  Scanmate<span className="text-emerald"></span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs font-light">
                The AI-native security scanner that finds vulnerabilities and suggests fixes as you write code.
              </p>
              <div className="flex gap-4 mt-8">
                <Github className="w-5 h-5 text-muted-foreground hover:text-white hover:scale-110 transition-all cursor-pointer" />
                <Twitter className="w-5 h-5 text-muted-foreground hover:text-white hover:scale-110 transition-all cursor-pointer" />
                <Linkedin className="w-5 h-5 text-muted-foreground hover:text-white hover:scale-110 transition-all cursor-pointer" />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-white mb-6 uppercase tracking-wider">Product</h4>
              <ul className="space-y-4">
                {['SAST Scanner', 'AI Fixes', 'Cloud History', 'Private API'].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => onNavigate('scanner')}
                      className="text-sm text-muted-foreground hover:text-emerald transition-colors duration-200 text-left"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-6 uppercase tracking-wider">Resources</h4>
              <ul className="space-y-4">
                {[
                  { label: 'Documentation', view: 'docs' as const },
                  { label: 'API Guide', view: 'api-guide' as const },
                  { label: 'Security', view: 'security' as const },
                  { label: 'Support', view: 'support' as const }
                ].map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => onNavigate(item.view)}
                      className="text-sm text-muted-foreground hover:text-emerald transition-colors duration-200 text-left"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-6 uppercase tracking-wider">Company</h4>
              <ul className="space-y-4">
                {[
                  { label: 'About', view: 'about' as const },
                  { label: 'Privacy', view: 'privacy' as const },
                  { label: 'Terms', view: 'terms' as const },
                  { label: 'Contact', view: 'contact' as const }
                ].map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => onNavigate(item.view)}
                      className="text-sm text-muted-foreground hover:text-emerald transition-colors duration-200 text-left"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; 2026 Scanmate. All rights reserved.
            </p>
            <div className="flex gap-8">
              <span className="text-sm text-muted-foreground hover:text-white transition-colors cursor-pointer">
                Privacy Policy
              </span>
              <span className="text-sm text-muted-foreground hover:text-white transition-colors cursor-pointer">
                Terms of Service
              </span>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
