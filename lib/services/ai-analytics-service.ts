import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  AIRecommendation,
  AnalyticsDashboard,
  DashboardWidget,
  PredictiveModel,
  Prediction,
  AIConversation,
  AIMessage,
  AnalyticsEvent,
  Report,
  PerformanceInsight,
  Experiment,
  DateRange,
  ModelType
} from '@/lib/types/ai-analytics';

const RECOMMENDATIONS_COLLECTION = 'ai_recommendations';
const DASHBOARDS_COLLECTION = 'analytics_dashboards';
const MODELS_COLLECTION = 'predictive_models';
const PREDICTIONS_COLLECTION = 'predictions';
const CONVERSATIONS_COLLECTION = 'ai_conversations';
const EVENTS_COLLECTION = 'analytics_events';
const REPORTS_COLLECTION = 'reports';
const INSIGHTS_COLLECTION = 'performance_insights';
const EXPERIMENTS_COLLECTION = 'experiments';

// AI Recommendation Engine
export class AIRecommendationEngine {
  private static instance: AIRecommendationEngine;
  
  static getInstance(): AIRecommendationEngine {
    if (!this.instance) {
      this.instance = new AIRecommendationEngine();
    }
    return this.instance;
  }
  
  async generateRecommendations(
    targetId: string,
    targetType: string
  ): Promise<AIRecommendation[]> {
    try {
      // Analyze target data
      const analysis = await this.analyzeTarget(targetId, targetType);
      
      // Generate recommendations based on analysis
      const recommendations: AIRecommendation[] = [];
      
      // Event recommendations
      if (targetType === 'event') {
        recommendations.push(...await this.generateEventRecommendations(targetId, analysis));
      }
      
      // Venue recommendations
      if (targetType === 'venue') {
        recommendations.push(...await this.generateVenueRecommendations(targetId, analysis));
      }
      
      // DJ recommendations
      if (targetType === 'dj') {
        recommendations.push(...await this.generateDJRecommendations(targetId, analysis));
      }
      
      // Save recommendations
      for (const recommendation of recommendations) {
        await this.saveRecommendation(recommendation);
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }
  
  private async analyzeTarget(targetId: string, targetType: string): Promise<any> {
    // TODO: Implement target analysis
    // This would analyze historical data, patterns, and performance
    return {
      historicalPerformance: {},
      patterns: {},
      similarItems: []
    };
  }
  
  private async generateEventRecommendations(
    eventId: string,
    analysis: any
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];
    
    // Pricing optimization
    recommendations.push({
      type: 'pricing',
      targetId: eventId,
      targetType: 'event',
      title: 'Optimize Ticket Pricing',
      description: 'Based on similar events, adjusting your ticket price could increase revenue',
      reason: 'Events with similar demographics show 20% higher revenue at this price point',
      confidence: 0.85,
      priority: 'high',
      action: {
        type: 'update',
        label: 'Update Pricing',
        data: { suggestedPrice: 35 }
      },
      impact: {
        metric: 'revenue',
        currentValue: 1000,
        projectedValue: 1200,
        improvement: 20
      },
      status: 'pending',
      createdAt: Timestamp.now()
    });
    
    // Marketing recommendations
    recommendations.push({
      type: 'marketing',
      targetId: eventId,
      targetType: 'event',
      title: 'Boost Social Media Presence',
      description: 'Increase engagement by posting at optimal times',
      reason: 'Your audience is most active between 6-8 PM on weekdays',
      confidence: 0.92,
      priority: 'medium',
      action: {
        type: 'custom',
        label: 'View Schedule',
        data: { optimalTimes: ['18:00', '19:00', '20:00'] }
      },
      status: 'pending',
      createdAt: Timestamp.now()
    });
    
    return recommendations;
  }
  
  private async generateVenueRecommendations(
    venueId: string,
    analysis: any
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];
    
    // Booking optimization
    recommendations.push({
      type: 'booking',
      targetId: venueId,
      targetType: 'venue',
      title: 'Optimize Booking Schedule',
      description: 'You have gaps in your schedule that could be filled',
      reason: 'Friday nights show 40% higher demand but are underbooked',
      confidence: 0.78,
      priority: 'high',
      action: {
        type: 'create',
        label: 'Create Event',
        data: { suggestedDate: 'Friday', timeSlot: 'evening' }
      },
      status: 'pending',
      createdAt: Timestamp.now()
    });
    
    return recommendations;
  }
  
  private async generateDJRecommendations(
    djId: string,
    analysis: any
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];
    
    // Profile optimization
    recommendations.push({
      type: 'dj',
      targetId: djId,
      targetType: 'dj',
      title: 'Complete Your EPK',
      description: 'Adding videos increases booking rate by 35%',
      reason: 'DJs with complete EPKs receive 3x more bookings',
      confidence: 0.95,
      priority: 'high',
      action: {
        type: 'update',
        label: 'Update EPK',
        data: { missingFields: ['videos', 'press_photos'] }
      },
      status: 'pending',
      createdAt: Timestamp.now()
    });
    
    return recommendations;
  }
  
  private async saveRecommendation(
    recommendation: AIRecommendation
  ): Promise<string> {
    const docRef = await addDoc(
      collection(db, RECOMMENDATIONS_COLLECTION),
      recommendation
    );
    return docRef.id;
  }
  
  async getRecommendations(
    targetId: string,
    status?: string
  ): Promise<AIRecommendation[]> {
    try {
      let q = query(
        collection(db, RECOMMENDATIONS_COLLECTION),
        where('targetId', '==', targetId),
        orderBy('createdAt', 'desc')
      );
      
      if (status) {
        q = query(q, where('status', '==', status));
      }
      
      const querySnapshot = await getDocs(q);
      const recommendations: AIRecommendation[] = [];
      
      querySnapshot.forEach((doc) => {
        recommendations.push({
          id: doc.id,
          ...doc.data()
        } as AIRecommendation);
      });
      
      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }
  
  async applyRecommendation(recommendationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, RECOMMENDATIONS_COLLECTION, recommendationId), {
        status: 'applied',
        appliedAt: Timestamp.now()
      });
      
      // TODO: Execute the recommended action
    } catch (error) {
      console.error('Error applying recommendation:', error);
      throw error;
    }
  }
}

// Analytics Dashboard Service
export class AnalyticsDashboardService {
  private static instance: AnalyticsDashboardService;
  
  static getInstance(): AnalyticsDashboardService {
    if (!this.instance) {
      this.instance = new AnalyticsDashboardService();
    }
    return this.instance;
  }
  
  async createDashboard(
    dashboard: Omit<AnalyticsDashboard, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const newDashboard: Omit<AnalyticsDashboard, 'id'> = {
        ...dashboard,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, DASHBOARDS_COLLECTION), newDashboard);
      return docRef.id;
    } catch (error) {
      console.error('Error creating dashboard:', error);
      throw error;
    }
  }
  
  async getDashboards(orgId: string): Promise<AnalyticsDashboard[]> {
    try {
      const q = query(
        collection(db, DASHBOARDS_COLLECTION),
        where('orgId', '==', orgId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const dashboards: AnalyticsDashboard[] = [];
      
      querySnapshot.forEach((doc) => {
        dashboards.push({
          id: doc.id,
          ...doc.data()
        } as AnalyticsDashboard);
      });
      
      return dashboards;
    } catch (error) {
      console.error('Error getting dashboards:', error);
      return [];
    }
  }
  
  async updateWidget(
    dashboardId: string,
    widgetId: string,
    updates: Partial<DashboardWidget>
  ): Promise<void> {
    try {
      const dashboard = await this.getDashboardById(dashboardId);
      if (!dashboard) throw new Error('Dashboard not found');
      
      const widgets = dashboard.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      );
      
      await updateDoc(doc(db, DASHBOARDS_COLLECTION, dashboardId), {
        widgets,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating widget:', error);
      throw error;
    }
  }
  
  private async getDashboardById(dashboardId: string): Promise<AnalyticsDashboard | null> {
    try {
      const docRef = doc(db, DASHBOARDS_COLLECTION, dashboardId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as AnalyticsDashboard;
      }
      return null;
    } catch (error) {
      console.error('Error getting dashboard:', error);
      return null;
    }
  }
  
  async getWidgetData(widget: DashboardWidget): Promise<any> {
    try {
      // TODO: Implement data fetching based on widget configuration
      // This would query the appropriate collection and apply aggregations
      
      switch (widget.dataSource.type) {
        case 'metric':
          return this.getMetricData(widget);
        case 'chart':
          return this.getChartData(widget);
        case 'table':
          return this.getTableData(widget);
        default:
          return null;
      }
    } catch (error) {
      console.error('Error getting widget data:', error);
      return null;
    }
  }
  
  private async getMetricData(widget: DashboardWidget): Promise<any> {
    // TODO: Implement metric data fetching
    return {
      value: Math.floor(Math.random() * 1000),
      change: Math.random() * 20 - 10,
      trend: 'up'
    };
  }
  
  private async getChartData(widget: DashboardWidget): Promise<any> {
    // TODO: Implement chart data fetching
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [{
        label: widget.title,
        data: [65, 59, 80, 81, 56]
      }]
    };
  }
  
  private async getTableData(widget: DashboardWidget): Promise<any> {
    // TODO: Implement table data fetching
    return {
      columns: ['Name', 'Value', 'Change'],
      rows: [
        ['Item 1', 100, '+10%'],
        ['Item 2', 200, '-5%'],
        ['Item 3', 150, '+15%']
      ]
    };
  }
}

// Predictive Analytics Service
export class PredictiveAnalyticsService {
  private static instance: PredictiveAnalyticsService;
  
  static getInstance(): PredictiveAnalyticsService {
    if (!this.instance) {
      this.instance = new PredictiveAnalyticsService();
    }
    return this.instance;
  }
  
  async createModel(
    model: Omit<PredictiveModel, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const newModel: Omit<PredictiveModel, 'id'> = {
        ...model,
        status: 'training',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, MODELS_COLLECTION), newModel);
      
      // Start training process
      await this.trainModel(docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating model:', error);
      throw error;
    }
  }
  
  private async trainModel(modelId: string): Promise<void> {
    try {
      // TODO: Implement actual ML model training
      // For now, simulate training with timeout
      
      setTimeout(async () => {
        await updateDoc(doc(db, MODELS_COLLECTION, modelId), {
          status: 'ready',
          lastTrainedAt: Timestamp.now(),
          metrics: {
            accuracy: 0.85,
            precision: 0.82,
            recall: 0.88,
            f1Score: 0.85
          }
        });
      }, 5000);
    } catch (error) {
      console.error('Error training model:', error);
      await updateDoc(doc(db, MODELS_COLLECTION, modelId), {
        status: 'failed'
      });
    }
  }
  
  async predict(
    modelId: string,
    targetId: string,
    features: Record<string, any>
  ): Promise<Prediction> {
    try {
      // TODO: Implement actual prediction logic
      // For now, return mock prediction
      
      const prediction: Prediction = {
        modelId,
        targetId,
        targetType: 'event',
        prediction: this.generateMockPrediction(modelId),
        confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
        explanation: {
          features: Object.entries(features).map(([name, value]) => ({
            name,
            value,
            importance: Math.random()
          }))
        },
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, PREDICTIONS_COLLECTION), prediction);
      
      return {
        ...prediction,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error making prediction:', error);
      throw error;
    }
  }
  
  private generateMockPrediction(modelId: string): any {
    // Generate mock predictions based on model type
    const modelTypes: Record<string, () => any> = {
      booking_success: () => ({ probability: 0.75, factors: ['timing', 'price', 'location'] }),
      pricing_optimization: () => ({ optimal_price: 45, confidence_interval: [40, 50] }),
      demand_forecast: () => ({ expected_demand: 250, peak_times: ['19:00', '20:00'] }),
      attendance_prediction: () => ({ expected_attendance: 180, confidence: 0.82 })
    };
    
    return modelTypes[modelId] ? modelTypes[modelId]() : { value: Math.random() * 100 };
  }
  
  async getModelPerformance(modelId: string): Promise<any> {
    try {
      const model = await this.getModelById(modelId);
      if (!model) throw new Error('Model not found');
      
      // Get recent predictions
      const q = query(
        collection(db, PREDICTIONS_COLLECTION),
        where('modelId', '==', modelId),
        where('actual', '!=', null),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      const predictions: Prediction[] = [];
      
      querySnapshot.forEach((doc) => {
        predictions.push(doc.data() as Prediction);
      });
      
      // Calculate performance metrics
      return this.calculatePerformanceMetrics(predictions);
    } catch (error) {
      console.error('Error getting model performance:', error);
      return null;
    }
  }
  
  private async getModelById(modelId: string): Promise<PredictiveModel | null> {
    try {
      const docRef = doc(db, MODELS_COLLECTION, modelId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as PredictiveModel;
      }
      return null;
    } catch (error) {
      console.error('Error getting model:', error);
      return null;
    }
  }
  
  private calculatePerformanceMetrics(predictions: Prediction[]): any {
    // TODO: Implement actual performance calculation
    return {
      accuracy: 0.85,
      mse: 12.5,
      mae: 8.3,
      samples: predictions.length
    };
  }
}

// AI Chat Assistant Service
export class AIChatService {
  private static instance: AIChatService;
  
  static getInstance(): AIChatService {
    if (!this.instance) {
      this.instance = new AIChatService();
    }
    return this.instance;
  }
  
  async startConversation(userId: string, orgId?: string): Promise<string> {
    try {
      const conversation: Omit<AIConversation, 'id'> = {
        userId,
        orgId,
        messages: [],
        sessionId: this.generateSessionId(),
        startedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), conversation);
      
      // Send welcome message
      await this.addMessage(docRef.id, {
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant. How can I help you today?',
        suggestedActions: [
          { label: 'Book an event', action: 'book_event' },
          { label: 'View analytics', action: 'view_analytics' },
          { label: 'Get recommendations', action: 'get_recommendations' }
        ]
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  }
  
  async sendMessage(
    conversationId: string,
    message: string
  ): Promise<AIMessage> {
    try {
      // Add user message
      const userMessage = await this.addMessage(conversationId, {
        role: 'user',
        content: message
      });
      
      // Process message and generate response
      const response = await this.processMessage(message, conversationId);
      
      // Add assistant response
      const assistantMessage = await this.addMessage(conversationId, {
        role: 'assistant',
        content: response.content,
        intent: response.intent,
        suggestedActions: response.actions
      });
      
      return assistantMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  
  private async addMessage(
    conversationId: string,
    messageData: Partial<AIMessage>
  ): Promise<AIMessage> {
    const message: AIMessage = {
      id: this.generateMessageId(),
      role: messageData.role || 'user',
      content: messageData.content || '',
      intent: messageData.intent,
      suggestedActions: messageData.suggestedActions,
      timestamp: Timestamp.now()
    };
    
    // Update conversation with new message
    const conversation = await this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');
    
    await updateDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId), {
      messages: [...conversation.messages, message]
    });
    
    return message;
  }
  
  private async processMessage(
    message: string,
    conversationId: string
  ): Promise<any> {
    // TODO: Implement actual NLP processing
    // For now, use simple keyword matching
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('book') || lowerMessage.includes('event')) {
      return {
        content: 'I can help you book an event. What type of event are you planning?',
        intent: { name: 'book_event', confidence: 0.9 },
        actions: [
          { label: 'DJ Night', action: 'book_dj' },
          { label: 'Private Party', action: 'book_private' },
          { label: 'Corporate Event', action: 'book_corporate' }
        ]
      };
    }
    
    if (lowerMessage.includes('analytics') || lowerMessage.includes('stats')) {
      return {
        content: 'Here are your key metrics for this month:',
        intent: { name: 'view_analytics', confidence: 0.85 },
        actions: [
          { label: 'View Dashboard', action: 'open_dashboard' },
          { label: 'Download Report', action: 'download_report' }
        ]
      };
    }
    
    if (lowerMessage.includes('help')) {
      return {
        content: 'I can help you with:\n• Booking events and venues\n• Viewing analytics and reports\n• Getting AI recommendations\n• Managing contracts\n• And much more!',
        intent: { name: 'help', confidence: 0.95 }
      };
    }
    
    // Default response
    return {
      content: 'I understand you\'re asking about "' + message + '". Let me help you with that.',
      intent: { name: 'unknown', confidence: 0.3 }
    };
  }
  
  private async getConversation(conversationId: string): Promise<AIConversation | null> {
    try {
      const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as AIConversation;
      }
      return null;
    } catch (error) {
      console.error('Error getting conversation:', error);
      return null;
    }
  }
  
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  private generateMessageId(): string {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Analytics Event Tracking
export class AnalyticsEventService {
  private static instance: AnalyticsEventService;
  
  static getInstance(): AnalyticsEventService {
    if (!this.instance) {
      this.instance = new AnalyticsEventService();
    }
    return this.instance;
  }
  
  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const analyticsEvent: Omit<AnalyticsEvent, 'id'> = {
        ...event,
        timestamp: Timestamp.now()
      };
      
      await addDoc(collection(db, EVENTS_COLLECTION), analyticsEvent);
      
      // Process event for real-time analytics
      await this.processEventForAnalytics(analyticsEvent);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }
  
  private async processEventForAnalytics(event: Omit<AnalyticsEvent, 'id'>): Promise<void> {
    // TODO: Implement real-time analytics processing
    // This could update counters, calculate metrics, trigger alerts, etc.
  }
  
  async getEventAnalytics(
    orgId: string,
    dateRange: DateRange,
    groupBy?: string
  ): Promise<any> {
    try {
      let q = query(
        collection(db, EVENTS_COLLECTION),
        where('orgId', '==', orgId)
      );
      
      // Apply date range filter
      if (dateRange.startDate) {
        q = query(q, where('timestamp', '>=', dateRange.startDate));
      }
      if (dateRange.endDate) {
        q = query(q, where('timestamp', '<=', dateRange.endDate));
      }
      
      const querySnapshot = await getDocs(q);
      const events: AnalyticsEvent[] = [];
      
      querySnapshot.forEach((doc) => {
        events.push(doc.data() as AnalyticsEvent);
      });
      
      // Group and aggregate data
      return this.aggregateEvents(events, groupBy);
    } catch (error) {
      console.error('Error getting event analytics:', error);
      return null;
    }
  }
  
  private aggregateEvents(events: AnalyticsEvent[], groupBy?: string): any {
    // TODO: Implement event aggregation logic
    const result: any = {
      total: events.length,
      byCategory: {},
      byAction: {},
      timeline: []
    };
    
    events.forEach(event => {
      // Group by category
      if (!result.byCategory[event.category]) {
        result.byCategory[event.category] = 0;
      }
      result.byCategory[event.category]++;
      
      // Group by action
      if (!result.byAction[event.action]) {
        result.byAction[event.action] = 0;
      }
      result.byAction[event.action]++;
    });
    
    return result;
  }
}

// Performance Insights Service
export class PerformanceInsightsService {
  private static instance: PerformanceInsightsService;
  
  static getInstance(): PerformanceInsightsService {
    if (!this.instance) {
      this.instance = new PerformanceInsightsService();
    }
    return this.instance;
  }
  
  async generateInsights(orgId: string): Promise<PerformanceInsight[]> {
    try {
      const insights: PerformanceInsight[] = [];
      
      // Analyze different aspects
      insights.push(...await this.analyzeRevenue(orgId));
      insights.push(...await this.analyzeBookings(orgId));
      insights.push(...await this.analyzeEngagement(orgId));
      insights.push(...await this.detectAnomalies(orgId));
      
      // Save insights
      for (const insight of insights) {
        await this.saveInsight(insight);
      }
      
      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }
  
  private async analyzeRevenue(orgId: string): Promise<PerformanceInsight[]> {
    // TODO: Implement revenue analysis
    return [{
      orgId,
      type: 'opportunity',
      title: 'Revenue Growth Opportunity',
      description: 'Weekend events show 30% higher revenue potential',
      metric: 'revenue',
      currentValue: 10000,
      previousValue: 8000,
      change: 2000,
      changePercent: 25,
      trend: 'up',
      recommendations: [
        'Focus on weekend event bookings',
        'Increase marketing for Friday and Saturday slots'
      ],
      impact: 'high',
      status: 'new',
      createdAt: Timestamp.now()
    }];
  }
  
  private async analyzeBookings(orgId: string): Promise<PerformanceInsight[]> {
    // TODO: Implement booking analysis
    return [{
      orgId,
      type: 'trend',
      title: 'Booking Trend Alert',
      description: 'Bookings increased by 15% this month',
      metric: 'bookings',
      currentValue: 45,
      previousValue: 39,
      change: 6,
      changePercent: 15,
      trend: 'up',
      impact: 'medium',
      status: 'new',
      createdAt: Timestamp.now()
    }];
  }
  
  private async analyzeEngagement(orgId: string): Promise<PerformanceInsight[]> {
    // TODO: Implement engagement analysis
    return [];
  }
  
  private async detectAnomalies(orgId: string): Promise<PerformanceInsight[]> {
    // TODO: Implement anomaly detection
    return [{
      orgId,
      type: 'anomaly',
      title: 'Unusual Activity Detected',
      description: 'Spike in cancellations detected last week',
      metric: 'cancellations',
      currentValue: 8,
      previousValue: 2,
      change: 6,
      changePercent: 300,
      trend: 'up',
      recommendations: [
        'Review cancellation reasons',
        'Consider implementing cancellation fees'
      ],
      impact: 'high',
      status: 'new',
      createdAt: Timestamp.now()
    }];
  }
  
  private async saveInsight(insight: PerformanceInsight): Promise<void> {
    await addDoc(collection(db, INSIGHTS_COLLECTION), insight);
  }
  
  async getInsights(
    orgId: string,
    type?: string,
    status?: string
  ): Promise<PerformanceInsight[]> {
    try {
      let q = query(
        collection(db, INSIGHTS_COLLECTION),
        where('orgId', '==', orgId),
        orderBy('createdAt', 'desc')
      );
      
      if (type) {
        q = query(q, where('type', '==', type));
      }
      
      if (status) {
        q = query(q, where('status', '==', status));
      }
      
      const querySnapshot = await getDocs(q);
      const insights: PerformanceInsight[] = [];
      
      querySnapshot.forEach((doc) => {
        insights.push({
          id: doc.id,
          ...doc.data()
        } as PerformanceInsight);
      });
      
      return insights;
    } catch (error) {
      console.error('Error getting insights:', error);
      return [];
    }
  }
}