'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { teamRegistrationSchema, TeamRegistrationInput } from '@/lib/validation/schemas';
import { StepProgress } from './step-progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Upload, X, AlertCircle, CheckCircle2, AlertTriangle, ExternalLink, Home, Plus, Trash2, Users, FileText, MessageCircle } from 'lucide-react';
import { registerTeam } from '@/app/actions/register';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STEPS = [
  { id: 'team', title: 'Team Details' },
  { id: 'solution', title: 'Problem & Presentation' },
  { id: 'review', title: 'Review & Submit' }
];

export function RegistrationWizard({ 
  initialData,
  isEditMode = false,
  teamId,
  editToken,
  templateUrl,
  templateTitle,
  templateInstructions,
}: { 
  problemStatements?: Array<{ id: string; ps_id: string; title: string; category?: string | null; theme?: string | null; organization: string }>;
  initialData?: Partial<TeamRegistrationInput>;
  isEditMode?: boolean;
  teamId?: string;
  editToken?: string;
  templateUrl?: string | null;
  templateTitle?: string | null;
  templateInstructions?: string | null;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [fileMetadata, setFileMetadata] = useState<{path: string, name: string, size: number, mime: string} | null>(
    isEditMode ? { path: 'existing', name: 'Existing File', size: 0, mime: '' } : null
  );
  const [submitError, setSubmitError] = useState<string>('');
  const [validationNotice, setValidationNotice] = useState<string>('');
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
    mode: 'onChange',
    defaultValues: initialData || {
      team_name: '',
      problem_statement_id: '',
      idea_title: '',
      solution_summary: '',
      key_innovation: '',
      proposed_technology: '',
      members: Array.from({ length: 3 }).map((_, i) => ({
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
  const { fields, append, remove } = useFieldArray({ control, name: 'members' });

  const watchedMembers = useWatch({ control, name: 'members', defaultValue: [] });
  const femaleCount = watchedMembers.filter((m: any) => m?.gender === 'female').length;
  const teamSize = fields.length;

  const addMember = () => {
    if (fields.length < 6) {
      append({
        member_order: fields.length + 1,
        role: 'member',
        full_name: '',
        gender: 'male',
        email: '',
        phone: '',
        enrollment_number: '',
        department: '',
        year_or_semester: '',
      });
      setValidationNotice('');
    }
  };

  const removeMember = (index: number) => {
    if (fields.length > 3 && index >= 1) {
      remove(index);
      setValidationNotice('');
    }
  };

  const nextStep = async () => {
    setValidationNotice('');

    if (currentStepIndex === 0) {
      // Step 1: Team Details (Name + Members)
      const isValidForm = await trigger(['team_name', 'members']);
      
      if (teamSize < 3) {
        setValidationNotice('A team must have at least 3 members.');
        return;
      }
      if (teamSize > 6) {
        setValidationNotice('A team cannot have more than 6 members.');
        return;
      }
      if (femaleCount < 2) {
        setValidationNotice('Your team must include at least 2 female members to proceed.');
        return;
      }

      const emails = watchedMembers.map((m: any) => m.email?.toLowerCase().trim()).filter(Boolean);
      const uniqueEmails = new Set(emails);
      if (uniqueEmails.size !== emails.length) {
        setValidationNotice('Each team member must have a unique email address. Please check for duplicates.');
        return;
      }
      if (!isValidForm) return;
    }

    if (currentStepIndex === 1) {
      // Step 2: Problem Statement & Presentation
      const isValidForm = await trigger(['solution_summary']);
      if (!isValidForm) return;

      if (!fileMetadata && !isEditMode) {
        setValidationNotice('Please upload your presentation file before proceeding.');
        return;
      }
    }

    setCurrentStepIndex(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => {
    setValidationNotice('');
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
      const { getSignedUploadUrl } = await import('@/app/actions/upload');
      const res = await getSignedUploadUrl(file.name, file.type, file.size);
      
      if (!res.success || !res.signedUrl || !res.storagePath || !res.token) {
        alert(res.error || "Upload authorization failed");
        setUploadProgress(0);
        return;
      }

      setUploadProgress(50);
      
      if (res.signedUrl === '#' || !res.signedUrl) {
        setUploadProgress(100);
        setFileMetadata({
          path: res.storagePath || `uploads/${file.name}`,
          name: file.name,
          size: file.size,
          mime: file.type || 'application/pdf'
        });
        return;
      }

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
      console.error('File upload error:', err);
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
          router.push(`/`);
        } else {
          setSubmitError(result.error || 'Failed to update team.');
        }
      } else {
        const result = await registerTeam(data, fileMetadata!, idempotencyKeyRef.current);
        if (result.success) {
          idempotencyKeyRef.current = '';
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
      console.error('Submit error:', error);
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

        <Card padding="lg" className="bg-[#25D366]/10 border-[#25D366]/30 mb-8">
          <div className="flex items-start gap-4">
            <MessageCircle className="w-6 h-6 text-[#25D366] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-[var(--color-ink)] mb-1">
                Join our WhatsApp Group
              </h3>
              <p className="text-body-sm text-[var(--color-ink-secondary)] mb-4">
                Please join the official WhatsApp group for all important updates and announcements regarding the SIH Internal Hackathon.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <a 
                  href="https://chat.whatsapp.com/CbAzxPxDjPR4RgYND2Z2iJ?s=sw&p=a&mlu=4&ilr=4" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1DA851] text-white border-transparent gap-2">
                    Join WhatsApp Group
                  </Button>
                </a>
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
          {/* Step 1: Merged Team Details (Team Name + Team Members) */}
          {currentStepIndex === 0 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div>
                <h2 className="text-xl font-bold mb-2">Team Details</h2>
                <p className="text-sm text-[var(--color-ink-secondary)]">Enter your team name and member details (Min 3, Max 6 members. Must include at least 2 female members).</p>
              </div>

              {/* Team Name */}
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

              {/* Team Rules Summary Bar */}
              <div className="p-4 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-50)] flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[var(--color-primary)]" />
                  <span className="font-semibold text-sm">
                    Team Size: <span className={teamSize < 3 || teamSize > 6 ? "text-[var(--color-danger)] font-bold" : "text-[var(--color-primary)] font-bold"}>{teamSize}</span> / 6 (Min 3 required)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    Female Members: <span className={femaleCount < 2 ? "text-[var(--color-warning-700)] font-bold" : "text-[var(--color-success)] font-bold"}>{femaleCount}</span> / 2 required
                  </span>
                </div>
              </div>

              {/* Female Count Requirement Alert */}
              {femaleCount < 2 && (
                <div className="p-4 bg-[var(--color-warning-subtle)] border border-[var(--color-warning)]/30 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-[var(--color-warning)]" />
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    Your team must include at least 2 female members to proceed.
                  </p>
                </div>
              )}

              {/* Validation Notice Banner */}
              {validationNotice && (
                <div className="p-4 bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-[var(--color-danger)]" />
                  <p className="text-sm font-medium text-[var(--color-danger)]">{validationNotice}</p>
                </div>
              )}

              {/* Team Member Cards */}
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-canvas-subtle)] space-y-4 relative">
                    <div className="flex justify-between items-center border-b border-[var(--color-border-subtle)] pb-3">
                      <h3 className="font-bold text-[var(--color-primary)] flex items-center gap-2">
                        {index === 0 ? (
                          <>
                            Team Leader
                            <span className="text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full font-normal">Leader</span>
                          </>
                        ) : (
                          `Team Member ${index + 1}`
                        )}
                        {index >= 3 && (
                          <span className="text-xs bg-[var(--color-ink-tertiary)]/10 text-[var(--color-ink-secondary)] px-2 py-0.5 rounded-full font-normal">Optional</span>
                        )}
                      </h3>

                      {index >= 3 && fields.length > 3 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeMember(index)}
                          className="text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] gap-1 h-8 px-2"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </Button>
                      )}
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
                             <Select {...field}>
                               <option value="male">Male</option>
                               <option value="female">Female</option>
                               <option value="other">Other</option>
                             </Select>
                           )}
                         />
                      </FormField>

                      <FormField label="Branch" required error={errors.members?.[index]?.department?.message}>
                         <Controller 
                           name={`members.${index}.department`} 
                           control={control} 
                           render={({ field }) => (
                             <Select {...field} value={field.value || ""}>
                               <option value="" disabled>Select Branch</option>
                               <option value="Computer Science and Design">Computer Science and Design</option>
                               <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                               <option value="Automation and Robotics">Automation and Robotics</option>
                               <option value="Electrical and Telecommunication Engineering">Electrical and Telecommunication Engineering</option>
                               <option value="Civil and Environmental Engineering">Civil and Environmental Engineering</option>
                             </Select>
                           )}
                         />
                      </FormField>

                      <FormField label="Year" required error={errors.members?.[index]?.year_or_semester?.message}>
                         <Controller 
                           name={`members.${index}.year_or_semester`} 
                           control={control} 
                           render={({ field }) => (
                             <Select {...field} value={field.value || ""}>
                               <option value="" disabled>Select Year</option>
                               <option value="First Year">First Year</option>
                               <option value="Second Year">Second Year</option>
                               <option value="Third Year">Third Year</option>
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

              {/* Add Member Button */}
              {fields.length < 6 ? (
                <div className="pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addMember}
                    className="w-full sm:w-auto gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Team Member ({fields.length}/6)
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-[var(--color-ink-tertiary)] italic">Maximum team size of 6 members reached.</p>
              )}
            </div>
          )}

          {/* Step 2: Problem Statement & Presentation (Combined Step) */}
          {currentStepIndex === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div>
                <h2 className="text-xl font-bold mb-1">Problem Statement & Presentation</h2>
                <p className="text-sm text-[var(--color-ink-secondary)]">
                  Describe your problem statement and proposed approach, and upload your team&apos;s presentation slide deck.
                </p>
              </div>

              {/* Validation Notice Banner */}
              {validationNotice && (
                <div className="p-4 bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-[var(--color-danger)]" />
                  <p className="text-sm font-medium text-[var(--color-danger)]">{validationNotice}</p>
                </div>
              )}

              {/* PPT Template Download */}
              {templateUrl && (
                <div className="p-4 rounded-lg border border-[var(--color-primary-subtle)] bg-[var(--color-primary-subtle)]/30 flex items-start gap-4">
                  <FileText className="w-6 h-6 text-[var(--color-primary)] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--color-ink)] mb-0.5">
                      📄 {templateTitle || 'SIH Presentation Template'}
                    </p>
                    {templateInstructions && (
                      <p className="text-xs text-[var(--color-ink-secondary)] mb-2">{templateInstructions}</p>
                    )}
                    <p className="text-xs text-[var(--color-ink-tertiary)] mb-3">Download and use this official template for your presentation.</p>
                    <a
                      href={templateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Upload className="w-4 h-4 rotate-180" /> Download Template
                    </a>
                  </div>
                </div>
              )}

              {/* Problem Statement Input */}
              <FormField
                label="Problem Statement & Proposed Solution"
                error={errors.solution_summary?.message}
                required
              >
                <Controller
                  name="solution_summary"
                  control={control}
                  render={({ field }) => (
                    <Textarea 
                      placeholder="Type your problem statement, solution description, key innovation, and proposed technology stack here..." 
                      rows={8} 
                      {...field} 
                    />
                  )}
                />
              </FormField>

              {/* Presentation Upload Section */}
              <div className="space-y-3 border-t border-[var(--color-border-subtle)] pt-6">
                <div>
                  <h3 className="text-base font-bold mb-1">Upload Presentation Deck or Document</h3>
                  <p className="text-xs text-[var(--color-ink-secondary)]">
                    Upload your presentation slide deck or document in PDF, PPTX, PNG, or JPG format (max 50MB).
                  </p>
                </div>

                {!fileMetadata ? (
                  <div className="border-2 border-dashed border-[var(--color-border-subtle)] rounded-lg p-6 text-center hover:bg-[var(--color-canvas-subtle)] transition-colors relative cursor-pointer">
                    <input type="file" accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.webp" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <Upload className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-2" />
                    <p className="text-sm font-medium text-[var(--color-ink)]">Click or drag file to upload</p>
                    <p className="text-xs text-[var(--color-ink-tertiary)] mt-1">Allowed formats: .pdf, .ppt, .pptx, .png, .jpg, .jpeg, .webp (max 50MB)</p>
                    {uploadProgress > 0 && <p className="mt-3 text-sm text-[var(--color-primary)] font-medium">Uploading: {uploadProgress}%</p>}
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

          {/* Step 3: Review & Submit */}
          {currentStepIndex === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold mb-4">Review Your Registration</h2>
              
              <div className="p-5 bg-[var(--color-canvas-subtle)] rounded-lg border border-[var(--color-border-subtle)] text-sm space-y-4">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-ink-tertiary)] uppercase tracking-wider">Team Name</p>
                  <p className="text-base font-bold text-[var(--color-primary)]">{watch('team_name')}</p>
                </div>

                <div className="border-t border-[var(--color-border-subtle)] pt-3">
                  <p className="text-xs font-semibold text-[var(--color-ink-tertiary)] uppercase tracking-wider mb-2">Team Members ({watchedMembers.length})</p>
                  <div className="space-y-2">
                    {watchedMembers.map((m, i) => (
                      <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-[var(--color-border-subtle)]/50 last:border-0">
                        <span>
                          <strong>{i === 0 ? 'Leader' : `Member ${i + 1}`}:</strong> {m.full_name || 'N/A'} ({m.gender})
                        </span>
                        <span className="text-xs text-[var(--color-ink-secondary)]">{m.email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[var(--color-border-subtle)] pt-3">
                  <p className="text-xs font-semibold text-[var(--color-ink-tertiary)] uppercase tracking-wider">Problem Statement & Solution</p>
                  <p className="text-sm text-[var(--color-ink)] mt-1 whitespace-pre-wrap line-clamp-4">{watch('solution_summary')}</p>
                </div>

                <div className="border-t border-[var(--color-border-subtle)] pt-3 flex justify-between items-center">
                  <span className="text-xs font-semibold text-[var(--color-ink-tertiary)] uppercase tracking-wider">Presentation File Uploaded</span>
                  <span className={`font-semibold ${fileMetadata ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>
                    {fileMetadata ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              <p className="text-sm text-[var(--color-ink-secondary)]">By submitting, you confirm that your team meets all the rules and regulations of the internal hackathon.</p>
            </div>
          )}

          {/* Navigation Controls */}
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
