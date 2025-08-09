import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Music, Building, BarChart, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Gigguin
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            The Professional Multi-Role DJ Booking & Event Management Platform
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" className="gap-2">
                Get Started
              </Button>
            </Link>
            <Link href="/settings/organization">
              <Button size="lg" variant="outline" className="gap-2">
                Organization Settings
              </Button>
            </Link>
            <Link href="/events">
              <Button size="lg" variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Browse Events
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          <Card>
            <CardHeader>
              <Building className="h-8 w-8 text-primary mb-2" />
              <CardTitle>For Venues</CardTitle>
              <CardDescription>
                Manage your calendar, promoters, and events in one place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Visual calendar with holds & bookings</li>
                <li>• Promoter roster management</li>
                <li>• Tech specs & hospitality notes</li>
                <li>• Settlement tools & reporting</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>For Promoters</CardTitle>
              <CardDescription>
                Book DJs, manage events, and streamline operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Multi-venue event management</li>
                <li>• DJ database with availability</li>
                <li>• Marketing studio & asset generator</li>
                <li>• Guest list & RSVP management</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Music className="h-8 w-8 text-primary mb-2" />
              <CardTitle>For DJs</CardTitle>
              <CardDescription>
                Showcase your talent and manage bookings professionally
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Professional EPK pages</li>
                <li>• Availability calendar</li>
                <li>• Apply to gigs directly</li>
                <li>• Automated invoicing & payouts</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Financial Management</CardTitle>
              <CardDescription>
                Complete payment processing and financial analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Stripe integration for payments</li>
                <li>• Escrow deposits for bookings</li>
                <li>• Automated DJ payouts</li>
                <li>• Financial reporting & analytics</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Event Operations</CardTitle>
              <CardDescription>
                Everything you need to run successful events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Asset generator for flyers</li>
                <li>• Guest list with QR check-in</li>
                <li>• Google Sheets integration</li>
                <li>• Real-time collaboration</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary mb-2" />
              <CardTitle>AI-Powered Features</CardTitle>
              <CardDescription>
                Smart tools to save time and improve results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• AI copy generation for marketing</li>
                <li>• Smart DJ recommendations</li>
                <li>• Optimal scheduling suggestions</li>
                <li>• Automated social media content</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/venues">
              <Button variant="outline">Browse Venues</Button>
            </Link>
            <Link href="/events/pipeline">
              <Button variant="outline">Event Pipeline</Button>
            </Link>
            <Link href="/studio/brand-packs">
              <Button variant="outline">Brand Packs</Button>
            </Link>
            <Link href="/studio/asset-generator">
              <Button variant="outline">Asset Studio</Button>
            </Link>
            <Link href="/dj-booking">
              <Button variant="outline">Book a DJ</Button>
            </Link>
            <Link href="/events/create">
              <Button variant="outline">Create Event</Button>
            </Link>
            <Link href="/checkin">
              <Button variant="outline">Check-In Guests</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}