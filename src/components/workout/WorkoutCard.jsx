import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dumbbell, ChevronRight, Clock, Users, Copy, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WorkoutCard({ workout, isOwner, showCommunityBadge, onCopy, currentUserEmail }) {
  const totalSets = workout.exercises?.reduce((acc, ex) => acc + (ex.sets || 0), 0) || 0;
  const exerciseCount = workout.exercises?.length || 0;

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onCopy?.();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link to={createPageUrl(`WorkoutDetail?id=${workout.id}`)}>
        <Card 
          className="relative overflow-hidden cursor-pointer group border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <div 
            className="absolute inset-0 opacity-10"
            style={{ backgroundColor: workout.color || '#6366f1' }}
          />
          <div 
            className="absolute left-0 top-0 bottom-0 w-1.5"
            style={{ backgroundColor: workout.color || '#6366f1' }}
          />
          
          <div className="relative p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-lg font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-none">
                      {workout.name}
                    </h3>
                    {showCommunityBadge && (
                      <Badge variant="secondary" className={`text-xs flex-shrink-0 ${
                        isOwner 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-purple-100 text-purple-700'
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
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs flex-shrink-0">
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Badge>
                    )}
                  </div>
                <p className="text-sm text-slate-500 line-clamp-1 mb-3">
                  {workout.description}
                </p>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium">
                    <Dumbbell className="w-3 h-3 mr-1" />
                    {exerciseCount} exercises
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium">
                    {totalSets} sets
                  </Badge>
                  {workout.default_rest && (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium">
                      <Clock className="w-3 h-3 mr-1" />
                      {workout.default_rest}s rest
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {showCommunityBadge && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleCopy}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                )}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}