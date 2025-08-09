import { getAllBookings, BookingData } from "./firestore";
import { DJData } from "./dj-firestore";

export interface AgreementStatus {
  djId: string;
  djName: string;
  hasAgreement: boolean;
  agreementDate?: string;
  bookingId?: string;
  eventDate?: string;
}

export interface DJWithAgreementStatus extends DJData {
  agreementStatus: AgreementStatus;
}

/**
 * Check if a specific DJ has a booking (agreement) for a specific event date
 */
export async function checkDJAgreementForEvent(
  djName: string, 
  djEmail: string, 
  eventDate: string
): Promise<AgreementStatus> {
  try {
    const bookings = await getAllBookings();
    
    // Find booking that matches DJ name/email and event date
    const djBooking = bookings.find(booking => 
      (booking.djName?.toLowerCase() === djName.toLowerCase() || 
       booking.email?.toLowerCase() === djEmail.toLowerCase()) &&
      booking.eventDate === eventDate
    );

    return {
      djId: djEmail, // Use email as unique identifier
      djName,
      hasAgreement: !!djBooking,
      agreementDate: djBooking?.eventDate,
      bookingId: djBooking?.id,
      eventDate
    };
  } catch (error) {
    console.error("Error checking DJ agreement:", error);
    return {
      djId: djEmail,
      djName,
      hasAgreement: false,
      eventDate
    };
  }
}

/**
 * Check if a DJ has any agreement (regardless of date)
 */
export async function checkDJHasAnyAgreement(
  djName: string, 
  djEmail: string
): Promise<AgreementStatus> {
  try {
    const bookings = await getAllBookings();
    
    // Find any booking that matches DJ name or email
    const djBooking = bookings.find(booking => 
      booking.djName?.toLowerCase() === djName.toLowerCase() || 
      booking.email?.toLowerCase() === djEmail.toLowerCase()
    );

    return {
      djId: djEmail,
      djName,
      hasAgreement: !!djBooking,
      agreementDate: djBooking?.eventDate,
      bookingId: djBooking?.id,
      eventDate: djBooking?.eventDate
    };
  } catch (error) {
    console.error("Error checking DJ agreement:", error);
    return {
      djId: djEmail,
      djName,
      hasAgreement: false
    };
  }
}

/**
 * Get agreement status for multiple DJs for a specific event date
 */
export async function getDJsWithAgreementStatus(
  djs: DJData[], 
  eventDate: string
): Promise<DJWithAgreementStatus[]> {
  try {
    const bookings = await getAllBookings();
    
    return djs.map(dj => {
      // Find booking that matches this DJ for the event date
      const djBooking = bookings.find(booking => 
        (booking.djName?.toLowerCase() === dj.djName.toLowerCase() || 
         booking.email?.toLowerCase() === dj.email?.toLowerCase()) &&
        booking.eventDate === eventDate
      );

      const agreementStatus: AgreementStatus = {
        djId: dj.id || dj.email || dj.djName,
        djName: dj.djName,
        hasAgreement: !!djBooking,
        agreementDate: djBooking?.eventDate,
        bookingId: djBooking?.id,
        eventDate
      };

      return {
        ...dj,
        agreementStatus
      };
    });
  } catch (error) {
    console.error("Error getting DJs with agreement status:", error);
    // Return DJs with no agreement status if there's an error
    return djs.map(dj => ({
      ...dj,
      agreementStatus: {
        djId: dj.id || dj.email || dj.djName,
        djName: dj.djName,
        hasAgreement: false,
        eventDate
      }
    }));
  }
}

/**
 * Get all DJs who have agreements (are in bookings table)
 */
export async function getDJsWithAgreements(): Promise<BookingData[]> {
  try {
    return await getAllBookings();
  } catch (error) {
    console.error("Error getting DJs with agreements:", error);
    return [];
  }
}

/**
 * Check if a DJ needs an agreement for a specific event
 */
export function djNeedsAgreement(agreementStatus: AgreementStatus): boolean {
  return !agreementStatus.hasAgreement;
}

/**
 * Get booking form URL with pre-filled DJ data
 */
export function getBookingFormUrl(dj: DJData, eventDate?: string): string {
  const params = new URLSearchParams();
  
  if (dj.djName) params.set('djName', dj.djName);
  if (dj.fullName) params.set('djLegalName', dj.fullName);
  if (dj.email) params.set('email', dj.email);
  if (dj.phone) params.set('phone', dj.phone);
  if (eventDate) params.set('eventDate', eventDate);
  
  return `/book-dj?${params.toString()}`;
}

/**
 * Format agreement status for display
 */
export function formatAgreementStatus(agreementStatus: AgreementStatus): string {
  if (agreementStatus.hasAgreement) {
    return `Agreement sent${agreementStatus.agreementDate ? ` (${agreementStatus.agreementDate})` : ''}`;
  }
  return 'No agreement sent';
}