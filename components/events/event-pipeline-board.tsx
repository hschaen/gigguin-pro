'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Send, 
  CheckCircle, 
  Megaphone, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  Calendar,
  DollarSign,
  Users,
  ChevronRight,
  MoreVertical,
  Plus
} from 'lucide-react';
import { 
  EventWithPipeline, 
  EventStage, 
  STAGE_CONFIG, 
  getStageProgress 
} from '@/lib/types/event-pipeline';
import { 
  getEventsByStage, 
  transitionEventStage,
  getPipelineStatistics 
} from '@/lib/services/event-pipeline-service';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';

interface EventPipelineBoardProps {
  orgId: string;
}

const STAGE_ICONS = {
  Clock,
  Send,
  CheckCircle,
  Megaphone,
  CheckCircle2,
  XCircle
};

export function EventPipelineBoard({ orgId }: EventPipelineBoardProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventWithPipeline | null>(null);
  const [transitionDialog, setTransitionDialog] = useState<{
    event: EventWithPipeline;
    targetStage: EventStage;
  } | null>(null);
  const [transitionNotes, setTransitionNotes] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadEvents();
    loadStatistics();
  }, [orgId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsList = await getEventsByStage(orgId);
      setEvents(eventsList);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const statistics = await getPipelineStatistics(orgId);
      setStats(statistics);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleStageTransition = async (event: EventWithPipeline, targetStage: EventStage) => {
    if (!event.pipeline?.id || !user) return;

    try {
      await transitionEventStage(
        event.id!,
        event.pipeline.id,
        targetStage,
        user.uid,
        transitionNotes
      );
      
      setTransitionDialog(null);
      setTransitionNotes('');
      await loadEvents();
      await loadStatistics();
    } catch (error) {
      console.error('Error transitioning stage:', error);
      alert('Failed to transition stage');
    }
  };

  const getEventsByStageLocal = (stage: EventStage) => {
    return events.filter(e => e.pipeline?.stage === stage);
  };

  const renderStageColumn = (stage: EventStage) => {
    const stageConfig = STAGE_CONFIG[stage];
    const Icon = STAGE_ICONS[stageConfig.icon as keyof typeof STAGE_ICONS];
    const stageEvents = getEventsByStageLocal(stage);

    return (
      <div className="flex-1 min-w-[300px]">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 text-${stageConfig.color}-500`} />
              <h3 className="font-semibold">{stageConfig.label}</h3>
              <Badge variant="secondary">{stageEvents.length}</Badge>
            </div>
          </div>
          {stats && (
            <div className="text-sm text-gray-500">
              Avg: {stats.averageTimeInStage[stage]?.toFixed(1) || 0} days
            </div>
          )}
        </div>

        <ScrollArea className="h-[600px]">
          <div className="space-y-3 pr-4">
            {stageEvents.map((event) => (
              <Card 
                key={event.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedEvent(event)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium">
                        {event.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {format(event.date.toDate(), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Show stage transition options
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {event.pipeline?.offerAmount && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {event.pipeline.offerAmount}
                      </div>
                    )}
                    {event.capacity && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.capacity}
                      </div>
                    )}
                  </div>

                  {/* Stage-specific info */}
                  {stage === 'hold' && event.pipeline?.holdExpiresAt && (
                    <div className="mt-2 text-xs text-yellow-600">
                      Expires: {format(event.pipeline.holdExpiresAt.toDate(), 'MMM d')}
                    </div>
                  )}
                  
                  {stage === 'offer' && event.pipeline?.offerExpiresAt && (
                    <div className="mt-2 text-xs text-blue-600">
                      Offer expires: {format(event.pipeline.offerExpiresAt.toDate(), 'MMM d')}
                    </div>
                  )}

                  {/* Available transitions */}
                  {stageConfig.nextStages.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {stageConfig.nextStages.map((nextStage) => (
                        <Button
                          key={nextStage}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTransitionDialog({ event, targetStage: nextStage });
                          }}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          {STAGE_CONFIG[nextStage].label}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Statistics */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Events</CardDescription>
              <CardTitle>{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Progress</CardDescription>
              <CardTitle>
                {stats.byStage.hold + stats.byStage.offer + stats.byStage.confirmed + stats.byStage.marketing}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle>{stats.byStage.completed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Conversion Rate</CardDescription>
              <CardTitle>{stats.conversionRate.toFixed(1)}%</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Pipeline Board */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex gap-6 overflow-x-auto">
          {(['hold', 'offer', 'confirmed', 'marketing', 'completed'] as EventStage[]).map((stage) => (
            <div key={stage}>
              {renderStageColumn(stage)}
            </div>
          ))}
        </div>
      </div>

      {/* Transition Dialog */}
      {transitionDialog && (
        <Dialog open={true} onOpenChange={() => setTransitionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Move to {STAGE_CONFIG[transitionDialog.targetStage].label}
              </DialogTitle>
              <DialogDescription>
                Moving "{transitionDialog.event.name}" from {STAGE_CONFIG[transitionDialog.event.pipeline!.stage].label} to {STAGE_CONFIG[transitionDialog.targetStage].label}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Transition Notes</Label>
                <Textarea
                  id="notes"
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  placeholder="Add any notes about this transition..."
                  rows={3}
                />
              </div>

              {/* Stage-specific fields */}
              {transitionDialog.targetStage === 'offer' && (
                <>
                  <div>
                    <Label htmlFor="amount">Offer Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter offer amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expires">Offer Expires</Label>
                    <Input
                      id="expires"
                      type="date"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTransitionDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleStageTransition(transitionDialog.event, transitionDialog.targetStage)}>
                  Confirm Transition
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={true} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedEvent.name}</DialogTitle>
              <DialogDescription>
                Event Pipeline Details
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Pipeline Progress</span>
                  <span>{getStageProgress(selectedEvent.pipeline!.stage)}%</span>
                </div>
                <Progress value={getStageProgress(selectedEvent.pipeline!.stage)} />
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <p className="text-sm">{format(selectedEvent.date.toDate(), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <Label>Current Stage</Label>
                  <Badge className="mt-1">
                    {STAGE_CONFIG[selectedEvent.pipeline!.stage].label}
                  </Badge>
                </div>
                {selectedEvent.capacity && (
                  <div>
                    <Label>Capacity</Label>
                    <p className="text-sm">{selectedEvent.capacity}</p>
                  </div>
                )}
                {selectedEvent.ticketPrice && (
                  <div>
                    <Label>Ticket Price</Label>
                    <p className="text-sm">${selectedEvent.ticketPrice}</p>
                  </div>
                )}
              </div>

              {/* Stage History */}
              <div>
                <Label>Stage History</Label>
                <ScrollArea className="h-[200px] mt-2">
                  <div className="space-y-2">
                    {selectedEvent.pipeline?.stageHistory?.map((transition, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{STAGE_CONFIG[transition.from].label}</Badge>
                        <ChevronRight className="h-4 w-4" />
                        <Badge variant="outline">{STAGE_CONFIG[transition.to].label}</Badge>
                        <span className="text-gray-500">
                          {format(transition.transitionedAt.toDate(), 'MMM d, h:mm a')}
                        </span>
                        {transition.notes && (
                          <span className="text-gray-600 italic">- {transition.notes}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}