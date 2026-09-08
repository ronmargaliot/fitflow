import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AnnotationManager({ annotations }) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [label, setLabel] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BodyAnnotation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyAnnotations'] });
      setLabel('');
      toast.success('Annotation added');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BodyAnnotation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyAnnotations'] });
      toast.success('Annotation removed');
    },
  });

  const handleAdd = () => {
    if (!date || !label.trim()) return;
    createMutation.mutate({ date, label: label.trim() });
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Annotations</h3>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="sm:w-auto" />
          <Input
            placeholder="Label (e.g. Diet change, New program)"
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Button size="sm" onClick={handleAdd} disabled={!label.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {annotations.length === 0 ? (
          <p className="text-xs text-slate-400">Mark events like diet changes, new programs, or illness to see their impact on your progress.</p>
        ) : (
          <div className="space-y-1.5">
            {[...annotations].sort((a, b) => new Date(b.date) - new Date(a.date)).map(a => (
              <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{format(new Date(a.date), 'MMM d, yy')}</span>
                  <span className="text-sm text-slate-700">{a.label}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(a.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}