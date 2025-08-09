import { Timestamp } from 'firebase/firestore';

// AI Recommendation Types
export interface AIRecommendation {
  id?: string;
  type: 'event' | 'venue' | 'dj' | 'pricing' | 'marketing' | 'booking';
  
  // Target
  targetId: string;
  targetType: 'event' | 'venue' | 'dj' | 'user' | 'organization';
  
  // Recommendation
  title: string;
  description: string;
  reason: string;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Suggested Action
  action: {
    type: 'create' | 'update' | 'book' | 'contact' | 'review' | 'custom';
    label: string;
    data?: Record<string, any>;
  };
  
  // Related Items
  relatedItems?: {
    type: string;
    id: string;
    name: string;
    score: number;
  }[];
  
  // Metrics
  impact?: {
    metric: string;
    currentValue: number;
    projectedValue: number;
    improvement: number;
  };
  
  // Status
  status: 'pending' | 'viewed' | 'applied' | 'dismissed';
  viewedAt?: Timestamp;
  appliedAt?: Timestamp;
  dismissedAt?: Timestamp;
  feedback?: string;
  
  // Metadata
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

// Analytics Dashboard Types
export interface AnalyticsDashboard {
  id?: string;
  orgId: string;
  userId?: string;
  
  // Dashboard Config
  name: string;
  description?: string;
  type: 'overview' | 'events' | 'venues' | 'djs' | 'financial' | 'marketing' | 'custom';
  layout: DashboardLayout;
  
  // Widgets
  widgets: DashboardWidget[];
  
  // Settings
  refreshInterval?: number; // seconds
  dateRange: DateRange;
  filters?: Record<string, any>;
  
  // Sharing
  isPublic: boolean;
  sharedWith?: string[];
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastViewedAt?: Timestamp;
}

export interface DashboardLayout {
  type: 'grid' | 'list' | 'masonry';
  columns: number;
  gap: number;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  
  // Position
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Data Configuration
  dataSource: {
    type: 'metric' | 'chart' | 'table' | 'map' | 'custom';
    collection?: string;
    query?: Record<string, any>;
    aggregation?: AggregationType;
  };
  
  // Visualization
  visualization: {
    type: ChartType | 'metric' | 'table' | 'map' | 'list';
    config?: Record<string, any>;
    colors?: string[];
  };
  
  // Interactivity
  interactive: boolean;
  drillDown?: boolean;
  exportable?: boolean;
  
  // Real-time
  realTime?: boolean;
  updateFrequency?: number;
}

export type WidgetType = 
  | 'metric'
  | 'chart'
  | 'table'
  | 'map'
  | 'timeline'
  | 'heatmap'
  | 'funnel'
  | 'gauge'
  | 'list'
  | 'custom';

export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'area'
  | 'scatter'
  | 'bubble'
  | 'radar'
  | 'treemap'
  | 'sankey';

export type AggregationType =
  | 'sum'
  | 'average'
  | 'count'
  | 'min'
  | 'max'
  | 'median'
  | 'percentile'
  | 'distinct';

export interface DateRange {
  type: 'preset' | 'custom';
  preset?: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'all';
  startDate?: Timestamp;
  endDate?: Timestamp;
  comparison?: {
    enabled: boolean;
    type: 'previous_period' | 'previous_year' | 'custom';
    startDate?: Timestamp;
    endDate?: Timestamp;
  };
}

// Predictive Analytics Types
export interface PredictiveModel {
  id?: string;
  orgId: string;
  
  // Model Info
  name: string;
  type: ModelType;
  version: string;
  
  // Training
  trainingData: {
    source: string;
    features: string[];
    target: string;
    samples: number;
    splitRatio?: number;
  };
  
  // Performance
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    rmse?: number;
    mae?: number;
  };
  
  // Status
  status: 'training' | 'ready' | 'failed' | 'archived';
  lastTrainedAt?: Timestamp;
  nextTrainingAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ModelType =
  | 'booking_success'
  | 'pricing_optimization'
  | 'demand_forecast'
  | 'churn_prediction'
  | 'revenue_forecast'
  | 'attendance_prediction'
  | 'sentiment_analysis'
  | 'anomaly_detection';

export interface Prediction {
  id?: string;
  modelId: string;
  
  // Prediction
  targetId: string;
  targetType: string;
  prediction: any;
  confidence: number;
  
  // Explanation
  explanation?: {
    features: {
      name: string;
      value: any;
      importance: number;
    }[];
    reasoning?: string;
  };
  
  // Validation
  actual?: any;
  error?: number;
  
  // Metadata
  createdAt: Timestamp;
}

// AI Chat Assistant Types
export interface AIConversation {
  id?: string;
  userId: string;
  orgId?: string;
  
  // Conversation
  messages: AIMessage[];
  context?: Record<string, any>;
  
  // Session
  sessionId: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  
  // Metadata
  topic?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  resolved?: boolean;
  rating?: number;
  feedback?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  
  // Rich Content
  attachments?: {
    type: 'image' | 'file' | 'link' | 'data';
    url?: string;
    data?: any;
  }[];
  
  // Actions
  suggestedActions?: {
    label: string;
    action: string;
    data?: any;
  }[];
  
  // Intent
  intent?: {
    name: string;
    confidence: number;
    entities?: Record<string, any>;
  };
  
  // Metadata
  timestamp: Timestamp;
  tokens?: number;
  processingTime?: number;
}

// Analytics Events Types
export interface AnalyticsEvent {
  id?: string;
  
  // Event Info
  name: string;
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  
  // Context
  userId?: string;
  sessionId?: string;
  orgId?: string;
  
  // Properties
  properties?: Record<string, any>;
  
  // Device/Browser
  device?: {
    type: 'desktop' | 'mobile' | 'tablet';
    os?: string;
    browser?: string;
    screenResolution?: string;
  };
  
  // Location
  location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  
  // Referrer
  referrer?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  
  // Timestamp
  timestamp: Timestamp;
}

export type EventCategory =
  | 'page_view'
  | 'user_action'
  | 'booking'
  | 'payment'
  | 'search'
  | 'social'
  | 'error'
  | 'performance'
  | 'custom';

// Reporting Types
export interface Report {
  id?: string;
  orgId: string;
  
  // Report Info
  name: string;
  description?: string;
  type: ReportType;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  
  // Data
  dataConfig: {
    sources: string[];
    dateRange: DateRange;
    filters?: Record<string, any>;
    groupBy?: string[];
    orderBy?: {
      field: string;
      direction: 'asc' | 'desc';
    }[];
  };
  
  // Sections
  sections: ReportSection[];
  
  // Schedule
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time?: string;
    timezone?: string;
  };
  
  // Distribution
  distribution?: {
    emails: string[];
    slackChannel?: string;
    webhookUrl?: string;
  };
  
  // Status
  lastGeneratedAt?: Timestamp;
  nextGenerationAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ReportType =
  | 'event_summary'
  | 'financial'
  | 'booking'
  | 'venue_utilization'
  | 'dj_performance'
  | 'marketing'
  | 'custom';

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'chart' | 'table' | 'text' | 'metrics';
  
  // Content
  content?: {
    text?: string;
    data?: any;
    visualization?: {
      type: ChartType;
      config?: Record<string, any>;
    };
  };
  
  // Layout
  order: number;
  pageBreak?: boolean;
}

// Performance Insights Types
export interface PerformanceInsight {
  id?: string;
  orgId: string;
  
  // Insight
  type: InsightType;
  title: string;
  description: string;
  
  // Analysis
  metric: string;
  currentValue: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  
  // Benchmark
  benchmark?: {
    value: number;
    source: string;
    percentile?: number;
  };
  
  // Recommendations
  recommendations?: string[];
  
  // Impact
  impact: 'low' | 'medium' | 'high' | 'critical';
  affectedItems?: {
    type: string;
    id: string;
    name: string;
  }[];
  
  // Status
  status: 'new' | 'acknowledged' | 'resolved';
  acknowledgedAt?: Timestamp;
  resolvedAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  validUntil?: Timestamp;
}

export type InsightType =
  | 'opportunity'
  | 'anomaly'
  | 'trend'
  | 'warning'
  | 'achievement'
  | 'forecast';

// ML Feature Store
export interface Feature {
  id?: string;
  name: string;
  description?: string;
  
  // Definition
  type: 'numeric' | 'categorical' | 'text' | 'date' | 'boolean';
  source: string;
  computation?: string;
  
  // Statistics
  stats?: {
    count: number;
    missing: number;
    unique?: number;
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
    distribution?: Record<string, number>;
  };
  
  // Usage
  usedInModels?: string[];
  importance?: number;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// A/B Testing Types
export interface Experiment {
  id?: string;
  orgId: string;
  
  // Experiment Info
  name: string;
  description?: string;
  hypothesis: string;
  
  // Variants
  variants: ExperimentVariant[];
  
  // Targeting
  targeting?: {
    userSegment?: string;
    percentage: number;
    criteria?: Record<string, any>;
  };
  
  // Metrics
  primaryMetric: string;
  secondaryMetrics?: string[];
  
  // Results
  results?: {
    winner?: string;
    confidence?: number;
    uplift?: number;
    significance?: number;
  };
  
  // Status
  status: 'draft' | 'running' | 'paused' | 'completed';
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description?: string;
  
  // Configuration
  config: Record<string, any>;
  
  // Allocation
  allocation: number; // percentage
  
  // Results
  results?: {
    users: number;
    conversions: number;
    conversionRate: number;
    revenue?: number;
  };
}