'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/lib/api';

export default function SecurityPage() {
  const [twoFAStatus, setTwoFAStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);

  useEffect(() => {
    fetch2FAStatus();
  }, []);

  const fetch2FAStatus = async () => {
    try {
      const response = await api.get('/2fa/status');
      setTwoFAStatus(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch 2FA status');
      console.error('2FA status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const initiateSetup = async () => {
    try {
      const response = await api.get('/2fa/setup');
      setSetupData(response.data.data);
      setBackupCodes(response.data.data.backupCodes);
      setShowSetup(true);
      setError('');
    } catch (err) {
      setError('Failed to generate 2FA setup');
      console.error('2FA setup error:', err);
    }
  };

  const confirmSetup = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      await api.post('/2fa/enable', {
        secret: setupData.secret,
        verificationCode,
        backupCodes
      });
      setSuccess('2FA enabled successfully! Save your backup codes in a safe place.');
      setError('');
      setShowSetup(false);
      setVerificationCode('');
      await fetch2FAStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to enable 2FA');
      console.error('Enable 2FA error:', err);
    }
  };

  const disable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? Your account will be less secure.')) {
      return;
    }

    try {
      await api.post('/2fa/disable');
      setSuccess('2FA disabled successfully');
      setError('');
      await fetch2FAStatus();
    } catch (err) {
      setError('Failed to disable 2FA');
      console.error('Disable 2FA error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold">Loading security settings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Security Settings</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* 2FA Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold">2FA Status</h3>
                <p className="text-sm text-gray-600">
                  {twoFAStatus?.enabled ? (
                    <span className="text-green-600 font-medium">✓ Enabled</span>
                  ) : (
                    <span className="text-red-600 font-medium">✗ Disabled</span>
                  )}
                </p>
              </div>
              <div>
                {twoFAStatus?.enabled ? (
                  <Button variant="destructive" onClick={disable2FA}>
                    Disable 2FA
                  </Button>
                ) : (
                  <Button onClick={initiateSetup}>Enable 2FA</Button>
                )}
              </div>
            </div>

            {twoFAStatus?.enabled && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Backup codes remaining: <strong>{twoFAStatus.backupCodesRemaining}</strong>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2FA Setup Modal */}
      {showSetup && setupData && (
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Set Up Two-Factor Authentication</CardTitle>
            <CardDescription>Scan the QR code with an authenticator app</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <img
                  src={setupData.qrCode}
                  alt="2FA QR Code"
                  className="w-64 h-64 border-4 border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Can't scan? Enter this code manually:<br />
                  <code className="bg-white p-2 rounded mt-2 block text-xs font-mono">
                    {setupData.secret}
                  </code>
                </p>
              </div>

              {/* Verification Code Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Enter 6-digit code from your authenticator</label>
                <Input
                  type="text"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              {/* Backup Codes */}
              <div>
                <label className="block text-sm font-medium mb-2">Save these backup codes</label>
                <div className="bg-white p-4 rounded-lg border border-gray-300">
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, idx) => (
                      <code key={idx} className="text-sm font-mono">
                        {code}
                      </code>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-4">
                    Store these codes in a safe place. Each code can only be used once.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button onClick={confirmSetup} className="flex-1">
                  Confirm & Enable 2FA
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSetup(false);
                    setVerificationCode('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
