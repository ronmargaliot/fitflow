import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Check, X, GripVertical, Clock, Weight, MessageSquare, Timer, Hash, Play, Search, Layers, Plus } from 'lucide-react';
import ExerciseDemoModal from './ExerciseDemoModal';
import VideoSearchModal from './VideoSearchModal';
import { motion } from 'framer-motion';
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
  const [showVideoSearch, setShowVideoSearch] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const handleVideoSelect = React.useCallback((url) => {
    setEditData(prev => ({ ...prev, demo_video: url }));
    setShowVideoSearch(false);
  }, []);

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
    const isSuperset = editData.exercise_type === 'superset';
    
    return (
      <Card className="p-4 border-2 border-slate-300 bg-slate-50">
        <div className="space-y-3">
          {!isSuperset && (
            <Input
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder="Exercise name"
              className="font-medium"
            />
          )}
          
          {/* Exercise Type Toggle */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={!isTimeBased && !isSuperset ? 'default' : 'outline'}
              size="sm"
              className={`flex items-center justify-center gap-2 ${
                !isTimeBased && !isSuperset
                  ? 'bg-slate-900 text-white hover:bg-slate-800' 
                  : 'bg-white hover:bg-slate-50'
              }`}
              onClick={() => setEditData({ ...editData, exercise_type: 'reps', superset_exercises: undefined })}
            >
              <Hash className="w-4 h-4" />
              Reps
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
              onClick={() => setEditData({ ...editData, exercise_type: 'time', superset_exercises: undefined })}
            >
              <Timer className="w-4 h-4" />
              Time
            </Button>
            <Button
              type="button"
              variant={isSuperset ? 'default' : 'outline'}
              size="sm"
              className={`flex items-center justify-center gap-2 ${
                isSuperset
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-white hover:bg-slate-50'
              }`}
              onClick={() => setEditData({ 
                ...editData, 
                exercise_type: 'superset',
                name: 'Superset',
                superset_exercises: editData.superset_exercises || [
                  { id: `sub_${Date.now()}_1`, name: '', exercise_type: 'reps', reps: '8', duration_seconds: 30, weight: 0, notes: '' }
                ]
              })}
            >
              <Layers className="w-4 h-4" />
              Superset
            </Button>
          </div>
          
          {isSuperset ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Superset Exercises</label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditData({
                    ...editData,
                    superset_exercises: [
                      ...(editData.superset_exercises || []),
                      { id: `sub_${Date.now()}`, name: '', exercise_type: 'reps', reps: '8', duration_seconds: 30, weight: 0, notes: '' }
                    ]
                  })}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              
              {(editData.superset_exercises || []).map((subEx, idx) => (
                <div key={subEx.id} className="border border-slate-300 rounded p-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">#{idx + 1}</span>
                    <Input
                      placeholder="Exercise name"
                      value={subEx.name}
                      onChange={(e) => {
                        const newSubs = [...(editData.superset_exercises || [])];
                        newSubs[idx] = { ...subEx, name: e.target.value };
                        setEditData({ ...editData, superset_exercises: newSubs });
                      }}
                      className="flex-1 h-8"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditData({
                          ...editData,
                          superset_exercises: (editData.superset_exercises || []).filter((_, i) => i !== idx)
                        });
                      }}
                      disabled={(editData.superset_exercises || []).length <= 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={subEx.exercise_type === 'reps' ? 'default' : 'outline'}
                      className="h-7 text-xs"
                      onClick={() => {
                        const newSubs = [...(editData.superset_exercises || [])];
                        newSubs[idx] = { ...subEx, exercise_type: 'reps' };
                        setEditData({ ...editData, superset_exercises: newSubs });
                      }}
                    >
                      Reps
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={subEx.exercise_type === 'time' ? 'default' : 'outline'}
                      className="h-7 text-xs"
                      onClick={() => {
                        const newSubs = [...(editData.superset_exercises || [])];
                        newSubs[idx] = { ...subEx, exercise_type: 'time' };
                        setEditData({ ...editData, superset_exercises: newSubs });
                      }}
                    >
                      Time
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {subEx.exercise_type === 'reps' ? (
                      <div>
                        <label className="text-xs text-slate-500">Reps</label>
                        <Input
                          className="h-8"
                          value={subEx.reps}
                          onChange={(e) => {
                            const newSubs = [...(editData.superset_exercises || [])];
                            newSubs[idx] = { ...subEx, reps: e.target.value };
                            setEditData({ ...editData, superset_exercises: newSubs });
                          }}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs text-slate-500">Duration (s)</label>
                        <Input
                          className="h-8"
                          type="number"
                          value={subEx.duration_seconds}
                          onChange={(e) => {
                            const newSubs = [...(editData.superset_exercises || [])];
                            newSubs[idx] = { ...subEx, duration_seconds: parseInt(e.target.value) || 30 };
                            setEditData({ ...editData, superset_exercises: newSubs });
                          }}
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-slate-500">Weight (kg)</label>
                      <Input
                        className="h-8"
                        type="number"
                        value={subEx.weight || ''}
                        onChange={(e) => {
                          const newSubs = [...(editData.superset_exercises || [])];
                          newSubs[idx] = { ...subEx, weight: parseFloat(e.target.value) || 0 };
                          setEditData({ ...editData, superset_exercises: newSubs });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Sets (entire superset)</label>
                  <Input
                    type="number"
                    value={editData.sets}
                    onChange={(e) => setEditData({ ...editData, sets: parseInt(e.target.value) || 0 })}
                    placeholder="Sets"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Rest (s) - after superset</label>
                  <Input
                    type="number"
                    value={editData.rest}
                    onChange={(e) => setEditData({ ...editData, rest: parseInt(e.target.value) || 0 })}
                    placeholder="Rest"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
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
                <div className="flex gap-2">
                  <Input
                    value={editData.demo_video || ''}
                    onChange={(e) => setEditData({ ...editData, demo_video: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowVideoSearch(true);
                    }}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
          
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
    <>
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
                {exercise.exercise_type === 'superset' ? (
                  <>
                    <Badge className="bg-purple-600 text-white">
                      <Layers className="w-3 h-3 mr-1" />
                      {exercise.sets} sets
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {(exercise.superset_exercises || []).map((subEx, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-purple-300 text-purple-700">
                          {subEx.name}: {subEx.exercise_type === 'time' ? `${subEx.duration_seconds}s` : `${subEx.reps} reps`}
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : (
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
                )}
                
                {exercise.rest && (
                  <Badge variant="outline" className="text-slate-600 border-slate-300">
                    <Clock className="w-3 h-3 mr-1" />
                    {exercise.rest}s
                  </Badge>
                )}
                
                {exercise.weight > 0 && exercise.exercise_type !== 'superset' && (
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
                <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
                    onClick={() => setShowDeleteDialog(true)}
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{exercise.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={onDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </motion.div>

      {showVideoSearch && (
      <VideoSearchModal
        open={true}
        onClose={() => setShowVideoSearch(false)}
        onSelect={handleVideoSelect}
        exerciseName={editData.name}
      />
      )}
      </>
      );
      }