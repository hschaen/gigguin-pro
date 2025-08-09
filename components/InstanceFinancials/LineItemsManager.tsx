"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  createLineItem, 
  getLineItemsByInstanceId, 
  updateLineItem, 
  deleteLineItem, 
  copyLineItemsToInstance,
  LineItemData,
  REVENUE_CATEGORIES,
  EXPENSE_CATEGORIES
} from "@/lib/instance-line-items-firestore";
import { EventInstanceData } from "@/lib/event-instances-firestore";
import { Plus, Edit2, Trash2, Save, X, Copy, DollarSign, Receipt } from "lucide-react";

interface LineItemsManagerProps {
  instanceId: string;
  instance: EventInstanceData;
  onItemChange?: () => void;
  availableInstances?: Array<{ id: string; eventName: string; eventDate: string; venue: string }>;
}

export default function LineItemsManager({ instanceId, instance, onItemChange, availableInstances = [] }: LineItemsManagerProps) {
  const [lineItems, setLineItems] = useState<LineItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [targetInstanceId, setTargetInstanceId] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [formData, setFormData] = useState<Partial<LineItemData>>({
    type: 'expense',
    category: 'other',
    amount: 0,
    isPaid: false
  });

  useEffect(() => {
    loadLineItems();
  }, [instanceId]);

  useEffect(() => {
    if (instance) {
      const timeoutId = setTimeout(() => {
        syncDJAndTeamLineItems();
      }, 100); // Small delay to prevent multiple rapid calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [JSON.stringify(instance?.djAssignments), JSON.stringify(instance?.teamMembers)]);

  const syncDJAndTeamLineItems = async () => {
    if (!instance || isSyncing) return;
    
    setIsSyncing(true);
    console.log('Starting sync of DJ and team line items...');

    try {
      // Get current line items to check what's already synced
      const currentItems = await getLineItemsByInstanceId(instanceId);
      const autoSyncedItems = currentItems.filter(item => item.category === 'auto-sync-dj' || item.category === 'auto-sync-team');

      // Remove existing auto-synced items
      console.log(`Found ${autoSyncedItems.length} existing auto-synced items to remove`);
      const deletePromises = autoSyncedItems.map(item => {
        if (item.id) {
          console.log(`Deleting auto-synced item: ${item.description}`);
          return deleteLineItem(item.id);
        }
        return Promise.resolve();
      });
      
      await Promise.all(deletePromises);
      console.log('All existing auto-synced items removed');

      // Add DJ assignments as expense items
      if (instance.djAssignments && instance.djAssignments.length > 0) {
        console.log(`Creating ${instance.djAssignments.length} DJ assignment line items`);
        for (const djAssignment of instance.djAssignments) {
          if (djAssignment.paymentAmount && parseFloat(djAssignment.paymentAmount) > 0) {
            const description = `DJ Payment: ${djAssignment.djName} (${djAssignment.setStartTime})`;
            console.log(`Creating DJ line item: ${description} - $${djAssignment.paymentAmount}`);
            await createLineItem({
              instanceId,
              type: 'expense',
              category: 'auto-sync-dj',
              description,
              amount: parseFloat(djAssignment.paymentAmount),
              isPaid: false,
              notes: `Auto-synced from DJ assignment. Set: ${djAssignment.setStartTime}`
            });
          }
        }
      }

      // Add team members as expense items
      if (instance.teamMembers && instance.teamMembers.length > 0) {
        console.log(`Creating ${instance.teamMembers.filter(tm => !tm.isVolunteer && tm.paymentAmount > 0).length} team member line items`);
        for (const teamMember of instance.teamMembers) {
          if (!teamMember.isVolunteer && teamMember.paymentAmount && teamMember.paymentAmount > 0) {
            const description = `Team Payment: ${teamMember.name} (${teamMember.role})`;
            console.log(`Creating team line item: ${description} - $${teamMember.paymentAmount}`);
            await createLineItem({
              instanceId,
              type: 'expense',
              category: 'auto-sync-team',
              description,
              amount: teamMember.paymentAmount,
              isPaid: false,
              notes: `Auto-synced from team member assignment. Type: ${teamMember.teamType}`
            });
          }
        }
      }

      // Reload line items to show the synced data
      await loadLineItems();
      if (onItemChange) onItemChange();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Error syncing DJ and team line items:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadLineItems = async () => {
    try {
      const data = await getLineItemsByInstanceId(instanceId);
      setLineItems(data);
    } catch (error) {
      console.error("Error loading line items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.description || !formData.amount) {
      alert("Please fill in description and amount");
      return;
    }

    try {
      if (editingId) {
        await updateLineItem(editingId, formData);
      } else {
        await createLineItem({
          ...formData,
          instanceId,
          description: formData.description!,
          amount: formData.amount!,
          type: formData.type as any,
          category: formData.category!,
          isPaid: formData.isPaid || false
        });
      }

      await loadLineItems();
      resetForm();
      if (onItemChange) onItemChange();
    } catch (error) {
      console.error("Error saving line item:", error);
      alert("Failed to save line item");
    }
  };

  const handleEdit = (item: LineItemData) => {
    setEditingId(item.id!);
    setFormData(item);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this line item?")) return;

    try {
      await deleteLineItem(id);
      await loadLineItems();
      if (onItemChange) onItemChange();
    } catch (error) {
      console.error("Error deleting line item:", error);
      alert("Failed to delete line item");
    }
  };

  const handleCopy = async () => {
    if (!targetInstanceId || selectedItems.length === 0) {
      alert("Please select items and target instance");
      return;
    }

    try {
      await copyLineItemsToInstance(instanceId, targetInstanceId, selectedItems);
      alert(`Copied ${selectedItems.length} items successfully`);
      setShowCopyModal(false);
      setSelectedItems([]);
      setTargetInstanceId("");
    } catch (error) {
      console.error("Error copying line items:", error);
      alert("Failed to copy line items");
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      category: 'other',
      amount: 0,
      isPaid: false
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const getCurrentCategories = () => {
    return formData.type === 'revenue' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const revenueItems = lineItems.filter(item => item.type === 'revenue');
  const expenseItems = lineItems.filter(item => item.type === 'expense');

  if (loading) {
    return <div>Loading line items...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Financial Line Items</h3>
        <div className="flex gap-2">
          {selectedItems.length > 0 && availableInstances.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowCopyModal(true)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Selected ({selectedItems.length})
            </Button>
          )}
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Add'} Line Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value as any, category: 'other' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getCurrentCategories().map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  placeholder="Enter description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentDate">Payment Date (Optional)</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate || ''}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                />
              </div>
              
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="isPaid"
                  checked={formData.isPaid || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked === true })}
                />
                <Label htmlFor="isPaid">Mark as paid</Label>
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
          </CardContent>
        </Card>
      )}

      {/* Revenue Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            Revenue Items ({revenueItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueItems.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No revenue items yet</p>
          ) : (
            <div className="space-y-2">
              {revenueItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedItems.includes(item.id!)}
                      onCheckedChange={() => toggleItemSelection(item.id!)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {REVENUE_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                        </Badge>
                        {item.isPaid && (
                          <Badge variant="default" className="text-xs">Paid</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium text-green-600">{formatCurrency(item.amount)}</span>
                        {item.paymentDate && ` • Paid: ${new Date(item.paymentDate).toLocaleDateString()}`}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id!)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-red-600" />
            Expense Items ({expenseItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenseItems.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No expense items yet</p>
          ) : (
            <div className="space-y-2">
              {expenseItems.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${
                  (item.category === 'auto-sync-dj' || item.category === 'auto-sync-team') ? 'border-blue-200 bg-blue-50' : ''
                }`}>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedItems.includes(item.id!)}
                      onCheckedChange={() => toggleItemSelection(item.id!)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {EXPENSE_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                        </Badge>
                        {item.isPaid && (
                          <Badge variant="default" className="text-xs">Paid</Badge>
                        )}
                        {(item.category === 'auto-sync-dj' || item.category === 'auto-sync-team') && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Auto-synced</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium text-red-600">{formatCurrency(item.amount)}</span>
                        {item.paymentDate && ` • Paid: ${new Date(item.paymentDate).toLocaleDateString()}`}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!(item.category === 'auto-sync-dj' || item.category === 'auto-sync-team') ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(item.id!)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="text-xs text-blue-600 font-medium px-2 py-1">
                        Managed automatically
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Copy Modal */}
      {showCopyModal && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Copy Selected Items</h3>
            <p className="text-sm text-gray-600 mb-4">
              Copy {selectedItems.length} selected items to another instance:
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="targetInstance">Target Instance</Label>
                <Select value={targetInstanceId} onValueChange={setTargetInstanceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target instance" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInstances
                      .filter(inst => inst.id !== instanceId)
                      .map(inst => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.eventName} - {new Date(inst.eventDate).toLocaleDateString()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleCopy} size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Items
                </Button>
                <Button 
                  onClick={() => setShowCopyModal(false)} 
                  variant="outline" 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}