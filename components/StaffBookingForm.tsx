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
import { getAllTeamMembers, TeamMemberData } from "@/lib/team-members-firestore";
import { checkFirestoreStatus } from "@/lib/firebase-status";

interface FormData {
  teamMemberLegalName: string;
  teamMemberName: string;
  email: string;
  phone: string;
  eventStartTime: string;
  eventDate: string;
  paymentAmount: string;
  position: string;
}

export default function StaffBookingForm() {
  const [formData, setFormData] = useState<FormData>({
    teamMemberLegalName: "",
    teamMemberName: "",
    email: "",
    phone: "",
    eventStartTime: "",
    eventDate: "",
    paymentAmount: "125",
    position: "STAFF", // Default position
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMemberData[]>([]);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>("");
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [agreementSentManually, setAgreementSentManually] = useState(false);
  const [isPrePopulated, setIsPrePopulated] = useState(false);

  // Load Team Members on component mount
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        // Check Firestore status first
        const firestoreStatus = await checkFirestoreStatus();
        if (!firestoreStatus.available) {
          console.log("Firestore not available:", firestoreStatus.error);
          setTeamMembers([]);
          return;
        }

        const teamMembersData = await getAllTeamMembers();
        setTeamMembers(teamMembersData);
      } catch (error) {
        console.error("Failed to load team members:", error);
        // Set empty array so form still works without team members
        setTeamMembers([]);
      }
    };
    loadTeamMembers();
  }, []);

  // Auto-populate form when team member is selected
  const handleTeamMemberSelection = (teamMemberId: string) => {
    if (teamMemberId === "manual") {
      setIsManualEntry(true);
      setSelectedTeamMemberId("");
      setIsPrePopulated(false);
      return;
    }

    setIsManualEntry(false);
    setSelectedTeamMemberId(teamMemberId);
    
    const selectedTeamMember = teamMembers.find(member => member.id === teamMemberId);
    if (selectedTeamMember) {
      setIsPrePopulated(true);
      setFormData(prev => ({
        ...prev,
        teamMemberName: selectedTeamMember.name,
        teamMemberLegalName: selectedTeamMember.name, // Using name as legal name for now
        email: selectedTeamMember.email || "",
        phone: selectedTeamMember.phone || "",
        position: selectedTeamMember.role?.toUpperCase() || "STAFF",
      }));
      
      // Clear any existing errors for auto-populated fields
      setErrors(prev => ({
        ...prev,
        teamMemberName: "",
        teamMemberLegalName: "",
        email: selectedTeamMember.email ? "" : prev.email,
        phone: selectedTeamMember.phone ? "" : prev.phone,
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
      eventStartTime: value,
    }));

    // Clear error when user starts typing
    if (errors.eventStartTime) {
      setErrors((prev) => ({
        ...prev,
        eventStartTime: "",
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
    
    const legalNameError = validateRequired(formData.teamMemberLegalName, "Legal Name");
    if (legalNameError) newErrors.teamMemberLegalName = legalNameError;
    
    const teamMemberNameError = validateRequired(formData.teamMemberName, "Team Member Name");
    if (teamMemberNameError) newErrors.teamMemberName = teamMemberNameError;
    
    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    const timeError = validateRequired(formData.eventStartTime, "Event Start Time");
    if (timeError) newErrors.eventStartTime = timeError;
    
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
      // Prepare webhook data with consistent naming for n8n
      const webhookData = {
        djLegalName: formData.teamMemberLegalName, // Map to expected field name
        djName: formData.teamMemberName, // Map to expected field name
        email: formData.email,
        phone: formData.phone,
        setStartTime: formData.eventStartTime, // Map to expected field name
        eventDate: formData.eventDate,
        paymentAmount: formData.paymentAmount,
        role: "STAFF", // Always send STAFF for staff bookings
        position: formData.position, // Send the selected position
      };

      // Store in Firestore with teamMemberId if selected from database
      const bookingData = {
        ...webhookData,
        bookingType: 'staff', // To distinguish from DJ bookings
        ...(selectedTeamMemberId && !isManualEntry ? { teamMemberId: selectedTeamMemberId } : {}),
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
            body: JSON.stringify({ ...webhookData, bookingId }),
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
          ? "Staff booking submitted successfully! Agreement marked as sent manually."
          : "Staff booking submitted successfully! We'll be in touch soon.",
      });
      setFormData({
        teamMemberLegalName: "",
        teamMemberName: "",
        email: "",
        phone: "",
        eventStartTime: "",
        eventDate: "",
        paymentAmount: "125",
        position: "STAFF",
      });
      setErrors({});
      setAgreementSentManually(false);
      setSelectedTeamMemberId("");
      setIsPrePopulated(false);
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
        
        <h1 className="text-3xl font-bold text-center mb-8">Staff Booking Form</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hidden Role Field */}
          <input type="hidden" name="role" value="STAFF" />
          
          {/* Team Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="teamMemberSelect">Select Team Member (or enter manually)</Label>
            <Select value={selectedTeamMemberId || "manual"} onValueChange={handleTeamMemberSelection}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a team member from database or enter manually" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Enter manually</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id || ''}>
                    {member.name} {member.role && `(${member.role})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {teamMembers.length === 0 && (
              <p className="text-sm text-gray-500">
                Team member database not available. <Link href="/admin/team" className="text-blue-600 hover:text-blue-800 underline">Set up database</Link> or use manual entry.
              </p>
            )}
            {isPrePopulated && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  ✏️ Fields have been pre-populated with team member data. You can edit any field as needed before booking.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="teamMemberLegalName">Legal Name *</Label>
              <Input
                id="teamMemberLegalName"
                name="teamMemberLegalName"
                value={formData.teamMemberLegalName}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className={errors.teamMemberLegalName ? "border-red-500" : ""}
              />
              {errors.teamMemberLegalName && (
                <p className="text-sm text-red-500">{errors.teamMemberLegalName}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="teamMemberName">Team Member Name *</Label>
              <Input
                id="teamMemberName"
                name="teamMemberName"
                value={formData.teamMemberName}
                onChange={handleChange}
                required
                placeholder="John"
                className={errors.teamMemberName ? "border-red-500" : ""}
              />
              {errors.teamMemberName && (
                <p className="text-sm text-red-500">{errors.teamMemberName}</p>
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
                placeholder="john@example.com"
                className={errors.email ? "border-red-500" : ""}
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
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                <SelectTrigger className={errors.position ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="PHOTOGRAPHER">Photographer</SelectItem>
                  <SelectItem value="VIDEOGRAPHER">Videographer</SelectItem>
                  <SelectItem value="SECURITY">Security</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ASSISTANT">Assistant</SelectItem>
                  <SelectItem value="PROMOTER">Promoter</SelectItem>
                  <SelectItem value="TECHNICIAN">Technician</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.position && (
                <p className="text-sm text-red-500">{errors.position}</p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="eventStartTime">Event Start Time *</Label>
              <TimePicker
                value={formData.eventStartTime}
                onChange={handleTimeChange}
                placeholder="Select start time"
              />
              {errors.eventStartTime && (
                <p className="text-sm text-red-500">{errors.eventStartTime}</p>
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
            {isSubmitting ? "Submitting..." : "Book Staff Member"}
          </Button>
        </form>
      </div>
    </div>
  );
}