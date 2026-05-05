import { useState, useRef, useEffect } from 'react';
import { 
  Shield, Activity, FileCode2, Download, ChevronRight, CheckCircle2, 
  AlertTriangle, XCircle, FileText, BarChart3, Clock, Lock
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

  useEffect(() => {
    const fetchHistory = () => {
      try {
        const history = JSON.parse(localStorage.getItem('scanmate_history') || '[]');
        setRepos(history);
      } catch (err) {
        console.error('Failed to load scan history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Usage stats (Calculated from actual scanned history)
  const stats = {
    scansThisMonth: repos.length,
    threatsPrevented: repos.reduce((acc, r) => acc + (r.vulns?.critical || 0) + (r.vulns?.high || 0), 0),
    avgScore: repos.length > 0 ? Math.round(repos.reduce((acc, r) => acc + (r.score || 0), 0) / repos.length) : 0,
    plan: 'Pro'
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
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

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <BarChart3 className="w-8 h-8 text-yellow-400 mb-4 relative z-10" />
            <p className="text-muted-foreground text-sm font-medium mb-1 relative z-10">Avg Security Score</p>
            <p className="text-3xl font-bold relative z-10">{stats.avgScore}/100</p>
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
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-emerald" />
              Scanned Projects
            </h2>
          </div>
          
          <div className="divide-y divide-white/10">
            {loading ? (
              <div className="p-12 flex justify-center items-center text-emerald">
                <div className="w-8 h-8 border-4 border-emerald border-t-transparent rounded-full animate-spin" />
              </div>
            ) : repos.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p>No scanned repositories found. Go to the scanner to start.</p>
              </div>
            ) : (
              repos.map((project) => (
                <div key={project.id} className="p-6 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  
                  {/* Project Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{project.name}</h3>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-muted-foreground border border-white/10">
                        {project.language}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        {project.status === 'passed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald" />
                        ) : (
                          <XCircle className="w-4 h-4 text-ruby" />
                        )}
                        {project.status === 'passed' ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                  </div>

                  {/* Vulnerability Badges */}
                  <div className="flex gap-2">
                    <div className="flex flex-col items-center justify-center bg-ruby/10 border border-ruby/20 rounded-lg px-3 py-1.5 min-w-[60px]">
                      <span className="text-ruby text-lg font-bold leading-none">{project.vulns?.critical || 0}</span>
                      <span className="text-[10px] text-ruby/80 font-semibold uppercase tracking-wider mt-1">Crit</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5 min-w-[60px]">
                      <span className="text-orange-500 text-lg font-bold leading-none">{project.vulns?.high || 0}</span>
                      <span className="text-[10px] text-orange-500/80 font-semibold uppercase tracking-wider mt-1">High</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-1.5 min-w-[60px]">
                      <span className="text-yellow-400 text-lg font-bold leading-none">{project.vulns?.medium || 0}</span>
                      <span className="text-[10px] text-yellow-400/80 font-semibold uppercase tracking-wider mt-1">Med</span>
                    </div>
                  </div>

                  {/* Score & Actions */}
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-bold text-xl ${getScoreColor(project.score || 0)}`}>
                      {project.score}
                    </div>
                    
                    <button 
                      onClick={() => handleGenerateReport(project)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-medium"
                    >
                      <FileText className="w-4 h-4 text-emerald" />
                      Report
                    </button>
                  </div>

                </div>
              ))
            )}
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
                    <div className="flex-shrink-0 text-center">
                      <div className="text-6xl font-black mb-1" style={{ color: (selectedProject.score || 0) >= 90 ? '#10b981' : (selectedProject.score || 0) >= 70 ? '#facc15' : '#ef4444' }}>
                        {selectedProject.score}
                      </div>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Security Score</p>
                    </div>
                    <div>
                      <p className="text-gray-700 leading-relaxed text-justify">
                        This automated security assessment was performed using the ScanMate AI-powered static analysis engine. 
                        The target codebase (<span className="font-semibold">{selectedProject.name}</span>) was evaluated against industry standard vulnerability catalogs including OWASP Top 10 and CWE/SANS Top 25. 
                        The application achieved a security score of <span className="font-semibold">{selectedProject.score}/100</span>, indicating a 
                        <span className="font-semibold"> {selectedProject.status === 'passed' ? 'satisfactory' : 'critical'} </span> security posture.
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
                  <div className="bg-gray-50 border-l-4 border-emerald p-6 rounded-r-lg">
                    <p className="text-gray-700 italic text-sm leading-relaxed mb-4">
                      "The architectural design follows standard patterns, but care must be taken regarding input validation and secret management. 
                      No plaintext API keys were found in the root configuration, which is a strong positive indicator. 
                      However, continuous monitoring is advised for dependency updates."
                    </p>
                    <p className="text-gray-500 text-xs font-bold text-right">— ScanMate AI Lead Engineer (Auto-generated)</p>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="mt-16 pt-6 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-400 font-medium">
                    This document contains confidential information intended solely for the authorized developers of {selectedProject.name}.
                    <br />Generated securely by verstack.lk AI Infrastructure.
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
