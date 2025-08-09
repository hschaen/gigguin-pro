import { EventData } from "./events-firestore";
import { EventInstanceData } from "./event-instances-firestore";
import { getExpensesByEventId } from "./expenses-firestore";
import { getTeamMembersByEventId } from "./team-members-firestore";

export interface EventFinancials {
  budget: number;
  totalExpenses: number;
  totalDJPayments: number;
  totalTeamPayments: number;
  totalCommitted: number;
  remainingBudget: number;
  budgetUsedPercentage: number;
}

// Calculate total DJ payments from event instances
export function calculateDJPayments(instances: EventInstanceData[]): number {
  let total = 0;
  
  instances.forEach(instance => {
    instance.djAssignments.forEach(assignment => {
      const amount = parseFloat(assignment.paymentAmount) || 0;
      total += amount;
    });
  });
  
  return total;
}

// Calculate complete financial overview for an event
export async function calculateEventFinancials(
  event: EventData,
  instances: EventInstanceData[]
): Promise<EventFinancials> {
  const budget = event.budget || 0;
  
  // Get expenses and team members
  const [expenses, teamMembers] = await Promise.all([
    getExpensesByEventId(event.id!),
    getTeamMembersByEventId(event.id!)
  ]);
  
  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalDJPayments = calculateDJPayments(instances);
  const totalTeamPayments = teamMembers.reduce((sum, member) => sum + member.paymentAmount, 0);
  
  const totalCommitted = totalExpenses + totalDJPayments + totalTeamPayments;
  const remainingBudget = budget - totalCommitted;
  const budgetUsedPercentage = budget > 0 ? (totalCommitted / budget) * 100 : 0;
  
  return {
    budget,
    totalExpenses,
    totalDJPayments,
    totalTeamPayments,
    totalCommitted,
    remainingBudget,
    budgetUsedPercentage
  };
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Get budget status color based on percentage used
export function getBudgetStatusColor(percentage: number): string {
  if (percentage >= 100) return 'text-red-600';
  if (percentage >= 80) return 'text-orange-600';
  if (percentage >= 60) return 'text-yellow-600';
  return 'text-green-600';
}

// Get budget status badge variant
export function getBudgetStatusVariant(percentage: number): 'destructive' | 'secondary' | 'default' | 'outline' {
  if (percentage >= 100) return 'destructive';
  if (percentage >= 80) return 'secondary';
  if (percentage >= 60) return 'default';
  return 'outline';
}