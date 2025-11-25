import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, ChevronRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WorkoutCard({ workout, onClick }) {
  const totalSets = workout.exercises?.reduce((acc, ex) => acc + (ex.sets || 0), 0) || 0;
  const exerciseCount = workout.exercises?.length || 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card 
        className="relative overflow-hidden cursor-pointer group border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
        onClick={onClick}
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
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {workout.name}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-1 mb-3">
                {workout.description}
              </p>
              
              <div className="flex items-center gap-3">
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
            
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}