import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dumbbell, Clock, Users, Copy, User, Heart, Sparkles, Wand2, Share2 } from 'lucide-react';
import ShareButton from '@/components/social/ShareButton';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const DEFAULT_IMAGES = {
  strength: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400&h=200&fit=crop',
  cardio: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&h=200&fit=crop',
  hiit: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=400&h=200&fit=crop',
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=200&fit=crop',
  stretching: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400&h=200&fit=crop',
  calisthenics: 'https://images.unsplash.com/photo-1598971639058-a5e8e2d39e72?w=400&h=200&fit=crop',
  crossfit: 'https://images.unsplash.com/photo-1533681904393-9ab6ebed4d63?w=400&h=200&fit=crop',
  default: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=200&fit=crop'
};

export default function WorkoutCard({ workout, isOwner, showCommunityBadge, onCopy, onAIInspire, likeData }) {
  const totalSets = workout.exercises?.reduce((acc, ex) => acc + (ex.sets || 0), 0) || 0;
  const exerciseCount = workout.exercises?.length || 0;
  const coverImage = workout.cover_image || DEFAULT_IMAGES[workout.category] || DEFAULT_IMAGES.default;

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onCopy?.();
  };

  const handleAIInspire = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAIInspire?.();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link to={createPageUrl(`WorkoutDetail?id=${workout.id}`)}>
        <Card className="relative overflow-hidden cursor-pointer group border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-[280px] flex flex-col">
          {/* Cover Image */}
          <div className="relative h-32 overflow-hidden">
            <img 
              src={coverImage} 
              alt={workout.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.target.src = DEFAULT_IMAGES.default; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Badges on image */}
            <div className="absolute top-2 left-2 flex gap-1.5">
              {showCommunityBadge && (
                <Badge className={`text-xs ${
                  isOwner 
                    ? 'bg-green-500 text-white' 
                    : 'bg-purple-500 text-white'
                }`}>
                  {isOwner ? (
                    <>
                      <User className="w-3 h-3 mr-1" />
                      Yours
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3 mr-1" />
                      Community
                    </>
                  )}
                </Badge>
              )}
              {workout.original_workout_id && (
                <Badge className="bg-blue-500 text-white text-xs">
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Badge>
              )}
            </div>

            {/* Stats badges */}
            <div className="absolute top-2 right-2 flex gap-1">
              <Badge className="bg-white/90 text-red-500 text-xs">
                <Heart className={`w-3 h-3 mr-1 ${likeData?.isLiked ? 'fill-current' : ''}`} />
                {likeData?.likeCount || 0}
              </Badge>
              <Badge className="bg-white/90 text-blue-600 text-xs">
                <Copy className="w-3 h-3 mr-1" />
                {workout.copy_count || 0}
              </Badge>
              <Badge className="bg-white/90 text-purple-600 text-xs">
                <Wand2 className="w-3 h-3 mr-1" />
                {workout.ai_inspo_count || 0}
              </Badge>
              <Badge className="bg-white/90 text-slate-600 text-xs">
                <Share2 className="w-3 h-3 mr-1" />
                {workout.share_count || 0}
              </Badge>
            </div>

            {/* Title on image */}
            <div className="absolute bottom-2 left-3 right-3">
              <h3 className="text-white font-semibold text-lg truncate drop-shadow-md">
                {workout.name}
              </h3>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 flex-1 flex flex-col">
            {workout.description && (
              <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex-shrink-0">
                {workout.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 flex-wrap mb-3 flex-shrink-0">
              {workout.category && (
                <Badge variant="outline" className="text-xs capitalize">
                  {workout.category}
                </Badge>
              )}
              {workout.difficulty && (
                <Badge variant="outline" className="text-xs capitalize">
                  {workout.difficulty}
                </Badge>
              )}
              {workout.duration_minutes && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {workout.duration_minutes}m
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-4 h-4" />
                  {exerciseCount}
                </span>
                <span>{totalSets} sets</span>
              </div>
              
              {onCopy && onAIInspire && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                    onClick={handleAIInspire}
                  >
                    <Sparkles className="w-4 h-4" />
                  </Button>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ShareButton workout={workout} variant="icon" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}