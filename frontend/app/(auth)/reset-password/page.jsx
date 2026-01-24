'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/api';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [view, setView] = useState('loading'); // loading, otp-entry, password-form, success, invalid
    const [error, setError] = useState('');
    const [validToken, setValidToken] = useState(null);
    const [email, setEmail] = useState(emailParam || '');

    // OTP State
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const otpRefs = useRef([]);

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    // Verify token on mount if present
    useEffect(() => {
        if (token) {
            verifyToken();
        } else if (emailParam) {
            // User came from forgot password, show OTP entry
            setView('otp-entry');
            setLoading(false);
        } else {
            setView('otp-entry');
            setLoading(false);
        }
    }, [token, emailParam]);

    const verifyToken = async () => {
        try {
            await api.get(`/password-reset/verify/${token}`);
            setValidToken(token);
            setView('password-form');
        } catch (err) {
            setView('invalid');
            setError(err.response?.data?.error || 'Invalid or expired reset token.');
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP input change
    const handleOtpChange = (index, value) => {
        // Allow only alphanumeric
        const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (cleanValue.length <= 1) {
            const newOtp = [...otp];
            newOtp[index] = cleanValue;
            setOtp(newOtp);
            setOtpError('');

            // Auto-focus next input
            if (cleanValue && index < 5) {
                otpRefs.current[index + 1]?.focus();
            }
        }
    };

    // Handle OTP paste
    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            setOtpError('');
            otpRefs.current[5]?.focus();
        }
    };

    // Handle OTP keydown (backspace)
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    // Verify OTP
    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();

        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            setOtpError('Please enter the complete 6-character OTP');
            return;
        }

        if (!email) {
            setOtpError('Please enter your email address');
            return;
        }

        setVerifyingOtp(true);
        setOtpError('');

        try {
            const response = await api.post('/password-reset/verify-otp', {
                email,
                otp: otpValue
            });

            setValidToken(response.data.data.token);
            setView('password-form');
        } catch (err) {
            setOtpError(err.response?.data?.error || 'Invalid OTP code');
        } finally {
            setVerifyingOtp(false);
        }
    };

    // Reset password
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setSubmitting(true);

        try {
            await api.post('/password-reset/reset', {
                token: validToken,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            });
            setView('success');
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setSubmitting(false);
        }
    };

    // Lock Icon SVG
    const LockIcon = () => (
        <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
        </svg>
    );

    // Email Icon SVG
    const EmailIcon = () => (
        <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-strong">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-surface-strong">
            <div className="bg-surface rounded-2xl shadow-card max-w-md w-full p-10 space-y-6">

                {/* Logo */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-2 border-accent shadow-md">
                        <Image src="/bat-logo.png" alt="Logo" width={50} height={50} />
                    </div>
                </div>

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold text-primary tracking-tight">
                        Reset Password
                    </h1>
                    {view === 'otp-entry' && (
                        <p className="text-text-muted text-sm">Enter the OTP code sent to your email</p>
                    )}
                    {view === 'password-form' && (
                        <p className="text-text-muted text-sm">Enter your new password below</p>
                    )}
                </div>

                {/* Success State */}
                {view === 'success' && (
                    <div className="text-center space-y-6 animate-slideIn">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium text-text">Password Reset Successfully!</h3>
                            <p className="text-text-muted text-sm">You can now login with your new password.</p>
                        </div>
                        <Link
                            href="/login"
                            className="block w-full py-3.5 bg-accent text-white font-semibold rounded-full hover:bg-[#e8900f] transition-all shadow-md text-center"
                        >
                            Go to Login
                        </Link>
                    </div>
                )}

                {/* Invalid Token State */}
                {view === 'invalid' && (
                    <div className="text-center space-y-6 animate-slideIn">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium text-text">Invalid or Expired Link</h3>
                            <p className="text-text-muted text-sm">{error}</p>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setView('otp-entry');
                                    setError('');
                                    setOtp(['', '', '', '', '', '']);
                                }}
                                className="block w-full py-3.5 bg-accent text-white font-semibold rounded-full hover:bg-[#e8900f] transition-all shadow-md text-center"
                            >
                                Enter OTP Code Instead
                            </button>
                            <Link
                                href="/login"
                                className="block w-full py-3.5 border border-border text-text font-semibold rounded-full hover:bg-surface-strong transition-all text-center"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                )}

                {/* OTP Entry View */}
                {view === 'otp-entry' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-6 animate-slideIn">
                        {otpError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {otpError}
                            </div>
                        )}

                        {/* Email Input */}
                        {!emailParam && (
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <EmailIcon />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 border border-border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-text placeholder:text-muted transition-all"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        )}

                        {/* OTP Input Boxes */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-text-muted text-center">
                                Enter 6-character OTP
                            </label>
                            <div className="flex justify-center gap-2 sm:gap-3">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (otpRefs.current[index] = el)}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        onPaste={index === 0 ? handleOtpPaste : undefined}
                                        className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold border-2 border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-primary transition-all uppercase"
                                        style={{ fontFamily: 'monospace' }}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-text-muted text-center">
                                Check your email for the OTP code
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={verifyingOtp || otp.join('').length !== 6}
                            className="w-full py-3.5 bg-accent text-white font-semibold rounded-full hover:bg-[#e8900f] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        <div className="text-center">
                            <Link href="/login" className="text-sm text-text-muted hover:text-accent transition-colors">
                                Back to login
                            </Link>
                        </div>
                    </form>
                )}

                {/* Password Reset Form */}
                {view === 'password-form' && (
                    <form onSubmit={handleSubmit} className="space-y-5 animate-slideIn">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* New Password */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <LockIcon />
                                </div>
                                <input
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 border border-border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-text placeholder:text-muted transition-all"
                                    placeholder="New Password"
                                    required
                                    minLength={8}
                                />
                            </div>

                            {/* Confirm Password */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <LockIcon />
                                </div>
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 border border-border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-text placeholder:text-muted transition-all"
                                    placeholder="Confirm New Password"
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3.5 bg-accent text-white font-semibold rounded-full hover:bg-[#e8900f] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Resetting...' : 'Reset Password'}
                        </button>

                        <div className="text-center">
                            <Link href="/login" className="text-sm text-text-muted hover:text-accent transition-colors">
                                Cancel and return to login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-surface-strong">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
