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
import { Plus } from 'lucide-react';
import ImageUpload from '@/components/common/ImageUpload';

export default function AddExerciseModal({ open, onClose, onAdd, defaultRest }) {
  const [exercise, setExercise] = useState({
    name: '',
    sets: 3,
    reps: '8',
    rest: defaultRest || 90,
    weight: 0,
    notes: '',
    demo_image: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!exercise.name.trim()) return;
    
    onAdd({
      ...exercise,
      id: `custom_${Date.now()}`
    });
    
    setExercise({
      name: '',
      sets: 3,
      reps: '8',
      rest: defaultRest || 90,
      weight: 0,
      notes: '',
      demo_image: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Exercise</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div>
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                value={exercise.reps}
                onChange={(e) => setExercise({ ...exercise, reps: e.target.value })}
                className="mt-1"
                placeholder="8 or 30s"
              />
            </div>
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
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="notes">Notes - optional</Label>
              <Textarea
                id="notes"
                value={exercise.notes}
                onChange={(e) => setExercise({ ...exercise, notes: e.target.value })}
                className="mt-1"
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
            <div>
              <Label>Demo Image - optional</Label>
              <ImageUpload
                value={exercise.demo_image}
                onChange={(url) => setExercise({ ...exercise, demo_image: url })}
                className="mt-1 h-20"
                placeholder="Add demo"
              />
            </div>
          </div>
          
          <DialogFooter>
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
  );
}