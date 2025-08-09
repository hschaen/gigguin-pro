"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Copy, 
  ExternalLink, 
  Users, 
  Check, 
  Loader2, 
  Share2,
  FileSpreadsheet,
  Edit,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface RSVPLinkButtonProps {
  eventInstanceId: string;
  assigneeType: 'dj' | 'team_member';
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  existingLink?: string;
  existingGoogleSheetsUrl?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  onGoogleSheetsUpdate?: (url: string) => void;
}

export default function RSVPLinkButton({
  eventInstanceId,
  assigneeType,
  assigneeId,
  assigneeName,
  assigneeEmail,
  existingLink,
  existingGoogleSheetsUrl,
  variant = 'outline',
  size = 'sm',
  showIcon = true,
  onGoogleSheetsUpdate
}: RSVPLinkButtonProps) {
  const [rsvpLink, setRSVPLink] = useState<string>(existingLink || '');
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState<string>(existingGoogleSheetsUrl || '');
  const [editingGoogleSheets, setEditingGoogleSheets] = useState(false);
  const [tempGoogleSheetsUrl, setTempGoogleSheetsUrl] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedSheets, setCopiedSheets] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const generateRSVPLink = async () => {
    // Check if existing link is in the old format (contains query parameters)
    const isOldFormat = rsvpLink && rsvpLink.includes('/rsvp?');
    
    if (rsvpLink && !isOldFormat) {
      return rsvpLink; // Return existing link if it's in the correct format
    }

    try {
      setGenerating(true);
      
      const response = await fetch('/api/rsvp/generate-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventInstanceId,
          assigneeType,
          assigneeId,
          assigneeName,
          assigneeEmail
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate RSVP link');
      }

      const result = await response.json();
      setRSVPLink(result.rsvpLink);
      return result.rsvpLink;
    } catch (error) {
      console.error('Error generating RSVP link:', error);
      toast.error('Failed to generate RSVP link');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  // Auto-regenerate link if it's in the old format
  useEffect(() => {
    const checkAndUpdateLink = async () => {
      if (existingLink && existingLink.includes('/rsvp?')) {
        console.log('Detected old format RSVP link, regenerating...');
        const newLink = await generateRSVPLink();
        if (newLink) {
          setRSVPLink(newLink);
        }
      }
    };
    
    checkAndUpdateLink();
  }, [existingLink]);

  const copyToClipboard = async () => {
    let linkToCopy = rsvpLink;
    
    if (!linkToCopy) {
      linkToCopy = await generateRSVPLink();
      if (!linkToCopy) return;
    }

    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      toast.success('RSVP link copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  const openLink = () => {
    if (rsvpLink) {
      window.open(rsvpLink, '_blank');
    }
  };

  const shareLink = async () => {
    let linkToShare = rsvpLink;
    
    if (!linkToShare) {
      linkToShare = await generateRSVPLink();
      if (!linkToShare) return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `RSVP for Event`,
          text: `You're invited! Please RSVP for the event.`,
          url: linkToShare
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to copy
        copyToClipboard();
      }
    } else {
      // Fallback to copy
      copyToClipboard();
    }
  };

  const copyGoogleSheetsUrl = async () => {
    if (!googleSheetsUrl) {
      toast.error('No Google Sheets URL to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(googleSheetsUrl);
      setCopiedSheets(true);
      toast.success('Google Sheets URL copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedSheets(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy URL');
    }
  };

  const openGoogleSheets = () => {
    if (googleSheetsUrl) {
      window.open(googleSheetsUrl, '_blank');
    }
  };

  const handleEditGoogleSheets = () => {
    setTempGoogleSheetsUrl(googleSheetsUrl);
    setEditingGoogleSheets(true);
  };

  const handleSaveGoogleSheets = () => {
    setGoogleSheetsUrl(tempGoogleSheetsUrl);
    setEditingGoogleSheets(false);
    if (onGoogleSheetsUpdate) {
      onGoogleSheetsUpdate(tempGoogleSheetsUrl);
    }
    toast.success('Google Sheets URL updated');
  };

  const handleCancelGoogleSheets = () => {
    setTempGoogleSheetsUrl('');
    setEditingGoogleSheets(false);
  };

  const handleButtonClick = async () => {
    if (!rsvpLink) {
      await generateRSVPLink();
    }
    setDialogOpen(true);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleButtonClick}
        disabled={generating}
        className="flex items-center gap-2"
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : showIcon ? (
          <Users className="h-4 w-4" />
        ) : null}
        {generating ? 'Generating...' : 'Guest List'}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Guest List Management</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">
                  {assigneeType === 'dj' ? 'DJ' : 'Team Member'}
                </Badge>
                <span className="font-medium">{assigneeName}</span>
              </div>
              <p className="text-sm text-gray-600">
                Manage your RSVP form for guests and view responses in Google Sheets.
              </p>
            </div>

            {/* RSVP Form Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-blue-600">RSVP Form for Guests</h3>
              </div>
              <p className="text-sm text-gray-600">
                Share this link with your friends so they can RSVP and receive QR codes.
              </p>

              {rsvpLink ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm break-all font-mono text-blue-800">{rsvpLink}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={openLink}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                    
                    <Button
                      onClick={shareLink}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              ) : generating ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500">Generating RSVP link...</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-3">No RSVP link generated yet</p>
                  <Button onClick={generateRSVPLink}>
                    Generate RSVP Link
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Google Sheets Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-green-600">Google Sheets View</h3>
              </div>
              <p className="text-sm text-gray-600">
                View and manage all RSVP responses in your Google Sheet.
              </p>

              {editingGoogleSheets ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="googleSheetsUrl">Google Sheets URL</Label>
                    <Input
                      id="googleSheetsUrl"
                      type="url"
                      value={tempGoogleSheetsUrl}
                      onChange={(e) => setTempGoogleSheetsUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveGoogleSheets}
                      size="sm"
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelGoogleSheets}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : googleSheetsUrl ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm break-all font-mono text-green-800">{googleSheetsUrl}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={copyGoogleSheetsUrl}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {copiedSheets ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy URL
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={openGoogleSheets}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Sheet
                    </Button>
                    
                    <Button
                      onClick={handleEditGoogleSheets}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-3">No Google Sheets URL set</p>
                  <Button onClick={handleEditGoogleSheets} variant="outline">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Add Google Sheets URL
                  </Button>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Quick Guide:</p>
              <ul className="space-y-1">
                <li>• Share the <span className="text-blue-600">RSVP Form link</span> with guests</li>
                <li>• View responses in your <span className="text-green-600">Google Sheet</span></li>
                <li>• Guests get QR codes automatically after submitting</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}