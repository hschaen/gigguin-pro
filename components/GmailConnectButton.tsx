'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GmailStatus {
  connected: boolean;
  valid: boolean;
  email?: string;
  message: string;
}

export default function GmailConnectButton() {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkGmailStatus();
  }, []);

  const checkGmailStatus = async () => {
    try {
      const response = await fetch('/api/gmail/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking Gmail status:', error);
    }
  };

  const connectGmail = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/gmail/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.authUrl) {
        // Redirect to Gmail OAuth
        window.location.href = data.authUrl;
      } else {
        toast.error('Failed to generate Gmail authorization URL');
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      toast.error('Failed to connect Gmail');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectGmail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gmail/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Gmail disconnected successfully');
        await checkGmailStatus();
      } else {
        toast.error('Failed to disconnect Gmail');
      }
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast.error('Failed to disconnect Gmail');
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <Button disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Checking Gmail status...
      </Button>
    );
  }

  if (status.connected && status.valid) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={disconnectGmail} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4 mr-2" />
          )}
          Disconnect Gmail
        </Button>
        <div className="flex items-center gap-1 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Connected ({status.email})</span>
        </div>
      </div>
    );
  }

  return (
    <Button onClick={connectGmail} disabled={connecting}>
      {connecting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Mail className="w-4 h-4 mr-2" />
      )}
      {connecting ? 'Connecting...' : 'Connect Gmail'}
    </Button>
  );
} 