'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { teamRegistrationSchema, TeamRegistrationInput } from '@/lib/validation/schemas';
import { StepProgress } from './step-progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Upload, X, AlertCircle, CheckCircle2, Copy, AlertTriangle, ExternalLink, Home } from 'lucide-react';
import { registerTeam } from '@/app/actions/register';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STEPS = [
  { id: 'team', title: 'Team Details' },
  { id: 'members', title: 'Team Members' },
  { id: 'problem', title: 'Problem Statement' },
  { id: 'idea', title: 'Idea & PPT' },
  { id: 'review', title: 'Review & Submit' }
];

export function RegistrationWizard({ 
  problemStatements, 
  initialData,
  isEditMode = false,
  teamId,
  editToken
}: { 
  problemStatements: any[];
  initialData?: Partial<TeamRegistrationInput>;
  isEditMode?: boolean;
  teamId?: string;
  editToken?: string;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [fileMetadata, setFileMetadata] = useState<{path: string, name: string, size: number, mime: string} | null>(
    isEditMode ? { path: 'existing', name: 'Existing File', size: 0, mime: '' } : null
  );
  const [submitError, setSubmitError] = useState<string>('');
  const [successData, setSuccessData] = useState<{ id: string; code: string; token: string } | null>(null);
  const router = useRouter();
  const idempotencyKeyRef = useRef<string>('');

  useEffect(() => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }
  }, []);

  const form = useForm<TeamRegistrationInput>({
    resolver: zodResolver(teamRegistrationSchema),
    mode: 'onTouched',
    defaultValues: initialData || {
      team_name: '',
      problem_statement_id: '',
      idea_title: '',
      solution_summary: '',
      key_innovation: '',
      proposed_technology: '',
      members: Array.from({ length: 6 }).map((_, i) => ({
        member_order: i + 1,
        role: (i === 0 ? 'team_leader' : 'member') as 'team_leader' | 'member',
        full_name: '',
        gender: 'male' as 'male' | 'female' | 'other',
        email: '',
        phone: '',
        enrollment_number: '',
        department: '',
        year_or_semester: '',
      })),
    }
  });

  const { control, handleSubmit, trigger, watch, formState: { errors } } = form;
  const { fields } = useFieldArray({ control, name: 'members' });

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStepIndex === 0) fieldsToValidate = ['team_name'];
    if (currentStepIndex === 1) fieldsToValidate = ['members'];
    if (currentStepIndex === 2) fieldsToValidate = ['problem_statement_id'];
    if (currentStepIndex === 3) fieldsToValidate = ['idea_title', 'solution_summary', 'key_innovation', 'proposed_technology'];

    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStepIndex(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("File must be less than 50MB");
      return;
    }

    setUploadProgress(10);

    try {
      // 1. Get Signed Upload URL from trusted Next.js server
      const { getSignedUploadUrl } = await import('@/app/actions/upload');
      const res = await getSignedUploadUrl(file.name, file.type, file.size);
      
      if (!res.success || !res.signedUrl || !res.storagePath || !res.token) {
        alert(res.error || "Upload authorization failed");
        setUploadProgress(0);
        return;
      }

      setUploadProgress(50);
      
      // 2. Upload directly to Supabase Storage using the signed URL
      const uploadRes = await fetch(res.signedUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${res.token}`,
          'Content-Type': file.type,
        },
        body: file,
      });

      if (uploadRes.ok) {
        setUploadProgress(100);
        setFileMetadata({
          path: res.storagePath,
          name: file.name,
          size: file.size,
          mime: file.type
        });
      } else {
        const errorText = await uploadRes.text();
        console.error('Direct upload failed:', errorText);
        alert("Direct upload failed.");
        setUploadProgress(0);
      }
    } catch (err) {
      alert("Upload failed due to network error.");
      setUploadProgress(0);
    }
  };

  const onSubmit = async (data: TeamRegistrationInput) => {
    if (!fileMetadata && !isEditMode) {
      setSubmitError('Please upload your presentation file before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (isEditMode && teamId && editToken) {
        const { updateTeam } = await import('@/app/actions/edit');
        const result = await updateTeam(teamId, editToken, data, fileMetadata?.path === 'existing' ? null : fileMetadata);
        if (result.success) {
          alert('Team details updated successfully!');
          router.push(`/`); // Or to a success page without token
        } else {
          setSubmitError(result.error || 'Failed to update team.');
        }
      } else {
        const result = await registerTeam(data, fileMetadata!, idempotencyKeyRef.current);
        if (result.success) {
          idempotencyKeyRef.current = ''; // Clear for future unrelated submissions if any
          setSuccessData({
            id: result.teamId!,
            code: result.registrationCode!,
            token: result.editToken!
          });
        } else {
          setSubmitError(result.error || 'Failed to register team.');
        }
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    const editUrl = `${window.location.origin}/edit?id=${successData.id}&token=${successData.token}`;
    return (
      <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-6">
          <div className="w-16 h-16 bg-[var(--color-success-subtle)] rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-[var(--color-success)]" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2">Registration Successful!</h1>
        <p className="text-center text-[var(--color-ink-secondary)] mb-8">Your team has been successfully registered for the SIH Internal Hackathon.</p>
        
        <Card padding="lg" className="border-2 border-[var(--color-primary-subtle)] text-center mb-6">
          <p className="text-body text-[var(--color-ink-secondary)] mb-2">Your Registration Code</p>
          <div className="inline-block px-6 py-3 bg-[var(--color-canvas-subtle)] border border-[var(--color-border)] rounded-lg">
            <span className="text-3xl font-bold tracking-wider text-[var(--color-primary)]">
              {successData.code}
            </span>
          </div>
          <p className="text-sm mt-4 text-[var(--color-ink-tertiary)]">
            Please save this code. You will need it for all future correspondence.
          </p>
        </Card>

        <Card padding="lg" className="bg-[var(--color-warning-subtle)] border-[var(--color-warning)]/20 mb-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-[var(--color-warning)] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-[var(--color-ink)] mb-1">
                Save Your Edit Link!
              </h3>
              <p className="text-body-sm text-[var(--color-ink-secondary)] mb-4">
                This is the <strong>ONLY</strong> time you will see this link. If you need to make changes to your team members or idea, you must use this specific link. Do not share it with anyone outside your team.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 bg-white border border-[var(--color-border-subtle)] rounded-md px-3 py-2 text-sm overflow-x-auto whitespace-nowrap font-mono text-[var(--color-ink)]">
                  {editUrl}
                </div>
                <Link href={`/edit?id=${successData.id}&token=${successData.token}`}>
                  <Button variant="outline" className="w-full sm:w-auto shrink-0 gap-2">
                    <ExternalLink className="w-4 h-4" /> Go to Edit Page
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="ghost" icon={<Home className="w-4 h-4" />}>
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-12">
        <StepProgress steps={STEPS} currentStepIndex={currentStepIndex} />
      </div>

      <Card padding="lg">
        {submitError && (
          <div className="mb-6 p-4 bg-[var(--color-danger-subtle)] text-[var(--color-danger)] rounded-md flex gap-2 items-start">
             <AlertCircle className="w-5 h-5 shrink-0" />
             <p>{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Team Details */}
          {currentStepIndex === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold mb-4">Team Details</h2>
              <FormField
                label="Team Name"
                error={errors.team_name?.message}
                required
              >
                <Controller
                  name="team_name"
                  control={control}
                  render={({ field }) => <Input placeholder="e.g. Innovators" {...field} />}
                />
              </FormField>
            </div>
          )}

          {/* Step 2: Team Members */}
          {currentStepIndex === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Team Members (Exactly 6 required)</h2>
                <span className="text-sm text-[var(--color-warning)] font-medium">
                  At least 2 female members mandatory
                </span>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-canvas-subtle)] space-y-4">
                  <div className="flex justify-between items-center mb-2 border-b border-[var(--color-border-subtle)] pb-2">
                    <h3 className="font-semibold text-[var(--color-primary)]">
                      Member {index + 1} {index === 0 && <span className="ml-2 text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full">Leader</span>}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Full Name" required error={errors.members?.[index]?.full_name?.message}>
                      <Controller name={`members.${index}.full_name`} control={control} render={({ field }) => <Input placeholder="Full Name" {...field} />} />
                    </FormField>
                    
                    <FormField label="Gender" required error={errors.members?.[index]?.gender?.message}>
                       <Controller 
                         name={`members.${index}.gender`} 
                         control={control} 
                         render={({ field }) => (
                           <Select value={field.value} onChange={field.onChange}>
                         <option value="male">Male</option>
                         <option value="female">Female</option>
                         <option value="other">Other</option>
                       </Select>
                         )}
                       />
                    </FormField>
                    
                    <FormField label="Email Address" required error={errors.members?.[index]?.email?.message}>
                      <Controller name={`members.${index}.email`} control={control} render={({ field }) => <Input type="email" placeholder="Email Address" {...field} />} />
                    </FormField>

                    <FormField label="Phone Number" required error={errors.members?.[index]?.phone?.message}>
                      <Controller name={`members.${index}.phone`} control={control} render={({ field }) => <Input type="tel" placeholder="Phone Number" {...field} value={field.value || ''} />} />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Problem Statement */}
          {currentStepIndex === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold mb-4">Problem Statement</h2>
              <FormField
                label="Select Problem Statement"
                error={errors.problem_statement_id?.message}
                required
              >
                <Controller
                  name="problem_statement_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect 
                       value={field.value} 
                       onChange={field.onChange}
                       error={!!errors.problem_statement_id}
                       options={problemStatements.map(ps => ({
                         value: ps.id,
                         label: ps.ps_id,
                         subLabel: ps.title,
                         searchTerms: [ps.organization, ps.theme].filter(Boolean)
                       }))}
                       placeholder="Search by ID, title, organization, or theme..."
                    />
                  )}
                />
              </FormField>
            </div>
          )}

          {/* Step 4: Idea Details & PPT */}
          {currentStepIndex === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold mb-4">Idea & Presentation</h2>
              
              <FormField label="Idea Title" error={errors.idea_title?.message} required>
                <Controller name="idea_title" control={control} render={({ field }) => <Input placeholder="Title of your solution" {...field} />} />
              </FormField>

              <FormField label="Solution Summary" error={errors.solution_summary?.message} required>
                <Controller name="solution_summary" control={control} render={({ field }) => <Textarea placeholder="Brief summary of your approach" rows={4} {...field} />} />
              </FormField>

              <FormField label="Key Innovation" error={errors.key_innovation?.message}>
                <Controller name="key_innovation" control={control} render={({ field }) => <Input placeholder="What makes your idea unique?" {...field} value={field.value || ''} />} />
              </FormField>

              <FormField label="Proposed Technology Stack" error={errors.proposed_technology?.message}>
                <Controller name="proposed_technology" control={control} render={({ field }) => <Input placeholder="e.g. React, Python, PostgreSQL" {...field} value={field.value || ''} />} />
              </FormField>

              <div className="mt-8 border-t border-[var(--color-border-subtle)] pt-6">
                <h3 className="font-semibold mb-4">Upload Presentation (PDF or PPTX, max 50MB)</h3>
                {!fileMetadata ? (
                  <div className="border-2 border-dashed border-[var(--color-border-subtle)] rounded-lg p-8 text-center hover:bg-[var(--color-canvas-subtle)] transition-colors relative cursor-pointer">
                    <input type="file" accept=".pdf,.pptx" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <Upload className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[var(--color-ink)]">Click or drag file to upload</p>
                    <p className="text-xs text-[var(--color-ink-tertiary)] mt-1">Official SIH template format only</p>
                    {uploadProgress > 0 && <p className="mt-3 text-sm text-[var(--color-primary)]">Uploading: {uploadProgress}%</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-[var(--color-success-subtle)] rounded-lg border border-[var(--color-success)]">
                    <div className="flex items-center gap-3 text-[var(--color-success)]">
                      <Upload className="w-5 h-5" />
                      <span className="font-medium text-sm">File uploaded successfully: {fileMetadata.name}</span>
                    </div>
                    <button type="button" onClick={() => {setFileMetadata(null); setUploadProgress(0);}} className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-danger)] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStepIndex === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold mb-4">Review Your Registration</h2>
              <div className="p-4 bg-[var(--color-canvas-subtle)] rounded-lg border border-[var(--color-border-subtle)] text-sm space-y-2">
                <p><strong>Team Name:</strong> {watch('team_name')}</p>
                <p><strong>Leader:</strong> {watch('members.0.full_name')} ({watch('members.0.email')})</p>
                <p><strong>Problem Statement:</strong> {problemStatements.find(p => p.id === watch('problem_statement_id'))?.ps_id || watch('problem_statement_id')}</p>
                <p><strong>Idea Title:</strong> {watch('idea_title')}</p>
                <p><strong>Presentation Uploaded:</strong> {fileMetadata ? 'Yes' : 'No'}</p>
              </div>
              <p className="text-sm text-[var(--color-ink-secondary)]">By submitting, you confirm that your team meets all the rules and regulations of the internal hackathon.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 mt-8 border-t border-[var(--color-border-subtle)]">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStepIndex === 0 || isSubmitting}
            >
              Previous
            </Button>
            
            {currentStepIndex < STEPS.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Next Step
              </Button>
            ) : (
              <Button type="submit" loading={isSubmitting}>
                Submit Registration
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
