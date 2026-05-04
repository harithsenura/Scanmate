import { useState, useCallback, useRef, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard,
  ScanLine,
  FileText,
  History,
  Settings,
  Shield,
  ShieldAlert,
  ChevronRight,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  LogOut,
  Bug,
  Lock,
  Code2,
  Cpu,
  Sparkles,
  Copy,
  Check,
  Download,
  Trash2,
  Search,
  Filter,
  Github,
  Folder,
  File,
  ChevronDown,
  ChevronLeft,
  Loader2,
  Terminal,
  Activity,
  Zap,
  BarChart3,
  Layers,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import type { AppView } from '../App';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';

interface ScannerDashboardProps {
  onNavigate: (view: AppView) => void;
  session: Session;
  selectedRepo?: any;
}

interface Vulnerability {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  line: number;
  column: number;
  description: string;
  cwe: string;
  recommendation: string;
  fixedCode?: string;
  file?: string;
  aiExplanation?: string;
}

interface ScanResult {
  id: string;
  timestamp: string;
  filename: string;
  language: string;
  totalLines: number;
  scanDuration: string;
  vulnerabilities: Vulnerability[];
  securityScore: number;
  filesScanned?: number;
  techStack?: string[];
  projectDescription?: string;
}

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scanner', label: 'Scanner', icon: ScanLine },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const sampleVulnerabilities: Vulnerability[] = [
  {
    id: 'vuln-1',
    title: 'SQL Injection via String Concatenation',
    severity: 'critical',
    line: 12,
    column: 4,
    description: 'User-supplied input is directly concatenated into a SQL query string, allowing attackers to manipulate the query structure and access unauthorized data.',
    cwe: 'CWE-89',
    recommendation: 'Use parameterized queries or prepared statements to separate code from data.',
    fixedCode: `query = "SELECT * FROM users WHERE id = ?"
cursor.execute(query, (user_id,))`,
  },
  {
    id: 'vuln-2',
    title: 'Hardcoded API Key',
    severity: 'high',
    line: 5,
    column: 11,
    description: 'A sensitive API key is hardcoded in the source file. This key could be exposed through version control or code sharing.',
    cwe: 'CWE-798',
    recommendation: 'Store secrets in environment variables or use a secrets management service.',
    fixedCode: `API_KEY = os.environ.get('API_KEY')`,
  },
  {
    id: 'vuln-3',
    title: 'Insecure Deserialization',
    severity: 'high',
    line: 24,
    column: 8,
    description: 'Use of pickle.loads() on untrusted data can lead to arbitrary code execution.',
    cwe: 'CWE-502',
    recommendation: 'Use json.loads() for untrusted data, or implement signed serialization.',
    fixedCode: `data = json.loads(request.data)`,
  },
  {
    id: 'vuln-4',
    title: 'Weak Cryptographic Hash',
    severity: 'medium',
    line: 31,
    column: 12,
    description: 'MD5 is cryptographically broken and should not be used for security-sensitive operations.',
    cwe: 'CWE-327',
    recommendation: 'Use SHA-256 or bcrypt for password hashing.',
    fixedCode: `hash = hashlib.sha256(password.encode()).hexdigest()`,
  },
  {
    id: 'vuln-5',
    title: 'Debug Mode Enabled',
    severity: 'low',
    line: 2,
    column: 0,
    description: 'Flask debug mode exposes the Werkzeug debugger which allows remote code execution.',
    cwe: 'CWE-489',
    recommendation: 'Never enable debug mode in production environments.',
    fixedCode: `app.run(debug=False)`,
  },
];

const defaultCode = `import sqlite3
import pickle
import hashlib
import os
from flask import Flask, request

app = Flask(__name__)
API_KEY = "sk-live-abc123xyz789secret"

def get_user():
    user_id = request.args.get('id')
    conn = sqlite3.connect('db.sqlite')
    cursor = conn.cursor()
    
    # VULNERABLE: String formatting allows SQL injection
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)
    
    return cursor.fetchall()

def process_data():
    # VULNERABLE: Insecure deserialization
    data = pickle.loads(request.data)
    return data

def hash_password(password):
    # VULNERABLE: Weak hash algorithm
    return hashlib.md5(password.encode()).hexdigest()

if __name__ == '__main__':
    # VULNERABLE: Debug mode enabled
    app.run(debug=True)`;

const severityConfig = {
  critical: { color: 'text-ruby', bg: 'bg-ruby/10', border: 'border-ruby/20', icon: XCircle },
  high: { color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', icon: AlertTriangle },
  medium: { color: 'text-amber', bg: 'bg-amber/10', border: 'border-amber/20', icon: AlertTriangle },
  low: { color: 'text-blue', bg: 'bg-blue/10', border: 'border-blue/20', icon: Info },
};

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileNode[];
  isOpen?: boolean;
  content?: string;
}

export default function ScannerDashboard({ onNavigate, session, selectedRepo }: ScannerDashboardProps) {
  const [code, setCode] = useState(selectedRepo ? `# Select a file from the explorer to start scanning ${selectedRepo.name}` : defaultCode);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [copiedFix, setCopiedFix] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'editor' | 'analysis'>('editor');
  const [dashboardView, setDashboardView] = useState<'editor' | 'results'>('editor');
  const isResizing = useRef(false);

  useEffect(() => {
    if (selectedRepo) {
      fetchRepoContents('');
    }
  }, [selectedRepo]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, []);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 300 && newWidth <= 600) {
      setAnalysisWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    Prism.highlightAll();
  }, [code]);

  const fetchRepoContents = async (path: string = '') => {
    const providerToken = (session as any).provider_token || session.access_token;
    if (!providerToken || !selectedRepo) return;

    setLoadingFiles(true);
    try {
      const response = await fetch(`https://api.github.com/repos/${selectedRepo.full_name}/contents/${path}`, {
        headers: { Authorization: `Bearer ${providerToken}` },
      });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const nodes: FileNode[] = data.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type === 'dir' ? 'dir' : 'file',
          children: item.type === 'dir' ? [] : undefined
        }));

        if (path === '') {
          setFileTree(nodes);
        } else {
          // Update nested children (simplified for this version)
          setFileTree(prev => updateNestedNode(prev, path, nodes));
        }
      }
    } catch (err) {
      console.error('Failed to fetch repo contents:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const updateNestedNode = (nodes: FileNode[], path: string, children: FileNode[]): FileNode[] => {
    return nodes.map(node => {
      if (node.path === path) {
        return { ...node, children, isOpen: true };
      }
      if (node.children) {
        return { ...node, children: updateNestedNode(node.children, path, children) };
      }
      return node;
    });
  };

  const toggleFolder = (node: FileNode) => {
    if (node.isOpen) {
      setFileTree(prev => updateNodeState(prev, node.path, { isOpen: false }));
    } else {
      fetchRepoContents(node.path);
    }
  };

  const updateNodeState = (nodes: FileNode[], path: string, state: Partial<FileNode>): FileNode[] => {
    return nodes.map(node => {
      if (node.path === path) return { ...node, ...state };
      if (node.children) return { ...node, children: updateNodeState(node.children, path, state) };
      return node;
    });
  };

  const fetchFileContent = async (path: string) => {
    const providerToken = (session as any).provider_token || session.access_token;
    if (!providerToken || !selectedRepo) return;

    setSelectedFilePath(path);
    setLoadingFiles(true);
    try {
      const response = await fetch(`https://api.github.com/repos/${selectedRepo.full_name}/contents/${path}`, {
        headers: { Authorization: `Bearer ${providerToken}` },
      });
      const data = await response.json();
      if (data.content) {
        const decodedContent = atob(data.content.replace(/\n/g, ''));
        setCode(decodedContent);
      }
    } catch (err) {
      console.error('Failed to fetch file content:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path}>
        <button
          onClick={() => {
            if (node.type === 'dir') {
              toggleFolder(node);
            } else {
              fetchFileContent(node.path);
              // Auto-switch to editor tab and close sidebar on mobile
              if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
                setActiveMobileTab('editor');
              }
            }
          }}
          className={`w-full flex items-center gap-3 py-2.5 lg:py-1 px-3 lg:px-2 rounded-xl lg:rounded-md hover:bg-white/5 transition-all text-left ${
            selectedFilePath === node.path ? 'bg-emerald/10 text-emerald shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]' : 'text-slate-400'
          }`}
          style={{ paddingLeft: `${(level + 1) * 16}px` }}
        >
          {node.type === 'dir' ? (
            <>
              {node.isOpen ? <ChevronDown className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> : <ChevronLeft className="w-4 h-4 lg:w-3.5 lg:h-3.5 rotate-180" />}
              <Folder className={`w-4 h-4 lg:w-3.5 lg:h-3.5 ${node.isOpen ? 'text-emerald' : 'text-muted-foreground'}`} />
            </>
          ) : (
            <File className={`w-4 h-4 lg:w-3.5 lg:h-3.5 ${selectedFilePath === node.path ? 'text-emerald shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'text-muted-foreground'}`} />
          )}
          <span className="text-xs lg:text-[11px] truncate font-medium lg:font-normal">{node.name}</span>
        </button>
        {node.isOpen && node.children && (
          <div className="ml-2 border-l border-white/5">
            {renderFileTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('landing');
  };
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and line numbers
  const handleScroll = useCallback(() => {
    if (editorRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
    }
  }, []);

  const detectLanguage = useCallback((filePath: string | null): string => {
    if (!filePath) return 'python';
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      py: 'python', js: 'javascript', ts: 'typescript', tsx: 'typescript',
      jsx: 'javascript', java: 'java', go: 'go', rs: 'rust', php: 'php',
    };
    return langMap[ext || ''] || 'python';
  }, []);

  const SCANNABLE_EXTENSIONS = ['py', 'js', 'ts', 'tsx', 'jsx', 'java', 'go', 'rs', 'php', 'rb', 'c', 'cpp', 'cs', 'env', 'yml', 'yaml', 'json'];
  const SKIP_DIRS = ['node_modules', '.git', '__pycache__', '.next', 'dist', 'build', '.expo', 'venv', 'env', '.vscode'];

  const getAllRepoFiles = useCallback(async (): Promise<{path: string; sha: string}[]> => {
    const providerToken = (session as any).provider_token || session.access_token;
    if (!providerToken || !selectedRepo) return [];

    // Use GitHub Git Trees API with recursive=1 to get ALL files in one call
    const defaultBranch = selectedRepo.default_branch || 'main';
    const response = await fetch(
      `https://api.github.com/repos/${selectedRepo.full_name}/git/trees/${defaultBranch}?recursive=1`,
      { headers: { Authorization: `Bearer ${providerToken}` } }
    );

    if (!response.ok) throw new Error('Failed to fetch repository file tree');
    const data = await response.json();

    // Filter to scannable files only (skip dirs, node_modules, binary files)
    return (data.tree || []).filter((item: any) => {
      if (item.type !== 'blob') return false;
      const ext = item.path.split('.').pop()?.toLowerCase();
      if (!ext || !SCANNABLE_EXTENSIONS.includes(ext)) return false;
      if (SKIP_DIRS.some(dir => item.path.includes(`${dir}/`))) return false;
      if (item.size > 500000) return false; // Skip files > 500KB
      return true;
    });
  }, [session, selectedRepo]);

  const fetchFileContentRaw = useCallback(async (filePath: string): Promise<string | null> => {
    const providerToken = (session as any).provider_token || session.access_token;
    if (!providerToken || !selectedRepo) return null;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${selectedRepo.full_name}/contents/${filePath}`,
        { headers: { Authorization: `Bearer ${providerToken}` } }
      );
      const data = await response.json();
      if (data.content) {
        return atob(data.content.replace(/\n/g, ''));
      }
    } catch {
      // Skip files that can't be fetched
    }
    return null;
  }, [session, selectedRepo]);

  const runScan = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanResult(null);
    setSelectedVuln(null);
    setScanError(null);
    setScanStatus('Discovering files...');

    const startTime = Date.now();

    try {
      // Step 1: Get all scannable files from the repo
      const allFiles = await getAllRepoFiles();

      if (allFiles.length === 0) {
        throw new Error('No scannable files found in this repository');
      }

      setScanStatus(`Found ${allFiles.length} files to scan`);

      const allVulnerabilities: Vulnerability[] = [];
      let totalLines = 0;
      let filesScanned = 0;
      let vulnCounter = 0;

      // Step 2: Scan each file
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        const fileName = file.path.split('/').pop() || file.path;
        setScanStatus(`Scanning ${fileName} (${i + 1}/${allFiles.length})`);
        setScanProgress(Math.round(((i + 1) / allFiles.length) * 95));

        // Fetch file content
        const content = await fetchFileContentRaw(file.path);
        if (!content || content.trim().length === 0) continue;

        totalLines += content.split('\n').length;

        // Detect language
        const language = detectLanguage(file.path);

        // Scan via backend
        try {
          const apiHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
          const response = await fetch(`http://${apiHost}:8000/api/v1/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: content,
              language,
              filename: file.path,
              use_ai: true,
            }),
          });

          if (response.ok) {
            const data = await response.json();

            // Map vulnerabilities with file attribution
            const fileVulns: Vulnerability[] = (data.vulnerabilities || []).map((v: any) => {
              vulnCounter++;
              return {
                id: `vuln-${vulnCounter}`,
                title: v.title,
                severity: v.severity,
                line: v.line,
                column: v.column || 0,
                description: v.description,
                cwe: v.cwe_id || 'N/A',
                recommendation: v.recommendation,
                fixedCode: v.fixed_code || undefined,
                file: file.path,
              };
            });

            // Merge AI fixes
            if (data.ai_analysis) {
              data.ai_analysis.forEach((ai: any) => {
                const vuln = fileVulns.find((v) => v.id === ai.vulnerability_id);
                if (vuln && ai.fixed_code) {
                  vuln.fixedCode = ai.fixed_code;
                  if (ai.ai_recommendation) vuln.recommendation = ai.ai_recommendation;
                  if (ai.ai_explanation) vuln.aiExplanation = ai.ai_explanation;
                }
              });
            }

            allVulnerabilities.push(...fileVulns);
          }
        } catch {
          // Skip files that fail to scan - continue with others
        }

        filesScanned++;
      }

      setScanProgress(100);
      setScanStatus('Scan complete');
      const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

      // Calculate aggregate security score
      const severityWeights: Record<string, number> = { critical: 20, high: 10, medium: 5, low: 2 };
      const totalPenalty = allVulnerabilities.reduce(
        (sum, v) => sum + (severityWeights[v.severity] || 0), 0
      );
      const securityScore = Math.max(0, 100 - Math.min(totalPenalty, 80));

      // Analyze tech stack
      const techStack = Array.from(new Set(allFiles.map(f => detectLanguage(f.path))));
      const projectDescription = `This project appears to be a ${techStack.join('/')} application. Security analysis focused on 6 key service areas: SQL Injection, Secrets Management, Command Injection, Deserialization, Path Traversal, and Cryptographic standards.`;

      const result: ScanResult = {
        id: `scan-${Date.now()}`,
        timestamp: new Date().toISOString(),
        filename: selectedRepo?.name || 'project',
        language: 'Multi-language',
        totalLines,
        scanDuration: `${durationSec}s`,
        vulnerabilities: allVulnerabilities,
        securityScore,
        filesScanned,
        techStack,
        projectDescription,
      };

      setScanResult(result);
      setDashboardView('results');
    } catch (err: any) {
      setScanProgress(0);
      setScanError(err.message || 'Failed to scan project');
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
      setScanStatus('');
    }
  }, [selectedRepo, getAllRepoFiles, fetchFileContentRaw, detectLanguage]);

  const copyFix = useCallback((fixCode?: string) => {
    const codeToCopy = fixCode || selectedVuln?.fixedCode;
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy);
      setCopiedFix(true);
      setTimeout(() => setCopiedFix(false), 2000);
    }
  }, [selectedVuln]);

  const clearScan = useCallback(() => {
    setScanResult(null);
    setSelectedVuln(null);
    setScanProgress(0);
  }, []);

  const lineCount = code.split('\n').length;

  // Severity counts
  const severityCounts = scanResult?.vulnerabilities.reduce(
    (acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  return (
    <div className="min-h-screen bg-obsidian text-offwhite flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`fixed inset-y-0 left-0 w-[85vw] lg:static lg:w-64 border-r border-white/5 flex flex-col bg-black/95 backdrop-blur-2xl shrink-0 z-[70] transition-all duration-500 ease-in-out lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0 shadow-[20px_0_100px_rgba(0,0,0,0.8)]' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="h-20 lg:h-16 flex items-center justify-between px-5 border-b border-white/5">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 group"
          >
            <Shield className="w-6 h-6 lg:w-5 lg:h-5 text-emerald transition-transform duration-200 group-hover:scale-110" />
            <span className="text-base lg:text-sm font-semibold tracking-tight">
              verstack<span className="text-emerald">.lk</span>
            </span>
          </button>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-muted-foreground hover:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Project Explorer (The only main section now) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-11 border-b border-white/5 flex items-center justify-between px-4 bg-black">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Project Explorer</span>
            {loadingFiles && <Loader2 className="w-3 h-3 text-emerald animate-spin" />}
          </div>
          <div className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar">
            {selectedRepo ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium text-emerald bg-emerald/5 rounded-lg mb-2">
                  <Github className="w-3.5 h-3.5" />
                  <span className="truncate">{selectedRepo.name}</span>
                </div>
                {renderFileTree(fileTree)}
              </div>
            ) : (
              <div className="text-center py-10 px-4">
                <button 
                  onClick={() => onNavigate('repos')}
                  className="text-[10px] text-emerald hover:underline"
                >
                  Select a repository &rarr;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-[env(safe-area-inset-top)]">
        {/* Top Bar */}
        <header className="h-20 lg:h-16 border-b border-white/5 flex items-center justify-between px-4 lg:px-6 bg-black z-10">
          <div className="flex items-center gap-3 lg:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-3 -ml-2 text-muted-foreground hover:text-white bg-white/5 rounded-2xl"
            >
              <LayoutDashboard className="w-6 h-6" />
            </button>
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-3">
              <h1 className="text-sm lg:text-sm font-medium truncate tracking-tight">Security Scanner</h1>
              {selectedRepo && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald/5 border border-emerald/10 lg:hidden mt-1">
                  <Github className="w-3 h-3 text-emerald" />
                  <span className="text-[10px] text-emerald font-mono truncate">{selectedRepo.name}</span>
                </div>
              )}
            </div>
            {isScanning && (
              <span className="flex items-center gap-2 text-xs font-mono text-emerald">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                AI Analysis...
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-muted-foreground hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <Search className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald/20 flex items-center justify-center overflow-hidden">
                {session.user.user_metadata.avatar_url ? (
                  <img src={session.user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-medium text-emerald">
                    {session.user.email?.[0].toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground hidden md:inline">
                {session.user.user_metadata.full_name || session.user.email}
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div id="content-area-main" className="flex-1 overflow-hidden flex flex-col bg-black">
          {isScanning ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-obsidian relative overflow-hidden">
              {/* Background Ambience */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] lg:w-[600px] h-[400px] lg:h-[600px] bg-emerald/10 rounded-full blur-[100px] lg:blur-[120px] animate-pulse" />
              
              <div className="relative z-10 flex flex-col items-center text-center max-w-md px-6">
                {/* Pulsating Core */}
                <div className="relative mb-8 lg:mb-12">
                  <div className="absolute inset-0 bg-emerald/20 rounded-full blur-2xl animate-ping" />
                  <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-full border-2 border-emerald/30 flex items-center justify-center bg-emerald/5 backdrop-blur-xl">
                     <Cpu className="w-12 h-12 lg:w-16 lg:h-16 text-emerald animate-pulse" />
                     {/* Scanning Ring */}
                     <div className="absolute inset-[-10px] rounded-full border border-emerald/20 animate-[spin_4s_linear_infinite]" />
                     <div className="absolute inset-[-20px] rounded-full border border-emerald/10 animate-[spin_8s_linear_infinite_reverse]" />
                  </div>
                </div>

                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 tracking-tight">AI Security Audit</h3>
                <p className="text-xs lg:text-sm text-muted-foreground mb-8 leading-relaxed">
                  Deeply analyzing codebase structure and security patterns for vulnerabilities...
                </p>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4 border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald/40 via-emerald to-emerald/40 transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>

                <div className="flex items-center gap-3 text-[9px] lg:text-[10px] font-mono text-emerald uppercase tracking-[0.2em]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {scanStatus}
                </div>
              </div>

              {/* Code Stream Overlay */}
              <div className="absolute bottom-10 left-10 text-[8px] font-mono text-emerald/10 select-none hidden md:block">
                <div className="animate-pulse">SELECT * FROM security WHERE threat = 'NONE'</div>
                <div className="animate-pulse delay-75">ANALYZING AST TREE...</div>
                <div className="animate-pulse delay-150">DETECTING PATTERNS...</div>
              </div>
            </div>
          ) : dashboardView === 'editor' ? (
            <div className="flex-1 flex overflow-hidden">
              {/* Code Editor */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Editor Toolbar */}
                <div className="h-11 border-b border-white/5 flex items-center justify-between px-4 bg-black">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground">{selectedFilePath || 'untitled'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {scanResult && (
                      <button
                        onClick={() => setDashboardView('results')}
                        className="text-[10px] font-bold text-emerald hover:underline mr-4"
                      >
                        View Last Results &rarr;
                      </button>
                    )}
                    <button
                      onClick={runScan}
                      disabled={isScanning || !selectedRepo}
                      className={`group relative flex items-center gap-2 text-[10px] lg:text-xs font-semibold px-4 lg:px-6 py-1.5 rounded-full transition-all duration-300 overflow-hidden ${
                        isScanning || !selectedRepo
                          ? 'bg-white/5 text-muted-foreground cursor-not-allowed'
                          : 'bg-emerald text-obsidian shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-[1.05]'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald/0 via-white/20 to-emerald/0 -translate-x-full group-hover:animate-shimmer" />
                      {isScanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      {isScanning ? 'Analyzing...' : 'Run Scan'}
                    </button>
                  </div>
                </div>

                {/* Editor Body */}
                <div className="flex-1 flex overflow-hidden relative group/editor">
                  {/* Line Numbers */}
                  <div
                    ref={lineNumbersRef}
                    className="w-10 shrink-0 bg-black border-r border-white/5 py-4 overflow-hidden select-none"
                  >
                    {Array.from({ length: Math.max(code.split('\n').length, 1) }, (_, i) => (
                      <div
                        key={i}
                        className={`text-right pr-2 text-[10px] lg:text-[8px] font-mono leading-[20px] lg:leading-[13px] ${
                          scanResult?.vulnerabilities.some((v) => v.line === i + 1)
                            ? 'text-ruby'
                            : 'text-muted-foreground/20'
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Editor & Highlight Container */}
                  <div className="flex-1 relative overflow-hidden bg-black">
                    <textarea
                      ref={editorRef}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      onScroll={handleScroll}
                      className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-emerald font-mono text-[13px] lg:text-[8.5px] leading-[20px] lg:leading-[13px] p-4 lg:p-4 resize-none outline-none z-10 custom-scrollbar whitespace-pre"
                      spellCheck={false}
                    />
                    <pre 
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full m-0 p-4 lg:p-4 font-mono text-[13px] lg:text-[8.5px] leading-[20px] lg:leading-[13px] pointer-events-none overflow-hidden whitespace-pre"
                    >
                      <code className={`language-${selectedFilePath?.endsWith('.py') ? 'python' : selectedFilePath?.endsWith('.js') ? 'javascript' : 'typescript'} !text-[13px] lg:!text-[8.5px] !leading-[20px] lg:!leading-[13px]`}>
                        {code}
                      </code>
                    </pre>

                    {/* Scan Line Animation */}
                    {isScanning && (
                      <div
                        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald to-transparent pointer-events-none z-20"
                        style={{
                          animation: 'scan-down 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                          boxShadow: '0 0 15px rgba(16, 185, 129, 0.6)',
                        }}
                      />
                    )}

                    {!selectedFilePath && !isScanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                          <Search className="w-8 h-8 text-muted-foreground/20" />
                        </div>
                        <h3 className="text-sm font-medium text-white mb-2">Discovery Phase</h3>
                        <p className="text-[11px] text-muted-foreground text-center max-w-[200px]">
                          Select a file from the Project Explorer to begin code inspection.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto bg-obsidian custom-scrollbar animate-in fade-in zoom-in-95 duration-500">
              <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Results Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                  <div>
                    <button 
                      onClick={() => setDashboardView('editor')}
                      className="flex items-center gap-2 text-emerald text-[10px] font-mono mb-4 uppercase tracking-widest hover:brightness-125 transition-all"
                    >
                      <ArrowLeft className="w-3 h-3" /> Back to Workspace
                    </button>
                    <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-2">Security Posture Analysis</h2>
                    <div className="flex items-center gap-4 text-muted-foreground/40 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3 h-3" /> {scanResult?.scanDuration}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <div>{new Date(scanResult?.timestamp || '').toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className={`absolute inset-0 blur-[60px] opacity-20 rounded-full transition-all duration-1000 group-hover:opacity-40 ${
                      (scanResult?.securityScore || 0) >= 80 ? 'bg-emerald' : 'bg-ruby'
                    }`} />
                    <div className="relative flex flex-col items-center justify-center w-28 h-28 lg:w-36 lg:h-36 rounded-full border border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl">
                      <span className={`text-4xl lg:text-5xl font-bold tracking-tighter ${
                        (scanResult?.securityScore || 0) >= 80 ? 'text-emerald' : 'text-ruby'
                      }`}>
                        {scanResult?.securityScore}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold mt-1">Score</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Intelligence */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* AI Project Intelligence */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 lg:p-10 relative overflow-hidden group/intel">
                      <div className="absolute top-0 right-0 p-10 opacity-5 group-hover/intel:opacity-10 transition-opacity">
                        <Sparkles className="w-24 h-24 text-emerald" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="p-2.5 rounded-xl bg-emerald/10 text-emerald border border-emerald/20">
                            <Cpu className="w-5 h-5" />
                          </div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">AI Project Intelligence</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                          {scanResult?.techStack?.map(tech => (
                            <div key={tech} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald/30 transition-colors">
                              <span className="text-[9px] text-muted-foreground uppercase tracking-widest block mb-1">Stack</span>
                              <span className="text-xs font-bold text-white">{tech.toUpperCase()}</span>
                            </div>
                          ))}
                          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest block mb-1">Files</span>
                            <span className="text-xs font-bold text-white">{scanResult?.filesScanned}</span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground/80 leading-relaxed font-light">
                          {scanResult?.projectDescription}
                        </p>
                      </div>
                    </div>

                    {/* Service Audit Map */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: 'SQL Injection', desc: 'Industry-standard parameterized query verification', status: 'secure', icon: Shield },
                        { name: 'Secrets Management', desc: 'Detection of hardcoded credentials & API tokens', status: 'warning', icon: Lock },
                        { name: 'Command Injection', desc: 'Verification of shell execution boundaries', status: 'secure', icon: Terminal },
                        { name: 'Insecure Deserialization', desc: 'Object stream integrity & parsing safety', status: 'secure', icon: Layers },
                        { name: 'Path Traversal', desc: 'Failsafe boundary checks for filesystem access', status: 'secure', icon: Folder },
                        { name: 'Weak Cryptography', desc: 'Entropy audit for hashing & encryption algorithms', status: 'warning', icon: Sparkles },
                      ].map((service, idx) => (
                        <div 
                          key={service.name} 
                          className="flex items-center gap-5 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300"
                          style={{ animationDelay: `${idx * 100}ms` }}
                        >
                          <div className={`p-3 rounded-2xl ${service.status === 'secure' ? 'bg-emerald/10 text-emerald border border-emerald/20' : 'bg-amber/10 text-amber border border-amber/20'}`}>
                            <service.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{service.name}</h4>
                              <div className={`w-1.5 h-1.5 rounded-full ${service.status === 'secure' ? 'bg-emerald' : 'bg-amber'} animate-pulse`} />
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 leading-tight">{service.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Security Feed */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
                          <Bug className="w-5 h-5 text-ruby" /> Security Feed
                        </h3>
                        <span className="text-[10px] font-mono text-muted-foreground/40 uppercase">Total Findings: {scanResult?.vulnerabilities.length}</span>
                      </div>
                      
                      {scanResult?.vulnerabilities.map((vuln, idx) => (
                        <div 
                          key={vuln.id} 
                          className="group relative p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-emerald/20 transition-all duration-500 overflow-hidden"
                          style={{ animationDelay: `${idx * 150}ms` }}
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-emerald/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
                            <div className="flex items-center gap-4">
                              <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border ${
                                vuln.severity === 'critical' ? 'bg-ruby/10 text-ruby border-ruby/20' :
                                vuln.severity === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                'bg-amber/10 text-amber border-amber/20'
                              }`}>
                                {vuln.severity}
                              </div>
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald/5 border border-emerald/10 text-[8px] font-bold text-emerald uppercase tracking-widest">
                                <Sparkles className="w-2.5 h-2.5" /> Hybrid Intel
                              </div>
                              <h4 className="text-base font-bold text-white tracking-tight">{vuln.title}</h4>
                            </div>
                            <button 
                              onClick={() => {
                                fetchFileContent(vuln.file || '');
                                setDashboardView('editor');
                              }}
                              className="px-5 py-2 rounded-full bg-emerald text-obsidian text-[10px] font-bold uppercase tracking-widest sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                              Trace <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="space-y-6 mb-8">
                            {/* Problem Context */}
                            <div className="relative p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                              <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                <AlertTriangle className="w-3 h-3 text-amber" /> Detection Context
                              </div>
                              <p className="text-sm text-white/70 leading-relaxed font-light italic">
                                "{vuln.description}"
                              </p>
                            </div>
                            
                            {/* AI Impact Analysis */}
                            {vuln.aiExplanation && (
                              <div className="p-6 rounded-[2rem] bg-ruby/5 border border-ruby/10">
                                <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-ruby uppercase tracking-widest">
                                  <ShieldAlert className="w-3.5 h-3.5" /> Impact Analysis
                                </div>
                                <p className="text-sm text-white/80 leading-relaxed font-light">
                                  {vuln.aiExplanation}
                                </p>
                              </div>
                            )}

                            {/* Remediation Guide */}
                            <div className="p-6 rounded-[2rem] bg-emerald/5 border border-emerald/10">
                              <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-emerald uppercase tracking-widest">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Remediation Guide
                              </div>
                              <div className="space-y-4">
                                {vuln.recommendation.split('\n').map((step, sIdx) => (
                                  step.trim() && (
                                    <div key={sIdx} className="flex gap-4 items-start">
                                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald/10 border border-emerald/20 flex items-center justify-center text-[10px] font-bold text-emerald">
                                        {sIdx + 1}
                                      </div>
                                      <p className="text-sm text-white/70 leading-relaxed font-light">
                                        {step.replace(/^\d+\.\s*/, '')}
                                      </p>
                                    </div>
                                  )
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/5">
                            <div className="flex items-center gap-2.5">
                              <Terminal className="w-4 h-4 text-emerald/40" />
                              <span className="text-[11px] font-mono text-muted-foreground group-hover:text-emerald transition-colors">{vuln.file}</span>
                            </div>
                            <div className="hidden sm:block w-px h-4 bg-white/5" />
                            <div className="flex items-center gap-2.5">
                              <Terminal className="w-4 h-4 text-emerald/40" />
                              <span className="text-[11px] font-mono text-muted-foreground uppercase">Line {vuln.line}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Recommendations */}
                  <div className="space-y-6">
                    <div className="bg-emerald/5 border border-emerald/10 rounded-[2rem] p-6 lg:p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Zap className="w-12 h-12 text-emerald" />
                      </div>
                      <h4 className="text-xs font-bold text-emerald uppercase tracking-widest mb-6">Immediate Actions</h4>
                      <ul className="space-y-6">
                        {[
                          'Isolate hardcoded API secrets from repository content.',
                          'Rotate all credentials found in plaintext commits.',
                          'Implement Argon2id for all password hashing operations.'
                        ].map((action, i) => (
                          <li key={i} className="flex gap-4 text-xs text-muted-foreground/80 leading-relaxed group/action">
                            <span className="text-emerald font-mono group-hover/action:translate-x-1 transition-transform">0{i+1}.</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 lg:p-8">
                      <div className="flex items-center gap-3 mb-8">
                        <BarChart3 className="w-4 h-4 text-white" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest">Risk Telemetry</h4>
                      </div>
                      <div className="space-y-6">
                        {[
                          { label: 'Infiltration Potential', value: 20, color: 'bg-emerald' },
                          { label: 'Data Leak Probability', value: 35, color: 'bg-amber' },
                          { label: 'Runtime Stability', value: 85, color: 'bg-emerald' },
                        ].map(metric => (
                          <div key={metric.label} className="space-y-3">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                              <span className="text-muted-foreground/60">{metric.label}</span>
                              <span className="text-white">{metric.value < 50 ? 'Minimal' : 'Elevated'}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ease-out ${metric.color}`} style={{ width: `${metric.value}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
    );
}
