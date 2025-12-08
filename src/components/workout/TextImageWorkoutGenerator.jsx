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
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'text/plain', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload an image (PNG, JPG), text file, or PDF');
      return;
    }

    try {
      setUploadedFile(file);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
      console.error(error);
    }
  };

  const handleGenerate = async () => {
    if (!workoutText.trim() && !fileUrl) {
      toast.error('Please provide workout text or upload a file');
      return;
    }

    setGenerating(true);

    try {
      let extractedData;

      // If file is uploaded, extract data from it
      if (fileUrl) {
        const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: fileUrl,
          json_schema: {
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

        if (extractResult.status === 'error') {
          throw new Error(extractResult.details);
        }

        extractedData = extractResult.output;
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

      // Transform to app format
      const exercises = (extractedData.exercises || []).map((ex, idx) => ({
        id: `ex_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
        name: ex.name,
        sets: ex.sets || 3,
        exercise_type: 'reps',
        reps: ex.reps || '10',
        rest: ex.rest || 60,
        weight: ex.weight || 0,
        notes: ex.notes || '',
        demo_video: ''
      }));

      const workoutData = {
        name: extractedData.workout_name || 'Imported Workout',
        description: `Imported from ${uploadedFile ? uploadedFile.name : 'text'}`,
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
      setUploadedFile(null);
      setFileUrl('');
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
            <Label>Upload Workout Image or File</Label>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploadedFile ? (
                    <>
                      <FileText className="w-10 h-10 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600">{uploadedFile.name}</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-10 h-10 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF, or TXT</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.txt,.pdf"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
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
            disabled={generating || (!workoutText.trim() && !fileUrl)}
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