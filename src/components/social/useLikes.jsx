import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useLikes(workoutId, currentUserEmail) {
  const queryClient = useQueryClient();

  const { data: likes = [] } = useQuery({
    queryKey: ['likes', workoutId],
    queryFn: () => base44.entities.WorkoutLike.filter({ workout_id: workoutId }),
    enabled: !!workoutId
  });

  const isLiked = likes.some(like => like.created_by === currentUserEmail);
  const likeCount = likes.length;
  const userLike = likes.find(like => like.created_by === currentUserEmail);

  const likeMutation = useMutation({
    mutationFn: async ({ shouldUnlike, likeId }) => {
      if (shouldUnlike) {
        await base44.entities.WorkoutLike.delete(likeId);
      } else {
        await base44.entities.WorkoutLike.create({ workout_id: workoutId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes', workoutId] });
      queryClient.invalidateQueries({ queryKey: ['allLikes'] });
    }
  });

  const toggleLike = () => {
    likeMutation.mutate({
      shouldUnlike: isLiked,
      likeId: userLike?.id
    });
  };

  return {
    isLiked,
    likeCount,
    toggleLike,
    isLoading: likeMutation.isPending
  };
}

export function useBulkLikes(workoutIds) {
  const { data: allLikes = [] } = useQuery({
    queryKey: ['allLikes'],
    queryFn: () => base44.entities.WorkoutLike.list(),
    staleTime: 30000
  });

  const getLikesForWorkout = (workoutId, currentUserEmail) => {
    const workoutLikes = allLikes.filter(like => like.workout_id === workoutId);
    return {
      likeCount: workoutLikes.length,
      isLiked: workoutLikes.some(like => like.created_by === currentUserEmail)
    };
  };

  return { getLikesForWorkout, allLikes };
}