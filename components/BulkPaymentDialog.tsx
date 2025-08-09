"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Users, Music, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { createPaymentRecord } from "@/lib/payment-firestore";
import { DJAssignment, TeamMember } from "@/lib/event-instances-firestore";
import { Timestamp } from "firebase/firestore";

interface BulkPaymentDialogProps {
  type: 'dj' | 'team' | 'all';
  djAssignments?: DJAssignment[];
  teamMembers?: TeamMember[];
  eventInstanceId: string;
  eventName: string;
  eventDate: string;
  onPaymentsCreated: () => void;
}

export function BulkPaymentDialog({
  type,
  djAssignments = [],
  teamMembers = [],
  eventInstanceId,
  eventName,
  eventDate,
  onPaymentsCreated,
}: BulkPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days from now
  );
  const [selectedDJs, setSelectedDJs] = useState<string[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Filter out volunteers from team members
  const paidTeamMembers = teamMembers.filter(member => !member.isVolunteer && member.paymentAmount > 0);

  // Initialize selections when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      if (type === 'dj' || type === 'all') {
        setSelectedDJs(djAssignments.map(dj => dj.email));
      }
      if (type === 'team' || type === 'all') {
        setSelectedTeamMembers(paidTeamMembers.map(member => member.id!).filter(Boolean));
      }
    }
    setOpen(newOpen);
  };

  const getTotalAmount = () => {
    let total = 0;
    
    selectedDJs.forEach(email => {
      const dj = djAssignments.find(d => d.email === email);
      if (dj) total += parseFloat(dj.paymentAmount);
    });
    
    selectedTeamMembers.forEach(memberId => {
      const member = paidTeamMembers.find(m => m.id === memberId);
      if (member) total += member.paymentAmount;
    });
    
    return total;
  };

  const getSelectedCount = () => {
    return selectedDJs.length + selectedTeamMembers.length;
  };

  const handleCreatePayments = async () => {
    if (!dueDate || getSelectedCount() === 0) return;

    setIsCreating(true);
    try {
      const promises: Promise<any>[] = [];

      // Create DJ payments
      selectedDJs.forEach(email => {
        const dj = djAssignments.find(d => d.email === email);
        if (dj) {
          promises.push(
            createPaymentRecord({
              djId: dj.djId || dj.email,
              djName: dj.djName,
              djEmail: dj.email,
              eventInstanceId,
              eventName,
              eventDate,
              amount: parseFloat(dj.paymentAmount),
              paymentMethod: 'manual',
              status: 'pending',
              dueDate: Timestamp.fromDate(dueDate),
              notes: `Bulk payment for DJ at ${eventName}`,
            })
          );
        }
      });

      // Create team member payments
      selectedTeamMembers.forEach(memberId => {
        const member = paidTeamMembers.find(m => m.id === memberId);
        if (member) {
          promises.push(
            createPaymentRecord({
              djId: member.id!,
              djName: member.name,
              djEmail: member.email || '',
              eventInstanceId,
              eventName,
              eventDate,
              amount: member.paymentAmount,
              paymentMethod: 'manual',
              status: 'pending',
              dueDate: Timestamp.fromDate(dueDate),
              notes: `Bulk payment for ${member.role} at ${eventName}`,
            })
          );
        }
      });

      await Promise.all(promises);

      setOpen(false);
      onPaymentsCreated();
    } catch (error) {
      console.error("Error creating bulk payments:", error);
      alert("Failed to create some payment records. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const getButtonText = () => {
    switch (type) {
      case 'dj':
        return 'Pay All DJs';
      case 'team':
        return 'Pay All Team';
      case 'all':
        return 'Pay Everyone';
      default:
        return 'Bulk Pay';
    }
  };

  const getButtonIcon = () => {
    switch (type) {
      case 'dj':
        return <Music className="h-4 w-4 mr-2" />;
      case 'team':
        return <Users className="h-4 w-4 mr-2" />;
      case 'all':
        return <DollarSign className="h-4 w-4 mr-2" />;
      default:
        return <DollarSign className="h-4 w-4 mr-2" />;
    }
  };

  const hasPayableItems = () => {
    if (type === 'dj') return djAssignments.length > 0;
    if (type === 'team') return paidTeamMembers.length > 0;
    if (type === 'all') return djAssignments.length > 0 || paidTeamMembers.length > 0;
    return false;
  };

  if (!hasPayableItems()) {
    return null; // Don't render if there's nothing to pay
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          {getButtonIcon()}
          {getButtonText()}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Payment Creation</DialogTitle>
          <DialogDescription>
            Create payment records for multiple people at once for {eventName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Due Date Selection */}
          <div className="space-y-2">
            <Label>Payment Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a due date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* DJ Selection */}
          {(type === 'dj' || type === 'all') && djAssignments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">DJs to Pay</Label>
                <Badge variant="outline">{selectedDJs.length} selected</Badge>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                {djAssignments.map((dj) => (
                  <div key={dj.email} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedDJs.includes(dj.email)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDJs([...selectedDJs, dj.email]);
                          } else {
                            setSelectedDJs(selectedDJs.filter(email => email !== dj.email));
                          }
                        }}
                      />
                      <div>
                        <div className="font-medium">{dj.djName}</div>
                        <div className="text-sm text-gray-500">{dj.email}</div>
                      </div>
                    </div>
                    <div className="font-semibold">${dj.paymentAmount}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Member Selection */}
          {(type === 'team' || type === 'all') && paidTeamMembers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Team Members to Pay</Label>
                <Badge variant="outline">{selectedTeamMembers.length} selected</Badge>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                {paidTeamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedTeamMembers.includes(member.id!)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTeamMembers([...selectedTeamMembers, member.id!]);
                          } else {
                            setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== member.id));
                          }
                        }}
                      />
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-500">
                          {member.role} • {member.email || 'No email'}
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold">${member.paymentAmount}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Selected:</span>
              <div className="text-right">
                <div className="font-bold text-lg">${getTotalAmount().toFixed(2)}</div>
                <div className="text-sm text-gray-500">{getSelectedCount()} people</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreatePayments}
            disabled={!dueDate || getSelectedCount() === 0 || isCreating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCreating ? "Creating..." : `Create ${getSelectedCount()} Payment${getSelectedCount() !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}