'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { Logo } from '@/components/branding/logo';
import { adminLoginSchema, type AdminLoginInput } from '@/lib/validation/schemas';
import { createClient } from '@/lib/supabase/client';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin/dashboard';
  const unauthorizedError = searchParams.get('error') === 'unauthorized';

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(
    unauthorizedError ? 'You do not have admin access. Contact the administrator.' : null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
  });

  async function onSubmit(data: AdminLoginInput) {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setServerError(
        error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : 'Unable to sign in. Please try again.'
      );
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-md)] p-6">
        {serverError && (
          <Alert variant="danger" className="mb-4">
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Email"
            htmlFor="email"
            error={errors.email?.message}
            required
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@metbkc.edu"
              error={!!errors.email}
              {...register('email')}
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="password"
            error={errors.password?.message}
            required
          >
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                error={!!errors.password}
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <Button type="submit" loading={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </div>

      <p className="text-caption text-center mt-6">
        MET BKC – Institute of Technology Polytechnic
      </p>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo variant="full" />
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-section-title text-[var(--color-ink)]">Admin Sign In</h1>
          </div>
          <p className="text-body-sm text-[var(--color-ink-secondary)] mt-1">
            Sign in to access the administration panel.
          </p>
        </div>

        <Suspense fallback={<div className="h-[300px] flex items-center justify-center bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]"><p className="text-[var(--color-ink-tertiary)]">Loading...</p></div>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
