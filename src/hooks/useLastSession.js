import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useLastSession(workoutId) {
  return useQuery({
    queryKey: ['lastSession', workoutId],
    queryFn: async () => {
      if (!workoutId) return null;
      const sessions = await base44.entities.WorkoutSession.filter(
        { workout_id: workoutId },
        '-created_date',
        1
      );
      return sessions[0] || null;
    },
    enabled: !!workoutId,
    staleTime: 30000,
  });
}

export function buildPerformanceMap(session) {
  if (!session?.exercises_completed) return {};
  const map = {};
  session.exercises_completed.forEach(ex => {
    if (ex.sets_completed > 0) {
      map[ex.name] = {
        sets: ex.sets_completed,
        reps: ex.reps,
        weight: ex.weight,
        date: session.finished_at || session.created_date,
      };
    }
  });
  return map;
}

export function resolvePerformance(exercise, perfMap) {
  const manual = exercise.last_performance;
  if (manual && (manual.sets || manual.reps || (manual.weight != null && manual.weight > 0))) {
    return { sets: manual.sets, reps: manual.reps, weight: manual.weight, date: null, manual: true };
  }
  return perfMap[exercise.name] || null;
}