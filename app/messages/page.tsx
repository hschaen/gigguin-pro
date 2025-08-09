'use client';

import MessageCenter from '@/components/communication/MessageCenter';
import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';

export default function MessagesPage() {
  const { user } = useAuth();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-gray-600">
          Communicate with your team, venues, and DJs
        </p>
      </div>

      <MessageCenter />
    </div>
  );
}