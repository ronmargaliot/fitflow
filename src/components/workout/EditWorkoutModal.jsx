import React, { useState, useEffect } from 'react';
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
import { Check } from 'lucide-react';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
];

export default function EditWorkoutModal({ open, onClose, workout, onSave }) {
  const [data, setData] = useState({
    name: '',
    description: '',
    default_rest: 90,
    color: '#6366f1'
  });

  useEffect(() => {
    if (workout) {
      setData({
        name: workout.name || '',
        description: workout.description || '',
        default_rest: workout.default_rest || 90,
        color: workout.color || '#6366f1'
      });
    }
  }, [workout]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!data.name.trim()) return;
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {workout ? 'Edit Workout' : 'Create New Workout'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Workout Name</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="e.g., Pull Day"
              className="mt-1"
              autoFocus
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              className="mt-1"
              placeholder="Describe your workout..."
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="rest">Default Rest Time (seconds)</Label>
            <Input
              id="rest"
              type="number"
              value={data.default_rest}
              onChange={(e) => setData({ ...data, default_rest: parseInt(e.target.value) || 90 })}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Theme Color</Label>
            <div className="flex gap-2 mt-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setData({ ...data, color })}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                >
                  {data.color === color && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
              {workout ? 'Save Changes' : 'Create Workout'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}