import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Check, X, GripVertical, Clock, Weight, MessageSquare, Timer, Hash, Play } from 'lucide-react';
import ExerciseDemoModal from './ExerciseDemoModal';
import { motion } from 'framer-motion';

export default function ExerciseItem({ 
  exercise, 
  index, 
  onUpdate, 
  onDelete, 
  dragHandleProps,
  workoutColor,
  readOnly = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(exercise);
  const [showDemo, setShowDemo] = useState(false);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(exercise);
    setIsEditing(false);
  };

  if (isEditing) {
    const isTimeBased = editData.exercise_type === 'time';
    
    return (
      <Card className="p-4 border-2 border-slate-300 bg-slate-50">
        <div className="space-y-3">
          <Input
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            placeholder="Exercise name"
            className="font-medium"
          />
          
          {/* Exercise Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={!isTimeBased ? 'default' : 'outline'}
              size="sm"
              className={`flex items-center justify-center gap-2 ${
                !isTimeBased 
                  ? 'bg-slate-900 text-white hover:bg-slate-800' 
                  : 'bg-white hover:bg-slate-50'
              }`}
              onClick={() => setEditData({ ...editData, exercise_type: 'reps' })}
            >
              <Hash className="w-4 h-4" />
              Rep-based
            </Button>
            <Button
              type="button"
              variant={isTimeBased ? 'default' : 'outline'}
              size="sm"
              className={`flex items-center justify-center gap-2 ${
                isTimeBased 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-white hover:bg-slate-50'
              }`}
              onClick={() => setEditData({ ...editData, exercise_type: 'time' })}
            >
              <Timer className="w-4 h-4" />
              Time-based
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Sets</label>
              <Input
                type="number"
                value={editData.sets}
                onChange={(e) => setEditData({ ...editData, sets: parseInt(e.target.value) || 0 })}
                placeholder="Sets"
              />
            </div>
            {isTimeBased ? (
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Duration (s)</label>
                <Input
                  type="number"
                  value={editData.duration_seconds || 30}
                  onChange={(e) => setEditData({ ...editData, duration_seconds: parseInt(e.target.value) || 30 })}
                  placeholder="30"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Reps</label>
                <Input
                  value={editData.reps}
                  onChange={(e) => setEditData({ ...editData, reps: e.target.value })}
                  placeholder="Reps"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Rest (s)</label>
              <Input
                type="number"
                value={editData.rest}
                onChange={(e) => setEditData({ ...editData, rest: parseInt(e.target.value) || 0 })}
                placeholder="Rest"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Weight (kg)</label>
              <Input
                type="number"
                value={editData.weight || ''}
                onChange={(e) => setEditData({ ...editData, weight: parseFloat(e.target.value) || 0 })}
                placeholder="Weight"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Notes</label>
              <Input
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                placeholder="Notes"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs text-slate-500 mb-1 block">YouTube Video URL</label>
            <Input
              value={editData.demo_video || ''}
              onChange={(e) => setEditData({ ...editData, demo_video: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="bg-slate-900 hover:bg-slate-800">
              <Check className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group relative overflow-hidden border border-slate-200 hover:border-slate-300 transition-all duration-200">
        <div 
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: workoutColor || '#6366f1' }}
        />
        
        <div className="p-4 pl-5">
          <div className="flex items-center gap-3">
              {dragHandleProps ? (
                <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors">
                  <GripVertical className="w-5 h-5" />
                </div>
              ) : (
                <div className="text-slate-200">
                  <GripVertical className="w-5 h-5" />
                </div>
              )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  #{index + 1}
                </span>
                <h4 className="font-semibold text-slate-900 truncate">
                  {exercise.name}
                </h4>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDemo(true);
                  }}
                  className="flex items-center gap-1 group/demo"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover/demo:bg-indigo-100 transition-colors">
                    <Play className="w-3 h-3 text-slate-500 group-hover/demo:text-indigo-600" />
                  </div>
                  <Badge className={`${exercise.exercise_type === 'time' ? 'bg-green-600' : 'bg-slate-900'} text-white hover:opacity-90`}>
                    {exercise.sets} × {exercise.exercise_type === 'time' ? `${exercise.duration_seconds || 30}s` : exercise.reps}
                  </Badge>
                </button>
                
                {exercise.rest && (
                  <Badge variant="outline" className="text-slate-600 border-slate-300">
                    <Clock className="w-3 h-3 mr-1" />
                    {exercise.rest}s
                  </Badge>
                )}
                
                {exercise.weight > 0 && (
                  <Badge variant="outline" className="text-slate-600 border-slate-300">
                    <Weight className="w-3 h-3 mr-1" />
                    {exercise.weight}kg
                  </Badge>
                )}
                
                {exercise.notes && (
                  <Badge variant="outline" className="text-slate-500 border-slate-200 max-w-[200px] truncate">
                    <MessageSquare className="w-3 h-3 mr-1 flex-shrink-0" />
                    {exercise.notes}
                  </Badge>
                )}
              </div>
            </div>
            
            {!readOnly && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-slate-700"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-red-600"
                    onClick={onDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
          </div>
        </div>
      </Card>
      
      <ExerciseDemoModal
        open={showDemo}
        onClose={() => setShowDemo(false)}
        exercise={exercise}
      />
    </motion.div>
  );
}