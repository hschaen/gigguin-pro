import { EventService } from '@/lib/services/event-service';
import { addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Event } from '@/lib/types/event';
import { Timestamp } from 'firebase/firestore';

// Mock Firestore functions
jest.mock('firebase/firestore');

describe('EventService', () => {
  let eventService: EventService;
  
  beforeEach(() => {
    eventService = EventService.getInstance();
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create a new event successfully', async () => {
      const mockEventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
        organizationId: 'org123',
        name: 'Test Event',
        date: Timestamp.fromDate(new Date('2024-12-31')),
        startTime: '20:00',
        endTime: '02:00',
        venueId: 'venue123',
        venueName: 'Test Venue',
        status: 'draft',
        capacity: 100,
        ticketPrice: 25,
        currency: 'USD',
        description: 'Test event description',
        djIds: ['dj1', 'dj2'],
        djNames: ['DJ One', 'DJ Two'],
        createdBy: 'user123'
      };

      const mockDocRef = { id: 'event123' };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const eventId = await eventService.createEvent(mockEventData);

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...mockEventData,
          createdAt: expect.anything(),
          updatedAt: expect.anything()
        })
      );
      expect(eventId).toBe('event123');
    });

    it('should handle errors when creating an event', async () => {
      const mockEventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
        organizationId: 'org123',
        name: 'Test Event',
        date: Timestamp.fromDate(new Date('2024-12-31')),
        startTime: '20:00',
        endTime: '02:00',
        venueId: 'venue123',
        venueName: 'Test Venue',
        status: 'draft',
        capacity: 100,
        createdBy: 'user123'
      };

      (addDoc as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      await expect(eventService.createEvent(mockEventData)).rejects.toThrow('Firebase error');
    });
  });

  describe('getEvent', () => {
    it('should retrieve an event by ID', async () => {
      const mockEvent = {
        id: 'event123',
        name: 'Test Event',
        date: Timestamp.now(),
        status: 'confirmed'
      };

      const mockDoc = {
        exists: () => true,
        id: 'event123',
        data: () => mockEvent
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const event = await eventService.getEvent('event123');

      expect(getDoc).toHaveBeenCalled();
      expect(event).toEqual({ ...mockEvent, id: 'event123' });
    });

    it('should return null for non-existent event', async () => {
      const mockDoc = {
        exists: () => false
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const event = await eventService.getEvent('nonexistent');

      expect(event).toBeNull();
    });
  });

  describe('updateEvent', () => {
    it('should update an event successfully', async () => {
      const updates = {
        name: 'Updated Event Name',
        capacity: 150
      };

      await eventService.updateEvent('event123', updates);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updates,
          updatedAt: expect.anything()
        })
      );
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event successfully', async () => {
      await eventService.deleteEvent('event123');

      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('getEventsByOrganization', () => {
    it('should retrieve events for an organization', async () => {
      const mockEvents = [
        { id: 'event1', name: 'Event 1' },
        { id: 'event2', name: 'Event 2' }
      ];

      const mockQuerySnapshot = {
        forEach: (callback: Function) => {
          mockEvents.forEach(event => {
            callback({
              id: event.id,
              data: () => event
            });
          });
        }
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const events = await eventService.getEventsByOrganization('org123');

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual(mockEvents[0]);
    });
  });

  describe('getUpcomingEvents', () => {
    it('should retrieve upcoming events', async () => {
      const mockEvents = [
        { id: 'event1', name: 'Upcoming Event 1', date: Timestamp.fromDate(new Date('2024-12-31')) },
        { id: 'event2', name: 'Upcoming Event 2', date: Timestamp.fromDate(new Date('2025-01-15')) }
      ];

      const mockQuerySnapshot = {
        forEach: (callback: Function) => {
          mockEvents.forEach(event => {
            callback({
              id: event.id,
              data: () => event
            });
          });
        }
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const events = await eventService.getUpcomingEvents('org123');

      expect(events).toHaveLength(2);
      expect(events[0].name).toBe('Upcoming Event 1');
    });
  });
});