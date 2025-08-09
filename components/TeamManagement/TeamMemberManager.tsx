"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Mail, 
  Phone, 
  UserCheck,
  Crown,
  Database,
  Link as LinkIcon
} from "lucide-react";
import { 
  TeamMember, 
  addTeamMember, 
  updateTeamMember, 
  removeTeamMember,
  getTeamMembersByType,
  calculateTeamMemberCosts
} from "@/lib/event-instances-firestore";
import { getAllTeamMembers, createTeamMember, TeamMemberData } from "@/lib/team-firestore";
import { checkFirestoreStatus } from "@/lib/firebase-status";
import { createOrUpdateGuestList } from "@/lib/guest-list-firestore";
import Link from "next/link";
import RSVPLinkButton from "@/components/RSVPLinkButton";

interface TeamMemberManagerProps {
  instanceId: string;
  teamMembers: TeamMember[];
  onTeamMemberChange: () => void;
  eventName?: string;
  eventDate?: string;
  venue?: string;
}

export default function TeamMemberManager({ 
  instanceId, 
  teamMembers, 
  onTeamMemberChange,
  eventName = 'Event',
  eventDate = new Date().toISOString().split('T')[0],
  venue = 'Venue'
}: TeamMemberManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    paymentAmount: 0,
    isVolunteer: false,
    teamType: "team" as 'management' | 'team',
    notes: "",
    guestListLink: ""
  });

  // Database team member selection
  const [databaseTeamMembers, setDatabaseTeamMembers] = useState<TeamMemberData[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [saveToDatabase, setSaveToDatabase] = useState(false);
  
  // Guest list editing state
  const [editingGuestList, setEditingGuestList] = useState<{memberId: string, link: string} | null>(null);

  const managementTeam = teamMembers.filter(member => member.teamType === 'management');
  const regularTeam = teamMembers.filter(member => member.teamType === 'team');

  // Load database team members on component mount
  useEffect(() => {
    const loadDatabaseTeamMembers = async () => {
      try {
        // Check Firestore status first
        const firestoreStatus = await checkFirestoreStatus();
        if (!firestoreStatus.available) {
          console.log("Firestore not available:", firestoreStatus.error);
          setDatabaseTeamMembers([]);
          return;
        }

        const members = await getAllTeamMembers();
        setDatabaseTeamMembers(members);
      } catch (error) {
        console.error("Failed to load database team members:", error);
        setDatabaseTeamMembers([]);
      }
    };
    loadDatabaseTeamMembers();
  }, []);

  // Handle team member selection from database
  const handleTeamMemberSelection = (memberId: string) => {
    if (memberId === "manual") {
      setIsManualEntry(true);
      setSelectedMemberId("");
      return;
    }

    setIsManualEntry(false);
    setSelectedMemberId(memberId);
    
    const selectedMember = databaseTeamMembers.find(member => member.id === memberId);
    if (selectedMember) {
      // Auto-populate form with selected member's data
      const primaryRole = selectedMember.preferredRoles.length > 0 ? selectedMember.preferredRoles[0] : "";
      setFormData({
        name: selectedMember.name,
        email: selectedMember.email || "",
        phone: selectedMember.phone || "",
        role: primaryRole,
        paymentAmount: selectedMember.isVolunteerByDefault ? 0 : selectedMember.defaultPaymentAmount,
        isVolunteer: selectedMember.isVolunteerByDefault,
        teamType: selectedMember.teamType,
        notes: selectedMember.notes || "",
        guestListLink: ""
      });
      setSaveToDatabase(false); // Don't save to database since it's already there
    }
  };

  const handleAddMember = async () => {
    try {
      // Add team member to the event instance
      const memberResult = await addTeamMember(instanceId, formData);
      
      // Create guest list record if link provided
      if (formData.guestListLink && formData.guestListLink.trim()) {
        try {
          // Get the ID of the newly created team member
          const newMemberId = memberResult && memberResult.length > 0 
            ? memberResult[memberResult.length - 1].id 
            : `${formData.email}-${Date.now()}`;
            
          await createOrUpdateGuestList(
            instanceId,
            newMemberId || `${formData.email}-${Date.now()}`, // Use email as fallback ID
            'team_member',
            {
              eventName,
              eventDate,
              venue,
              assigneeName: formData.name,
              assigneeEmail: formData.email || '',
              assigneeRole: formData.role,
              guestListLink: formData.guestListLink.trim(),
              isActive: true
            }
          );
        } catch (guestListError) {
          console.error("Error creating guest list record:", guestListError);
          // Don't fail the main operation, just log the error
        }
      }
      
      // Optionally save new team member to database for future use
      if (isManualEntry && saveToDatabase && formData.name.trim()) {
        try {
          await createTeamMember({
            name: formData.name,
            email: formData.email || "",
            phone: formData.phone || "",
            preferredRoles: formData.role ? [formData.role] : [],
            defaultPaymentAmount: formData.isVolunteer ? 0 : formData.paymentAmount,
            isVolunteerByDefault: formData.isVolunteer,
            teamType: formData.teamType,
            notes: formData.notes || "",
            eventsWorked: ""
          });
          console.log("Team member saved to database for future use");
          
          // Reload database members to include the new one
          const members = await getAllTeamMembers();
          setDatabaseTeamMembers(members);
        } catch (dbError) {
          console.warn("Failed to save team member to database:", dbError);
          // Don't fail the main operation if database save fails
        }
      }
      
      onTeamMemberChange();
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      console.error("Error adding team member:", err);
      alert("Failed to add team member");
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember?.id) return;

    try {
      await updateTeamMember(instanceId, editingMember.id, formData);
      onTeamMemberChange();
      setEditingMember(null);
      resetForm();
    } catch (err) {
      console.error("Error updating team member:", err);
      alert("Failed to update team member");
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to remove this team member?");
    if (!confirmDelete) return;

    try {
      await removeTeamMember(instanceId, memberId);
      onTeamMemberChange();
    } catch (err) {
      console.error("Error removing team member:", err);
      alert("Failed to remove team member");
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      paymentAmount: member.paymentAmount,
      isVolunteer: member.isVolunteer,
      teamType: member.teamType,
      notes: member.notes || "",
      guestListLink: member.guestListLink || ""
    });
    setEditingMember(member);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
      paymentAmount: 0,
      isVolunteer: false,
      teamType: "team",
      notes: "",
      guestListLink: ""
    });
    setSelectedMemberId("");
    setIsManualEntry(false);
    setSaveToDatabase(false);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingMember(null);
    resetForm();
  };

  const handleEditTeamMemberGuestList = (memberId: string, currentLink: string) => {
    setEditingGuestList({ memberId, link: currentLink });
  };

  const handleSaveTeamMemberGuestList = async () => {
    if (!editingGuestList) return;

    const trimmedLink = editingGuestList.link.trim();
    if (!trimmedLink) {
      alert("Please enter a valid guest list link");
      return;
    }

    try {
      const member = teamMembers.find(m => m.id === editingGuestList.memberId);
      if (member) {
        // Update the team member record with the guest list link
        await updateTeamMember(instanceId, member.id!, {
          ...member,
          guestListLink: trimmedLink
        });
        
        // Also create/update the guest list record
        await createOrUpdateGuestList(
          instanceId,
          member.id!,
          'team_member',
          {
            eventName,
            eventDate,
            venue,
            assigneeName: member.name,
            assigneeEmail: member.email || '',
            assigneeRole: member.role,
            guestListLink: trimmedLink,
            isActive: true
          }
        );
        
        // Refresh the team members data
        onTeamMemberChange();
      }
      
      setEditingGuestList(null);
    } catch (err) {
      console.error("Error updating team member guest list:", err);
      alert("Failed to update guest list link");
    }
  };

  const handleCancelTeamMemberGuestListEdit = () => {
    setEditingGuestList(null);
  };

  const costs = {
    management: managementTeam.filter(m => !m.isVolunteer).reduce((sum, m) => sum + m.paymentAmount, 0),
    team: regularTeam.filter(m => !m.isVolunteer).reduce((sum, m) => sum + m.paymentAmount, 0)
  };

  const renderTeamMemberCard = (member: TeamMember) => (
    <div key={member.id} className="border rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium text-lg">{member.name}</h3>
            <Badge variant={member.teamType === 'management' ? 'default' : 'secondary'}>
              {member.role}
            </Badge>
            {member.isVolunteer && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <UserCheck className="h-3 w-3 mr-1" />
                Volunteer
              </Badge>
            )}
            {member.teamType === 'management' && (
              <Crown className="h-4 w-4 text-yellow-600" />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              {member.email}
            </div>
            <div className="flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              {member.phone}
            </div>
            <div>
              <strong>Payment:</strong> {member.isVolunteer ? 'Volunteer' : `$${member.paymentAmount}`}
            </div>
            <div>
              <strong>Team:</strong> {member.teamType === 'management' ? 'Management' : 'Regular Team'}
            </div>
          </div>
          {member.notes && (
            <div className="mt-2 text-sm text-gray-600">
              <strong>Notes:</strong> {member.notes}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => handleEditMember(member)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => handleDeleteMember(member.id!)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="mb-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-medium mb-4">
        {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
      </h3>
      <div className="space-y-4">
        {/* Team Member Selection - Only show when adding new member */}
        {!editingMember && (
          <div className="space-y-2">
            <Label htmlFor="teamMemberSelect">Select Team Member (or enter manually)</Label>
            <Select value={selectedMemberId || "manual"} onValueChange={handleTeamMemberSelection}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a team member from database or enter manually" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Enter manually</SelectItem>
                {databaseTeamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id || ''}>
                    <div className="flex items-center gap-2">
                      {member.name}
                      {member.teamType === 'management' && <Crown className="h-3 w-3 text-yellow-600" />}
                      {member.preferredRoles.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ({member.preferredRoles[0]}) - ${member.isVolunteerByDefault ? 'Volunteer' : member.defaultPaymentAmount}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {databaseTeamMembers.length === 0 && (
              <p className="text-sm text-gray-500">
                Team database not available. <Link href="/admin/team" className="text-blue-600 hover:text-blue-800 underline">Manage team database</Link> or use manual entry.
              </p>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Full name"
              readOnly={!isManualEntry && selectedMemberId !== ""}
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              placeholder="e.g., Event Coordinator, Security, Setup Crew"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="email@example.com"
              readOnly={!isManualEntry && selectedMemberId !== ""}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="(555) 123-4567"
              readOnly={!isManualEntry && selectedMemberId !== ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="teamType">Team Type</Label>
            <Select 
              value={formData.teamType} 
              onValueChange={(value) => setFormData({...formData, teamType: value as 'management' | 'team'})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Regular Team</SelectItem>
                <SelectItem value="management">Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="isVolunteer"
              checked={formData.isVolunteer}
              onCheckedChange={(checked) => setFormData({
                ...formData, 
                isVolunteer: checked as boolean,
                paymentAmount: checked ? 0 : formData.paymentAmount
              })}
            />
            <Label htmlFor="isVolunteer">Volunteer (no payment)</Label>
          </div>
          {!formData.isVolunteer && (
            <div>
              <Label htmlFor="paymentAmount">Payment Amount ($)</Label>
              <Input
                id="paymentAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.paymentAmount}
                onChange={(e) => setFormData({...formData, paymentAmount: parseFloat(e.target.value) || 0})}
              />
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows={2}
            placeholder="Additional notes about this team member..."
          />
        </div>

        <div>
          <Label htmlFor="guestListLink">Guest List Link (optional)</Label>
          <Input
            id="guestListLink"
            type="url"
            value={formData.guestListLink}
            onChange={(e) => setFormData({...formData, guestListLink: e.target.value})}
            placeholder="https://example.com/guest-list"
          />
        </div>

        {/* Save to Database option - Only show for manual entries and when adding new members */}
        {isManualEntry && !editingMember && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Database className="h-4 w-4 text-blue-600" />
            <Checkbox
              id="saveToDatabase"
              checked={saveToDatabase}
              onCheckedChange={(checked) => setSaveToDatabase(checked as boolean)}
            />
            <Label htmlFor="saveToDatabase" className="text-sm">
              Save this team member to database for future events
            </Label>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={editingMember ? handleUpdateMember : handleAddMember}
            disabled={!formData.name || !formData.role || !formData.email}
          >
            <Save className="h-4 w-4 mr-2" />
            {editingMember ? 'Update' : 'Add'} Team Member
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Cost Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Management Team Cost</p>
                <p className="text-2xl font-bold">${costs.management}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Regular Team Cost</p>
                <p className="text-2xl font-bold">${costs.team}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Team Cost</p>
                <p className="text-2xl font-bold">${costs.management + costs.team}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Team */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                Management Team
              </CardTitle>
              <CardDescription>
                {managementTeam.length} member{managementTeam.length !== 1 ? 's' : ''} assigned
              </CardDescription>
            </div>
            <Button onClick={() => {
              setFormData({...formData, teamType: 'management'});
              setShowAddForm(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Management
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(showAddForm && formData.teamType === 'management') && renderForm()}
          {editingMember && editingMember.teamType === 'management' && renderForm()}
          
          {managementTeam.length === 0 ? (
            <div className="text-center py-8">
              <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No management team assigned</h3>
              <p className="text-gray-500">Add management staff to oversee this event.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {managementTeam.map((member) => (
                <div key={member.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{member.name}</h3>
                        <Badge variant={member.teamType === 'management' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                        {member.isVolunteer && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Volunteer
                          </Badge>
                        )}
                        {member.teamType === 'management' && (
                          <Crown className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {member.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {member.phone}
                        </div>
                        <div>
                          <strong>Payment:</strong> {member.isVolunteer ? 'Volunteer' : `$${member.paymentAmount}`}
                        </div>
                        <div>
                          <strong>Team:</strong> {member.teamType === 'management' ? 'Management' : 'Regular Team'}
                        </div>
                        <div className="flex items-center gap-2">
                          <strong>Guest List:</strong> 
                          <RSVPLinkButton
                            eventInstanceId={instanceId}
                            assigneeType="team_member"
                            assigneeId={member.id!}
                            assigneeName={member.name}
                            assigneeEmail={member.email}
                            existingLink={member.guestListLink}
                            variant="outline"
                            size="sm"
                            showIcon={false}
                          />
                        </div>
                      </div>
                      {member.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Notes:</strong> {member.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEditMember(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDeleteMember(member.id!)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regular Team */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Team Members
              </CardTitle>
              <CardDescription>
                {regularTeam.length} member{regularTeam.length !== 1 ? 's' : ''} assigned
              </CardDescription>
            </div>
            <Button onClick={() => {
              setFormData({...formData, teamType: 'team'});
              setShowAddForm(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(showAddForm && formData.teamType === 'team') && renderForm()}
          {editingMember && editingMember.teamType === 'team' && renderForm()}
          
          {regularTeam.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members assigned</h3>
              <p className="text-gray-500">Add team members to help run this event.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {regularTeam.map((member) => (
                <div key={member.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{member.name}</h3>
                        <Badge variant={member.teamType === 'management' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                        {member.isVolunteer && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Volunteer
                          </Badge>
                        )}
                        {member.teamType === 'management' && (
                          <Crown className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {member.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {member.phone}
                        </div>
                        <div>
                          <strong>Payment:</strong> {member.isVolunteer ? 'Volunteer' : `$${member.paymentAmount}`}
                        </div>
                        <div>
                          <strong>Team:</strong> {member.teamType === 'management' ? 'Management' : 'Regular Team'}
                        </div>
                        <div className="flex items-center gap-2">
                          <strong>Guest List:</strong> 
                          <RSVPLinkButton
                            eventInstanceId={instanceId}
                            assigneeType="team_member"
                            assigneeId={member.id!}
                            assigneeName={member.name}
                            assigneeEmail={member.email}
                            existingLink={member.guestListLink}
                            variant="outline"
                            size="sm"
                            showIcon={false}
                          />
                        </div>
                      </div>
                      {member.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Notes:</strong> {member.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEditMember(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDeleteMember(member.id!)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Guest List Edit Modal */}
      {editingGuestList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Edit Guest List Link</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="guestListUrl">Guest List URL</Label>
                <Input
                  id="guestListUrl"
                  type="url"
                  value={editingGuestList.link}
                  onChange={(e) => setEditingGuestList({...editingGuestList, link: e.target.value})}
                  placeholder="https://example.com/guest-list"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleCancelTeamMemberGuestListEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTeamMemberGuestList}>
                  Save Guest List
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}