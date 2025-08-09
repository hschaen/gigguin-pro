'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { userLinkingService, UserLinkRecord } from '@/lib/user-linking-service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface AccountLinkingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountLinkingDialog({ open, onOpenChange }: AccountLinkingDialogProps) {
  const [user, loading] = useAuthState(auth);
  const [linkingStatus, setLinkingStatus] = useState<{
    isLinked: boolean;
    linkingRecord?: UserLinkRecord;
  }>({ isLinked: false });
  const [linkingToken, setLinkingToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  useEffect(() => {
    if (user && open) {
      loadLinkingStatus();
    }
  }, [user, open]);

  const loadLinkingStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const status = await userLinkingService.getCurrentUserLinkingStatus();
      setLinkingStatus(status);
    } catch (error) {
      console.error('Error loading linking status:', error);
      toast.error('Failed to load linking status');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const generateLinkingToken = async () => {
    if (!user) return;

    try {
      setIsGeneratingToken(true);

      // First create a linking record if it doesn't exist
      if (!linkingStatus.linkingRecord) {
        await userLinkingService.createLinkingRecord(user);
        await loadLinkingStatus();
      }

      // Generate the token
      const linkingRequest = await userLinkingService.generateLinkingToken(user.uid);
      setLinkingToken(linkingRequest.token);
      setTokenExpiry(linkingRequest.expiresAt);
      
      toast.success('Linking token generated successfully');
    } catch (error) {
      console.error('Error generating token:', error);
      toast.error('Failed to generate linking token');
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const copyTokenToClipboard = async () => {
    if (linkingToken) {
      await navigator.clipboard.writeText(linkingToken);
      toast.success('Token copied to clipboard');
    }
  };

  const copyLinkToClipboard = async () => {
    if (linkingToken) {
      const gigguinUrl = `${process.env.NEXT_PUBLIC_GIGGUIN_URL || 'https://gigguin.com'}/account/link?token=${linkingToken}`;
      await navigator.clipboard.writeText(gigguinUrl);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading || isLoadingStatus) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link with Gigguin Account</DialogTitle>
          <DialogDescription>
            Connect your DJ Booking Tool account with Gigguin to receive notifications
            and manage bookings across both platforms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {linkingStatus.isLinked ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Account Linked</p>
                    <p className="text-sm text-green-600">
                      Connected to: {linkingStatus.linkingRecord?.gigguinEmail}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">Not Linked</p>
                      <p className="text-sm text-yellow-600">
                        Your account is not connected to Gigguin
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {linkingToken ? (
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium mb-2">Linking Token Generated</p>
                        <div className="bg-gray-50 p-3 rounded border font-mono text-sm break-all">
                          {linkingToken}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyTokenToClipboard}
                          className="mt-2 mr-2"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Token
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyLinkToClipboard}
                          className="mt-2"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                      </div>

                      <div className="text-sm text-gray-600">
                        <p><strong>Instructions:</strong></p>
                        <ol className="list-decimal list-inside space-y-1 mt-1">
                          <li>Copy the token above</li>
                          <li>Go to your Gigguin account settings</li>
                          <li>Navigate to "Account Linking"</li>
                          <li>Paste the token to complete the link</li>
                        </ol>
                      </div>

                      {tokenExpiry && (
                        <Badge variant="secondary" className="text-xs">
                          Expires: {tokenExpiry.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center">
                  <Button
                    onClick={generateLinkingToken}
                    disabled={isGeneratingToken}
                    className="w-full"
                  >
                    {isGeneratingToken ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Linking Token'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {linkingStatus.isLinked && (
            <Button
              variant="destructive"
              onClick={async () => {
                if (user) {
                  await userLinkingService.unlinkUsers(user.uid);
                  await loadLinkingStatus();
                  toast.success('Account unlinked successfully');
                }
              }}
            >
              Unlink Account
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}