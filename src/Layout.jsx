import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Home, TrendingUp, User, LogOut, Dumbbell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  const handleLogout = () => {
    base44.auth.logout();
  };

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
                className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2 px-4">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user?.picture || user?.avatar_url || user?.photo_url} alt={user?.full_name} />
                    <AvatarFallback className="text-xs bg-slate-200">
                      {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-slate-500">Profile</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Bottom padding for nav */}
      <div className="h-16" />
    </div>
  );
}