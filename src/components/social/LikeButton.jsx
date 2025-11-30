import React from 'react';
import { Button } from "@/components/ui/button";
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function LikeButton({ isLiked, likeCount, onToggle, loading, size = 'default' }) {
  const isSmall = size === 'sm';
  
  return (
    <Button
      variant="ghost"
      size={isSmall ? 'sm' : 'default'}
      onClick={onToggle}
      disabled={loading}
      className={cn(
        "gap-1.5 transition-colors",
        isLiked ? "text-red-500 hover:text-red-600" : "text-slate-500 hover:text-red-500"
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isLiked ? 'liked' : 'not-liked'}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          <Heart 
            className={cn(
              isSmall ? "w-4 h-4" : "w-5 h-5",
              isLiked && "fill-current"
            )} 
          />
        </motion.div>
      </AnimatePresence>
      {likeCount > 0 && (
        <span className={cn("font-medium", isSmall ? "text-xs" : "text-sm")}>
          {likeCount}
        </span>
      )}
    </Button>
  );
}