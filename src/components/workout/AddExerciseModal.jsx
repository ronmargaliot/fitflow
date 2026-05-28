import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Plus, Timer, Hash, Search, Layers, X } from 'lucide-react';
import ImageUpload from '@/components/common/ImageUpload';
import VideoSearchModal from './VideoSearchModal';

export default function AddExerciseModal({ open, onClose, onAdd, defaultRest }) {
  const [showVideoSearch, setShowVideoSearch] = useState(false);
  const [searchingSubIdx, setSearchingSubIdx] = useState(null);
  const [exercise, setExercise] = useState({
    name: '',
    exercise_type: 'reps',
    sets: 3,
    reps: '8',
    duration_seconds: 30,
    rest: defaultRest || 90,
    weight: 0,
    notes: '',
    demo_image: '',
    demo_video: '',
    superset_exercises: []
  });
  
  const handleVideoSelect = React.useCallback((url) => {
    if (searchingSubIdx !== null) {
      setExercise(prev => {
        const newSubs = [...(prev.superset_exercises || [])];
        newSubs[searchingSubIdx] = { ...newSubs[searchingSubIdx], demo_video: url };
        return { ...prev, superset_exercises: newSubs };
      });
      setSearchingSubIdx(null);
    } else {
      setExercise(prev => ({ ...prev, demo_video: url }));
    }
    setShowVideoSearch(false);
  }, [searchingSubIdx]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!exercise.name.trim()) return;
    
    onAdd({
      ...exercise,
      id: `custom_${Date.now()}`
    });
    
    setExercise({
      name: '',
      exercise_type: 'reps',
      sets: 3,
      reps: '8',
      duration_seconds: 30,
      rest: defaultRest || 90,
      weight: 0,
      notes: '',
      demo_image: '',
      demo_video: ''
    });
    onClose();
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Exercise</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div>
            <Label htmlFor="name">Exercise Name</Label>
            <Input
              id="name"
              value={exercise.name}
              onChange={(e) => setExercise({ ...exercise, name: e.target.value })}
              placeholder="e.g., Pull-Ups"
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label className="mb-2 block">Exercise Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={exercise.exercise_type === 'reps' ? 'default' : 'outline'}
                className={`flex items-center justify-center gap-2 ${
                  exercise.exercise_type === 'reps' 
                    ? 'bg-slate-900 text-white hover:bg-slate-800' 
                    : 'bg-white hover:bg-slate-50'
                }`}
                onClick={() => setExercise({ ...exercise, exercise_type: 'reps', superset_exercises: [] })}
              >
                <Hash className="w-4 h-4" />
                Reps
              </Button>
              <Button
                type="button"
                variant={exercise.exercise_type === 'time' ? 'default' : 'outline'}
                className={`flex items-center justify-center gap-2 ${
                  exercise.exercise_type === 'time' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-white hover:bg-slate-50'
                }`}
                onClick={() => setExercise({ ...exercise, exercise_type: 'time', superset_exercises: [] })}
              >
                <Timer className="w-4 h-4" />
                Time
              </Button>
              <Button
                type="button"
                variant={exercise.exercise_type === 'superset' ? 'default' : 'outline'}
                className={`flex items-center justify-center gap-2 ${
                  exercise.exercise_type === 'superset' 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-white hover:bg-slate-50'
                }`}
                onClick={() => setExercise({ ...exercise, exercise_type: 'superset', superset_exercises: [
                  { id: `sub_${Date.now()}_1`, name: '', exercise_type: 'reps', reps: '8', duration_seconds: 30, weight: 0, notes: '' }
                ] })}
              >
                <Layers className="w-4 h-4" />
                Superset
              </Button>
            </div>
          </div>

          {exercise.exercise_type === 'superset' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Superset Exercises (no rest between)</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setExercise({
                    ...exercise,
                    superset_exercises: [
                      ...exercise.superset_exercises,
                      { id: `sub_${Date.now()}_${exercise.superset_exercises.length}`, name: '', exercise_type: 'reps', reps: '8', duration_seconds: 30, weight: 0, notes: '' }
                    ]
                  })}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Exercise
                </Button>
              </div>
              
              {exercise.superset_exercises.map((subEx, idx) => (
                <div key={subEx.id} className="border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">#{idx + 1}</span>
                    <Input
                      placeholder="Exercise name"
                      value={subEx.name}
                      onChange={(e) => {
                        const newSubs = [...exercise.superset_exercises];
                        newSubs[idx] = { ...subEx, name: e.target.value };
                        setExercise({ ...exercise, superset_exercises: newSubs });
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setExercise({
                          ...exercise,
                          superset_exercises: exercise.superset_exercises.filter((_, i) => i !== idx)
                        });
                      }}
                      disabled={exercise.superset_exercises.length <= 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={subEx.exercise_type === 'reps' ? 'default' : 'outline'}
                      onClick={() => {
                        const newSubs = [...exercise.superset_exercises];
                        newSubs[idx] = { ...subEx, exercise_type: 'reps' };
                        setExercise({ ...exercise, superset_exercises: newSubs });
                      }}
                    >
                      Reps
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={subEx.exercise_type === 'time' ? 'default' : 'outline'}
                      onClick={() => {
                        const newSubs = [...exercise.superset_exercises];
                        newSubs[idx] = { ...subEx, exercise_type: 'time' };
                        setExercise({ ...exercise, superset_exercises: newSubs });
                      }}
                    >
                      Time
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {subEx.exercise_type === 'reps' ? (
                      <div>
                        <Label className="text-xs">Reps</Label>
                        <Input
                          value={subEx.reps}
                          onChange={(e) => {
                            const newSubs = [...exercise.superset_exercises];
                            newSubs[idx] = { ...subEx, reps: e.target.value };
                            setExercise({ ...exercise, superset_exercises: newSubs });
                          }}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs">Duration (s)</Label>
                        <Input
                          type="number"
                          value={subEx.duration_seconds}
                          onChange={(e) => {
                            const newSubs = [...exercise.superset_exercises];
                            newSubs[idx] = { ...subEx, duration_seconds: parseInt(e.target.value) || 30 };
                            setExercise({ ...exercise, superset_exercises: newSubs });
                          }}
                        />
                      </div>
                    )}
                    <div>
                      <Label className="text-xs">Weight (kg)</Label>
                      <Input
                        type="number"
                        value={subEx.weight || ''}
                        onChange={(e) => {
                          const newSubs = [...exercise.superset_exercises];
                          newSubs[idx] = { ...subEx, weight: parseFloat(e.target.value) || 0 };
                          setExercise({ ...exercise, superset_exercises: newSubs });
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Input
                      value={subEx.notes || ''}
                      placeholder="Optional notes"
                      onChange={(e) => {
                        const newSubs = [...exercise.superset_exercises];
                        newSubs[idx] = { ...subEx, notes: e.target.value };
                        setExercise({ ...exercise, superset_exercises: newSubs });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">YouTube Video URL</Label>
                    <div className="flex gap-1">
                      <Input
                        value={subEx.demo_video || ''}
                        placeholder="https://youtube.com/..."
                        onChange={(e) => {
                          const newSubs = [...exercise.superset_exercises];
                          newSubs[idx] = { ...subEx, demo_video: e.target.value };
                          setExercise({ ...exercise, superset_exercises: newSubs });
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="px-2 flex-shrink-0"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSearchingSubIdx(idx);
                          setShowVideoSearch(true);
                        }}
                        disabled={!subEx.name}
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sets">Sets (entire superset)</Label>
                  <Input
                    id="sets"
                    type="number"
                    value={exercise.sets}
                    onChange={(e) => setExercise({ ...exercise, sets: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="rest">Rest (s) - after superset</Label>
                  <Input
                    id="rest"
                    type="number"
                    value={exercise.rest}
                    onChange={(e) => setExercise({ ...exercise, rest: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="sets">Sets</Label>
                  <Input
                    id="sets"
                    type="number"
                    value={exercise.sets}
                    onChange={(e) => setExercise({ ...exercise, sets: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                {exercise.exercise_type === 'reps' ? (
                  <div>
                    <Label htmlFor="reps">Reps</Label>
                    <Input
                      id="reps"
                      value={exercise.reps}
                      onChange={(e) => setExercise({ ...exercise, reps: e.target.value })}
                      className="mt-1"
                      placeholder="8"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="duration">Duration (s)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={exercise.duration_seconds}
                      onChange={(e) => setExercise({ ...exercise, duration_seconds: parseInt(e.target.value) || 30 })}
                      className="mt-1"
                      placeholder="30"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="rest">Rest (s)</Label>
                  <Input
                    id="rest"
                    type="number"
                    value={exercise.rest}
                    onChange={(e) => setExercise({ ...exercise, rest: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="weight">Weight (kg) - optional</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={exercise.weight || ''}
                    onChange={(e) => setExercise({ ...exercise, weight: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="rest_after">Rest After Exercise (s)</Label>
                  <Input
                    id="rest_after"
                    type="number"
                    value={exercise.rest_after_exercise || ''}
                    onChange={(e) => setExercise({ ...exercise, rest_after_exercise: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                    placeholder="120"
                  />
                </div>
              </div>
            </>
          )}
          
          <div>
            <Label htmlFor="notes">Notes - optional</Label>
            <Textarea
              id="notes"
              value={exercise.notes}
              onChange={(e) => setExercise({ ...exercise, notes: e.target.value })}
              className="mt-1"
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="video">YouTube Video URL - optional</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="video"
                value={exercise.demo_video}
                onChange={(e) => setExercise({ ...exercise, demo_video: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowVideoSearch(true);
                }}
                disabled={!exercise.name}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Paste URL or search for a video</p>
          </div>
          
          <DialogFooter className="pt-2 sticky bottom-0 bg-white">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    
    {showVideoSearch && (
      <VideoSearchModal
        open={true}
        onClose={() => { setShowVideoSearch(false); setSearchingSubIdx(null); }}
        onSelect={handleVideoSelect}
        exerciseName={
          searchingSubIdx !== null
            ? (exercise.superset_exercises?.[searchingSubIdx]?.name || exercise.name)
            : exercise.name
        }
      />
    )}
    </>
  );
}