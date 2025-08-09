"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EventData } from "@/lib/events-firestore";
import { EventInstanceData } from "@/lib/event-instances-firestore";
import { calculateEventFinancials, formatCurrency, getBudgetStatusColor, getBudgetStatusVariant, EventFinancials } from "@/lib/financial-utils";
import { DollarSign, TrendingDown, Users, Receipt } from "lucide-react";

interface FinancialOverviewProps {
  event: EventData;
  instances: EventInstanceData[];
}

export default function FinancialOverview({ event, instances }: FinancialOverviewProps) {
  const [financials, setFinancials] = useState<EventFinancials | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFinancials = async () => {
      try {
        const data = await calculateEventFinancials(event, instances);
        setFinancials(data);
      } catch (error) {
        console.error("Error loading financials:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFinancials();
  }, [event, instances]);

  if (loading || !financials) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const budgetPercentage = Math.min(financials.budgetUsedPercentage, 100);

  return (
    <div className="space-y-6">
      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financials.budget)}</div>
            <p className="text-xs text-muted-foreground">
              Event budget allocation
            </p>
          </CardContent>
        </Card>

        {/* Remaining Budget Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBudgetStatusColor(budgetPercentage)}`}>
              {formatCurrency(financials.remainingBudget)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available budget
            </p>
          </CardContent>
        </Card>

        {/* DJ Payments Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DJ Payments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financials.totalDJPayments)}</div>
            <p className="text-xs text-muted-foreground">
              Total DJ commitments
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financials.totalExpenses + financials.totalTeamPayments)}</div>
            <p className="text-xs text-muted-foreground">
              Team & other expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Budget Usage</CardTitle>
            <Badge variant={getBudgetStatusVariant(budgetPercentage)}>
              {financials.budgetUsedPercentage.toFixed(1)}% Used
            </Badge>
          </div>
          <CardDescription>
            {formatCurrency(financials.totalCommitted)} of {formatCurrency(financials.budget)} committed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={budgetPercentage} className="h-3" />
          
          {/* Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">DJ Payments</p>
              <p className="font-medium">{formatCurrency(financials.totalDJPayments)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Team Payments</p>
              <p className="font-medium">{formatCurrency(financials.totalTeamPayments)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Other Expenses</p>
              <p className="font-medium">{formatCurrency(financials.totalExpenses)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}