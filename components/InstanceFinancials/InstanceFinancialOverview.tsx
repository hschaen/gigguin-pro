"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getInstanceFinancialSummary } from "@/lib/instance-line-items-firestore";
import { EventInstanceData } from "@/lib/event-instances-firestore";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Users, Users2, Receipt } from "lucide-react";

interface InstanceFinancialOverviewProps {
  instance: EventInstanceData;
  refreshTrigger?: number;
}

export default function InstanceFinancialOverview({ instance, refreshTrigger }: InstanceFinancialOverviewProps) {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    lineItemExpenses: 0,
    djExpenses: 0,
    teamExpenses: 0,
    netProfit: 0,
    paidRevenue: 0,
    paidExpenses: 0,
    outstandingRevenue: 0,
    outstandingExpenses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, [instance.id, refreshTrigger]);

  const loadFinancialData = async () => {
    if (!instance.id) return;
    
    try {
      const data = await getInstanceFinancialSummary(instance.id, instance.djAssignments || [], instance.teamMembers || []);
      setSummary(data);
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProfitStatus = () => {
    if (!instance.budget) {
      // If no budget set, use simple profit/loss based on revenue vs expenses
      if (summary.netProfit > 0) return { status: 'profit', color: 'text-green-600', bgColor: 'bg-green-100' };
      if (summary.netProfit < 0) return { status: 'loss', color: 'text-red-600', bgColor: 'bg-red-100' };
      return { status: 'break-even', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }

    // With budget, calculate remaining budget vs expenses
    const remainingBudget = instance.budget - summary.totalExpenses;
    const budgetUtilization = (summary.totalExpenses / instance.budget) * 100;
    
    if (budgetUtilization <= 50) return { status: 'profit', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (budgetUtilization <= 80) return { status: 'break-even', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (budgetUtilization <= 100) return { status: 'approaching-deficit', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { status: 'deficit', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getProgressValue = () => {
    if (!instance.budget) return 0;
    return Math.min(Math.max((summary.totalExpenses / instance.budget) * 100, 0), 100);
  };

  const profitStatus = getProfitStatus();

  if (loading) {
    return <div>Loading financial data...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Main Financial Status Card */}
      <Card className={`${profitStatus.bgColor} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <CardTitle>Financial Overview</CardTitle>
            </div>
            <Badge 
              variant="outline" 
              className={`${profitStatus.color} border-current`}
            >
              {profitStatus.status === 'profit' && <TrendingUp className="h-3 w-3 mr-1" />}
              {profitStatus.status === 'loss' && <TrendingDown className="h-3 w-3 mr-1" />}
              {profitStatus.status === 'deficit' && <TrendingDown className="h-3 w-3 mr-1" />}
              {profitStatus.status === 'approaching-deficit' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {profitStatus.status.replace('-', ' ').toUpperCase()}
            </Badge>
          </div>
          <CardDescription>
            {(() => {
              // Parse date as local date to avoid timezone issues
              const dateParts = instance.eventDate.split('-');
              const instanceDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
              return instanceDate.toLocaleDateString();
            })()} • {instance.venue}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {instance.budget 
                  ? formatCurrency(instance.budget - summary.totalExpenses)
                  : formatCurrency(summary.netProfit)
                }
              </p>
              <p className="text-sm text-gray-600">
                {instance.budget ? 'Budget Remaining' : 'Net Profit/Loss'}
              </p>
            </div>
            {instance.budget && (
              <div className="text-right">
                <p className="text-lg font-semibold">
                  {formatCurrency(instance.budget)}
                </p>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="text-sm font-medium mt-1">
                  {formatCurrency(instance.budget - summary.totalExpenses)}
                </p>
                <p className="text-xs text-gray-500">Remaining after expenses</p>
              </div>
            )}
          </div>

          {instance.budget && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Expense vs Budget</span>
                <span className="text-sm font-medium">
                  {formatCurrency(summary.totalExpenses)} / {formatCurrency(instance.budget)}
                </span>
              </div>
              <Progress 
                value={getProgressValue()} 
                className="w-full h-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {((summary.totalExpenses / instance.budget) * 100).toFixed(1)}% of budget used
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue, Expenses, and Details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalRevenue)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Paid: {formatCurrency(summary.paidRevenue)}
            </p>
            {summary.outstandingRevenue > 0 && (
              <p className="text-xs text-orange-600">
                Outstanding: {formatCurrency(summary.outstandingRevenue)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalExpenses)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Paid: {formatCurrency(summary.paidExpenses)}
            </p>
            {summary.outstandingExpenses > 0 && (
              <p className="text-xs text-orange-600">
                Outstanding: {formatCurrency(summary.outstandingExpenses)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DJ Payments</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(summary.djExpenses)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {instance.djAssignments?.length || 0} DJ{(instance.djAssignments?.length || 0) !== 1 ? 's' : ''} assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Payments</CardTitle>
            <Users2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.teamExpenses)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {instance.teamMembers?.filter(member => !member.isVolunteer).length || 0} paid member{(instance.teamMembers?.filter(member => !member.isVolunteer).length || 0) !== 1 ? 's' : ''}
            </p>
            {(instance.teamMembers?.filter(member => member.isVolunteer).length || 0) > 0 && (
              <p className="text-xs text-green-600">
                + {instance.teamMembers?.filter(member => member.isVolunteer).length || 0} volunteer{(instance.teamMembers?.filter(member => member.isVolunteer).length || 0) !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Line Items</CardTitle>
            <Receipt className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {formatCurrency(summary.lineItemExpenses)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Additional expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitStatus.color}`}>
              {summary.totalRevenue > 0 
                ? `${((summary.netProfit / summary.totalRevenue) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {summary.netProfit >= 0 ? 'Profit' : 'Loss'} per dollar of revenue
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}