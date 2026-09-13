'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { teamRegistrationSchema, TeamRegistrationInput, createTeamRegistrationSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Plus, Trash2, Users, Save, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { adminUpdateTeam } from '@/app/actions/admin-edit';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function TeamEditForm({ 
  teamId, 
  initialData, 
  problemStatements,
  minTeamSize,
  maxTeamSize,
  minFemale
}: { 
  teamId: string;
  initialData: Partial<TeamRegistrationInput>;
  problemStatements: Array<{ id: string; ps_id: string; title: string }>;
  minTeamSize?: number;
  maxTeamSize?: number;
  minFemale?: number;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentMinSize = minTeamSize ?? 3;
  const currentMaxSize = maxTeamSize ?? 6;
  const currentMinFemale = minFemale ?? 1;

  const dynamicSchema = createTeamRegistrationSchema(currentMinSize, currentMaxSize, currentMinFemale);

  const form = useForm<TeamRegistrationInput>({
    resolver: zodResolver(dynamicSchema),
    mode: 'onChange',
    defaultValues: initialData as any,
  });

  useEffect(() => {
    form.clearErrors();
  }, [minTeamSize, maxTeamSize, minFemale, form]);

  const { control, handleSubmit, formState: { errors }, watch } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'members' });
  const teamSize = fields.length;
  const watchedMembers = watch('members') || [];

  const addMember = () => {
    if (fields.length < currentMaxSize) {
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
    }
  };

  const onSubmit = async (data: TeamRegistrationInput) => {
    if (teamSize < currentMinSize) {
      setErrorMsg(`A team must have at least ${currentMinSize} members.`);
      return;
    }
    if (teamSize > currentMaxSize) {
      setErrorMsg(`A team can have a maximum of ${currentMaxSize} members.`);
      return;
    }
    
    const females = watchedMembers.filter(m => m.gender === 'female').length;
    if (females < currentMinFemale) {
      setErrorMsg(`A team must include at least ${currentMinFemale} female member(s).`);
      return;
    }
    
    // Zod validation fallback
    const parsed = dynamicSchema.safeParse(data);
    if (!parsed.success) {
      setErrorMsg('Please check the form for errors.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await adminUpdateTeam(teamId, data);
      if (res.success) {
        router.push(`/admin/teams/${teamId}`);
      } else {
        setErrorMsg(res.error || 'Failed to update team.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/teams/${teamId}`}>
          <Button variant="ghost" className="px-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Team Registration</h1>
      </div>

      {errorMsg && (
        <div className="p-4 bg-[var(--color-danger-subtle)] text-[var(--color-danger)] rounded-md flex gap-2 items-start">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Team Details Section */}
        <Card padding="lg" className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">1. Team Details</h2>
          
          <FormField label="Team Name" error={errors.team_name?.message} required>
            <Controller
              name="team_name"
              control={control}
              render={({ field }) => <Input placeholder="Team Name" {...field} />}
            />
          </FormField>
          
          <FormField label="Idea Title" error={errors.idea_title?.message}>
            <Controller
              name="idea_title"
              control={control}
              render={({ field }) => <Input placeholder="Idea Title" {...field} />}
            />
          </FormField>

          <FormField label="Problem Statement" error={errors.problem_statement_id?.message}>
            <Controller
              name="problem_statement_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || ''}
                  onChange={field.onChange}
                >
                  <option value="">Select Problem Statement...</option>
                  {problemStatements.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      {ps.ps_id}: {ps.title}
                    </option>
                  ))}
                </Select>
              )}
            />
          </FormField>

          <FormField label="Idea Description / Solution" error={errors.solution_summary?.message} required>
            <Controller
              name="solution_summary"
              control={control}
              render={({ field }) => (
                <Textarea 
                  placeholder="Describe the solution..." 
                  rows={6}
                  className="resize-y"
                  {...field} 
                />
              )}
            />
          </FormField>
        </Card>

        {/* Members Section */}
        <Card padding="lg" className="space-y-6">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--color-primary)]" />
              2. Team Members
            </h2>
            <span className="text-sm font-medium">Count: {teamSize}/{currentMaxSize}</span>
          </div>
          
          {errors.members?.root?.message && (
            <div className="text-[var(--color-danger)] text-sm font-medium p-3 bg-[var(--color-danger-subtle)] rounded-md">
              {errors.members.root.message}
            </div>
          )}

          <div className="space-y-8">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-50)] relative">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="font-bold">
                    {index === 0 ? 'Team Leader' : `Member ${index + 1}`}
                  </h3>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        if (fields.length > currentMinSize) {
                          remove(index);
                          setErrorMsg('');
                        } else {
                          setErrorMsg(`A team must have at least ${currentMinSize} members.`);
                        }
                      }}
                      className="text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] h-8 px-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Full Name" required error={errors.members?.[index]?.full_name?.message}>
                    <Controller name={`members.${index}.full_name`} control={control} render={({ field }) => <Input {...field} />} />
                  </FormField>
                  <FormField label="Email" required error={errors.members?.[index]?.email?.message}>
                    <Controller name={`members.${index}.email`} control={control} render={({ field }) => <Input type="email" {...field} />} />
                  </FormField>
                  <FormField label="Phone" required error={errors.members?.[index]?.phone?.message}>
                    <Controller name={`members.${index}.phone`} control={control} render={({ field }) => <Input type="tel" {...field} />} />
                  </FormField>
                  <FormField label="Gender" required error={errors.members?.[index]?.gender?.message}>
                    <Controller name={`members.${index}.gender`} control={control} render={({ field }) => (
                      <Select value={field.value} onChange={field.onChange}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </Select>
                    )} />
                  </FormField>
                  <FormField label="Department/Branch" required error={errors.members?.[index]?.department?.message}>
                    <Controller name={`members.${index}.department`} control={control} render={({ field }) => <Input {...field} />} />
                  </FormField>
                  <FormField label="Year of Study" required error={errors.members?.[index]?.year_or_semester?.message}>
                    <Controller name={`members.${index}.year_or_semester`} control={control} render={({ field }) => <Input {...field} />} />
                  </FormField>
                </div>
              </div>
            ))}
          </div>

          {teamSize < currentMaxSize && (
            <Button type="button" variant="outline" onClick={addMember} className="w-full gap-2 border-dashed">
              <Plus className="w-4 h-4" /> Add Team Member
            </Button>
          )}
        </Card>

        <div className="flex justify-end gap-4 pb-12">
          <Link href={`/admin/teams/${teamId}`}>
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting} className="min-w-[150px] gap-2">
            {!isSubmitting && <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
