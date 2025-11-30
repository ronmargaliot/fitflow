import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

function CommentItem({ comment, currentUser, onDelete }) {
  const isOwner = comment.created_by === currentUser?.email;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 group"
    >
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className="text-xs bg-slate-200">
          {comment.created_by?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-xs font-medium text-slate-700 truncate">
            {comment.created_by}
          </p>
          <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
          </span>
          {isOwner && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function CommentSection({ workoutId, currentUser }) {
  const [content, setContent] = useState('');
  const [showAll, setShowAll] = useState(false);
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', workoutId],
    queryFn: () => base44.entities.WorkoutComment.filter({ workout_id: workoutId }, '-created_date'),
    enabled: !!workoutId
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', workoutId] });
      setContent('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkoutComment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', workoutId] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    addMutation.mutate({ workout_id: workoutId, content: content.trim() });
  };

  const displayedComments = showAll ? comments : comments.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-slate-500" />
        <h3 className="font-semibold text-slate-900">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="text-xs bg-slate-200">
            {currentUser?.email?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[40px] h-10 resize-none py-2"
            rows={1}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!content.trim() || addMutation.isPending}
            className="h-10 w-10 flex-shrink-0"
          >
            {addMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {displayedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </AnimatePresence>
          
          {comments.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full text-slate-500"
            >
              {showAll ? 'Show less' : `View all ${comments.length} comments`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}