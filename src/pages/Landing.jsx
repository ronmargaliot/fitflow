import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Dumbbell, ChevronRight, Users, Flame, Zap, 
  Trophy, ArrowRight, Play, Star, Copy, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CATEGORIES = [
  { id: 'strength', label: 'Strength', icon: Dumbbell, color: 'bg-blue-500' },
  { id: 'cardio', label: 'Cardio', icon: Flame, color: 'bg-red-500' },
  { id: 'hiit', label: 'HIIT', icon: Zap, color: 'bg-orange-500' },
  { id: 'yoga', label: 'Yoga', icon: Star, color: 'bg-purple-500' },
];

export default function Landing() {
  const { data: publicWorkouts = [] } = useQuery({
    queryKey: ['publicWorkouts'],
    queryFn: async () => {
      const workouts = await base44.entities.Workout.filter({ is_public: true });
      return workouts.sort((a, b) => (b.copy_count || 0) - (a.copy_count || 0)).slice(0, 6);
    }
  });

  const handleGetStarted = () => {
    base44.auth.redirectToLogin(createPageUrl('Home'));
  };

  const totalCopies = publicWorkouts.reduce((acc, w) => acc + (w.copy_count || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-20">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-slate-900" />
              </div>
              <span className="text-xl font-bold text-white">FitShare</span>
            </div>
            <Button 
              onClick={handleGetStarted}
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              Sign In
            </Button>
          </nav>

          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="bg-white/10 text-white border-white/20 mb-6">
                <Users className="w-3 h-3 mr-1" />
                {publicWorkouts.length}+ Community Workouts
              </Badge>
              
              <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
                Discover, Share &<br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Crush Your Workouts
                </span>
              </h1>
              
              <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
                Join a community of fitness enthusiasts. Browse workouts, copy what works, 
                create your own, and track your progress.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  onClick={handleGetStarted}
                  className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-8 text-lg"
                >
                  Create Your Workout
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 h-14 px-8 text-lg"
                  onClick={() => document.getElementById('workouts').scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Browse Workouts
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-16"
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{publicWorkouts.length}+</p>
              <p className="text-sm text-slate-400">Workouts</p>
            </div>
            <div className="text-center border-x border-white/10">
              <p className="text-3xl font-bold text-white">{totalCopies}+</p>
              <p className="text-sm text-slate-400">Copies Made</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">Free</p>
              <p className="text-sm text-slate-400">Forever</p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Categories */}
      <section className="py-12 bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 flex-shrink-0"
                onClick={handleGetStarted}
              >
                <cat.icon className="w-4 h-4 mr-2" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Workouts */}
      <section id="workouts" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Popular Workouts</h2>
              <p className="text-slate-400">Discover what the community is training</p>
            </div>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              onClick={handleGetStarted}
            >
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicWorkouts.map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
                  onClick={handleGetStarted}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: workout.color || '#6366f1' }}
                      >
                        <Dumbbell className="w-5 h-5 text-white" />
                      </div>
                      {workout.copy_count > 0 && (
                        <Badge className="bg-green-500/20 text-green-400 border-0">
                          <Copy className="w-3 h-3 mr-1" />
                          {workout.copy_count}
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-1">{workout.name}</h3>
                    {workout.description && (
                      <p className="text-sm text-slate-400 mb-3 line-clamp-2">{workout.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {workout.category && (
                        <Badge variant="outline" className="text-slate-300 border-slate-600 text-xs">
                          {workout.category}
                        </Badge>
                      )}
                      {workout.difficulty && (
                        <Badge variant="outline" className="text-slate-300 border-slate-600 text-xs">
                          {workout.difficulty}
                        </Badge>
                      )}
                      {workout.duration_minutes && (
                        <Badge variant="outline" className="text-slate-300 border-slate-600 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {workout.duration_minutes}m
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span>{workout.exercises?.length || 0} exercises</span>
                      <span className="flex items-center group-hover:text-white transition-colors">
                        Copy Workout
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {publicWorkouts.length === 0 && (
            <div className="text-center py-16">
              <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No public workouts yet. Be the first to share!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 sm:p-12">
            <Trophy className="w-12 h-12 text-white/80 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Start Your Fitness Journey?
            </h2>
            <p className="text-white/80 mb-8">
              Create your free account and join thousands of fitness enthusiasts sharing their workouts.
            </p>
            <Button 
              size="lg"
              onClick={handleGetStarted}
              className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-8 text-lg"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-slate-400" />
            <span className="text-slate-400">FitShare</span>
          </div>
          <p className="text-sm text-slate-500">© 2024 FitShare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}