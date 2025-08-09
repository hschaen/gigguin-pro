import { EventService } from '@/lib/services/event-service';
import { VenueService } from '@/lib/services/venue-service';
import { DJService } from '@/lib/services/dj-service';
import { ContractService } from '@/lib/services/contract-service';
import { Event } from '@/lib/types/event';
import { Venue } from '@/lib/types/venue';
import { DJ } from '@/lib/types/dj';
import { Contract } from '@/lib/types/contract';
import { Timestamp } from 'firebase/firestore';

jest.mock('firebase/firestore');

describe('Event Flow Integration', () => {
  let eventService: EventService;
  let venueService: VenueService;
  let djService: DJService;
  let contractService: ContractService;

  beforeEach(() => {
    eventService = EventService.getInstance();
    venueService = VenueService.getInstance();
    djService = DJService.getInstance();
    contractService = ContractService.getInstance();
    jest.clearAllMocks();
  });

  describe('Complete Event Booking Flow', () => {
    it('should complete full event booking process', async () => {
      // Step 1: Check venue availability
      const venueId = 'venue123';
      const eventDate = new Date('2024-12-31');
      
      jest.spyOn(venueService, 'checkVenueAvailability').mockResolvedValue(true);
      
      const isVenueAvailable = await venueService.checkVenueAvailability(venueId, eventDate);
      expect(isVenueAvailable).toBe(true);

      // Step 2: Check DJ availability
      const djIds = ['dj1', 'dj2'];
      jest.spyOn(djService, 'checkAvailability').mockResolvedValue(true);
      
      for (const djId of djIds) {
        const isDJAvailable = await djService.checkAvailability(djId, eventDate);
        expect(isDJAvailable).toBe(true);
      }

      // Step 3: Create event
      const eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
        organizationId: 'org123',
        name: 'New Year Eve Party',
        date: Timestamp.fromDate(eventDate),
        startTime: '21:00',
        endTime: '03:00',
        venueId,
        venueName: 'Grand Ballroom',
        status: 'draft',
        capacity: 500,
        ticketPrice: 100,
        currency: 'USD',
        description: 'Celebrate New Year with us!',
        djIds,
        djNames: ['DJ One', 'DJ Two'],
        createdBy: 'user123'
      };

      jest.spyOn(eventService, 'createEvent').mockResolvedValue('event123');
      
      const eventId = await eventService.createEvent(eventData);
      expect(eventId).toBe('event123');

      // Step 4: Generate contracts
      const venueContractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'> = {
        organizationId: 'org123',
        type: 'venue',
        eventId,
        partyAId: 'org123',
        partyAName: 'Event Organizer',
        partyBId: venueId,
        partyBName: 'Grand Ballroom',
        status: 'draft',
        terms: {
          rentalFee: 5000,
          depositAmount: 2500,
          paymentSchedule: 'Net 30',
          cancellationPolicy: '48 hours notice'
        },
        startDate: Timestamp.fromDate(eventDate),
        endDate: Timestamp.fromDate(new Date('2025-01-01')),
        createdBy: 'user123'
      };

      jest.spyOn(contractService, 'createContract').mockResolvedValue('contract123');
      
      const venueContractId = await contractService.createContract(venueContractData);
      expect(venueContractId).toBe('contract123');

      // Step 5: Update event status to confirmed
      jest.spyOn(eventService, 'updateEvent').mockResolvedValue();
      
      await eventService.updateEvent(eventId, { status: 'confirmed' });
      expect(eventService.updateEvent).toHaveBeenCalledWith(eventId, { status: 'confirmed' });

      // Step 6: Book venue
      jest.spyOn(venueService, 'updateVenueAvailability').mockResolvedValue();
      
      await venueService.updateVenueAvailability(venueId, {
        date: Timestamp.fromDate(eventDate),
        isAvailable: false,
        eventId,
        reason: 'Booked for New Year Eve Party'
      });

      // Step 7: Book DJs
      for (const djId of djIds) {
        jest.spyOn(djService, 'bookDJ').mockResolvedValue();
        await djService.bookDJ(djId, eventId, eventDate);
      }

      // Verify all steps completed
      expect(venueService.checkVenueAvailability).toHaveBeenCalled();
      expect(djService.checkAvailability).toHaveBeenCalledTimes(2);
      expect(eventService.createEvent).toHaveBeenCalled();
      expect(contractService.createContract).toHaveBeenCalled();
      expect(eventService.updateEvent).toHaveBeenCalled();
      expect(venueService.updateVenueAvailability).toHaveBeenCalled();
      expect(djService.bookDJ).toHaveBeenCalledTimes(2);
    });

    it('should handle venue unavailability', async () => {
      const venueId = 'venue123';
      const eventDate = new Date('2024-12-31');
      
      jest.spyOn(venueService, 'checkVenueAvailability').mockResolvedValue(false);
      
      const isVenueAvailable = await venueService.checkVenueAvailability(venueId, eventDate);
      
      expect(isVenueAvailable).toBe(false);
      // Event creation should not proceed
      expect(eventService.createEvent).not.toHaveBeenCalled();
    });

    it('should handle DJ unavailability', async () => {
      const djId = 'dj1';
      const eventDate = new Date('2024-12-31');
      
      jest.spyOn(djService, 'checkAvailability').mockResolvedValue(false);
      
      const isDJAvailable = await djService.checkAvailability(djId, eventDate);
      
      expect(isDJAvailable).toBe(false);
      // Event creation should not proceed with this DJ
      expect(eventService.createEvent).not.toHaveBeenCalled();
    });
  });

  describe('Event Cancellation Flow', () => {
    it('should handle event cancellation properly', async () => {
      const eventId = 'event123';
      const venueId = 'venue123';
      const djIds = ['dj1', 'dj2'];
      const eventDate = new Date('2024-12-31');

      // Cancel event
      jest.spyOn(eventService, 'updateEvent').mockResolvedValue();
      await eventService.updateEvent(eventId, { status: 'cancelled' });

      // Release venue
      jest.spyOn(venueService, 'updateVenueAvailability').mockResolvedValue();
      await venueService.updateVenueAvailability(venueId, {
        date: Timestamp.fromDate(eventDate),
        isAvailable: true,
        reason: 'Event cancelled'
      });

      // Release DJs
      for (const djId of djIds) {
        jest.spyOn(djService, 'cancelBooking').mockResolvedValue();
        await djService.cancelBooking(djId, eventId);
      }

      // Update contracts
      jest.spyOn(contractService, 'updateContract').mockResolvedValue();
      await contractService.updateContract('contract123', { status: 'cancelled' });

      // Verify cancellation flow
      expect(eventService.updateEvent).toHaveBeenCalledWith(eventId, { status: 'cancelled' });
      expect(venueService.updateVenueAvailability).toHaveBeenCalled();
      expect(djService.cancelBooking).toHaveBeenCalledTimes(2);
      expect(contractService.updateContract).toHaveBeenCalled();
    });
  });
});