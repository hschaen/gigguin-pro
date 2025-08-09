"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar
} from "lucide-react";

interface PaymentStats {
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  overduePayments: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
}

interface FinancialMetrics {
  totalEvents: number;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  averageProfitMargin: number;
  profitableEvents: number;
  unprofitableEvents: number;
}

export function PaymentDashboard() {
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load payment statistics
      const { getPaymentStatistics } = await import('@/lib/payment-firestore');
      const stats = await getPaymentStatistics();
      setPaymentStats(stats);

      // Load financial metrics
      const { getOverallFinancialMetrics } = await import('@/lib/venue-sales-firestore');
      const metrics = await getOverallFinancialMetrics();
      setFinancialMetrics(metrics);
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Statistics */}
      <div>
        <h3 className="text-lg font-medium mb-4">Payment Overview</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats?.totalPayments || 0}</div>
              <p className="text-xs text-muted-foreground">
                ${(paymentStats?.totalAmount || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {paymentStats?.completedPayments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                ${(paymentStats?.completedAmount || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {paymentStats?.pendingPayments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                ${(paymentStats?.pendingAmount || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {paymentStats?.overduePayments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Action required
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Metrics */}
      <div>
        <h3 className="text-lg font-medium mb-4">Financial Overview</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{financialMetrics?.totalEvents || 0}</div>
              <p className="text-xs text-muted-foreground">
                {financialMetrics?.profitableEvents || 0} profitable
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(financialMetrics?.totalRevenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From venue sales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(financialMetrics?.totalCosts || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                All expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              {(financialMetrics?.totalProfit || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                (financialMetrics?.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${(financialMetrics?.totalProfit || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {(financialMetrics?.averageProfitMargin || 0).toFixed(1)}% avg margin
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        <div className="flex gap-4">
          <Button variant="outline">
            View All Payments
          </Button>
          <Button variant="outline">
            Overdue Notifications
          </Button>
          <Button variant="outline">
            Financial Reports
          </Button>
          <Button>
            Process Payments
          </Button>
        </div>
      </div>
    </div>
  );
}