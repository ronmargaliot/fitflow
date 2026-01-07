import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Home, TrendingUp, User, Dumbbell } from 'lucide-react';
import { Button } from "@/components/ui/button";


export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      }
    };
    checkAuth();
  }, []);



  // Pages without navigation
  const hideNav = ['ActiveWorkout', 'Landing'].includes(currentPageName);

  // Show Landing page for non-authenticated users
  if (isAuthenticated === false && currentPageName !== 'Landing') {
    window.location.href = createPageUrl('Landing');
    return null;
  }

  if (hideNav) {
    return <>{children}</>;
  }

  // Still checking auth
  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {children}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <Link to={createPageUrl('Home')}>
              <Button 
                variant="ghost" 
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                  currentPageName === 'Home' ? 'text-indigo-600' : 'text-slate-500'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="text-xs">Workouts</span>
              </Button>
            </Link>

            <Link to={createPageUrl('Progress')}>
              <Button 
                variant="ghost" 
                className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
                  currentPageName === 'Progress' ? 'text-indigo-600' : 'text-slate-500'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs">Progress</span>
              </Button>
            </Link>

            <Link to={createPageUrl('Profile')}>
              <Button 
                variant="ghost" 
                className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
                  currentPageName === 'Profile' ? 'text-indigo-600' : 'text-slate-500'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-xs">Profile</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Bottom padding for nav */}
      <div className="h-16" />
    </div>
  );
}