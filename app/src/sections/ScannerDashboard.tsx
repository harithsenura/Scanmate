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
  ChevronDown,
  ChevronLeft,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  LogOut,
  Activity,
  Zap,
  Layers,
  ArrowLeft,
  Folder,
  File,
  Search,
  Loader2,
  Github,
  Cpu,
  Sparkles,
  Lock,
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
  deep_analysis?: {
    security_audit: string;
    validation_audit: string;
    engineering_audit: string;
    hardcoded_credentials: string;
  };
}



const BACKEND_URL = 'https://scanmate-jqy1.onrender.com';



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
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'editor' | 'analysis'>('editor');
  const [dashboardView, setDashboardView] = useState<'editor' | 'results'>('editor');
  const [showEngineModal, setShowEngineModal] = useState(false);
  const [engineSelection, setEngineSelection] = useState<'default' | 'private'>('default');
  const [historyCount, setHistoryCount] = useState(0);
  const [analysisWidth, setAnalysisWidth] = useState(400);

  // Check history count for Free Plan limits
  useEffect(() => {
    const fetchHistoryCount = async () => {
      let count = 0;
      // Try local storage first
      const local = JSON.parse(localStorage.getItem('scanmate_history') || '[]');
      count = local.length;
      
      // Try Supabase for cross-device sync accuracy
      if (session?.user?.id) {
        try {
          const { data } = await supabase
            .from('users')
            .select('preferences')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (data?.preferences?.scan_history) {
            count = data.preferences.scan_history.length;
          }
        } catch (e) {
          console.error("Failed to fetch history count from Supabase", e);
        }
      }
      setHistoryCount(count);
      
      // Auto-switch to private if default is locked
      if (count >= 1) {
        setEngineSelection('private');
      }
    };
    fetchHistoryCount();
  }, [session?.user?.id]);
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

  const runScan = useCallback(async (usePrivate: boolean) => {
    setShowEngineModal(false);
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
      let fullProjectCode = '';

      // Read custom user API keys if set
      const userKeysString = localStorage.getItem('user_api_keys');
      let userGroqKey: string | undefined = undefined;
      let userGeminiKey: string | undefined = undefined;
      if (usePrivate && userKeysString) {
        try {
          const keys = JSON.parse(userKeysString);
          userGroqKey = keys.groq;
          userGeminiKey = keys.gemini;
        } catch(e) {}
      }

      // Step 2: Scan each file using AST (Fast, no Rate Limits)
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        const fileName = file.path.split('/').pop() || file.path;
        setScanStatus(`Scanning ${fileName} (${i + 1}/${allFiles.length})`);
        setScanProgress(Math.round(((i + 1) / allFiles.length) * 80));

        // Fetch file content
        const content = await fetchFileContentRaw(file.path);
        if (!content || content.trim().length === 0) continue;

        totalLines += content.split('\n').length;
        
        // Step 2.1: Priority Files (Always include these in AI Context)
        const isPriorityFile = file.path.includes('.env') || 
                              file.path.includes('config') || 
                              file.path.includes('auth') || 
                              file.path.includes('admin') ||
                              file.path.includes('settings');

        // Append to full project code (Prioritize content or add to end if space allows)
        const fileContext = `\n\n--- File: ${file.path} ---\n${content.substring(0, isPriorityFile ? 5000 : 800)}`;
        
        if (isPriorityFile) {
            fullProjectCode = fileContext + fullProjectCode; // Prepend priority files
        } else if (fullProjectCode.length < 40000) { 
            fullProjectCode += fileContext;
        }

        // Detect language
        const language = detectLanguage(file.path);

        // Scan via backend (AST Mode)
        try {
          const response = await fetch(`${BACKEND_URL}/api/v1/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: content,
              language,
              filename: file.path,
              use_ai: false, // Use AST for individual files to save limits
              user_groq_key: userGroqKey,
              user_gemini_key: userGeminiKey
            }),
          });

          if (response.ok) {
            const data = await response.json();

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

            allVulnerabilities.push(...fileVulns);
          }
        } catch {
          // Skip
        }

        filesScanned++;
      }

      setScanStatus('Performing Deep Semantic AI Audit...');
      setScanProgress(90);
      let finalDeepAnalysis = undefined;

      // Step 3: ONE Final AI Call for the Deep Narrative Report
      try {
        const aiResponse = await fetch(`${BACKEND_URL}/api/v1/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: fullProjectCode,
            language: 'multi',
            filename: 'Full Project Context',
            use_ai: true,
            user_groq_key: userGroqKey,
            user_gemini_key: userGeminiKey
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          if (aiData.deep_analysis) {
            finalDeepAnalysis = aiData.deep_analysis;
          }
          // Also append any extra AI vulnerabilities found
          if (aiData.vulnerabilities) {
              const aiVulns = aiData.vulnerabilities.map((v: any) => {
                vulnCounter++;
                return {
                  id: `vuln-${vulnCounter}`,
                  title: v.title,
                  severity: v.severity,
                  line: v.line,
                  column: 0,
                  description: v.description,
                  cwe: v.cwe_id || 'N/A',
                  recommendation: v.recommendation,
                  file: 'Project Architecture',
                };
              });
              allVulnerabilities.push(...aiVulns);
          }
        }
      } catch (err) {
          console.error("AI Deep Audit failed:", err);
      }

      setScanProgress(100);
      setScanStatus('Scan complete');
      const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

      const severityWeights: Record<string, number> = { critical: 20, high: 10, medium: 5, low: 2 };
      const totalPenalty = allVulnerabilities.reduce(
        (sum, v) => sum + (severityWeights[v.severity] || 0), 0
      );
      const securityScore = Math.max(0, 100 - Math.min(totalPenalty, 80));

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
        deep_analysis: finalDeepAnalysis,
      };

      setScanResult(result);
      
      // Save scan history to local storage for User Dashboard
      const historyRecord = {
        id: result.id,
        name: selectedRepo?.name || 'Unknown Project',
        language: selectedRepo?.language || 'Unknown',
        updated_at: result.timestamp,
        score: result.securityScore,
        status: result.securityScore >= 70 ? 'passed' : 'failed',
        vulns: {
          critical: allVulnerabilities.filter(v => v.severity === 'critical').length,
          high: allVulnerabilities.filter(v => v.severity === 'high').length,
          medium: allVulnerabilities.filter(v => v.severity === 'medium').length,
          low: allVulnerabilities.filter(v => v.severity === 'low').length,
        },
        deep_analysis: finalDeepAnalysis
      };
      
      try {
        const existingHistory = JSON.parse(localStorage.getItem('scanmate_history') || '[]');
        // Keep only the latest scan for a specific project
        const filteredHistory = existingHistory.filter((item: any) => item.name !== historyRecord.name);
        const newHistory = [historyRecord, ...filteredHistory];
        
        localStorage.setItem('scanmate_history', JSON.stringify(newHistory));
        
        // Save to Supabase for cross-device sync
        if (session?.user?.id) {
          const { data: userData } = await supabase
            .from('users')
            .select('preferences')
            .eq('id', session.user.id)
            .maybeSingle();
            
          const currentPrefs = userData?.preferences || {};
          const cloudHistory = currentPrefs.scan_history || [];
          
          // Merge: Keep latest scan for each project name
          const mergedHistory = [historyRecord, ...cloudHistory.filter((item: any) => item.name !== historyRecord.name)];
          
          // Update local storage to match cloud
          localStorage.setItem('scanmate_history', JSON.stringify(mergedHistory));

          const { error: upsertError } = await supabase
            .from('users')
            .upsert({ 
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || '',
              avatar_url: session.user.user_metadata?.avatar_url || '',
              preferences: { 
                ...currentPrefs, 
                scan_history: mergedHistory 
              },
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
            
          if (upsertError) console.error('Supabase sync error:', upsertError);
        }
      } catch (e) {
        console.error('Failed to save scan history', e);
      }

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
              Scanmate<span className="text-emerald"></span>
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
                      onClick={() => setShowEngineModal(true)}
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 border-b border-white/10 pb-8">
                  <div>
                    <button 
                      onClick={() => setDashboardView('editor')}
                      className="flex items-center gap-2 text-emerald text-[10px] font-mono mb-4 uppercase tracking-widest hover:brightness-125 transition-all"
                    >
                      <ArrowLeft className="w-3 h-3" /> Back to Workspace
                    </button>
                    <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight mb-4 flex items-center gap-4">
                      <Sparkles className="w-10 h-10 text-emerald" /> 
                      Deep Project Analysis
                    </h2>
                    <div className="flex items-center gap-4 text-muted-foreground/50 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald" /> 
                        Analyzed {scanResult?.filesScanned || scanResult?.vulnerabilities.length || 0} files in {scanResult?.scanDuration}
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      <div>{new Date(scanResult?.timestamp || '').toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Affected Files Navigation */}
                {scanResult?.vulnerabilities && scanResult.vulnerabilities.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-6 bg-ruby rounded-full" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">Critical Affected Files</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from(new Set(scanResult.vulnerabilities.map(v => v.file))).map((filePath) => {
                        const fileVulns = scanResult.vulnerabilities.filter(v => v.file === filePath);
                        const hasCritical = fileVulns.some(v => v.severity === 'critical' || v.severity === 'high');
                        
                        return (
                          <button
                            key={filePath}
                            onClick={() => {
                              setSelectedFilePath(filePath || null);
                              setDashboardView('editor');
                            }}
                            className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-ruby/30 hover:bg-ruby/5 transition-all text-left"
                          >
                            <div className="flex items-center gap-4 overflow-hidden">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                hasCritical ? 'bg-ruby/10 border-ruby/20' : 'bg-white/5 border-white/10'
                              }`}>
                                <FileText className={`w-5 h-5 ${hasCritical ? 'text-ruby' : 'text-muted-foreground'}`} />
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-[13px] font-medium text-white truncate">{(filePath || '').split('/').pop()}</p>
                                <p className="text-[10px] text-muted-foreground truncate opacity-50">{filePath || ''}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter ${
                                hasCritical ? 'bg-ruby/20 text-ruby' : 'bg-white/10 text-muted-foreground'
                              }`}>
                                {fileVulns.length} Issues
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-ruby transition-colors" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Deep Analysis Report */}
                {scanResult?.deep_analysis ? (
                  <div className="space-y-12">
                    {/* Security Audit */}
                    <div className="bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-ruby/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-all duration-700 group-hover:bg-ruby/10" />
                      <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-2xl bg-ruby/10 flex items-center justify-center border border-ruby/20 shadow-[0_0_30px_rgba(225,29,72,0.2)]">
                              <ShieldAlert className="w-8 h-8 text-ruby" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Security Audit</h3>
                            <p className="text-xs font-mono text-ruby uppercase tracking-widest mb-8">Critical Vulnerability Assessment</p>
                            <div className="prose prose-invert max-w-none text-[15px]">
                              {scanResult.deep_analysis.security_audit.split('\n').map((paragraph, i) => (
                                paragraph.trim() ? <p key={i} className="mb-6 whitespace-pre-wrap text-muted-foreground/90 leading-relaxed font-light">{paragraph}</p> : null
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Validation Audit */}
                    <div className="bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-64 h-64 bg-amber/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 transition-all duration-700 group-hover:bg-amber/10" />
                      <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-2xl bg-amber/10 flex items-center justify-center border border-amber/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                              <CheckCircle2 className="w-8 h-8 text-amber" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Validation Audit</h3>
                            <p className="text-xs font-mono text-amber uppercase tracking-widest mb-8">Data & Input Integrity</p>
                            <div className="prose prose-invert max-w-none text-[15px]">
                              {scanResult.deep_analysis.validation_audit.split('\n').map((paragraph, i) => (
                                paragraph.trim() ? <p key={i} className="mb-6 whitespace-pre-wrap text-muted-foreground/90 leading-relaxed font-light">{paragraph}</p> : null
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Software Engineering Audit */}
                    <div className="bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden group">
                      <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 transition-all duration-700 group-hover:bg-blue-500/10" />
                      <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                              <Layers className="w-8 h-8 text-blue-500" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Software Engineering Audit</h3>
                            <p className="text-xs font-mono text-blue-500 uppercase tracking-widest mb-8">Architecture & Best Practices</p>
                            <div className="prose prose-invert max-w-none text-[15px]">
                              {scanResult.deep_analysis.engineering_audit.split('\n').map((paragraph, i) => (
                                paragraph.trim() ? <p key={i} className="mb-6 whitespace-pre-wrap text-muted-foreground/90 leading-relaxed font-light">{paragraph}</p> : null
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hardcoded Credentials */}
                    <div className="bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 transition-all duration-700 group-hover:bg-emerald/10" />
                      <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-2xl bg-emerald/10 flex items-center justify-center border border-emerald/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                              <Lock className="w-8 h-8 text-emerald" />
                            </div>
                          </div>
                          <div className="w-full">
                            <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Hardcoded Credentials</h3>
                            <p className="text-xs font-mono text-emerald uppercase tracking-widest mb-8">Secrets, Keys & Passwords</p>
                            <div className="p-8 bg-emerald/5 border border-emerald/10 rounded-2xl shadow-inner">
                              <div className="prose prose-invert max-w-none text-[14px]">
                                {scanResult.deep_analysis.hardcoded_credentials.split('\n').map((line, i) => (
                                  line.trim() ? <div key={i} className="mb-3 whitespace-pre-wrap text-emerald/90 font-mono leading-relaxed">{line}</div> : null
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground/50 font-mono border border-white/5 rounded-[2rem] bg-white/[0.02]">
                    <Activity className="w-8 h-8 mx-auto mb-4 opacity-20" />
                    Deep analysis report is not available for this scan.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* API Engine Selection Modal */}
      {showEngineModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowEngineModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald" />
              Select Scan Engine
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Choose which AI backend to use for your deep code analysis.
            </p>

            <div className="space-y-3 mb-6">
              <label 
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                  historyCount >= 1 
                    ? 'bg-ruby/5 border-ruby/20 opacity-80 cursor-not-allowed'
                    : engineSelection === 'default' 
                      ? 'bg-emerald/10 border-emerald/50 cursor-pointer' 
                      : 'bg-white/5 border-white/10 hover:border-white/20 cursor-pointer'
                }`}
              >
                <div className="pt-0.5">
                  <input 
                    type="radio" 
                    name="engine" 
                    checked={engineSelection === 'default'} 
                    onChange={() => historyCount < 1 && setEngineSelection('default')}
                    disabled={historyCount >= 1}
                    className="accent-emerald"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">Default ScanMate API</h4>
                    {historyCount >= 1 && (
                      <span className="text-[9px] bg-ruby/20 text-ruby px-1.5 py-0.5 rounded font-bold uppercase">Locked (Free Plan)</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {historyCount >= 1 
                      ? "You've used your 1-project limit for the Default API. Upgrade or use a Private API for more." 
                      : "Free global API. Limit: 1 Project per account."}
                  </p>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  engineSelection === 'private' 
                    ? 'bg-emerald/10 border-emerald/50' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="pt-0.5">
                  <input 
                    type="radio" 
                    name="engine" 
                    checked={engineSelection === 'private'} 
                    onChange={() => setEngineSelection('private')}
                    className="accent-emerald"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      Private API <Lock className="w-3 h-3 text-emerald" />
                    </h4>
                    {localStorage.getItem('user_api_keys') ? (
                      <span className="text-[10px] bg-emerald/20 text-emerald px-2 py-0.5 rounded uppercase font-bold">Ready</span>
                    ) : (
                      <span className="text-[10px] bg-ruby/20 text-ruby px-2 py-0.5 rounded uppercase font-bold">Missing</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Use your own Groq/Gemini API keys for guaranteed speed and zero rate limits.</p>
                  
                  {!localStorage.getItem('user_api_keys') && engineSelection === 'private' && (
                    <button 
                      onClick={() => onNavigate('settings')}
                      className="mt-3 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors"
                    >
                      Configure Keys in Settings &rarr;
                    </button>
                  )}
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowEngineModal(false)}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={() => runScan(engineSelection === 'private')}
                disabled={engineSelection === 'private' && !localStorage.getItem('user_api_keys')}
                className="px-5 py-2 text-sm font-bold bg-emerald text-obsidian rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Scan &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
}
