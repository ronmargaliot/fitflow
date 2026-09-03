import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BodyPartManager({ open, onClose, bodyParts, onSaved }) {
  const [parts, setParts] = useState(bodyParts || []);
  const [newPart, setNewPart] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setParts(bodyParts || []);
  }, [bodyParts, open]);

  const handleAdd = () => {
    const trimmed = newPart.trim();
    if (!trimmed) return;
    if (parts.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('That body part already exists');
      return;
    }
    setParts([...parts, trimmed]);
    setNewPart('');
  };

  const handleRename = (idx, value) => {
    const next = [...parts];
    next[idx] = value;
    setParts(next);
  };

  const handleRemove = (idx) => {
    setParts(parts.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleaned = parts.map(p => p.trim()).filter(Boolean);
      await base44.auth.updateMe({ body_parts: cleaned });
      onSaved(cleaned);
      toast.success('Body parts updated');
      onClose();
    } catch {
      toast.error('Failed to save body parts');
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Body Parts</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Track circumference for any body part. Removing a part hides it from the form but keeps historical data.
          </p>

          <div className="flex gap-2">
            <Input placeholder="e.g. Chest, Left Arm" value={newPart}
              onChange={e => setNewPart(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <Button onClick={handleAdd} size="icon" className="flex-shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {parts.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No body parts yet. Add one above.</p>
            )}
            {parts.map((part, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input value={part} onChange={e => handleRename(idx, e.target.value)} className="flex-1" />
                <Button variant="ghost" size="icon" onClick={() => handleRemove(idx)}
                  className="text-red-500 hover:text-red-600 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}