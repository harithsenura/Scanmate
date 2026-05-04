import React, { useState } from 'react';
import { Book, ShieldAlert, FileCode2, Terminal, Activity, ArrowRight, CheckCircle2, ChevronRight, LayoutDashboard, SearchCode, Cpu } from 'lucide-react';
import type { AppView } from '../App';
import Navigation from '../components/Navigation';

interface DocumentationProps {
  onNavigate: (view: AppView) => void;
}

type DocCategory = 'getting-started' | 'security-scanning' | 'ai-fixes' | 'integrations' | 'reports';

export default function Documentation({ onNavigate }: DocumentationProps) {
  const [activeCategory, setActiveCategory] = useState<DocCategory>('getting-started');

  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: Book },
    { id: 'security-scanning', label: 'Security Scanning', icon: SearchCode },
    { id: 'ai-fixes', label: 'Automated AI Fixes', icon: Cpu },
    { id: 'reports', label: 'Vulnerability Reports', icon: Activity },
    { id: 'integrations', label: 'IDE & CI/CD Integrations', icon: Terminal },
  ];

  return (
    <div className="bg-[#0c0c0e] min-h-screen">
      {/* Navigation */}
      <Navigation onNavigate={onNavigate} />
      
      {/* Spacer to push content down below fixed nav */}
      <div className="h-20 pointer-events-none" />

      <div className="relative z-10">
        <div className="bg-obsidian min-h-[calc(100vh-5rem)] rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] border-t border-white/5 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Sidebar - Categories */}
          <aside className="w-full md:w-80 border-r border-white/5 bg-obsidian/50 p-6 md:h-[calc(100vh-5rem)] overflow-y-auto shrink-0 sticky top-0">
            <div className="mb-8 mt-4">
              <span className="text-xs font-mono text-emerald bg-emerald/10 border border-emerald/20 px-3 py-1.5 rounded-full uppercase tracking-wider inline-block">
                Documentation
              </span>
              <h2 className="text-2xl font-medium text-white tracking-tight mt-4">
                User Guide
              </h2>
            </div>

            <nav className="space-y-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id as DocCategory)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-emerald/10 border border-emerald/20 text-emerald' 
                        : 'text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-emerald' : 'text-muted-foreground'}`} />
                      <span className="font-medium text-sm">{category.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </button>
                );
              })}
            </nav>

            <div className="mt-12 p-5 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-2">Need direct help?</h3>
              <p className="text-xs text-muted-foreground mb-4">Our security experts are available 24/7 to assist with your codebase integration.</p>
              <button className="w-full bg-white text-obsidian text-xs font-semibold py-2 rounded-lg hover:bg-gray-200 transition-colors">
                Contact Support
              </button>
            </div>
          </aside>

          {/* Right Content Area */}
          <main className="flex-1 p-8 md:p-12 lg:p-16 h-full md:h-[calc(100vh-5rem)] overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald/5 via-transparent to-transparent">
            <div className="max-w-3xl mx-auto">
              
              {/* Content dynamic rendering based on category */}
              
              {activeCategory === 'getting-started' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-4">Getting Started with Verstack</h1>
                  <p className="text-lg text-muted-foreground mb-10 leading-relaxed font-light">
                    Welcome to Verstack. This guide will walk you through the foundational steps to secure your codebase, from initial setup to running your very first AI-powered security scan.
                  </p>

                  <h3 className="text-2xl font-medium text-white mb-4">Step 1: Create your Workspace</h3>
                  <div className="glass-card p-6 rounded-2xl mb-8">
                    <p className="text-muted-foreground mb-4">To begin, you need to set up a secure workspace environment. This ensures your code is isolated during analysis.</p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">Navigate to the <strong>Dashboard</strong> by clicking "Launch Scanner" from the homepage.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">Click on <strong>"New Project"</strong> and securely authenticate via GitHub or GitLab.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">Select the repository you wish to scan. Verstack requests read-only access to prevent unauthorized code modifications.</span>
                      </li>
                    </ul>
                  </div>

                  <h3 className="text-2xl font-medium text-white mb-4">Step 2: Understanding the Dashboard</h3>
                  <p className="text-muted-foreground mb-6">
                    Once imported, you will be redirected to the Verstack Scanner Dashboard. Here you will find an overview of your project's health, recent scan history, and active alerts.
                  </p>
                  
                  <button 
                    onClick={() => onNavigate('scanner')}
                    className="inline-flex items-center gap-2 bg-emerald text-obsidian px-6 py-3 rounded-full font-medium hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)] text-sm"
                  >
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {activeCategory === 'security-scanning' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-4">Running Security Scans</h1>
                  <p className="text-lg text-muted-foreground mb-10 leading-relaxed font-light">
                    Verstack utilizes an advanced AI engine to perform deep static analysis (SAST) and logic flaw detection across your entire codebase in real-time.
                  </p>

                  <h3 className="text-2xl font-medium text-white mb-4">How to Initiate a Manual Scan</h3>
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald"></div>
                    <ol className="list-decimal list-inside space-y-4 text-gray-300">
                      <li>Open your desired project in the <strong>Verstack Dashboard</strong>.</li>
                      <li>Navigate to the <strong>"Scan Center"</strong> tab on the left menu.</li>
                      <li>Select your scan depth: 
                        <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm text-muted-foreground">
                          <li><strong>Fast Scan:</strong> Checks for common OWASP Top 10 vulnerabilities (Avg 2s).</li>
                          <li><strong>Deep AI Scan:</strong> Analyzes complex logical paths and custom business logic flaws.</li>
                        </ul>
                      </li>
                      <li>Click the <span className="inline-block px-2 py-1 bg-white/10 rounded text-xs text-white">Start Scan</span> button.</li>
                    </ol>
                  </div>

                  <h3 className="text-2xl font-medium text-white mb-4">Reviewing Vulnerabilities</h3>
                  <p className="text-muted-foreground mb-6">
                    When the scan completes, Verstack categorizes issues by severity (Critical, High, Medium, Low). Click on any vulnerability card to expand the details, which includes the exact file path, vulnerable code snippet, and the potential exploit vector.
                  </p>
                </div>
              )}

              {activeCategory === 'ai-fixes' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-4">Automated AI Fixes</h1>
                  <p className="text-lg text-muted-foreground mb-10 leading-relaxed font-light">
                    Detecting vulnerabilities is only half the battle. Verstack's primary feature is generating secure, context-aware code replacements instantly.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="glass-card p-6 rounded-2xl border-emerald/20">
                      <ShieldAlert className="w-8 h-8 text-red-400 mb-4" />
                      <h4 className="text-white font-medium mb-2">1. Identify the Risk</h4>
                      <p className="text-sm text-muted-foreground">Select a vulnerability from your scan results. Review the AI-generated explanation of why the current code is insecure.</p>
                    </div>
                    <div className="glass-card p-6 rounded-2xl border-emerald/20">
                      <FileCode2 className="w-8 h-8 text-emerald mb-4" />
                      <h4 className="text-white font-medium mb-2">2. Generate Patch</h4>
                      <p className="text-sm text-muted-foreground">Click the "Generate Secure Code" button. Verstack will rewrite the function using industry best practices and secure APIs.</p>
                    </div>
                  </div>

                  <h3 className="text-2xl font-medium text-white mb-4">Applying Fixes via Dashboard</h3>
                  <div className="bg-[#0f1115] rounded-xl border border-white/10 p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 font-mono">auth_controller.py</span>
                      <span className="text-xs px-2 py-1 bg-emerald/20 text-emerald rounded">AI Suggested Fix</span>
                    </div>
                    <pre className="text-sm font-mono text-gray-300 overflow-x-auto p-4 bg-black/50 rounded-lg">
<code className="text-red-400 line-through opacity-70">- query = f"SELECT * FROM users WHERE username = '{'{username}'}'"</code>{'\n'}
<code className="text-emerald">+ query = "SELECT * FROM users WHERE username = %s"</code>{'\n'}
<code className="text-emerald">+ cursor.execute(query, (username,))</code>
                    </pre>
                  </div>
                  <p className="text-muted-foreground">
                    You can either manually copy the suggested code, or click <strong>"Create Pull Request"</strong> to have Verstack automatically push the secure patch directly to your repository branch.
                  </p>
                </div>
              )}

              {activeCategory === 'reports' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-4">Vulnerability Reports</h1>
                  <p className="text-lg text-muted-foreground mb-10 leading-relaxed font-light">
                    Generate compliance-ready security reports to share with stakeholders, auditors, or your engineering team.
                  </p>

                  <h3 className="text-2xl font-medium text-white mb-4">Generating a Report</h3>
                  <ul className="space-y-4 text-gray-300 mb-8">
                    <li className="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-emerald/10 flex items-center justify-center text-emerald font-bold shrink-0">1</div>
                      <div>
                        <strong className="block text-white mb-1">Select Timeframe</strong>
                        <span className="text-sm text-muted-foreground">Navigate to the 'Reports' tab and select the desired date range (e.g., Last 30 Days, Q3 2025).</span>
                      </div>
                    </li>
                    <li className="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-emerald/10 flex items-center justify-center text-emerald font-bold shrink-0">2</div>
                      <div>
                        <strong className="block text-white mb-1">Choose Format</strong>
                        <span className="text-sm text-muted-foreground">Select between detailed PDF for compliance (SOC2, HIPAA) or CSV for internal metric tracking.</span>
                      </div>
                    </li>
                    <li className="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-emerald/10 flex items-center justify-center text-emerald font-bold shrink-0">3</div>
                      <div>
                        <strong className="block text-white mb-1">Export</strong>
                        <span className="text-sm text-muted-foreground">Click 'Generate Report'. The system will compile all resolved vulnerabilities, AI patches applied, and current risk scores.</span>
                      </div>
                    </li>
                  </ul>
                </div>
              )}

              {activeCategory === 'integrations' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-4">Integrations</h1>
                  <p className="text-lg text-muted-foreground mb-10 leading-relaxed font-light">
                    Bring Verstack's AI security directly into your existing development workflow.
                  </p>

                  <h3 className="text-2xl font-medium text-white mb-6">Supported Integrations</h3>
                  
                  <div className="space-y-6">
                    <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                        <Terminal className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white mb-2">VS Code Extension</h4>
                        <p className="text-sm text-muted-foreground mb-3">Get real-time security warnings and AI fixes directly in your IDE editor as you type.</p>
                        <button className="text-xs font-mono text-emerald hover:text-emerald-400">View Setup Guide &rarr;</button>
                      </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#24292e] flex items-center justify-center shrink-0 border border-white/20">
                        <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white mb-2">GitHub Actions CI/CD</h4>
                        <p className="text-sm text-muted-foreground mb-3">Automatically scan every Pull Request. Block merges if critical vulnerabilities are detected, and auto-comment AI fixes.</p>
                        <pre className="bg-black/50 p-3 rounded-lg text-xs font-mono text-gray-400 mt-2 overflow-x-auto border border-white/5">
<code className="text-emerald">uses: verstack/security-action@v2</code>{'\n'}
<code>with:</code>{'\n'}
<code>{"  api-key: ${{ secrets.VERSTACK_API_KEY }}"}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Spacer */}
              <div className="h-24"></div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
