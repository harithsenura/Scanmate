import { useState, useRef, useEffect } from 'react';
import { 
  Shield, Activity, FileCode2, Download, ChevronRight, CheckCircle2, 
  AlertTriangle, XCircle, FileText, BarChart3, Clock, Lock, Github
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import type { AppView } from '../App';
import Navigation from '../components/Navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface UserDashboardProps {
  onNavigate: (view: AppView) => void;
  session: Session;
}

// Define the Repo interface
interface GithubRepo {
  id: number;
  name: string;
  language: string | null;
  updated_at: string;
  private: boolean;
  score?: number;
  status?: 'passed' | 'failed';
  vulns?: { critical: number; high: number; medium: number; low: number };
}

export default function UserDashboard({ onNavigate, session }: UserDashboardProps) {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<GithubRepo | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const user = session.user;
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Developer';

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let historyData: GithubRepo[] = [];
      
      // Try to fetch from Supabase for cross-device sync
      if (user?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('preferences')
          .eq('id', user.id)
          .maybeSingle();
          
        if (!error && data?.preferences?.scan_history) {
          historyData = data.preferences.scan_history;
          // Sync it back to local storage just in case
          localStorage.setItem('scanmate_history', JSON.stringify(historyData));
        }
      }
      
      // Fallback to local storage if Supabase failed or returned nothing
      if (!historyData || historyData.length === 0) {
        historyData = JSON.parse(localStorage.getItem('scanmate_history') || '[]');
      }
      
      setRepos(historyData);
    } catch (err) {
      console.error('Failed to load scan history:', err);
      // Absolute fallback
      setRepos(JSON.parse(localStorage.getItem('scanmate_history') || '[]'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.id]);

  const stats = {
    scansThisMonth: repos.length,
    threatsPrevented: repos.reduce((acc, r) => acc + (r.vulns?.critical || 0) + (r.vulns?.high || 0), 0),
    plan: 'Free'
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald border-emerald';
    if (score >= 70) return 'text-yellow-400 border-yellow-400';
    return 'text-ruby border-ruby';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald';
    if (score >= 70) return 'bg-yellow-400';
    return 'bg-ruby';
  };

  const handleGenerateReport = (project: typeof MOCK_PROJECTS[0]) => {
    setSelectedProject(project);
    setShowReportModal(true);
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGeneratingReport(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ScanMate_Security_Report_${selectedProject?.name}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white">
      <Navigation onNavigate={onNavigate} isLoggedIn={true} user={user} transparent={false} />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Welcome back, <span className="text-emerald">{userName}</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Here is your security posture and recent activity.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('repos')}
            className="bg-emerald text-obsidian px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <Shield className="w-5 h-5" />
            New Scan
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <Activity className="w-8 h-8 text-emerald mb-4 relative z-10" />
            <p className="text-muted-foreground text-sm font-medium mb-1 relative z-10">Scans This Month</p>
            <p className="text-3xl font-bold relative z-10">{stats.scansThisMonth}</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-ruby/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <Lock className="w-8 h-8 text-ruby mb-4 relative z-10" />
            <p className="text-muted-foreground text-sm font-medium mb-1 relative z-10">Threats Prevented</p>
            <p className="text-3xl font-bold relative z-10">{stats.threatsPrevented}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald/20 to-emerald/5 border border-emerald/20 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald/20 flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-emerald" />
            </div>
            <p className="text-emerald text-sm font-bold uppercase tracking-wider mb-1">Active Plan</p>
            <p className="text-2xl font-bold text-white">{stats.plan}</p>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-[#121214] border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl mb-12">
          <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center">
                <FileCode2 className="w-6 h-6 text-emerald" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Scanned Projects</h2>
                <p className="text-xs text-muted-foreground">Securely synced across all your devices</p>
              </div>
            </div>
            <button 
              onClick={fetchHistory}
              className={`p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-emerald ${loading ? 'animate-spin text-emerald' : ''}`}
              title="Refresh and Sync"
              disabled={loading}
            >
              <Activity className="w-5 h-5" />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-full divide-y divide-white/5">
              {loading ? (
                <div className="p-20 flex flex-col justify-center items-center gap-4 text-emerald">
                  <div className="w-10 h-10 border-4 border-emerald border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-mono animate-pulse">Syncing Cloud History...</p>
                </div>
              ) : repos.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">No Projects Found</h3>
                  <p className="text-muted-foreground mb-8 max-w-xs mx-auto">Start your first security audit to see your projects here.</p>
                  <button 
                    onClick={() => onNavigate('repos')}
                    className="bg-emerald/10 text-emerald hover:bg-emerald/20 px-6 py-2 rounded-xl font-bold transition-all border border-emerald/20"
                  >
                    Go to Scanner
                  </button>
                </div>
              ) : (
                <div className="flex flex-col">
                  {repos.map((project) => (
                    <div key={project.id} className="p-6 hover:bg-white/[0.03] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 last:border-0 group">
                      
                      {/* Project Info */}
                      <div className="flex items-center gap-4 flex-1 w-full">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-emerald/30 group-hover:bg-emerald/5 transition-all">
                          <Github className="w-6 h-6 text-muted-foreground group-hover:text-emerald" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold truncate group-hover:text-emerald transition-colors">{project.name}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-muted-foreground border border-white/10 uppercase tracking-wider">
                              {project.language}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(project.updated_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                              {project.status === 'passed' ? (
                                <div className="w-2 h-2 rounded-full bg-emerald shadow-[0_0_8px_#10b981]" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-ruby shadow-[0_0_8px_#ef4444]" />
                              )}
                              {project.status === 'passed' ? 'System Secure' : 'Threats Detected'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Vulnerability Distribution & Action */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-black/20 p-2 rounded-2xl border border-white/5 w-full sm:w-auto justify-between sm:justify-start">
                          <div className="flex flex-col items-center justify-center px-4 py-1.5 min-w-[60px]">
                            <span className="text-ruby text-lg font-black leading-none">{project.vulns?.critical || 0}</span>
                            <span className="text-[9px] text-ruby/60 font-bold uppercase tracking-tighter mt-1">Critical</span>
                          </div>
                          <div className="w-px h-8 bg-white/5" />
                          <div className="flex flex-col items-center justify-center px-4 py-1.5 min-w-[60px]">
                            <span className="text-orange-500 text-lg font-black leading-none">{project.vulns?.high || 0}</span>
                            <span className="text-[9px] text-orange-500/60 font-bold uppercase tracking-tighter mt-1">High</span>
                          </div>
                          <div className="w-px h-8 bg-white/5" />
                          <div className="flex flex-col items-center justify-center px-4 py-1.5 min-w-[60px]">
                            <span className="text-yellow-400 text-lg font-black leading-none">{project.vulns?.medium || 0}</span>
                            <span className="text-[9px] text-yellow-400/60 font-bold uppercase tracking-tighter mt-1">Medium</span>
                          </div>
                        </div>

                        {/* Action */}
                        <button 
                          onClick={() => handleGenerateReport(project)}
                          className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 hover:bg-emerald hover:text-obsidian border border-white/10 transition-all font-bold text-sm w-full sm:w-auto"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Detailed Report</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Industrial Report Modal Preview */}
      {showReportModal && selectedProject && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
          <div className="bg-[#1a1a1f] w-full max-w-5xl h-full max-h-[90vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-emerald" />
                <h2 className="text-lg font-bold">Industrial Security Report Generator</h2>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={downloadPDF}
                  disabled={isGeneratingReport}
                  className="flex items-center gap-2 bg-emerald text-obsidian px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  {isGeneratingReport ? (
                    <div className="w-4 h-4 border-2 border-obsidian border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isGeneratingReport ? 'Generating PDF...' : 'Download PDF'}
                </button>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="p-2 text-muted-foreground hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content - The actual report preview to be printed */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-black/40 relative">
              
              {/* THE REPORT CONTAINER (White background for PDF rendering) */}
              <div 
                ref={reportRef} 
                className="bg-white text-black max-w-[800px] mx-auto p-12 shadow-xl"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                {/* Report Header */}
                <div className="border-b-4 border-emerald pb-6 mb-8 flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">SECURITY AUDIT REPORT</h1>
                    <p className="text-gray-500 font-medium">Generated by ScanMate Enterprise Engine</p>
                  </div>
                  <div className="text-right">
                    <Shield className="w-12 h-12 text-emerald ml-auto mb-2" />
                    <p className="text-sm font-bold text-gray-800">CONFIDENTIAL</p>
                  </div>
                </div>

                {/* Project Meta */}
                <div className="grid grid-cols-2 gap-6 mb-10 bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Target Repository</p>
                    <p className="text-lg font-bold text-gray-900">{selectedProject.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Primary Language</p>
                    <p className="text-lg font-bold text-gray-900">{selectedProject.language}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Audit Date</p>
                    <p className="text-base font-medium text-gray-800">{new Date(selectedProject.updated_at).toUTCString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Auditor</p>
                    <p className="text-base font-medium text-gray-800">{userName} (ScanMate Automated)</p>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Executive Summary</h2>
                  <div className="flex gap-8 items-center">
                    <div>
                      <p className="text-gray-700 leading-relaxed text-justify">
                        This automated security assessment was performed using the ScanMate AI-powered static analysis engine. 
                        The target codebase (<span className="font-semibold">{selectedProject.name}</span>) was evaluated against industry standard vulnerability catalogs including OWASP Top 10 and CWE/SANS Top 25. 
                        A total of <span className="font-semibold">{(selectedProject.vulns?.critical || 0) + (selectedProject.vulns?.high || 0) + (selectedProject.vulns?.medium || 0) + (selectedProject.vulns?.low || 0)}</span> vulnerabilities were discovered during this scan.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vulnerability Distribution */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Vulnerability Distribution</h2>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                      <p className="text-3xl font-black text-red-600 mb-1">{selectedProject.vulns?.critical || 0}</p>
                      <p className="text-xs font-bold text-red-800 uppercase">Critical</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
                      <p className="text-3xl font-black text-orange-600 mb-1">{selectedProject.vulns?.high || 0}</p>
                      <p className="text-xs font-bold text-orange-800 uppercase">High</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                      <p className="text-3xl font-black text-yellow-600 mb-1">{selectedProject.vulns?.medium || 0}</p>
                      <p className="text-xs font-bold text-yellow-800 uppercase">Medium</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                      <p className="text-3xl font-black text-blue-600 mb-1">{selectedProject.vulns?.low || 0}</p>
                      <p className="text-xs font-bold text-blue-800 uppercase">Low</p>
                    </div>
                  </div>
                </div>

                {/* AI Deep Analysis Placeholder */}
                <div className="mb-10 page-break-inside-avoid">
                  <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Senior Auditor Notes</h2>
                  
                  {selectedProject.deep_analysis ? (
                    <div className="space-y-6">
                      <div className="bg-gray-50 border-l-4 border-emerald p-5 rounded-r-lg">
                        <h4 className="font-bold text-gray-900 mb-2">Security Audit</h4>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedProject.deep_analysis.security_audit}</p>
                      </div>
                      <div className="bg-gray-50 border-l-4 border-blue-400 p-5 rounded-r-lg">
                        <h4 className="font-bold text-gray-900 mb-2">Validation & Architecture</h4>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedProject.deep_analysis.validation_audit}</p>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mt-3 border-t border-gray-200 pt-3">{selectedProject.deep_analysis.engineering_audit}</p>
                      </div>
                      <div className="bg-gray-50 border-l-4 border-ruby p-5 rounded-r-lg">
                        <h4 className="font-bold text-gray-900 mb-2">Credentials & Secrets Management</h4>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedProject.deep_analysis.hardcoded_credentials}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-r-lg">
                      <p className="text-gray-500 italic text-sm text-center">
                        Deep analysis report was not generated or not available for this project.
                      </p>
                    </div>
                  )}
                  <p className="text-gray-500 text-xs font-bold text-right mt-4">— ScanMate Advanced Engine</p>
                </div>
                
                {/* Footer */}
                <div className="mt-16 pt-6 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-400 font-medium">
                    This document contains confidential information intended solely for the authorized developers of {selectedProject.name}.
                    <br />Generated securely by Scanmate AI Infrastructure.
                  </p>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
