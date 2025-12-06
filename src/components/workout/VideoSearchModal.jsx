import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Youtube } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VideoSearchModal({ open, onClose, onSelect, exerciseName }) {
  const [prompt, setPrompt] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [videos, setVideos] = useState([]);

  const handleSearch = async () => {
    if (!prompt.trim()) return;
    
    setIsSearching(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Find 3 high-quality YouTube videos demonstrating the exercise: "${exerciseName}". ${prompt}
        
Return ONLY a JSON array with this exact structure:
[
  {
    "title": "video title",
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "description": "brief description"
  }
]`,
        response_json_schema: {
          type: "object",
          properties: {
            videos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        },
        add_context_from_internet: true
      });
      
      setVideos(result.videos || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (video) => {
    onSelect(video.url);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            Find Exercise Video
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="search">Exercise: {exerciseName}</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="search"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., beginner tutorial, proper form, common mistakes"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Add guidance to help find the right video (optional)
            </p>
          </div>

          {videos.length > 0 && (
            <div className="space-y-3">
              <Label>Select a video:</Label>
              {videos.map((video, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => handleSelect(video)}
                >
                  <div className="flex gap-3">
                    <div className="w-32 h-20 bg-slate-200 rounded flex items-center justify-center flex-shrink-0">
                      <Youtube className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">{video.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {video.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}