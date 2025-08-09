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
  createExpense, 
  getExpensesByEventId, 
  updateExpense, 
  deleteExpense, 
  ExpenseData 
} from "@/lib/expenses-firestore";
import { formatCurrency } from "@/lib/financial-utils";
import { Plus, Edit2, Trash2, Save, X, Receipt } from "lucide-react";

interface ExpenseManagerProps {
  eventId: string;
  onExpenseChange?: () => void;
}

export default function ExpenseManager({ eventId, onExpenseChange }: ExpenseManagerProps) {
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ExpenseData>>({
    category: 'other',
    amount: 0,
    isPaid: false
  });

  const expenseCategories = [
    { value: 'dj', label: 'DJ Payment' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'venue', label: 'Venue' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'staff', label: 'Staff' },
    { value: 'catering', label: 'Catering' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadExpenses();
  }, [eventId]);

  const loadExpenses = async () => {
    try {
      const data = await getExpensesByEventId(eventId);
      setExpenses(data);
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.description || !formData.amount) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      if (editingId) {
        await updateExpense(editingId, formData);
      } else {
        await createExpense({
          ...formData,
          eventId,
          description: formData.description!,
          amount: formData.amount!,
          category: formData.category as any,
          isPaid: formData.isPaid || false
        });
      }

      await loadExpenses();
      resetForm();
      if (onExpenseChange) onExpenseChange();
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Failed to save expense");
    }
  };

  const handleEdit = (expense: ExpenseData) => {
    setEditingId(expense.id!);
    setFormData(expense);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await deleteExpense(id);
      await loadExpenses();
      if (onExpenseChange) onExpenseChange();
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense");
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'other',
      amount: 0,
      isPaid: false
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return <div>Loading expenses...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Expense Management</CardTitle>
            <CardDescription>
              Total: {formatCurrency(totalExpenses)}
            </CardDescription>
          </div>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
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
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter expense description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payee">Payee (Optional)</Label>
                <Input
                  id="payee"
                  placeholder="Who is being paid?"
                  value={formData.payee || ''}
                  onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
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

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPaid || false}
                  onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Mark as paid</span>
              </label>
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

        {/* Expenses List */}
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No expenses recorded yet</p>
          ) : (
            expenses.map(expense => (
              <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{expense.description}</span>
                    <Badge variant="outline" className="text-xs">
                      {expenseCategories.find(c => c.value === expense.category)?.label || expense.category}
                    </Badge>
                    {expense.isPaid && (
                      <Badge variant="default" className="text-xs">Paid</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formatCurrency(expense.amount)}
                    {expense.payee && ` • ${expense.payee}`}
                    {expense.dueDate && ` • Due: ${new Date(expense.dueDate).toLocaleDateString()}`}
                  </div>
                  {expense.notes && (
                    <div className="text-xs text-gray-500 mt-1">{expense.notes}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(expense)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(expense.id!)}
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