'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { importProblemStatements } from '@/app/actions/problem-statements';
import Papa from 'papaparse';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

interface CSVProblemStatementRow {
  [key: string]: unknown;
  ps_id: string;
  title: string;
  organization: string;
  theme?: string;
  category?: string;
  problem_type: string;
  description?: string;
}

export function CSVImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedData, setParsedData] = useState<CSVProblemStatementRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<{row: number, error: string}[]>([]);
  const [globalError, setGlobalError] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);
  const [skipExisting, setSkipExisting] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalError('');
    setValidationErrors([]);
    setResult(null);
    setParsedData([]);
    
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setGlobalError('Please select a valid CSV file.');
        return;
      }
      
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as CSVProblemStatementRow[];
          const errors: {row: number, error: string}[] = [];
          const seenIds = new Set<string>();

          rows.forEach((row, idx) => {
            const line = idx + 1;
            if (!row.ps_id) errors.push({ row: line, error: 'Missing ps_id' });
            else if (seenIds.has(row.ps_id)) errors.push({ row: line, error: `Duplicate ps_id inside CSV: ${row.ps_id}` });
            else seenIds.add(row.ps_id);

            if (!row.title) errors.push({ row: line, error: 'Missing title' });
            if (!row.organization) errors.push({ row: line, error: 'Missing organization' });
            if (row.problem_type !== 'software' && row.problem_type !== 'hardware') {
              errors.push({ row: line, error: 'problem_type must be software or hardware' });
            }
          });

          setValidationErrors(errors);
          setParsedData(rows);
        },
        error: (err) => {
          setGlobalError(`Error parsing CSV: ${err.message}`);
        }
      });
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0 || validationErrors.length > 0) {
      setGlobalError('Please fix validation errors before importing.');
      return;
    }

    setIsImporting(true);
    setGlobalError('');
    setResult(null);

    const res = await importProblemStatements(parsedData);
    if (res.success) {
      setResult({ success: true, count: res.count });
      setParsedData([]);
      setTimeout(() => {
        setIsOpen(false);
        setResult(null);
      }, 2000);
    } else {
      setResult({ success: false, error: res.error });
    }
    setIsImporting(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" className="flex items-center gap-2">
        <UploadCloud className="w-4 h-4" />
        Import CSV
      </Button>

      <Dialog
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setParsedData([]);
          setValidationErrors([]);
          setGlobalError('');
          setResult(null);
        }}
        title="Import Problem Statements"
        description="Upload a CSV file containing problem statements."
      >
        <div className="space-y-4">
          <div className="text-body-sm text-[var(--color-ink-secondary)] bg-[var(--color-surface-50)] p-3 rounded-md">
            <p className="font-medium mb-1">Expected columns:</p>
            <code>ps_id, title, organization, theme, category, problem_type, description</code>
            <p className="mt-1 text-caption text-[var(--color-ink-muted)]">
              Ensure <code className="bg-transparent p-0">problem_type</code> is either &quot;software&quot; or &quot;hardware&quot;.
            </p>
          </div>

          <div>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
              className="block w-full text-sm text-[var(--color-ink-secondary)]
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-[var(--color-primary-50)] file:text-[var(--color-primary-700)]
                hover:file:bg-[var(--color-primary-100)]
                cursor-pointer"
            />
          </div>

          {globalError && (
            <div className="flex items-start gap-2 p-3 bg-[var(--color-danger-50)] text-[var(--color-danger-700)] rounded-md text-body-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="p-3 bg-[var(--color-warning-50)] border border-[var(--color-warning-200)] rounded-md max-h-40 overflow-y-auto">
              <div className="flex items-center gap-2 text-[var(--color-warning-700)] font-medium mb-2 text-body-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Found {validationErrors.length} validation errors</span>
              </div>
              <ul className="text-sm space-y-1 text-[var(--color-warning-700)] list-disc pl-5">
                {validationErrors.map((err, i) => (
                  <li key={i}>Row {err.row}: {err.error}</li>
                ))}
              </ul>
            </div>
          )}

          {parsedData.length > 0 && validationErrors.length === 0 && !globalError && (
            <div className="space-y-3">
              <div className="text-body-sm text-[var(--color-success-700)] bg-[var(--color-success-50)] p-3 rounded-md flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Found <strong>{parsedData.length}</strong> valid rows ready to import.</span>
              </div>
              <div className="flex flex-col gap-1 border border-[var(--color-border-subtle)] rounded-md p-3 max-h-40 overflow-y-auto bg-[var(--color-surface)] text-xs">
                {parsedData.slice(0, 5).map((r, i) => (
                  <div key={i} className="truncate"><span className="font-semibold">{r.ps_id}</span> - {r.title}</div>
                ))}
                {parsedData.length > 5 && <div className="text-[var(--color-ink-muted)]">...and {parsedData.length - 5} more.</div>}
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="skip-existing" 
                  checked={skipExisting} 
                  onChange={(e) => setSkipExisting(e.target.checked)}
                  disabled // Hardcoded safe default as requested
                />
                <label htmlFor="skip-existing" className="text-body-sm font-medium text-[var(--color-ink)]">
                  Skip existing PS IDs (Safe Default)
                </label>
              </div>
            </div>
          )}

          {result && (
            <div className={`flex items-start gap-2 p-3 rounded-md text-body-sm ${result.success ? 'bg-[var(--color-success-50)] text-[var(--color-success-700)]' : 'bg-[var(--color-danger-50)] text-[var(--color-danger-700)]'}`}>
              {result.success ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <AlertTriangle className="w-4 h-4 mt-0.5" />}
              <span>{result.success ? `Successfully imported ${result.count} problem statements.` : result.error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleImport} 
              disabled={parsedData.length === 0 || validationErrors.length > 0 || isImporting || !!result?.success}
              loading={isImporting}
            >
              Start Import
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
