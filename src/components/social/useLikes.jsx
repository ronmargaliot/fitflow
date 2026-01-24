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
        return { action: 'unlike' };
      } else {
        await base44.entities.WorkoutLike.create({ workout_id: workoutId });
        return { action: 'like' };
      }
    },
    onMutate: async ({ shouldUnlike }) => {
      await queryClient.cancelQueries({ queryKey: ['likes', workoutId] });
      await queryClient.cancelQueries({ queryKey: ['allLikes'] });
      
      const previousLikes = queryClient.getQueryData(['likes', workoutId]);
      const previousAllLikes = queryClient.getQueryData(['allLikes']);
      
      if (shouldUnlike) {
        queryClient.setQueryData(['likes', workoutId], (old = []) => 
          old.filter(like => like.created_by !== currentUserEmail)
        );
        queryClient.setQueryData(['allLikes'], (old = []) => 
          old.filter(like => !(like.workout_id === workoutId && like.created_by === currentUserEmail))
        );
      } else {
        const newLike = { workout_id: workoutId, created_by: currentUserEmail, id: 'temp-' + Date.now() };
        queryClient.setQueryData(['likes', workoutId], (old = []) => [...old, newLike]);
        queryClient.setQueryData(['allLikes'], (old = []) => [...old, newLike]);
      }
      
      return { previousLikes, previousAllLikes };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['likes', workoutId], context.previousLikes);
      queryClient.setQueryData(['allLikes'], context.previousAllLikes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['likes', workoutId] });
      queryClient.invalidateQueries({ queryKey: ['allLikes'] });
    }
  });

  const toggleLike = () => {
    if (likeMutation.isPending) return;
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