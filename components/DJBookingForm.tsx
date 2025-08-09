"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { createBooking, updateBooking } from "@/lib/firestore";
import { getAllDJs, DJData } from "@/lib/dj-firestore";
import { checkFirestoreStatus } from "@/lib/firebase-status";

interface FormData {
  djLegalName: string;
  djName: string;
  email: string;
  phone: string;
  setStartTime: string;
  eventDate: string;
  paymentAmount: string;
}

export default function DJBookingForm() {
  const [formData, setFormData] = useState<FormData>({
    djLegalName: "",
    djName: "",
    email: "",
    phone: "",
    setStartTime: "",
    eventDate: "",
    paymentAmount: "125",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [djs, setDJs] = useState<DJData[]>([]);
  const [selectedDJId, setSelectedDJId] = useState<string>("");
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [agreementSentManually, setAgreementSentManually] = useState(false);

  // Load DJs on component mount
  useEffect(() => {
    const loadDJs = async () => {
      try {
        // Check Firestore status first
        const firestoreStatus = await checkFirestoreStatus();
        if (!firestoreStatus.available) {
          console.log("Firestore not available:", firestoreStatus.error);
          setDJs([]);
          return;
        }

        const djsData = await getAllDJs();
        setDJs(djsData);
      } catch (error) {
        console.error("Failed to load DJs:", error);
        // Set empty array so form still works without DJs
        setDJs([]);
      }
    };
    loadDJs();
  }, []);

  // Auto-populate form when DJ is selected
  const handleDJSelection = (djId: string) => {
    if (djId === "manual") {
      setIsManualEntry(true);
      setSelectedDJId("");
      return;
    }

    setIsManualEntry(false);
    setSelectedDJId(djId);
    
    const selectedDJ = djs.find(dj => dj.id === djId);
    if (selectedDJ) {
      setFormData(prev => ({
        ...prev,
        djName: selectedDJ.djName,
        djLegalName: selectedDJ.fullName || selectedDJ.djName,
        email: selectedDJ.email || "",
        phone: selectedDJ.phone || "",
      }));
      
      // Clear any existing errors for auto-populated fields
      setErrors(prev => ({
        ...prev,
        djName: "",
        djLegalName: "",
        email: selectedDJ.email ? "" : prev.email,
        phone: selectedDJ.phone ? "" : prev.phone,
      }));
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phone.length >= 10 && phoneRegex.test(phone);
  };

  const validateRequired = (value: string, fieldName: string) => {
    if (!value.trim()) {
      return `${fieldName} is required`;
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleTimeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      setStartTime: value,
    }));

    // Clear error when user starts typing
    if (errors.setStartTime) {
      setErrors((prev) => ({
        ...prev,
        setStartTime: "",
      }));
    }
  };

  const handleDateChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      eventDate: value,
    }));

    // Clear error when user starts typing
    if (errors.eventDate) {
      setErrors((prev) => ({
        ...prev,
        eventDate: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    // Validate all required fields
    const newErrors: Partial<FormData> = {};
    
    const legalNameError = validateRequired(formData.djLegalName, "Legal Name");
    if (legalNameError) newErrors.djLegalName = legalNameError;
    
    const djNameError = validateRequired(formData.djName, "DJ Name");
    if (djNameError) newErrors.djName = djNameError;
    
    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    const timeError = validateRequired(formData.setStartTime, "Set Start Time");
    if (timeError) newErrors.setStartTime = timeError;
    
    const dateError = validateRequired(formData.eventDate, "Event Date");
    if (dateError) newErrors.eventDate = dateError;
    
    if (formData.paymentAmount && isNaN(Number(formData.paymentAmount))) {
      newErrors.paymentAmount = "Payment amount must be a number";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Store in Firestore with djId if DJ was selected from database
      const bookingData = {
        ...formData,
        role: "DJ", // Add role field for DJ bookings
        ...(selectedDJId && !isManualEntry ? { djId: selectedDJId } : {}),
        ...(agreementSentManually ? { agreementSentManually: true } : {})
      };
      const bookingId = await createBooking(bookingData);
      
      // Only send to webhook if agreement wasn't sent manually
      if (!agreementSentManually) {
        try {
          const response = await fetch("/api/webhook", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...bookingData, bookingId }),
          });

          if (response.ok) {
            const webhookResponse = await response.json();
            
            // Check if we got a guest list link back
            if (webhookResponse.guestListLink) {
              // Update the booking with the guest list link
              await updateBooking(bookingId, { 
                guestListLink: webhookResponse.guestListLink 
              });
            }
          } else {
            console.warn("Webhook failed, but booking saved to database");
          }
        } catch (webhookError) {
          console.warn("Webhook failed:", webhookError);
        }
      }

      setSubmitStatus({
        type: "success",
        message: agreementSentManually 
          ? "DJ booking submitted successfully! Agreement marked as sent manually."
          : "DJ booking submitted successfully! We'll be in touch soon.",
      });
      setFormData({
        djLegalName: "",
        djName: "",
        email: "",
        phone: "",
        setStartTime: "",
        eventDate: "",
        paymentAmount: "125",
      });
      setErrors({});
      setAgreementSentManually(false);
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitStatus({
        type: "error",
        message: "Failed to submit booking. Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-8">
          <Image
            src="/sushi-sundays-logo.png"
            alt="Sushi Sundays"
            width={200}
            height={200}
            className="object-contain"
          />
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-8">DJ Booking Form</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hidden Role Field */}
          <input type="hidden" name="role" value="DJ" />
          
          {/* DJ Selection */}
          <div className="space-y-2">
            <Label htmlFor="djSelect">Select DJ (or enter manually)</Label>
            <Select value={selectedDJId || "manual"} onValueChange={handleDJSelection}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a DJ from database or enter manually" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Enter manually</SelectItem>
                {djs.map((dj) => (
                  <SelectItem key={dj.id} value={dj.id || ''}>
                    {dj.djName} {dj.fullName && `(${dj.fullName})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {djs.length === 0 && (
              <p className="text-sm text-gray-500">
                DJ database not available. <Link href="/admin/djs" className="text-blue-600 hover:text-blue-800 underline">Set up database</Link> or use manual entry.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="djLegalName">Legal Name *</Label>
              <Input
                id="djLegalName"
                name="djLegalName"
                value={formData.djLegalName}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className={errors.djLegalName ? "border-red-500" : ""}
                readOnly={!isManualEntry && selectedDJId !== ""}
              />
              {errors.djLegalName && (
                <p className="text-sm text-red-500">{errors.djLegalName}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="djName">DJ Name *</Label>
              <Input
                id="djName"
                name="djName"
                value={formData.djName}
                onChange={handleChange}
                required
                placeholder="DJ Cool"
                className={errors.djName ? "border-red-500" : ""}
                readOnly={!isManualEntry && selectedDJId !== ""}
              />
              {errors.djName && (
                <p className="text-sm text-red-500">{errors.djName}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="dj@example.com"
                className={errors.email ? "border-red-500" : ""}
                readOnly={!isManualEntry && selectedDJId !== ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="123-456-7890"
                className={errors.phone ? "border-red-500" : ""}
                readOnly={!isManualEntry && selectedDJId !== ""}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="setStartTime">Set Start Time *</Label>
              <TimePicker
                value={formData.setStartTime}
                onChange={handleTimeChange}
                placeholder="Select start time"
              />
              {errors.setStartTime && (
                <p className="text-sm text-red-500">{errors.setStartTime}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date *</Label>
              <DatePicker
                value={formData.eventDate}
                onChange={handleDateChange}
                placeholder="Select event date"
                minDate={new Date()}
              />
              {errors.eventDate && (
                <p className="text-sm text-red-500">{errors.eventDate}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Payment Amount ($)</Label>
              <Input
                id="paymentAmount"
                name="paymentAmount"
                type="number"
                value={formData.paymentAmount}
                onChange={handleChange}
                placeholder="125"
                min="0"
                step="0.01"
                className={errors.paymentAmount ? "border-red-500" : ""}
              />
              {errors.paymentAmount && (
                <p className="text-sm text-red-500">{errors.paymentAmount}</p>
              )}
            </div>
          </div>
          
          {/* Manual Agreement Option */}
          <div className="flex items-center space-x-2 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <Checkbox
              id="agreementSentManually"
              checked={agreementSentManually}
              onCheckedChange={(checked) => setAgreementSentManually(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="agreementSentManually"
                className="text-sm font-medium text-amber-800 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Agreement sent manually
              </label>
              <p className="text-xs text-amber-600">
                Check this if you've already sent the booking agreement via email, text, or other means. This will prevent the system from sending an automated email.
              </p>
            </div>
          </div>
          
          {submitStatus.type && (
            <div
              className={`p-4 rounded-md ${
                submitStatus.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {submitStatus.message}
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Book DJ"}
          </Button>
        </form>
      </div>
    </div>
  );
}