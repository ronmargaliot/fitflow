import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Ruler, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import MeasurementForm from '@/components/body/MeasurementForm';
import MeasurementChart from '@/components/body/MeasurementChart';
import MeasurementStats from '@/components/body/MeasurementStats';
import WeightDistribution from '@/components/body/WeightDistribution';
import WeeklyComparison from '@/components/body/WeeklyComparison';
import AnnotationManager from '@/components/body/AnnotationManager';
import MeasurementList from '@/components/body/MeasurementList';
import BodyPartManager from '@/components/body/BodyPartManager';

const TIME_FRAMES = [
  { key: '7', label: '7D' },
  { key: '14', label: '14D' },
  { key: '30', label: '30D' },
  { key: '90', label: '90D' },
  { key: '180', label: '180D' },
  { key: '365', label: '1Y' },
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

  const { data: annotations = [] } = useQuery({
    queryKey: ['bodyAnnotations'],
    queryFn: () => base44.entities.BodyAnnotation.list('-date'),
  });

  const bodyParts = currentUser?.body_parts || ['Waist'];

  const metrics = [
    { key: 'weight', label: 'Weight', unit: 'kg' },
    ...bodyParts.map(p => ({ key: p, label: p, unit: 'cm' })),
  ];
  const selectedMetricObj = metrics.find(m => m.key === selectedMetric) || metrics[0];

  // All points for the selected metric (sorted ascending)
  const allPoints = measurements
    .map(r => ({
      date: r.date,
      value: selectedMetric === 'weight' ? r.weight_kg : (r.measurements?.[selectedMetric] ?? null),
    }))
    .filter(p => p.value != null && p.value > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

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

  const handleUpdateUser = async (data) => {
    try {
      await base44.auth.updateMe(data);
      setCurrentUser(prev => ({ ...prev, ...data }));
    } catch {
      toast.error('Failed to save setting');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
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

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <MeasurementForm
          bodyParts={bodyParts}
          editingEntry={editingEntry}
          onSave={(data, id) => saveMutation.mutate({ data, id })}
          onCancel={() => setEditingEntry(null)}
        />

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
          goalWeight={selectedMetric === 'weight' ? currentUser?.goal_weight : null}
          annotations={annotations}
        />

        <MeasurementStats
          allPoints={allPoints}
          timeFrame={timeFrame}
          metricKey={selectedMetric}
          metricLabel={selectedMetricObj.label}
          metricUnit={selectedMetricObj.unit}
          currentUser={currentUser}
          onUpdateUser={handleUpdateUser}
        />

        <WeightDistribution
          records={measurements}
          metricKey={selectedMetric}
          metricLabel={selectedMetricObj.label}
          metricUnit={selectedMetricObj.unit}
        />

        <WeeklyComparison
          allPoints={allPoints}
          metricLabel={selectedMetricObj.label}
          metricUnit={selectedMetricObj.unit}
        />

        <AnnotationManager annotations={annotations} />

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