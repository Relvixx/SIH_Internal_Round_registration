'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { saveTeamEvaluations } from '@/app/actions/evaluations';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

type Criteria = {
  id: string;
  name: string;
  description: string;
  max_score: number;
  weight: number;
};

type Evaluation = {
  criteria_id: string;
  score: number;
  comment: string;
};

export function EvaluationForm({ 
  teamId, 
  criteria,
  existingEvaluations 
}: { 
  teamId: string, 
  criteria: Criteria[],
  existingEvaluations: Evaluation[]
}) {
  const router = useRouter();
  
  const [scores, setScores] = useState<Record<string, { score: string, comment: string }>>(() => {
    const init: Record<string, { score: string, comment: string }> = {};
    criteria.forEach(c => {
      const existing = existingEvaluations.find(e => e.criteria_id === c.id);
      init[c.id] = {
        score: existing ? String(existing.score) : '',
        comment: existing?.comment || ''
      };
    });
    return init;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleScoreChange = (id: string, val: string) => {
    setScores(prev => ({ ...prev, [id]: { ...prev[id], score: val } }));
    setSuccess(false);
  };

  const handleCommentChange = (id: string, val: string) => {
    setScores(prev => ({ ...prev, [id]: { ...prev[id], comment: val } }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setError('');
    setSuccess(false);
    setIsLoading(true);

    const evaluationsToSave = [];

    for (const c of criteria) {
      const val = scores[c.id].score;
      if (val === '') continue; // Skip empty ones
      
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 0 || num > c.max_score) {
        setError(`Score for ${c.name} must be between 0 and ${c.max_score}`);
        setIsLoading(false);
        return;
      }
      
      evaluationsToSave.push({
        criteria_id: c.id,
        score: num,
        comment: scores[c.id].comment
      });
    }

    if (evaluationsToSave.length === 0) {
      setError('Please enter at least one score.');
      setIsLoading(false);
      return;
    }

    const res = await saveTeamEvaluations({
      team_id: teamId,
      evaluations: evaluationsToSave
    });

    if (res.success) {
      setSuccess(true);
      router.refresh();
    } else {
      setError(res.error || 'Failed to save evaluations');
    }
    
    setIsLoading(false);
  };

  if (criteria.length === 0) {
    return <div className="text-body-sm text-[var(--color-ink-muted)]">No evaluation criteria configured. Please configure them in Settings.</div>;
  }

  const totalScore = criteria.reduce((sum, c) => {
    const val = parseInt(scores[c.id].score, 10);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  
  const maxPossibleScore = criteria.reduce((sum, c) => sum + c.max_score, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {criteria.map((c) => (
          <div key={c.id} className="p-4 bg-[var(--color-surface-50)] border border-[var(--color-border-subtle)] rounded-md">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-body-sm text-[var(--color-ink)]">{c.name}</h4>
                {c.description && <p className="text-body-xs text-[var(--color-ink-secondary)] mt-1">{c.description}</p>}
                
                <div className="mt-3">
                  <Textarea 
                    placeholder="Evaluator comment (optional)"
                    value={scores[c.id].comment}
                    onChange={(e) => handleCommentChange(c.id, e.target.value)}
                    className="min-h-[60px] text-body-sm"
                  />
                </div>
              </div>
              
              <div className="w-full sm:w-32 flex flex-col items-start sm:items-end">
                <label className="text-body-xs font-medium text-[var(--color-ink-muted)] mb-1">
                  Score (Max: {c.max_score})
                </label>
                <Input
                  type="number"
                  min="0"
                  max={c.max_score}
                  value={scores[c.id].score}
                  onChange={(e) => handleScoreChange(c.id, e.target.value)}
                  className="w-full sm:w-24 text-right"
                  placeholder="-"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
        <div className="text-body-md font-semibold text-[var(--color-ink)]">
          Total Score: {totalScore} / {maxPossibleScore}
        </div>
        
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          {error && <span className="text-body-sm text-[var(--color-danger-600)]">{error}</span>}
          {success && (
            <span className="flex items-center gap-1 text-body-sm text-[var(--color-success-600)]">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
          <Button onClick={handleSave} loading={isLoading}>
            Save Evaluation
          </Button>
        </div>
      </div>
    </div>
  );
}
