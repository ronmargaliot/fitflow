import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

export default function MeasurementList({ entries, onEdit, onDelete }) {
  const [deleteId, setDeleteId] = useState(null);

  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <>
      <div className="space-y-2">
        {sorted.map(entry => (
          <Card key={entry.id} className="border-slate-200">
            <CardContent className="p-3 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {format(new Date(entry.date), 'MMM d, yyyy')}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  {entry.weight_kg != null && entry.weight_kg > 0 && (
                    <span className="text-xs text-slate-500">{entry.weight_kg} kg</span>
                  )}
                  {entry.measurements && Object.entries(entry.measurements).map(([part, val]) => (
                    val != null && val > 0 && (
                      <span key={part} className="text-xs text-slate-500">{part}: {val} cm</span>
                    )
                  ))}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600"
                  onClick={() => setDeleteId(entry.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={setDeleteId}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this measurement entry.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => { onDelete(deleteId); setDeleteId(null); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}