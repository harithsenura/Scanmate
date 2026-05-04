import React, { useState, useEffect } from 'react';
import { Github, Search, Lock, Shield, ArrowLeft, LogOut, Loader2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import type { AppView } from '../App';
import Navigation from '../components/Navigation';

interface RepoSelectionProps {
  onNavigate: (view: AppView) => void;
  session: Session;
  onSelectRepo: (repo: any) => void;
}

export default function RepoSelection({ onNavigate, session, onSelectRepo }: RepoSelectionProps) {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRepos = async () => {
      const providerToken = (session as any).provider_token || session.access_token;
      if (!providerToken) return;

      setLoading(true);
      try {
        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
          headers: {
            Authorization: `Bearer ${providerToken}`,
          },
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setRepos(data);
        }
      } catch (err) {
        console.error('Failed to fetch repos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [session]);

  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-offwhite flex flex-col">
      <Navigation onNavigate={onNavigate} isLoggedIn={true} user={session.user} />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-medium text-white mb-2">Select a Repository</h1>
            <p className="text-muted-foreground text-sm">Choose the codebase you want to scan for vulnerabilities.</p>
          </div>
          
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
            <input 
              type="text" 
              placeholder="Search repositories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald/50 focus:bg-white/[0.07] transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-card rounded-[24px] p-6 h-40 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : filteredRepos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepos.map((repo) => (
              <button
                key={repo.id}
                onClick={() => onSelectRepo(repo)}
                className="glass-card rounded-[24px] p-6 text-left border border-white/5 hover:border-emerald/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-emerald/30 transition-colors">
                    <Github className="w-5 h-5 text-muted-foreground group-hover:text-emerald transition-colors" />
                  </div>
                  {repo.private ? (
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/10 text-[10px] font-mono text-muted-foreground uppercase">
                      <Lock className="w-2.5 h-2.5" />
                      Private
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-emerald/10 rounded-md border border-emerald/20 text-[10px] font-mono text-emerald uppercase">
                      Public
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-white mb-1 truncate group-hover:text-emerald transition-colors">
                  {repo.name}
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mb-4 h-8 leading-relaxed">
                  {repo.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald"></div>
                    <span className="text-[10px] text-muted-foreground font-mono">{repo.language || "Other"}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    Select to Scan &rarr;
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 glass-card rounded-[32px] border-dashed border-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Github className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No repositories found</h3>
            <p className="text-sm text-muted-foreground">Try searching for a different keyword or create a new repo on GitHub.</p>
          </div>
        )}
      </main>
    </div>
  );
}
