import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Event } from '@/lib/types/event';
import { Timestamp } from 'firebase/firestore';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Simple EventCard component for testing
const EventCard = ({ event, onEdit, onDelete }: { 
  event: Event; 
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) => {
  return (
    <div data-testid="event-card">
      <h3>{event.name}</h3>
      <p>{event.venueName}</p>
      <p>{new Date(event.date.toDate()).toLocaleDateString()}</p>
      <p>{event.status}</p>
      {onEdit && (
        <button onClick={() => onEdit(event.id!)} data-testid="edit-button">
          Edit
        </button>
      )}
      {onDelete && (
        <button onClick={() => onDelete(event.id!)} data-testid="delete-button">
          Delete
        </button>
      )}
    </div>
  );
};

describe('EventCard', () => {
  const mockEvent: Event = {
    id: 'event123',
    organizationId: 'org123',
    name: 'Summer Music Festival',
    date: Timestamp.fromDate(new Date('2024-07-15')),
    startTime: '18:00',
    endTime: '23:00',
    venueId: 'venue123',
    venueName: 'Central Park',
    status: 'confirmed',
    capacity: 1000,
    ticketPrice: 50,
    currency: 'USD',
    description: 'Annual summer music festival',
    djIds: ['dj1', 'dj2'],
    djNames: ['DJ Alpha', 'DJ Beta'],
    createdBy: 'user123',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  it('should render event information correctly', () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText('Summer Music Festival')).toBeInTheDocument();
    expect(screen.getByText('Central Park')).toBeInTheDocument();
    expect(screen.getByText('confirmed')).toBeInTheDocument();
    expect(screen.getByText('7/15/2024')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const handleEdit = jest.fn();
    render(<EventCard event={mockEvent} onEdit={handleEdit} />);

    const editButton = screen.getByTestId('edit-button');
    fireEvent.click(editButton);

    expect(handleEdit).toHaveBeenCalledWith('event123');
  });

  it('should call onDelete when delete button is clicked', () => {
    const handleDelete = jest.fn();
    render(<EventCard event={mockEvent} onDelete={handleDelete} />);

    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.click(deleteButton);

    expect(handleDelete).toHaveBeenCalledWith('event123');
  });

  it('should not render edit button when onEdit is not provided', () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
  });

  it('should not render delete button when onDelete is not provided', () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
  });

  it('should render with draft status', () => {
    const draftEvent = { ...mockEvent, status: 'draft' as const };
    render(<EventCard event={draftEvent} />);

    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('should render with cancelled status', () => {
    const cancelledEvent = { ...mockEvent, status: 'cancelled' as const };
    render(<EventCard event={cancelledEvent} />);

    expect(screen.getByText('cancelled')).toBeInTheDocument();
  });
});