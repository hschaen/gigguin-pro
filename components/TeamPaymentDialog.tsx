"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import { createPaymentRecord } from "@/lib/payment-firestore";
import { TeamMember } from "@/lib/event-instances-firestore";
import { Timestamp } from "firebase/firestore";

interface TeamPaymentDialogProps {
  teamMember: TeamMember;
  eventInstanceId: string;
  eventName: string;
  eventDate: string;
  onPaymentCreated: () => void;
}

export function TeamPaymentDialog({
  teamMember,
  eventInstanceId,
  eventName,
  eventDate,
  onPaymentCreated,
}: TeamPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days from now
  );
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePayment = async () => {
    if (!dueDate || !teamMember.id) return;

    setIsCreating(true);
    try {
      await createPaymentRecord({
        djId: teamMember.id!,
        djName: teamMember.name,
        djEmail: teamMember.email || '',
        eventInstanceId,
        eventName,
        eventDate,
        amount: teamMember.paymentAmount,
        paymentMethod: 'manual',
        status: 'pending',
        dueDate: Timestamp.fromDate(dueDate),
        notes: `Payment for ${teamMember.role} at ${eventName}`,
      });

      setOpen(false);
      onPaymentCreated();
    } catch (error) {
      console.error("Error creating team member payment:", error);
      alert("Failed to create payment record. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Users className="h-4 w-4 mr-2" />
          Pay Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Payment for {teamMember.name}</DialogTitle>
          <DialogDescription>
            Set up payment for {teamMember.role} at {eventName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <div className="col-span-3 text-sm font-medium">
              {teamMember.name}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <div className="col-span-3 text-sm">
              {teamMember.role}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <div className="col-span-3 text-sm">
              {teamMember.email || 'Not provided'}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <div className="col-span-3 text-sm font-medium">
              ${teamMember.paymentAmount.toFixed(2)}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="due-date" className="text-right">
              Due Date
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
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
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleCreatePayment}
            disabled={!dueDate || isCreating}
          >
            {isCreating ? "Creating..." : "Create Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}