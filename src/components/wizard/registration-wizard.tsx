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
  const [copiedField, setCopiedField] = useState<'code' | 'link' | null>(null);
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

  const { control, handleSubmit, trigger, watch, setValue, formState: { errors } } = form;
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
      if (femaleCount < 1) {
          setValidationNotice('Your team must include at least 1 female member to proceed.');
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
    
    const copyToClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(text === editUrl ? 'link' : 'code');
        setTimeout(() => setCopiedField(null), 2500);
      } catch { /* fallback: do nothing */ }
    };

    return (
      <div className="max-w-xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4">
        
        {/* ── Celebration Header ── */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs animate-bounce shadow-sm">🎉</div>
          </div>
          <h1 className="text-3xl font-extrabold mb-2" style={{ letterSpacing: '-0.03em' }}>Registration Successful!</h1>
          <p className="text-[var(--color-ink-secondary)] text-sm max-w-md mx-auto">
            Congratulations! Your team has been successfully registered for the SIH Internal Hackathon.
          </p>
        </div>

        {/* ── Registration Code Card ── */}
        <div className="rounded-2xl border-2 border-[var(--color-primary)]/20 bg-gradient-to-b from-[var(--color-primary)]/[0.03] to-transparent p-6 text-center mb-5">
          <p className="text-xs font-semibold text-[var(--color-ink-tertiary)] uppercase tracking-widest mb-3">Your Registration Code</p>
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white border-2 border-[var(--color-primary)]/30 rounded-xl shadow-sm">
            <span className="text-4xl font-black tracking-widest text-[var(--color-primary)]" style={{ letterSpacing: '0.12em' }}>
              {successData.code}
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(successData.code)}
              className="p-2 rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors text-[var(--color-primary)]"
              title="Copy code"
            >
              {copiedField === 'code' ? <CheckCircle2 className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-[var(--color-ink-tertiary)] mt-3">
            📌 Please save this code. You will need it for all future correspondence.
          </p>
        </div>

        {/* ── Edit Link Card ── */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 mb-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--color-ink)]">⚠️ Save Your Edit Link</h3>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5 leading-relaxed">
                This link will only be shown <strong>once</strong>. If you need to update your team members or idea, you will need this link. Copy and save it somewhere safe.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(editUrl)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                copiedField === 'link'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm hover:shadow-md'
              }`}
            >
              {copiedField === 'link' ? (
                <><CheckCircle2 className="w-4 h-4" /> Link Copied!</>
              ) : (
                <><ExternalLink className="w-4 h-4" /> Copy Edit Link</>
              )}
            </button>
            <a 
              href={`/edit?id=${successData.id}&token=${successData.token}`}
              className="inline-flex items-center justify-center shrink-0 gap-2 h-[42px] px-4 rounded-xl border border-amber-300 text-amber-700 bg-transparent hover:bg-amber-100 text-sm font-semibold transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Open Edit Page
            </a>
          </div>
        </div>

        {/* ── WhatsApp Group Card ── */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-5 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4.5 h-4.5 text-[#25D366]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--color-ink)]">💬 Join WhatsApp Group</h3>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5 leading-relaxed">
                All important updates and announcements will be shared in this group. Joining is mandatory!
              </p>
            </div>
          </div>
          <a 
            href="https://chat.whatsapp.com/CbAzxPxDjPR4RgYND2Z2iJ?s=sw&p=a&mlu=4&ilr=4" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full px-5 py-3 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1DA851] transition-all shadow-sm hover:shadow-md"
          >
            <MessageCircle className="w-4.5 h-4.5" />
            Join WhatsApp Group
          </a>
        </div>

        {/* ── Return Home ── */}
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]">
              <Home className="w-4 h-4" /> Return to Homepage
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
                <p className="text-sm text-[var(--color-ink-secondary)]">Enter your team name and member details (Min 3, Max 6 members. Must include at least 1 female member).</p>
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
                    Female Members: <span className={femaleCount < 1 ? "text-[var(--color-warning-700)] font-bold" : "text-[var(--color-success)] font-bold"}>{femaleCount}</span> / 1 required
                  </span>
                </div>
              </div>

              {/* Female Count Requirement Alert */}
              {femaleCount < 1 && (
                  <div className="p-4 bg-[var(--color-warning-subtle)] border border-[var(--color-warning)]/30 rounded-lg flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-[var(--color-warning)]" />
                    <p className="text-sm font-medium text-[var(--color-ink)]">
                      Your team must include at least 1 female member to proceed.
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

          {/* Step 2: Problem Statement & Presentation (Redesigned) */}
          {currentStepIndex === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              
              {/* Step Header */}
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ letterSpacing: '-0.02em' }}>Problem Statement & Presentation</h2>
                <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed max-w-xl">
                  Choose your problem statement from the official SIH portal, describe your solution approach, and upload your presentation.
                </p>
              </div>

              {/* Validation Notice Banner */}
              {validationNotice && (
                <div className="p-4 bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-[var(--color-danger)]" />
                  <p className="text-sm font-medium text-[var(--color-danger)]">{validationNotice}</p>
                </div>
              )}

              {/* ── Section 1: Find Your Problem Statement ── */}
              <div className="rounded-xl border border-[var(--color-border-subtle)] overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">📋 Find Your Problem Statement</h3>
                      <p className="text-xs text-white/80 mt-0.5">Official SIH 2026 Problem Statements</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-[var(--color-canvas-subtle)] space-y-4">
                  <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">
                    If you don't know which problem statement to choose, visit the official SIH website using the link below to browse all available problem statements.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
                      <span className="w-6 h-6 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                      <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">Click the button below to open the <strong>official SIH website</strong></p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
                      <span className="w-6 h-6 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                      <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">Browse the problem statements and <strong>choose a topic</strong> for your team</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
                      <span className="w-6 h-6 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                      <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">Come back and <strong>describe your solution</strong> in the form below</p>
                    </div>
                  </div>
                  <a
                    href="https://www.sih.gov.in/sih2026PS"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm hover:shadow-md"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Official SIH Problem Statements
                  </a>
                </div>
              </div>

              {/* ── Section 2: PPT Template Download ── */}
              {templateUrl && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-[var(--color-ink)] mb-1">
                        📄 {templateTitle || 'SIH Presentation Template'}
                      </h4>
                      {templateInstructions && (
                        <p className="text-xs text-[var(--color-ink-secondary)] mb-3 leading-relaxed">{templateInstructions}</p>
                      )}
                      <a
                        href={templateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 rotate-180" /> Download Template
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Section 3: Describe Your Solution ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="font-bold text-base text-[var(--color-ink)]">Describe Your Solution</h3>
                </div>
                <p className="text-xs text-[var(--color-ink-tertiary)] pl-10">
                  Write your problem statement title, proposed solution, key innovation, and technology stack below.
                </p>
                <div className="pl-10">
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
                          placeholder="Example:&#10;&#10;Problem: Renewable Energy Management System for Rural Areas&#10;&#10;Solution: We propose a IoT-based smart grid system that monitors and distributes solar energy efficiently across rural households...&#10;&#10;Technology: React, Node.js, IoT sensors, Firebase&#10;&#10;Innovation: AI-powered load balancing for off-grid areas" 
                          rows={10} 
                          className="resize-y"
                          {...field} 
                        />
                      )}
                    />
                  </FormField>
                </div>
              </div>

              {/* ── Section 4: Upload Presentation ── */}
              <div className="space-y-3 border-t border-[var(--color-border-subtle)] pt-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <Upload className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="font-bold text-base text-[var(--color-ink)]">Upload Presentation</h3>
                </div>
                <p className="text-xs text-[var(--color-ink-tertiary)] pl-10">
                  Upload your team's presentation file in PDF, PPTX, PNG, or JPG format (max 50MB).
                </p>

                <div className="pl-10">
                  {!fileMetadata ? (
                    <div className="border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl p-8 text-center hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/[0.02] transition-all duration-300 relative cursor-pointer group">
                      <input type="file" accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.webp" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center group-hover:bg-[var(--color-primary)]/20 transition-colors">
                        <Upload className="w-7 h-7 text-[var(--color-primary)]" />
                      </div>
                      <p className="text-sm font-semibold text-[var(--color-ink)] mb-1">Click to upload or drag & drop</p>
                      <p className="text-xs text-[var(--color-ink-tertiary)]">PDF, PPTX, PNG, JPG, WEBP — Max 50MB</p>
                      {uploadProgress > 0 && (
                        <div className="mt-4">
                          <div className="w-full max-w-xs mx-auto h-2 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <p className="mt-2 text-xs text-[var(--color-primary)] font-medium">Uploading: {uploadProgress}%</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-[var(--color-success-subtle)] rounded-xl border border-[var(--color-success)]">
                      <div className="flex items-center gap-3 text-[var(--color-success)]">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <div>
                          <span className="font-semibold text-sm block">File uploaded successfully</span>
                          <span className="text-xs text-[var(--color-ink-secondary)]">{fileMetadata.name}</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => {setFileMetadata(null); setUploadProgress(0);}} className="p-1.5 rounded-lg text-[var(--color-ink-tertiary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
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
