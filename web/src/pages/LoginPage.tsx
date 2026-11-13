import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sanitizeInput = (val: string) =>
    val
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = sanitizeInput(email);
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.message || 'Authentication failed. Check your credentials.');
      } else {
        setSuccessMessage('Authentication verified. Redirecting to administrative console.');
      }
    } catch {
      setErrorMessage('Unable to reach authentication server. Verify backend service is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#EAF6FF] text-[#142B4A] min-h-[calc(100vh-16rem)] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-semibold text-[#142B4A] hover:text-[#FF8C42] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back to Home</span>
        </Link>

        <div className="rounded-xl border border-[#142B4A]/20 bg-[#F4FAFF] p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#142B4A] text-[#FF8C42]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#142B4A]">Admin Sign In</h1>
              <p className="text-xs text-[#142B4A]/75">Zero-Trust Property Owner Portal</p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-start space-x-2.5 rounded-md border border-[#FF8C42] bg-[#FFF1E6] p-3.5 text-xs text-[#142B4A]">
              <AlertCircle className="h-4 w-4 text-[#FF8C42] flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 rounded-md border border-[#142B4A] bg-[#D5EBFC] p-3.5 text-xs font-semibold text-[#142B4A]">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#142B4A] mb-1.5">
                Business Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@sunrisehostels.com"
                className="input-field"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#142B4A] mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-field"
                autoComplete="current-password"
              />
            </div>

            <div className="pt-2 flex flex-col space-y-3">
              <button
                type="submit"
                disabled={isSubmitting || !email || !password}
                className="btn-primary w-full"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In to Dashboard'}
              </button>

              <Link to="/domain-setup" className="btn-secondary w-full text-center">
                Configure Custom Domain
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
