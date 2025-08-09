import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  EventPipeline, 
  EventStage, 
  StageTransition, 
  EventWithPipeline,
  STAGE_CONFIG,
  canTransitionTo 
} from '@/lib/types/event-pipeline';
// Email service will be integrated later
// import { emailService } from '@/lib/email-service';

const PIPELINE_COLLECTION = 'event-pipelines';
const EVENTS_COLLECTION = 'events';

// Create event with pipeline
export async function createEventWithPipeline(
  eventData: Omit<EventWithPipeline, 'id' | 'createdAt' | 'updatedAt' | 'pipeline'>,
  userId: string
): Promise<string> {
  try {
    const batch = writeBatch(db);
    
    // Create event
    const eventRef = doc(collection(db, EVENTS_COLLECTION));
    batch.set(eventRef, {
      ...eventData,
      status: 'draft',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId
    });
    
    // Create pipeline in hold stage
    const pipelineRef = doc(collection(db, PIPELINE_COLLECTION));
    const pipeline: Omit<EventPipeline, 'id'> = {
      eventId: eventRef.id,
      orgId: eventData.orgId,
      stage: 'hold',
      stageHistory: [{
        from: 'hold',
        to: 'hold',
        transitionedAt: Timestamp.now(),
        transitionedBy: userId,
        notes: 'Event created'
      }],
      holdExpiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
      updatedBy: userId
    };
    
    batch.set(pipelineRef, pipeline);
    
    await batch.commit();
    
    // Trigger hold stage automations
    await triggerStageAutomations('hold', 'onEnter', eventRef.id, pipeline);
    
    return eventRef.id;
  } catch (error) {
    console.error('Error creating event with pipeline:', error);
    throw error;
  }
}

// Get event with pipeline
export async function getEventWithPipeline(eventId: string): Promise<EventWithPipeline | null> {
  try {
    // Get event
    const eventDoc = await getDoc(doc(db, EVENTS_COLLECTION, eventId));
    if (!eventDoc.exists()) {
      return null;
    }
    
    // Get pipeline
    const pipelineQuery = query(
      collection(db, PIPELINE_COLLECTION),
      where('eventId', '==', eventId)
    );
    const pipelineSnapshot = await getDocs(pipelineQuery);
    
    const event: EventWithPipeline = {
      id: eventDoc.id,
      ...eventDoc.data()
    } as EventWithPipeline;
    
    if (!pipelineSnapshot.empty) {
      event.pipeline = {
        id: pipelineSnapshot.docs[0].id,
        ...pipelineSnapshot.docs[0].data()
      } as EventPipeline;
    }
    
    return event;
  } catch (error) {
    console.error('Error getting event with pipeline:', error);
    throw error;
  }
}

// Get events by stage for organization
export async function getEventsByStage(orgId: string, stage?: EventStage): Promise<EventWithPipeline[]> {
  try {
    let pipelineQuery;
    
    if (stage) {
      pipelineQuery = query(
        collection(db, PIPELINE_COLLECTION),
        where('orgId', '==', orgId),
        where('stage', '==', stage),
        orderBy('updatedAt', 'desc')
      );
    } else {
      pipelineQuery = query(
        collection(db, PIPELINE_COLLECTION),
        where('orgId', '==', orgId),
        orderBy('updatedAt', 'desc')
      );
    }
    
    const pipelineSnapshot = await getDocs(pipelineQuery);
    const events: EventWithPipeline[] = [];
    
    for (const pipelineDoc of pipelineSnapshot.docs) {
      const pipeline = {
        id: pipelineDoc.id,
        ...pipelineDoc.data()
      } as EventPipeline;
      
      const eventDoc = await getDoc(doc(db, EVENTS_COLLECTION, pipeline.eventId));
      if (eventDoc.exists()) {
        events.push({
          id: eventDoc.id,
          ...eventDoc.data(),
          pipeline
        } as EventWithPipeline);
      }
    }
    
    return events;
  } catch (error) {
    console.error('Error getting events by stage:', error);
    throw error;
  }
}

// Transition event to new stage
export async function transitionEventStage(
  eventId: string,
  pipelineId: string,
  newStage: EventStage,
  userId: string,
  notes?: string,
  additionalData?: Partial<EventPipeline>
): Promise<void> {
  try {
    // Get current pipeline
    const pipelineDoc = await getDoc(doc(db, PIPELINE_COLLECTION, pipelineId));
    if (!pipelineDoc.exists()) {
      throw new Error('Pipeline not found');
    }
    
    const pipeline = pipelineDoc.data() as EventPipeline;
    
    // Validate transition
    if (!canTransitionTo(pipeline.stage, newStage)) {
      throw new Error(`Cannot transition from ${pipeline.stage} to ${newStage}`);
    }
    
    // Check required fields
    const requiredFields = STAGE_CONFIG[newStage].requiredFields || [];
    for (const field of requiredFields) {
      if (!additionalData?.[field as keyof EventPipeline] && !pipeline[field as keyof EventPipeline]) {
        throw new Error(`Required field ${field} is missing for stage ${newStage}`);
      }
    }
    
    // Trigger exit automations for current stage
    await triggerStageAutomations(pipeline.stage, 'onExit', eventId, pipeline);
    
    // Create transition record
    const transition: StageTransition = {
      from: pipeline.stage,
      to: newStage,
      transitionedAt: Timestamp.now(),
      transitionedBy: userId,
      notes
    };
    
    // Update pipeline
    const updates: Partial<EventPipeline> = {
      ...additionalData,
      stage: newStage,
      previousStage: pipeline.stage,
      stageHistory: [...(pipeline.stageHistory || []), transition],
      updatedAt: Timestamp.now(),
      updatedBy: userId
    };
    
    // Add stage-specific timestamp
    switch (newStage) {
      case 'offer':
        updates.offerSentAt = Timestamp.now();
        break;
      case 'confirmed':
        updates.confirmedAt = Timestamp.now();
        break;
      case 'marketing':
        updates.marketingStartedAt = Timestamp.now();
        break;
      case 'completed':
        updates.completedAt = Timestamp.now();
        break;
    }
    
    await updateDoc(doc(db, PIPELINE_COLLECTION, pipelineId), updates);
    
    // Update event status if needed
    if (newStage === 'confirmed' || newStage === 'marketing') {
      await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
        status: 'published',
        updatedAt: Timestamp.now()
      });
    } else if (newStage === 'cancelled') {
      await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
        status: 'cancelled',
        updatedAt: Timestamp.now()
      });
    }
    
    // Trigger enter automations for new stage
    await triggerStageAutomations(newStage, 'onEnter', eventId, { ...pipeline, ...updates });
    
    // Send notification email
    await sendStageTransitionEmail(eventId, pipeline.stage, newStage);
    
  } catch (error) {
    console.error('Error transitioning event stage:', error);
    throw error;
  }
}

// Trigger stage automations
async function triggerStageAutomations(
  stage: EventStage,
  trigger: 'onEnter' | 'onExit',
  eventId: string,
  pipeline: Partial<EventPipeline>
): Promise<void> {
  const automations = STAGE_CONFIG[stage].automations?.[trigger] || [];
  
  for (const automation of automations) {
    try {
      switch (automation) {
        case 'sendHoldConfirmation':
          // Send hold confirmation email
          console.log('Sending hold confirmation for event', eventId);
          break;
          
        case 'scheduleHoldExpiry':
          // Schedule a cloud function to check hold expiry
          console.log('Scheduling hold expiry check for event', eventId);
          break;
          
        case 'sendOfferEmail':
          // Send offer email to venue/talent
          console.log('Sending offer email for event', eventId);
          break;
          
        case 'generateMarketingAssets':
          // Trigger asset generation
          console.log('Generating marketing assets for event', eventId);
          break;
          
        case 'processSettlement':
          // Process financial settlement
          console.log('Processing settlement for event', eventId);
          break;
          
        // Add more automation handlers as needed
      }
    } catch (error) {
      console.error(`Error executing automation ${automation}:`, error);
      // Continue with other automations even if one fails
    }
  }
}

// Send stage transition email notification
async function sendStageTransitionEmail(
  eventId: string,
  fromStage: EventStage,
  toStage: EventStage
): Promise<void> {
  try {
    const event = await getEventWithPipeline(eventId);
    if (!event) return;
    
    // Get organization details for email
    // This would typically fetch org details and send to relevant parties
    
    const subject = `Event "${event.name}" moved to ${STAGE_CONFIG[toStage].label}`;
    const body = `
      <h2>Event Pipeline Update</h2>
      <p>The event <strong>${event.name}</strong> has been moved from 
      <strong>${STAGE_CONFIG[fromStage].label}</strong> to 
      <strong>${STAGE_CONFIG[toStage].label}</strong>.</p>
      
      <p>Event Date: ${event.date.toDate().toLocaleDateString()}</p>
      
      <p>Please log in to the platform to view details and take any necessary actions.</p>
    `;
    
    // Send email (implementation depends on email service)
    console.log('Sending stage transition email:', { subject, eventId, toStage });
    
  } catch (error) {
    console.error('Error sending stage transition email:', error);
  }
}

// Check for expired holds and offers (to be called by a scheduled cloud function)
export async function checkExpiredStages(): Promise<void> {
  try {
    const now = Timestamp.now();
    
    // Check expired holds
    const expiredHoldsQuery = query(
      collection(db, PIPELINE_COLLECTION),
      where('stage', '==', 'hold'),
      where('holdExpiresAt', '<=', now)
    );
    
    const expiredHolds = await getDocs(expiredHoldsQuery);
    for (const doc of expiredHolds.docs) {
      const pipeline = doc.data() as EventPipeline;
      await transitionEventStage(
        pipeline.eventId,
        doc.id,
        'cancelled',
        'system',
        'Hold expired automatically'
      );
    }
    
    // Check expired offers
    const expiredOffersQuery = query(
      collection(db, PIPELINE_COLLECTION),
      where('stage', '==', 'offer'),
      where('offerExpiresAt', '<=', now)
    );
    
    const expiredOffers = await getDocs(expiredOffersQuery);
    for (const doc of expiredOffers.docs) {
      const pipeline = doc.data() as EventPipeline;
      await transitionEventStage(
        pipeline.eventId,
        doc.id,
        'cancelled',
        'system',
        'Offer expired without response'
      );
    }
    
  } catch (error) {
    console.error('Error checking expired stages:', error);
  }
}

// Get pipeline statistics for organization
export async function getPipelineStatistics(orgId: string): Promise<{
  total: number;
  byStage: Record<EventStage, number>;
  conversionRate: number;
  averageTimeInStage: Record<EventStage, number>;
}> {
  try {
    const pipelines = await getDocs(
      query(
        collection(db, PIPELINE_COLLECTION),
        where('orgId', '==', orgId)
      )
    );
    
    const stats = {
      total: pipelines.size,
      byStage: {
        hold: 0,
        offer: 0,
        confirmed: 0,
        marketing: 0,
        completed: 0,
        cancelled: 0
      } as Record<EventStage, number>,
      conversionRate: 0,
      averageTimeInStage: {
        hold: 0,
        offer: 0,
        confirmed: 0,
        marketing: 0,
        completed: 0,
        cancelled: 0
      } as Record<EventStage, number>
    };
    
    let completedCount = 0;
    const timeInStage: Record<EventStage, number[]> = {
      hold: [],
      offer: [],
      confirmed: [],
      marketing: [],
      completed: [],
      cancelled: []
    };
    
    pipelines.forEach(doc => {
      const pipeline = doc.data() as EventPipeline;
      stats.byStage[pipeline.stage]++;
      
      if (pipeline.stage === 'completed') {
        completedCount++;
      }
      
      // Calculate time in each stage from history
      pipeline.stageHistory?.forEach((transition, index) => {
        if (index > 0) {
          const prevTransition = pipeline.stageHistory[index - 1];
          const timeSpent = transition.transitionedAt.toMillis() - prevTransition.transitionedAt.toMillis();
          timeInStage[prevTransition.to].push(timeSpent);
        }
      });
    });
    
    // Calculate conversion rate (completed / total non-cancelled)
    const nonCancelled = stats.total - stats.byStage.cancelled;
    stats.conversionRate = nonCancelled > 0 ? (completedCount / nonCancelled) * 100 : 0;
    
    // Calculate average time in each stage
    Object.keys(timeInStage).forEach(stage => {
      const times = timeInStage[stage as EventStage];
      if (times.length > 0) {
        const average = times.reduce((a, b) => a + b, 0) / times.length;
        stats.averageTimeInStage[stage as EventStage] = average / (1000 * 60 * 60 * 24); // Convert to days
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting pipeline statistics:', error);
    throw error;
  }
}