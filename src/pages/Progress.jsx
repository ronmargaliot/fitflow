import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Dumbbell, Clock, TrendingUp, Calendar, 
  Flame, Weight, BarChart3, Trophy, Loader2, Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { motion } from 'framer-motion';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

export default function Progress() {
  const [currentUser, setCurrentUser] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [deleteSessionId, setDeleteSessionId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.WorkoutSession.list('-started_at'),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkoutSession.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session deleted');
      setDeleteSessionId(null);
    }
  });

  // Filter sessions by current user
  const mySessions = sessions.filter(s => s.created_by === currentUser?.email);

  // Calculate stats
  const totalWorkouts = mySessions.length;
  const totalTime = mySessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
  const totalVolume = mySessions.reduce((acc, s) => acc + (s.total_volume || 0), 0);
  const totalReps = mySessions.reduce((acc, s) => acc + (s.total_reps || 0), 0);
  const completedWorkouts = mySessions.filter(s => s.is_complete).length;
  const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

  // Weekly data
  const getWeeklyData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayName = format(date, 'EEE');
      const daySessions = mySessions.filter(s => 
        format(new Date(s.started_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      data.push({
        name: dayName,
        workouts: daySessions.length,
        volume: daySessions.reduce((acc, s) => acc + (s.total_volume || 0), 0),
        duration: Math.round(daySessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / 60)
      });
    }
    return data;
  };

  // Exercise breakdown
  const getExerciseBreakdown = () => {
    const exerciseCounts = {};
    mySessions.forEach(session => {
      session.exercises_completed?.forEach(ex => {
        if (!exerciseCounts[ex.name]) {
          exerciseCounts[ex.name] = { sets: 0, volume: 0 };
        }
        exerciseCounts[ex.name].sets += ex.sets_completed || 0;
        exerciseCounts[ex.name].volume += (ex.sets_completed || 0) * (parseInt(ex.reps) || 0) * (ex.weight || 0);
      });
    });
    return Object.entries(exerciseCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sets - a.sets)
      .slice(0, 5);
  };

  // Personal records
  const getPersonalRecords = () => {
    const records = {};
    mySessions.forEach(session => {
      session.exercises_completed?.forEach(ex => {
        if (ex.weight > 0) {
          if (!records[ex.name] || ex.weight > records[ex.name].weight) {
            records[ex.name] = { weight: ex.weight, date: session.started_at };
          }
        }
      });
    });
    return Object.entries(records)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const weeklyData = getWeeklyData();
  const exerciseBreakdown = getExerciseBreakdown();
  const personalRecords = getPersonalRecords();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Progress</h1>
              <p className="text-xs text-slate-500">Track your fitness journey</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{totalWorkouts}</p>
                    <p className="text-xs text-slate-500">Workouts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{formatDuration(totalTime)}</p>
                    <p className="text-xs text-slate-500">Total Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Weight className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{(totalVolume / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-slate-500">Volume (kg)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{completionRate}%</p>
                    <p className="text-xs text-slate-500">Completion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Weekly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar dataKey="duration" fill="#6366f1" radius={[4, 4, 0, 0]} name="Duration (min)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Exercises */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-green-600" />
                  Top Exercises
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exerciseBreakdown.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Complete some workouts to see data</p>
                ) : (
                  <div className="space-y-3">
                    {exerciseBreakdown.map((ex, i) => (
                      <div key={ex.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          >
                            {i + 1}
                          </div>
                          <span className="font-medium text-slate-900 truncate max-w-[150px]">{ex.name}</span>
                        </div>
                        <Badge variant="secondary">{ex.sets} sets</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Personal Records */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Personal Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                {personalRecords.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Add weights to track PRs</p>
                ) : (
                  <div className="space-y-3">
                    {personalRecords.map((pr, i) => (
                      <div key={pr.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Trophy className={`w-5 h-5 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : 'text-orange-600'}`} />
                          <span className="font-medium text-slate-900 truncate max-w-[150px]">{pr.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{pr.weight}kg</p>
                          <p className="text-xs text-slate-500">{format(new Date(pr.date), 'MMM d')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mySessions.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No workout sessions yet</p>
              ) : (
                <div className="space-y-3">
                  {mySessions.slice(0, 10).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                      <div>
                        <p className="font-medium text-slate-900">{session.workout_name}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(session.started_at), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={session.is_complete ? "default" : "secondary"}>
                          {session.completed_sets}/{session.total_sets} sets
                        </Badge>
                        <Badge variant="outline">
                          {formatDuration(session.duration_seconds)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600"
                          onClick={() => setDeleteSessionId(session.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Delete Session Dialog */}
      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workout session from your history? This won't affect your workout templates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteSessionMutation.mutate(deleteSessionId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}