"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  createTeamMember, 
  getTeamMembersByEventId, 
  updateTeamMember, 
  deleteTeamMember, 
  TeamMemberData 
} from "@/lib/team-members-firestore";
import { formatCurrency } from "@/lib/financial-utils";
import { Plus, Edit2, Trash2, Save, X, Users } from "lucide-react";
import { Timestamp } from "firebase/firestore";

interface TeamManagerProps {
  eventId: string;
  onTeamChange?: () => void;
}

export default function TeamManager({ eventId, onTeamChange }: TeamManagerProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TeamMemberData>>({
    role: 'assistant',
    paymentAmount: 0,
    paymentStatus: 'pending'
  });

  const teamRoles = [
    { value: 'photographer', label: 'Photographer' },
    { value: 'videographer', label: 'Videographer' },
    { value: 'security', label: 'Security' },
    { value: 'manager', label: 'Manager' },
    { value: 'assistant', label: 'Assistant' },
    { value: 'promoter', label: 'Promoter' },
    { value: 'technician', label: 'Technician' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadTeamMembers();
  }, [eventId]);

  const loadTeamMembers = async () => {
    try {
      const data = await getTeamMembersByEventId(eventId);
      setTeamMembers(data);
    } catch (error) {
      console.error("Error loading team members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.paymentAmount) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const memberData = {
        ...formData,
        eventId,
        name: formData.name!,
        role: formData.role as any,
        paymentAmount: formData.paymentAmount!,
        paymentStatus: formData.paymentStatus as any,
        ...(formData.paymentStatus === 'paid' && !formData.paidAt ? { paidAt: Timestamp.now() } : {})
      };

      if (editingId) {
        await updateTeamMember(editingId, memberData);
      } else {
        await createTeamMember(memberData);
      }

      await loadTeamMembers();
      resetForm();
      if (onTeamChange) onTeamChange();
    } catch (error) {
      console.error("Error saving team member:", error);
      alert("Failed to save team member");
    }
  };

  const handleEdit = (member: TeamMemberData) => {
    setEditingId(member.id!);
    setFormData(member);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team member?")) return;

    try {
      await deleteTeamMember(id);
      await loadTeamMembers();
      if (onTeamChange) onTeamChange();
    } catch (error) {
      console.error("Error deleting team member:", error);
      alert("Failed to delete team member");
    }
  };

  const resetForm = () => {
    setFormData({
      role: 'assistant',
      paymentAmount: 0,
      paymentStatus: 'pending'
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const totalPayments = teamMembers.reduce((sum, member) => sum + member.paymentAmount, 0);
  const paidPayments = teamMembers
    .filter(member => member.paymentStatus === 'paid')
    .reduce((sum, member) => sum + member.paymentAmount, 0);

  if (loading) {
    return <div>Loading team members...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>
              Total: {formatCurrency(totalPayments)} • Paid: {formatCurrency(paidPayments)}
            </CardDescription>
          </div>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Team member name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {teamRoles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  placeholder="(555) 123-4567"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentAmount">Payment Amount *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  placeholder="0.00"
                  value={formData.paymentAmount || ''}
                  onChange={(e) => setFormData({ ...formData, paymentAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select 
                  value={formData.paymentStatus} 
                  onValueChange={(value) => setFormData({ ...formData, paymentStatus: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes"
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Update' : 'Save'}
              </Button>
              <Button onClick={resetForm} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Team Members List */}
        <div className="space-y-2">
          {teamMembers.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No team members added yet</p>
          ) : (
            teamMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{member.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {teamRoles.find(r => r.value === member.role)?.label || member.role}
                    </Badge>
                    <Badge 
                      variant={
                        member.paymentStatus === 'paid' ? 'default' : 
                        member.paymentStatus === 'cancelled' ? 'destructive' : 
                        'secondary'
                      } 
                      className="text-xs"
                    >
                      {member.paymentStatus}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formatCurrency(member.paymentAmount)}
                    {member.email && ` • ${member.email}`}
                    {member.phone && ` • ${member.phone}`}
                  </div>
                  {member.notes && (
                    <div className="text-xs text-gray-500 mt-1">{member.notes}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(member)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(member.id!)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}