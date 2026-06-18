'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail, CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic-link'>('signin');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleModeChange = (newMode: 'signin' | 'signup' | 'magic-link') => {
    setMode(newMode);
    setMessage(null);
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!email) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      setLoading(false);
      return;
    }

    if (mode !== 'magic-link' && !password) {
      setMessage({ type: 'error', text: 'Please enter a password.' });
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signin') {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMessage({ type: 'success', text: 'Logged in successfully! Redirecting...' });
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 800);
      } else if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const signupData = await res.json();
        if (!res.ok || signupData.error) {
          throw new Error(signupData.error || 'Failed to create account.');
        }

        // Auto-login after successful registration
        const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        setMessage({ type: 'success', text: 'Account created and logged in successfully! Redirecting...' });
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 800);
      } else if (mode === 'magic-link') {
        const redirectUrl = `${window.location.origin}/auth/callback`;
        const { error } = await supabaseClient.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Magic link sent! Check your email inbox to sign in directly.',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'An error occurred during authentication.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {/* Branding */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-3xl tracking-tight">
            <Shield className="h-8 w-8 stroke-[2.5]" />
            <span>RentSign</span>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
            Landlord Portal
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Create, review, and e-sign legally-valid agreements.
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">
              {mode === 'signin' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'magic-link' && 'Request Magic Link'}
            </CardTitle>
            <CardDescription>
              {mode === 'signin' && 'Enter your email and password to access your landlord portal.'}
              {mode === 'signup' && 'Choose an email and secure password to get started.'}
              {mode === 'magic-link' && 'Enter your email. We will send you a login link instantly.'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Alert Message */}
              {message && (
                <div
                  className={`p-3 rounded-lg flex items-start gap-2.5 text-sm ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-destructive/10 text-destructive dark:text-red-400 border border-destructive/20'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-white dark:bg-slate-900"
                    disabled={loading}
                  />
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Password Input (Login & Signup modes only) */}
              {mode !== 'magic-link' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 bg-white dark:bg-slate-900"
                      disabled={loading}
                    />
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 shadow-md shadow-indigo-600/15"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'signin' && 'Signing in...'}
                    {mode === 'signup' && 'Creating account...'}
                    {mode === 'magic-link' && 'Sending link...'}
                  </>
                ) : (
                  <>
                    {mode === 'signin' && 'Sign In'}
                    {mode === 'signup' && 'Sign Up'}
                    {mode === 'magic-link' && 'Send Magic Link'}
                  </>
                )}
              </Button>

              {/* Alternate flows */}
              <div className="flex flex-col items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                {mode === 'signin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleModeChange('magic-link')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Or use a magic link instead
                    </button>
                    <div>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => handleModeChange('signup')}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                      >
                        Sign up
                      </button>
                    </div>
                  </>
                )}

                {mode === 'signup' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleModeChange('magic-link')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Or use a magic link instead
                    </button>
                    <div>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => handleModeChange('signin')}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                      >
                        Sign in
                      </button>
                    </div>
                  </>
                )}

                {mode === 'magic-link' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleModeChange('signin')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Back to password sign in
                    </button>
                    <div>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => handleModeChange('signup')}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                      >
                        Sign up
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center text-xs text-slate-400 leading-normal mt-2">
                * By logging in, you agree to our Terms of Service and Privacy Policy. Magic links are valid for 1 hour.
              </div>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  );
}
