import { useState, useEffect } from 'react';
import LandingPage from './sections/LandingPage';
import ScannerDashboard from './sections/ScannerDashboard';
import Documentation from './sections/Documentation';
import LoginPage from './sections/LoginPage';
import RepoSelection from './sections/RepoSelection';
import UserDashboard from './sections/UserDashboard';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

export type AppView = 'landing' | 'scanner' | 'docs' | 'login' | 'repos' | 'user-dashboard';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [session, setSession] = useState<Session | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && currentView === 'login') {
        setCurrentView('repos');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        if (currentView === 'login') setCurrentView('repos');
      } else {
        if (currentView === 'scanner' || currentView === 'repos' || currentView === 'user-dashboard') setCurrentView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, [currentView]);

  return (
    <div className="min-h-screen bg-obsidian text-offwhite overflow-x-hidden">
      {currentView === 'landing' && (
        <LandingPage 
          onNavigate={setCurrentView} 
          isLoggedIn={!!session} 
          user={session?.user || null}
        />
      )}
      {currentView === 'login' && <LoginPage onNavigate={setCurrentView} />}
      {currentView === 'repos' && session && (
        <RepoSelection 
          onNavigate={setCurrentView} 
          session={session} 
          onSelectRepo={(repo) => {
            setSelectedRepo(repo);
            setCurrentView('scanner');
          }}
        />
      )}
      {currentView === 'scanner' && (
        session ? (
          <ScannerDashboard onNavigate={setCurrentView} session={session} selectedRepo={selectedRepo} />
        ) : (
          <LoginPage onNavigate={setCurrentView} />
        )
      )}
      {currentView === 'docs' && <Documentation onNavigate={setCurrentView} />}
      {currentView === 'user-dashboard' && session && (
        <UserDashboard onNavigate={setCurrentView} session={session} />
      )}
    </div>
  );
}

export default App;
