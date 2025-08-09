import { VenueService } from '@/lib/services/venue-service';
import { addDoc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { Venue } from '@/lib/types/venue';
import { Timestamp } from 'firebase/firestore';

jest.mock('firebase/firestore');

describe('VenueService', () => {
  let venueService: VenueService;

  beforeEach(() => {
    venueService = VenueService.getInstance();
    jest.clearAllMocks();
  });

  describe('createVenue', () => {
    it('should create a new venue successfully', async () => {
      const mockVenueData: Omit<Venue, 'id' | 'createdAt' | 'updatedAt'> = {
        organizationId: 'org123',
        name: 'Test Venue',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001',
        capacity: 500,
        type: ['nightclub', 'concert_hall'],
        amenities: ['parking', 'vip_area'],
        contact: {
          email: 'venue@test.com',
          phone: '555-0123',
          website: 'https://testvenue.com'
        },
        settings: {
          autoApproveBookings: false,
          requireDeposit: true,
          depositPercentage: 50,
          cancellationPolicy: '48 hours notice required'
        },
        isActive: true,
        createdBy: 'user123'
      };

      const mockDocRef = { id: 'venue123' };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const venueId = await venueService.createVenue(mockVenueData);

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...mockVenueData,
          createdAt: expect.anything(),
          updatedAt: expect.anything()
        })
      );
      expect(venueId).toBe('venue123');
    });
  });

  describe('getVenue', () => {
    it('should retrieve a venue by ID', async () => {
      const mockVenue = {
        id: 'venue123',
        name: 'Test Venue',
        capacity: 500,
        city: 'New York'
      };

      const mockDoc = {
        exists: () => true,
        id: 'venue123',
        data: () => mockVenue
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const venue = await venueService.getVenue('venue123');

      expect(getDoc).toHaveBeenCalled();
      expect(venue).toEqual({ ...mockVenue, id: 'venue123' });
    });

    it('should return null for non-existent venue', async () => {
      const mockDoc = {
        exists: () => false
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const venue = await venueService.getVenue('nonexistent');

      expect(venue).toBeNull();
    });
  });

  describe('updateVenueAvailability', () => {
    it('should update venue availability', async () => {
      const availability = {
        date: Timestamp.fromDate(new Date('2024-12-31')),
        isAvailable: false,
        reason: 'Booked for private event'
      };

      await venueService.updateVenueAvailability('venue123', availability);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          availability: expect.arrayContaining([availability]),
          updatedAt: expect.anything()
        })
      );
    });
  });

  describe('searchVenues', () => {
    it('should search venues by criteria', async () => {
      const mockVenues = [
        { id: 'venue1', name: 'Venue 1', city: 'New York', capacity: 300 },
        { id: 'venue2', name: 'Venue 2', city: 'New York', capacity: 500 }
      ];

      const mockQuerySnapshot = {
        forEach: (callback: Function) => {
          mockVenues.forEach(venue => {
            callback({
              id: venue.id,
              data: () => venue
            });
          });
        }
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const venues = await venueService.searchVenues({
        city: 'New York',
        minCapacity: 200
      });

      expect(venues).toHaveLength(2);
      expect(venues[0].city).toBe('New York');
    });
  });

  describe('getVenuesByOrganization', () => {
    it('should retrieve all venues for an organization', async () => {
      const mockVenues = [
        { id: 'venue1', name: 'Venue 1', organizationId: 'org123' },
        { id: 'venue2', name: 'Venue 2', organizationId: 'org123' }
      ];

      const mockQuerySnapshot = {
        forEach: (callback: Function) => {
          mockVenues.forEach(venue => {
            callback({
              id: venue.id,
              data: () => venue
            });
          });
        }
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const venues = await venueService.getVenuesByOrganization('org123');

      expect(venues).toHaveLength(2);
      expect(venues[0].organizationId).toBe('org123');
    });
  });

  describe('checkVenueAvailability', () => {
    it('should check if venue is available on a specific date', async () => {
      const mockVenue = {
        id: 'venue123',
        name: 'Test Venue',
        availability: [
          {
            date: Timestamp.fromDate(new Date('2024-12-31')),
            isAvailable: false,
            reason: 'Booked'
          }
        ]
      };

      const mockDoc = {
        exists: () => true,
        id: 'venue123',
        data: () => mockVenue
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const isAvailable = await venueService.checkVenueAvailability(
        'venue123',
        new Date('2024-12-31')
      );

      expect(isAvailable).toBe(false);
    });

    it('should return true if no availability record exists for date', async () => {
      const mockVenue = {
        id: 'venue123',
        name: 'Test Venue',
        availability: []
      };

      const mockDoc = {
        exists: () => true,
        id: 'venue123',
        data: () => mockVenue
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const isAvailable = await venueService.checkVenueAvailability(
        'venue123',
        new Date('2025-01-15')
      );

      expect(isAvailable).toBe(true);
    });
  });
});