import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Undo2, Check } from 'lucide-react';

export default function UndoToast({ 
  show, 
  message, 
  onUndo, 
  onDismiss,
  duration = 5000 
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!show) {
      setProgress(100);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss?.();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [show, duration, onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-32 left-4 right-4 z-30 flex justify-center"
        >
          <div className="bg-slate-700 rounded-xl shadow-xl overflow-hidden max-w-sm w-full">
            <div className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">{message}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/20"
                onClick={onUndo}
              >
                <Undo2 className="w-4 h-4 mr-1" />
                Undo
              </Button>
            </div>
            <div className="h-1 bg-slate-600">
              <motion.div 
                className="h-full bg-amber-400"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}