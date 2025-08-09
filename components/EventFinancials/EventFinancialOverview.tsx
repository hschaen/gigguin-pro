"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Calculator } from "lucide-react";
import { EventInstanceData } from "@/lib/event-instances-firestore";
import { getFinancialSummaryByEventInstanceId } from "@/lib/venue-sales-firestore";

interface EventFinancialOverviewProps {
  instances: EventInstanceData[];
}

interface EventTotals {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  profitableInstances: number;
  totalInstances: number;
}

export default function EventFinancialOverview({ instances }: EventFinancialOverviewProps) {
  const [financialData, setFinancialData] = useState<EventTotals>({
    totalRevenue: 0,
    totalCosts: 0,
    netProfit: 0,
    profitMargin: 0,
    profitableInstances: 0,
    totalInstances: instances.length,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        let totalRevenue = 0;
        let totalCosts = 0;
        let profitableCount = 0;

        // Get financial data for each instance
        for (const instance of instances) {
          try {
            // Calculate basic costs from instance data
            const djCosts = instance.djAssignments.reduce((sum, dj) => 
              sum + (parseFloat(dj.paymentAmount) || 0), 0
            );

            // Get financial summary if available
            const summary = await getFinancialSummaryByEventInstanceId(instance.id!);
            
            if (summary) {
              totalRevenue += summary.totalRevenue;
              totalCosts += (summary.totalDJPayments + summary.totalTeamPayments + summary.totalExpenses);
              if (summary.netProfit > 0) profitableCount++;
            } else {
              // Fallback to basic calculation if no summary exists
              totalCosts += djCosts;
              // Revenue is unknown without sales data, so we can't determine profitability
            }
          } catch (error) {
            // If we can't get financial data for an instance, just count the basic DJ costs
            const djCosts = instance.djAssignments.reduce((sum, dj) => 
              sum + (parseFloat(dj.paymentAmount) || 0), 0
            );
            totalCosts += djCosts;
          }
        }

        const netProfit = totalRevenue - totalCosts;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        setFinancialData({
          totalRevenue,
          totalCosts,
          netProfit,
          profitMargin,
          profitableInstances: profitableCount,
          totalInstances: instances.length,
        });
      } catch (error) {
        console.error("Error fetching financial data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (instances.length > 0) {
      fetchFinancialData();
    } else {
      setLoading(false);
    }
  }, [instances]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-green-600";
    if (profit < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getProfitIcon = (profit: number) => {
    if (profit > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (profit < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Calculator className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(financialData.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            Across {financialData.totalInstances} instance{financialData.totalInstances !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(financialData.totalCosts)}</div>
          <p className="text-xs text-muted-foreground">
            DJs, team, and expenses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          {getProfitIcon(financialData.netProfit)}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getProfitColor(financialData.netProfit)}`}>
            {formatCurrency(financialData.netProfit)}
          </div>
          <p className="text-xs text-muted-foreground">
            {financialData.profitMargin > 0 ? '+' : ''}{financialData.profitMargin.toFixed(1)}% margin
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profitability</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {financialData.profitableInstances}/{financialData.totalInstances}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={financialData.profitableInstances > financialData.totalInstances / 2 ? "default" : "secondary"}
            >
              {financialData.totalInstances > 0 
                ? Math.round((financialData.profitableInstances / financialData.totalInstances) * 100)
                : 0}% profitable
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}