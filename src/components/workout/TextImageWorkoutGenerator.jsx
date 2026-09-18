import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, FileText, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";

export default function TextImageWorkoutGenerator({ open, onClose, onGenerate }) {
  const [generating, setGenerating] = useState(false);
  const [workoutText, setWorkoutText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'text/plain', 'application/pdf'];
    const validFiles = files.filter(f => validTypes.includes(f.type));
    if (validFiles.length < files.length) {
      toast.error('Some files skipped — only PNG, JPG, PDF, or TXT allowed.');
    }
    if (validFiles.length === 0) return;

    try {
      const uploaded = await Promise.all(
        validFiles.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return { file, url: file_url, name: file.name, type: file.type };
        })
      );
      setUploadedFiles(prev => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload file(s)');
      console.error(error);
    }
    e.target.value = '';
  };

  const handleRemoveFile = (idx) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGenerate = async () => {
    if (!workoutText.trim() && uploadedFiles.length === 0) {
      toast.error('Please provide workout text or upload a file');
      return;
    }

    setGenerating(true);

    try {
      let extractedData;

      // If files are uploaded, send all images to the LLM at once
      if (uploadedFiles.length > 0) {
        const fileUrls = uploadedFiles.map(f => f.url);
        const prompt = `Analyze the following workout plan screenshot(s) and extract ALL exercises from every image.${workoutText.trim() ? ` Also consider this additional context: "${workoutText.trim()}"` : ''}

Extract the workout name and a complete list of all exercises with their sets, reps, rest periods, and any other details visible across all images. Merge duplicates if the same exercise appears in multiple screenshots.`;

        extractedData = await base44.integrations.Core.InvokeLLM({
          prompt,
          file_urls: fileUrls,
          response_json_schema: {
            type: 'object',
            properties: {
              workout_name: { type: 'string' },
              exercises: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    sets: { type: 'number' },
                    reps: { type: 'string' },
                    rest: { type: 'number' },
                    weight: { type: 'number' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          }
        });
      } else {
        // Use text input with LLM
        const prompt = `Parse the following workout text and extract structured workout data.

Workout text:
${workoutText}

Extract the workout name and list of exercises with their sets, reps, rest periods, and any other details.
Return structured data that can be used to create a workout.`;

        extractedData = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              workout_name: { type: 'string' },
              exercises: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    sets: { type: 'number' },
                    reps: { type: 'string' },
                    rest: { type: 'number' },
                    weight: { type: 'number' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          }
        });
      }

      // Fetch YouTube demo links for all exercises in parallel via LLM internet search
      const fetchVideoUrl = async (exerciseName) => {
        try {
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Find a real YouTube video URL demonstrating the exercise "${exerciseName}" with proper form. Return ONLY the full YouTube URL (e.g. https://www.youtube.com/watch?v=XXXXX). No other text.`,
            add_context_from_internet: true
          });
          const match = result && result.match(/https:\/\/www\.youtube\.com\/watch\?v=[\w-]+/);
          return match ? match[0] : '';
        } catch {
          return '';
        }
      };

      const exerciseList = extractedData.exercises || [];
      const videoUrls = await Promise.all(exerciseList.map(ex => fetchVideoUrl(ex.name)));

      const exercises = exerciseList.map((ex, idx) => ({
        id: `ex_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
        name: ex.name,
        sets: ex.sets || 3,
        exercise_type: 'reps',
        reps: ex.reps || '10',
        rest: ex.rest || 60,
        rest_after_exercise: ex.rest_after_exercise || 120,
        weight: ex.weight || 0,
        notes: ex.notes || '',
        demo_video: videoUrls[idx] || ''
      }));

      const workoutData = {
        name: extractedData.workout_name || 'Imported Workout',
        description: `Imported from ${uploadedFiles.length > 0 ? uploadedFiles.map(f => f.name).join(', ') : 'text'}`,
        default_rest: 60,
        rest_between_exercises: 90,
        exercises: exercises,
        category: 'strength',
        difficulty: 'intermediate',
        duration_minutes: exercises.length * 5,
        color: '#6366f1',
        is_public: false
      };

      onGenerate(workoutData);
      onClose();
      setWorkoutText('');
      setUploadedFiles([]);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate workout. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Import Workout from Text or Image
          </DialogTitle>
          <DialogDescription>
            Upload a photo of your workout plan or paste the text, and we'll extract the exercises for you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Upload Workout Screenshots or Files</Label>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                  <ImageIcon className="w-8 h-8 text-slate-400 mb-1" />
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">Click to upload</span> — one or more files
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF, or TXT</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.txt,.pdf"
                  multiple
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {uploadedFiles.map((f, idx) => (
                  <div key={idx} className="relative group">
                    {f.type?.startsWith('image/') ? (
                      <img src={f.url} alt={f.name} className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
                    >
                      ×
                    </button>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[64px] truncate">{f.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or paste text</span>
            </div>
          </div>

          <div>
            <Label>Workout Text</Label>
            <Textarea
              placeholder="Paste your workout here, e.g.:&#10;&#10;Pull Day&#10;- Pull-ups: 3 sets x 8 reps&#10;- Barbell Rows: 4 sets x 10 reps, 90s rest&#10;- Bicep Curls: 3 sets x 12 reps"
              value={workoutText}
              onChange={(e) => setWorkoutText(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={generating || (!workoutText.trim() && uploadedFiles.length === 0)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Generate Workout
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}