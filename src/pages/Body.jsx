import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Ruler, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import MeasurementForm from '@/components/body/MeasurementForm';
import MeasurementChart from '@/components/body/MeasurementChart';
import MeasurementList from '@/components/body/MeasurementList';
import BodyPartManager from '@/components/body/BodyPartManager';

const TIME_FRAMES = [
  { key: '7', label: '7D' },
  { key: '30', label: '30D' },
  { key: '90', label: '90D' },
  { key: '180', label: '180D' },
  { key: 'ytd', label: 'YTD' },
  { key: 'all', label: 'All' },
];

export default function Body() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [timeFrame, setTimeFrame] = useState('30');
  const [editingEntry, setEditingEntry] = useState(null);
  const [showPartManager, setShowPartManager] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: measurements = [], isLoading } = useQuery({
    queryKey: ['bodyMeasurements'],
    queryFn: () => base44.entities.BodyMeasurement.list('-date'),
  });

  const bodyParts = currentUser?.body_parts || ['Waist'];

  const metrics = [
    { key: 'weight', label: 'Weight', unit: 'kg' },
    ...bodyParts.map(p => ({ key: p, label: p, unit: 'cm' })),
  ];
  const selectedMetricObj = metrics.find(m => m.key === selectedMetric) || metrics[0];

  const saveMutation = useMutation({
    mutationFn: ({ data, id }) => id
      ? base44.entities.BodyMeasurement.update(id, data)
      : base44.entities.BodyMeasurement.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bodyMeasurements'] });
      setEditingEntry(null);
      toast.success(variables.id ? 'Entry updated' : 'Entry saved');
    },
    onError: () => toast.error('Failed to save entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BodyMeasurement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyMeasurements'] });
      toast.success('Entry deleted');
    },
  });

  const handlePartsSaved = (parts) => {
    setCurrentUser(prev => ({ ...prev, body_parts: parts }));
    if (!parts.includes(selectedMetric) && selectedMetric !== 'weight') {
      setSelectedMetric('weight');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-indigo-600" />
              <h1 className="text-xl font-bold text-slate-900">Body Tracking</h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPartManager(true)}>
              <Settings2 className="w-3.5 h-3.5 mr-1" />
              Parts
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Log form */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <MeasurementForm
                bodyParts={bodyParts}
                editingEntry={editingEntry}
                onSave={(data, id) => saveMutation.mutate({ data, id })}
                onCancel={() => setEditingEntry(null)}
              />
            </div>
          </div>

          {/* Right: Chart + History */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Metric</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {metrics.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setSelectedMetric(m.key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedMetric === m.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {TIME_FRAMES.map(tf => (
                <button
                  key={tf.key}
                  onClick={() => setTimeFrame(tf.key)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    timeFrame === tf.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <MeasurementChart
              records={measurements}
              metricKey={selectedMetricObj.key}
              metricLabel={selectedMetricObj.label}
              metricUnit={selectedMetricObj.unit}
              timeFrame={timeFrame}
            />

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">History</h3>
              {isLoading ? (
                <p className="text-sm text-slate-400">Loading...</p>
              ) : measurements.length === 0 ? (
                <p className="text-sm text-slate-400">No entries yet. Log your first measurement above.</p>
              ) : (
                <MeasurementList
                  entries={measurements}
                  onEdit={setEditingEntry}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <BodyPartManager
        open={showPartManager}
        onClose={() => setShowPartManager(false)}
        bodyParts={bodyParts}
        onSaved={handlePartsSaved}
      />
    </div>
  );
}