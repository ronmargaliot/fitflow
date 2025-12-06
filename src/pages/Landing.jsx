import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Dumbbell, TrendingUp, Users, Zap, Heart, 
  Trophy, Clock, Flame, ArrowRight, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBulkLikes } from '@/components/social/useLikes';

const CATEGORY_ICONS = {
  strength: '💪',
  cardio: '🏃',
  hiit: '⚡',
  yoga: '🧘',
  stretching: '🤸',
  calisthenics: '🏋️',
  crossfit: '🔥'
};

export default function Landing() {
  const navigate = useNavigate();

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['community-workouts'],
    queryFn: async () => {
      const all = await base44.entities.Workout.filter({ is_public: true });
      return all.sort((a, b) => (b.copy_count || 0) - (a.copy_count || 0));
    }
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['all-sessions'],
    queryFn: () => base44.entities.WorkoutSession.list('-started_at')
  });

  const { getLikesForWorkout } = useBulkLikes();

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  // Stats
  const totalWorkouts = workouts.length;
  const totalSessions = sessions.length;
  const totalCopies = workouts.reduce((sum, w) => sum + (w.copy_count || 0), 0);
  const activeUsers = new Set(sessions.map(s => s.created_by)).size;

  // Top workouts
  const trendingWorkouts = workouts.slice(0, 6);

  // Categories
  const categories = [
    { value: 'strength', label: 'Strength', color: 'bg-red-100 text-red-700' },
    { value: 'cardio', label: 'Cardio', color: 'bg-blue-100 text-blue-700' },
    { value: 'hiit', label: 'HIIT', color: 'bg-orange-100 text-orange-700' },
    { value: 'yoga', label: 'Yoga', color: 'bg-purple-100 text-purple-700' },
    { value: 'calisthenics', label: 'Calisthenics', color: 'bg-pink-100 text-pink-700' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <nav className="relative z-10 max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">FitTrack</span>
          </div>
          <Button onClick={handleLogin} className="bg-white text-slate-900 hover:bg-slate-100 font-semibold">
            Sign In
          </Button>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Workout Generation
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Transform Your
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Fitness Journey
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Create, share, and track workouts with the power of AI. Join thousands of fitness enthusiasts building their best selves.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                size="lg" 
                onClick={handleLogin}
                className="bg-white text-slate-900 hover:bg-slate-100 shadow-2xl text-lg px-8 h-14 font-bold"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                onClick={handleLogin}
                className="border-2 border-white text-white hover:bg-white/20 backdrop-blur text-lg px-8 h-14 font-bold"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Try AI Generator
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
              {[
                { icon: Dumbbell, label: 'Workouts', value: totalWorkouts },
                { icon: Users, label: 'Active Users', value: activeUsers },
                { icon: Flame, label: 'Sessions', value: totalSessions },
                { icon: Trophy, label: 'Copies Made', value: totalCopies }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20"
                >
                  <stat.icon className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white">{stat.value}+</p>
                  <p className="text-sm text-slate-300">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </header>

      {/* Categories Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">
          Browse by Category
        </h2>
        <div className="flex gap-3 justify-center flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              size="lg"
              onClick={handleLogin}
              className="bg-white/20 hover:bg-white/30 backdrop-blur border-2 border-white/40 text-white font-semibold shadow-lg"
            >
              <span className="mr-2">{CATEGORY_ICONS[cat.value]}</span>
              {cat.label}
            </Button>
          ))}
        </div>
      </section>

      {/* Trending Workouts */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Trending Workouts</h2>
            <p className="text-slate-300">Most popular in the community</p>
          </div>
          <Button 
            onClick={handleLogin}
            variant="ghost"
            className="text-indigo-300 hover:text-indigo-200 hover:bg-white/10"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingWorkouts.map((workout, index) => {
              const likeData = getLikesForWorkout(workout.id, null);
              return (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="bg-white/10 backdrop-blur border-white/20 overflow-hidden hover:bg-white/15 transition-all cursor-pointer group"
                    onClick={handleLogin}
                  >
                    <div className="h-40 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 relative">
                      {workout.cover_image ? (
                        <img 
                          src={workout.cover_image} 
                          alt={workout.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => { 
                            e.target.style.display = 'none';
                            e.target.parentElement.style.background = 'linear-gradient(to bottom right, rgb(51 65 85), rgb(15 23 42))';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-6xl opacity-50">
                            {CATEGORY_ICONS[workout.category] || '💪'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-white text-lg line-clamp-1">{workout.name}</h3>
                        <Badge className="bg-indigo-500/50 text-white border-0">
                          {CATEGORY_ICONS[workout.category] || '💪'}
                        </Badge>
                      </div>
                      
                      {workout.description && (
                        <p className="text-slate-300 text-sm mb-4 line-clamp-2">{workout.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-slate-300">
                        {workout.duration_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {workout.duration_minutes}min
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Dumbbell className="w-4 h-4" />
                          {workout.exercises?.length || 0} exercises
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {likeData.likeCount}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                        <Badge variant="outline" className="border-white/30 text-white">
                          <Users className="w-3 h-3 mr-1" />
                          {workout.copy_count || 0} copies
                        </Badge>
                        <Badge className="bg-amber-500/20 text-amber-300 border-0">
                          {workout.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/5 backdrop-blur" />
          <div className="relative z-10">
            <Zap className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Join our community and get access to AI-powered workout generation, progress tracking, and more.
            </p>
            <Button 
              size="lg"
              onClick={handleLogin}
              className="bg-white text-indigo-600 hover:bg-slate-100 shadow-2xl text-lg px-8 h-14 font-bold"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-slate-400">
            © 2025 FitTrack. Built with Base44.
          </p>
        </div>
      </footer>
    </div>
  );
}