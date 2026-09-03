import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from 'lucide-react';
import { format } from 'date-fns';

export default function MeasurementForm({ bodyParts, editingEntry, onSave, onCancel }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState('');
  const [measurements, setMeasurements] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setDate(editingEntry.date || today);
      setWeight(editingEntry.weight_kg ? String(editingEntry.weight_kg) : '');
      setMeasurements(editingEntry.measurements || {});
    } else {
      setDate(today);
      setWeight('');
      setMeasurements({});
    }
  }, [editingEntry]);

  const handleMeasurementChange = (part, value) => {
    setMeasurements(prev => ({ ...prev, [part]: value ? parseFloat(value) : null }));
  };

  const hasData = (weight && parseFloat(weight) > 0) ||
    Object.values(measurements).some(v => v != null && v > 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        date,
        weight_kg: weight ? parseFloat(weight) : null,
        measurements: Object.fromEntries(
          Object.entries(measurements).filter(([_, v]) => v != null && v > 0)
        ),
      };
      await onSave(data, editingEntry?.id);
      if (!editingEntry) {
        setWeight('');
        setMeasurements({});
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">
            {editingEntry ? 'Edit Entry' : 'Log Measurements'}
          </h3>
          {editingEntry && (
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-500">Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 h-9" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Weight (kg)</Label>
            <Input type="number" step="0.1" placeholder="75.5" value={weight}
              onChange={e => setWeight(e.target.value)} className="mt-1 h-9" />
          </div>
        </div>

        {bodyParts.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {bodyParts.map(part => (
              <div key={part}>
                <Label className="text-xs text-slate-500">{part} (cm)</Label>
                <Input type="number" step="0.1" placeholder="0"
                  value={measurements[part] || ''}
                  onChange={e => handleMeasurementChange(part, e.target.value)}
                  className="mt-1 h-9" />
              </div>
            ))}
          </div>
        )}

        <Button className="w-full" disabled={!hasData || saving} onClick={handleSave}>
          {saving ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
        </Button>
      </CardContent>
    </Card>
  );
}