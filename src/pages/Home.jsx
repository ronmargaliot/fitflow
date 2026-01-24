import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Plus, Dumbbell, Loader2, Users, User, Search, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import WorkoutCard from '@/components/workout/WorkoutCard';
import EditWorkoutModal from '@/components/workout/EditWorkoutModal';
import WorkoutFilters from '@/components/workout/WorkoutFilters';
import WorkoutCardSkeleton from '@/components/common/WorkoutCardSkeleton';
import { useBulkLikes } from '@/components/social/useLikes';
import AIWorkoutGenerator from '@/components/workout/AIWorkoutGenerator';

export default function Home() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('community');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ category: '', bodyArea: '', difficulty: '', sortBy: 'recent' });
  const [showAIInspiration, setShowAIInspiration] = useState(false);
  const [inspirationWorkout, setInspirationWorkout] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const { data: allWorkouts = [], isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => base44.entities.Workout.list(),
    staleTime: 10000
  });

  const { getLikesForWorkout, allLikes = [] } = useBulkLikes();

  // Filter workouts based on tab and filters
  const myWorkouts = allWorkouts.filter(w => w.created_by === currentUser?.email);
  const communityWorkouts = allWorkouts.filter(w => w.is_public === true);
  
  const applyFilters = (workouts) => {
    let filtered = [...workouts];
    
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w => 
        w.name?.toLowerCase().includes(query) ||
        w.description?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (filters.category) {
      filtered = filtered.filter(w => w.category === filters.category);
    }
    
    // Body area filter
    if (filters.bodyArea) {
      filtered = filtered.filter(w => w.body_areas?.includes(filters.bodyArea));
    }
    
    // Difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(w => w.difficulty === filters.difficulty);
    }
    
    // Sort
    if (filters.sortBy === 'popular') {
      filtered.sort((a, b) => (b.copy_count || 0) + (b.share_count || 0) - (a.copy_count || 0) - (a.share_count || 0));
    } else if (filters.sortBy === 'liked') {
      filtered.sort((a, b) => {
        const aLikes = allLikes.filter(l => l.workout_id === a.id).length;
        const bLikes = allLikes.filter(l => l.workout_id === b.id).length;
        return bLikes - aLikes;
      });
    } else if (filters.sortBy === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
    
    return filtered;
  };
  
  const displayedWorkouts = applyFilters(activeTab === 'my' ? myWorkouts : communityWorkouts);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Workout.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    }
  });

  const copyMutation = useMutation({
    mutationFn: async (workout) => {
      // Create the copy
      const copy = await base44.entities.Workout.create({
        name: `${workout.name} (Copy)`,
        description: workout.description,
        exercises: workout.exercises,
        default_rest: workout.default_rest,
        rest_between_exercises: workout.rest_between_exercises,
        color: workout.color,
        category: workout.category,
        body_areas: workout.body_areas,
        difficulty: workout.difficulty,
        duration_minutes: workout.duration_minutes,
        is_public: false,
        original_workout_id: workout.id,
        original_creator: workout.created_by
      });
      
      // Increment copy count on original
      await base44.entities.Workout.update(workout.id, {
        copy_count: (workout.copy_count || 0) + 1
      });

      // Create notification for workout owner
      if (workout.created_by !== currentUser?.email) {
        const users = await base44.entities.User.filter({ email: currentUser?.email });
        const actorUsername = users.length > 0 && users[0].username 
          ? users[0].username 
          : currentUser?.email.split('@')[0];
        
        await base44.entities.Notification.create({
          type: 'copy',
          workout_id: workout.id,
          workout_name: workout.name,
          actor_email: currentUser?.email,
          actor_username: actorUsername,
          recipient_email: workout.created_by
        });
      }
      
      return copy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['allLikes'] });
      setActiveTab('my');
    }
  });

  const handleCreateWorkout = (data) => {
    createMutation.mutate(data);
  };

  const handleCopyWorkout = (workout) => {
    copyMutation.mutate(workout);
  };

  const handleAIInspire = (workout) => {
    setInspirationWorkout(workout);
    setShowAIInspiration(true);
  };

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ workout_id, user_email, isLiked }) => {
      if (isLiked) {
        const likes = await base44.entities.WorkoutLike.filter({ 
          workout_id: workout_id,
          created_by: user_email 
        });
        if (likes.length > 0) {
          await base44.entities.WorkoutLike.delete(likes[0].id);
        }
      } else {
        await base44.entities.WorkoutLike.create({ workout_id });
      }
      return { isLiked: !isLiked };
    },
    onMutate: async ({ workout_id, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['allLikes'] });
      
      const previousAllLikes = queryClient.getQueryData(['allLikes']);
      
      queryClient.setQueryData(['allLikes'], (old = []) => {
        if (isLiked) {
          return old.filter(like => !(like.workout_id === workout_id && like.created_by === currentUser?.email));
        } else {
          return [...old, { workout_id, created_by: currentUser?.email, id: 'temp-' + Date.now() }];
        }
      });
      
      return { previousAllLikes };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['allLikes'], context.previousAllLikes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['allLikes'] });
    }
  });

  const handleAIGenerate = async (aiWorkoutData) => {
    if (inspirationWorkout) {
      await base44.entities.Workout.update(inspirationWorkout.id, {
        ai_inspo_count: (inspirationWorkout.ai_inspo_count || 0) + 1
      });

      // Create notification for workout owner
      if (inspirationWorkout.created_by !== currentUser?.email) {
        const users = await base44.entities.User.filter({ email: currentUser?.email });
        const actorUsername = users.length > 0 && users[0].username 
          ? users[0].username 
          : currentUser?.email.split('@')[0];
        
        await base44.entities.Notification.create({
          type: 'ai_inspire',
          workout_id: inspirationWorkout.id,
          workout_name: inspirationWorkout.name,
          actor_email: currentUser?.email,
          actor_username: actorUsername,
          recipient_email: inspirationWorkout.created_by
        });
      }
    }
    createMutation.mutate({
      ...aiWorkoutData,
      original_workout_id: inspirationWorkout?.id,
      original_creator: inspirationWorkout?.created_by
    });
    setShowAIInspiration(false);
    setInspirationWorkout(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Workout Tracker</h1>
                <p className="text-xs text-slate-500">Track your progress</p>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-slate-900 hover:bg-slate-800 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Workout
            </Button>
          </div>

          {/* Tabs */}
          <div className="mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="my" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  My Workouts ({myWorkouts.length})
                </TabsTrigger>
                <TabsTrigger value="community" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Community ({communityWorkouts.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Search & Filters */}
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search workouts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <WorkoutFilters filters={filters} onFilterChange={setFilters} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <WorkoutCardSkeleton key={i} />
            ))}
          </div>
        ) : displayedWorkouts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              {activeTab === 'my' ? (
                <Dumbbell className="w-10 h-10 text-slate-400" />
              ) : (
                <Users className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              {activeTab === 'my' ? 'No workouts yet' : 'No community workouts'}
            </h2>
            <p className="text-slate-500 mb-6">
              {activeTab === 'my' 
                ? 'Create your first workout to get started' 
                : 'Be the first to share a workout!'}
            </p>
            {activeTab === 'my' && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-slate-900 hover:bg-slate-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Workout
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {displayedWorkouts.map((workout, index) => (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <WorkoutCard 
                    workout={workout} 
                    isOwner={workout.created_by === currentUser?.email}
                    showCommunityBadge={activeTab === 'community'}
                    onCopy={() => handleCopyWorkout(workout)}
                    onAIInspire={() => handleAIInspire(workout)}
                    onLike={() => {
                      if (toggleLikeMutation.isPending) return;
                      const likeData = getLikesForWorkout(workout.id, currentUser?.email);
                      toggleLikeMutation.mutate({ 
                        workout_id: workout.id, 
                        user_email: currentUser?.email,
                        isLiked: likeData.isLiked 
                      });
                    }}
                    likeData={getLikesForWorkout(workout.id, currentUser?.email)}
                    currentUser={currentUser}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <EditWorkoutModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateWorkout}
      />

      <AIWorkoutGenerator
        open={showAIInspiration}
        onClose={() => {
          setShowAIInspiration(false);
          setInspirationWorkout(null);
        }}
        onGenerate={handleAIGenerate}
        inspirationWorkout={inspirationWorkout}
      />
    </div>
  );
}