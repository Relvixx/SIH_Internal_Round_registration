'use client';

import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { addEvaluationCriterion, updateEvaluationCriterion } from '@/app/actions/evaluations';
import { Dialog } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Edit2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Criteria = {
  id: string;
  name: string;
  description: string;
  max_score: number;
  weight: number;
  is_active: boolean;
};

export function EvaluationCriteriaSettings({ criteria }: { criteria: Criteria[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore] = useState(10);
  const [weight, setWeight] = useState(1.0);
  const [isActive, setIsActive] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const openNew = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setMaxScore(10);
    setWeight(1.0);
    setIsActive(true);
    setError('');
    setIsOpen(true);
  };

  const openEdit = (c: Criteria) => {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description || '');
    setMaxScore(c.max_score);
    setWeight(c.weight);
    setIsActive(c.is_active);
    setError('');
    setIsOpen(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    
    const payload = {
      name,
      description,
      max_score: maxScore,
      weight,
      sort_order: 0,
      is_active: isActive
    };

    let res;
    if (editingId) {
      res = await updateEvaluationCriterion(editingId, payload);
    } else {
      res = await addEvaluationCriterion(payload);
    }

    if (res.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      setError(res.error || 'An error occurred');
    }
    setIsLoading(false);
  };

  const totalMaxScore = criteria.filter(c => c.is_active).reduce((sum, c) => sum + c.max_score, 0);

  return (
    <Card>
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-subtle)]">
        <div>
          <h3 className="text-body-lg font-semibold text-[var(--color-ink)]">Evaluation Criteria</h3>
          <p className="text-body-sm text-[var(--color-ink-secondary)]">
            Define the rubric for evaluating team submissions. (Max Total: {totalMaxScore})
          </p>
        </div>
        <Button onClick={openNew} variant="outline" className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      <div className="divide-y divide-[var(--color-border-subtle)]">
        {criteria.map((c) => (
          <div key={c.id} className="p-4 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-[var(--color-ink)] text-body-md">{c.name}</h4>
                {!c.is_active && <Badge variant="default">Inactive</Badge>}
              </div>
              <p className="text-body-sm text-[var(--color-ink-secondary)] mt-1">{c.description}</p>
            </div>
            <div className="flex items-center gap-4 text-body-sm">
              <div className="text-[var(--color-ink-muted)]">Max: <span className="font-medium text-[var(--color-ink)]">{c.max_score}</span></div>
              <div className="text-[var(--color-ink-muted)]">Wt: <span className="font-medium text-[var(--color-ink)]">{c.weight}</span></div>
              <Button onClick={() => openEdit(c)} variant="ghost" className="p-2 h-auto">
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {criteria.length === 0 && (
          <div className="p-6 text-center text-body-sm text-[var(--color-ink-muted)]">
            No evaluation criteria defined.
          </div>
        )}
      </div>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingId ? "Edit Criterion" : "Add Criterion"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-body-sm font-medium mb-1 block">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Innovation & Novelty" />
          </div>
          <div>
            <label className="text-body-sm font-medium mb-1 block">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explain what to look for..." />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-body-sm font-medium mb-1 block">Max Score</label>
              <Input type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} />
            </div>
            <div className="flex-1">
              <label className="text-body-sm font-medium mb-1 block">Weight</label>
              <Input type="number" min={0} step={0.1} value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Checkbox 
              id="isActive" 
              checked={isActive} 
              onChange={(e: any) => setIsActive(e.target.checked)} 
            />
            <label htmlFor="isActive" className="text-body-sm text-[var(--color-ink)] cursor-pointer">Active (use in evaluations)</label>
          </div>
          {error && <p className="text-body-sm text-[var(--color-danger-600)]">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={isLoading}>Save</Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}
