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
import { CalendarIcon, CreditCard } from "lucide-react";
import { format } from "date-fns";

interface CreatePaymentDialogProps {
  djName: string;
  djEmail: string;
  amount: number;
  eventInstanceId: string;
  onPaymentCreated: () => void;
}

export function CreatePaymentDialog({
  djName,
  djEmail,
  amount,
  eventInstanceId,
  onPaymentCreated,
}: CreatePaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days from now
  );
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePayment = async () => {
    if (!dueDate) return;

    setIsCreating(true);

    try {
      // Import the function dynamically to avoid server-side issues
      const { createPaymentForDJAssignment } = await import('@/lib/event-instances-firestore');
      
      await createPaymentForDJAssignment(eventInstanceId, djEmail, dueDate);
      
      setOpen(false);
      onPaymentCreated();
    } catch (error) {
      console.error("Error creating payment:", error);
      alert("Failed to create payment. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <CreditCard className="h-4 w-4" />
          Create Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Payment Record</DialogTitle>
          <DialogDescription>
            Create a payment record for {djName} - ${amount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>DJ Name</Label>
            <Input value={djName} disabled />
          </div>
          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input value={`$${amount.toFixed(2)}`} disabled />
          </div>
          <div className="grid gap-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
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