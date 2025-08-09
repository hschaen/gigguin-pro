'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Brain,
  Lightbulb,
  AlertCircle,
  Target,
  Activity,
  DollarSign,
  Users,
  Calendar,
  MapPin,
  Zap,
  ChevronRight,
  Download,
  RefreshCw,
  Settings,
  MessageSquare,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/use-organization';
import {
  AIRecommendationEngine,
  AnalyticsDashboardService,
  PredictiveAnalyticsService,
  AIChatService,
  PerformanceInsightsService
} from '@/lib/services/ai-analytics-service';
import {
  AIRecommendation,
  PerformanceInsight,
  DashboardWidget
} from '@/lib/types/ai-analytics';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  
  // Services
  const recommendationEngine = AIRecommendationEngine.getInstance();
  const dashboardService = AnalyticsDashboardService.getInstance();
  const predictiveService = PredictiveAnalyticsService.getInstance();
  const chatService = AIChatService.getInstance();
  const insightsService = PerformanceInsightsService.getInstance();
  
  // Data states
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [metrics, setMetrics] = useState({
    revenue: { value: 0, change: 0, trend: 'stable' as 'up' | 'down' | 'stable' },
    bookings: { value: 0, change: 0, trend: 'stable' as 'up' | 'down' | 'stable' },
    users: { value: 0, change: 0, trend: 'stable' as 'up' | 'down' | 'stable' },
    events: { value: 0, change: 0, trend: 'stable' as 'up' | 'down' | 'stable' }
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  useEffect(() => {
    if (user && currentOrg) {
      loadAnalyticsData();
    }
  }, [user, currentOrg, dateRange]);
  
  const loadAnalyticsData = async () => {
    if (!user || !currentOrg) return;
    
    try {
      setLoading(true);
      
      // Load recommendations
      const orgRecommendations = await recommendationEngine.getRecommendations(
        currentOrg.id!,
        'pending'
      );
      setRecommendations(orgRecommendations);
      
      // Load insights
      const orgInsights = await insightsService.getInsights(currentOrg.id!);
      setInsights(orgInsights);
      
      // Load metrics (mock data for now)
      setMetrics({
        revenue: {
          value: 45230,
          change: 12.5,
          trend: 'up'
        },
        bookings: {
          value: 142,
          change: 8.3,
          trend: 'up'
        },
        users: {
          value: 3247,
          change: -2.1,
          trend: 'down'
        },
        events: {
          value: 28,
          change: 0,
          trend: 'stable'
        }
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartChat = async () => {
    if (!user) return;
    
    try {
      const convId = await chatService.startConversation(user.uid, currentOrg?.id);
      setConversationId(convId);
      setChatOpen(true);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };
  
  const handleApplyRecommendation = async (recommendationId: string) => {
    try {
      await recommendationEngine.applyRecommendation(recommendationId);
      alert('Recommendation applied successfully!');
      await loadAnalyticsData();
    } catch (error) {
      console.error('Error applying recommendation:', error);
      alert('Failed to apply recommendation');
    }
  };
  
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'anomaly':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'trend':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'achievement':
        return <Target className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics & AI Insights</h1>
          <p className="text-gray-600">
            AI-powered analytics and recommendations for your business
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">
                ${metrics.revenue.value.toLocaleString()}
              </p>
              <div className="flex items-center gap-1">
                <span className={`text-sm ${
                  metrics.revenue.change > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {metrics.revenue.change > 0 ? '+' : ''}{metrics.revenue.change}%
                </span>
                {getTrendIcon(metrics.revenue.trend)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bookings
              </CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{metrics.bookings.value}</p>
              <div className="flex items-center gap-1">
                <span className={`text-sm ${
                  metrics.bookings.change > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {metrics.bookings.change > 0 ? '+' : ''}{metrics.bookings.change}%
                </span>
                {getTrendIcon(metrics.bookings.trend)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{metrics.users.value.toLocaleString()}</p>
              <div className="flex items-center gap-1">
                <span className={`text-sm ${
                  metrics.users.change > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {metrics.users.change > 0 ? '+' : ''}{metrics.users.change}%
                </span>
                {getTrendIcon(metrics.users.trend)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Events
              </CardTitle>
              <MapPin className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{metrics.events.value}</p>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">
                  No change
                </span>
                {getTrendIcon(metrics.events.trend)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">
            AI Recommendations
            {recommendations.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {recommendations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="insights">Performance Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>
                  Monthly revenue over the past 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  {/* TODO: Add actual chart component */}
                  <BarChart3 className="h-16 w-16" />
                  <p className="ml-4">Chart visualization here</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Booking Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Patterns</CardTitle>
                <CardDescription>
                  Popular days and times for bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  {/* TODO: Add actual heatmap component */}
                  <Activity className="h-16 w-16" />
                  <p className="ml-4">Heatmap visualization here</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Top Venues */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Venues</CardTitle>
                <CardDescription>
                  Venues with highest booking rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {i}
                        </div>
                        <div>
                          <p className="font-semibold">Venue {i}</p>
                          <p className="text-sm text-gray-600">
                            {20 - i * 3} bookings this month
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {95 - i * 10}% utilization
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  AI-powered suggestions for immediate action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-between" variant="outline">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Optimize pricing for weekend events
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Button className="w-full justify-between" variant="outline">
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Review underperforming time slots
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Button className="w-full justify-between" variant="outline">
                    <span className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Generate monthly report
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="recommendations">
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">
                    No new recommendations at this time
                  </p>
                  <Button className="mt-4" variant="outline" onClick={loadAnalyticsData}>
                    Check for Updates
                  </Button>
                </CardContent>
              </Card>
            ) : (
              recommendations.map((recommendation) => (
                <Card key={recommendation.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">
                            {recommendation.title}
                          </CardTitle>
                          <Badge
                            variant={
                              recommendation.priority === 'high'
                                ? 'destructive'
                                : recommendation.priority === 'medium'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {recommendation.priority}
                          </Badge>
                        </div>
                        <CardDescription>
                          {recommendation.description}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Confidence</p>
                        <p className="text-lg font-semibold">
                          {(recommendation.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>Why:</strong> {recommendation.reason}
                      </p>
                    </div>
                    
                    {recommendation.impact && (
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">
                          Expected Impact
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            +{recommendation.impact.improvement}%
                          </span>
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApplyRecommendation(recommendation.id!)}
                      >
                        {recommendation.action.label}
                      </Button>
                      <Button variant="outline">
                        Learn More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="insights">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div>
                        <CardTitle className="text-lg">
                          {insight.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {insight.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={
                        insight.impact === 'critical'
                          ? 'destructive'
                          : insight.impact === 'high'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {insight.impact}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Current</p>
                      <p className="text-xl font-semibold">
                        {insight.currentValue}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Previous</p>
                      <p className="text-xl font-semibold">
                        {insight.previousValue || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Change</p>
                      <p className="text-xl font-semibold">
                        {insight.changePercent
                          ? `${insight.changePercent > 0 ? '+' : ''}${insight.changePercent}%`
                          : '-'}
                      </p>
                    </div>
                  </div>
                  
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-semibold mb-2">Recommendations:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {insight.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="predictions">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Success Prediction</CardTitle>
                <CardDescription>
                  AI prediction for upcoming events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Next Week</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">85%</span>
                      <Badge variant="outline" className="text-green-600">
                        High
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next Month</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">72%</span>
                      <Badge variant="outline" className="text-yellow-600">
                        Medium
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next Quarter</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">68%</span>
                      <Badge variant="outline" className="text-yellow-600">
                        Medium
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>
                  Predicted revenue for upcoming periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Next Month</span>
                    <span className="font-semibold">$52,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next Quarter</span>
                    <span className="font-semibold">$165,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next Year</span>
                    <span className="font-semibold">$680,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Demand Forecast</CardTitle>
                <CardDescription>
                  Expected demand for different event types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">DJ Events</span>
                      <span className="text-sm font-semibold">High</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Corporate</span>
                      <span className="text-sm font-semibold">Medium</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Private</span>
                      <span className="text-sm font-semibold">Low</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Optimal Pricing</CardTitle>
                <CardDescription>
                  AI-suggested pricing for maximum revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Weekend Events</span>
                    <span className="font-semibold text-green-600">$45-55</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Weekday Events</span>
                    <span className="font-semibold text-blue-600">$35-40</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Special Events</span>
                    <span className="font-semibold text-purple-600">$60-75</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* AI Chat Assistant Button */}
      <Button
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg"
        onClick={handleStartChat}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    </div>
  );
}