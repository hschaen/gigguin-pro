# Gigguin Platform - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Installation](#installation)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Application Routes](#application-routes)
7. [Features Guide](#features-guide)
8. [User Roles & Permissions](#user-roles--permissions)
9. [API Endpoints](#api-endpoints)
10. [Troubleshooting](#troubleshooting)

## Overview

Gigguin is a comprehensive multi-role DJ booking and event management platform that streamlines the entire event lifecycle from booking to execution. Built with Next.js 15, Firebase, and Stripe, it supports promoters, venues, DJs, and administrators.

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **Payments**: Stripe Connect Standard
- **UI Components**: shadcn/ui, Radix UI
- **Integrations**: Google Workspace, AI/ML Analytics
- **Testing**: Jest, Playwright
- **Deployment**: Vercel, Firebase

## Installation

### Prerequisites
- Node.js 20.0.0 or higher
- npm or yarn
- Git
- Firebase account
- Stripe account (for payments)
- Google Cloud account (for integrations)

### Step-by-Step Installation

```bash
# 1. Clone the repository
git clone https://github.com/hschaen/gigguin-pro.git
cd gigguin-pro

# 2. Install dependencies
npm install

# 3. Install Playwright browsers (for E2E testing)
npx playwright install

# 4. Copy environment variables
cp .env.local.example .env.local

# 5. Set up environment variables (see Environment Setup section)
```

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Required for server-side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"

# Stripe (Required for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Google APIs (Optional - for integrations)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Service - Resend (Optional)
RESEND_API_KEY=re_your_api_key

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key_here

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Go to Project Settings > General
4. Under "Your apps", click "Add app" > Web
5. Copy the configuration values
6. For Admin SDK: Go to Project Settings > Service Accounts > Generate new private key

### Getting Stripe Credentials

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get Publishable and Secret keys from Developers > API keys
3. For webhook secret: 
   - Go to Developers > Webhooks
   - Add endpoint: `http://localhost:3000/api/webhooks/stripe`
   - Copy the webhook signing secret

## Database Setup

### Firebase Firestore Setup

1. **Enable Firestore**:
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase (select your project)
   firebase init firestore
   ```

2. **Deploy Security Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Deploy Indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. **Enable Authentication**:
   - Go to Firebase Console > Authentication
   - Click "Get Started"
   - Enable Email/Password provider
   - (Optional) Enable Google provider

5. **Enable Storage**:
   - Go to Firebase Console > Storage
   - Click "Get Started"
   - Deploy storage rules:
   ```bash
   firebase deploy --only storage:rules
   ```

### Database Collections Structure

```
firestore/
├── users/                    # User profiles
├── organizations/            # Multi-tenant organizations
│   └── {orgId}/
│       └── members/         # Organization members
├── events/                  # Event records
├── venues/                  # Venue profiles
├── djs/                     # DJ profiles
├── contracts/               # Digital contracts
├── brand_packs/            # Brand assets
├── event_pipelines/        # Automation pipelines
├── conversations/          # Chat messages
│   └── {conversationId}/
│       └── messages/
├── public_pages/           # Public event/DJ/venue pages
├── ai_recommendations/     # AI-generated recommendations
├── analytics_dashboards/   # Custom dashboards
└── analytics_events/       # Analytics tracking
```

## Running the Application

### Development Mode

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npx playwright test

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## Application Routes

### Public Routes (No Authentication Required)
- `/` - Landing page / Login
- `/signup` - Create new account
- `/forgot-password` - Password reset
- `/[slug]` - Public event/DJ/venue pages (SEO-optimized)

### Authentication Routes
- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page
- `/auth/error` - Authentication error page

### Dashboard Routes (Authentication Required)
- `/dashboard` - Main dashboard
- `/profile` - User profile management
- `/settings` - Application settings
- `/settings/organization` - Organization settings
- `/settings/google` - Google integrations
- `/settings/payment` - Payment settings

### Event Management
- `/events` - Events list
- `/events/create` - Create new event
- `/events/[id]` - Event details
- `/events/[id]/edit` - Edit event
- `/events/[id]/pipeline` - Event pipeline view
- `/events/[id]/check-in` - Guest check-in

### Venue Management
- `/venues` - Venues list
- `/venues/create` - Add new venue
- `/venues/[id]` - Venue details
- `/venues/[id]/edit` - Edit venue
- `/venues/[id]/availability` - Manage availability

### DJ Management
- `/djs` - DJs list
- `/djs/create` - Add new DJ
- `/djs/[slug]` - DJ profile
- `/djs/[slug]/edit` - Edit DJ profile
- `/djs/[slug]/epk` - Electronic Press Kit

### Contract Management
- `/contracts` - Contracts list
- `/contracts/create` - Create new contract
- `/contracts/[id]` - Contract details
- `/contracts/[id]/sign` - Sign contract
- `/contracts/templates` - Contract templates

### Brand & Assets
- `/brand-packs` - Brand packs list
- `/brand-packs/create` - Create brand pack
- `/brand-packs/[id]` - Brand pack details
- `/assets/generate` - Generate flyers/assets

### Communication
- `/messages` - Message center
- `/notifications` - Notification center

### Analytics & AI
- `/analytics` - Analytics dashboard
- `/analytics/reports` - Generated reports
- `/analytics/insights` - AI insights

### Public Pages Management
- `/pages` - Manage public pages
- `/pages/create` - Create public page
- `/pages/[id]/edit` - Edit public page
- `/pages/[id]/analytics` - Page analytics

## Features Guide

### 1. Multi-Tenant Organization Management
```typescript
// Organizations support multiple users with role-based access
Roles:
- Owner: Full access
- Admin: Manage all features
- Manager: Manage events and bookings
- Member: View and basic operations
- Viewer: Read-only access
```

### 2. Event Management
- Create and manage events
- Multi-stage pipeline (Planning → Promotion → Execution → Complete)
- Automated status transitions
- Guest list management
- QR code check-in system
- Ticket sales integration

### 3. Venue Management
- Venue profiles with photos and amenities
- Availability calendar
- Booking management
- Capacity tracking
- Pricing tiers
- Reviews and ratings

### 4. DJ Management
- Professional DJ profiles
- Electronic Press Kit (EPK)
- Portfolio showcase
- Booking calendar
- Performance history
- Rate management

### 5. Contract System
- Digital contract creation
- Template library
- E-signature support
- Version tracking
- Automated reminders
- Legal compliance

### 6. Brand Pack & Asset Generation
- Canvas-based flyer generator
- Brand consistency tools
- Template management
- Social media assets
- Batch generation
- Export in multiple formats

### 7. Event Pipeline Automation
- Customizable workflows
- Automated triggers
- Email notifications
- Task assignments
- Status tracking
- Deadline management

### 8. Communication System
- Real-time messaging
- Email templates
- SMS notifications (with Twilio integration)
- Broadcast messages
- Conversation threading
- File sharing

### 9. Google Integrations
- **Calendar**: Sync events with Google Calendar
- **Sheets**: Export data to Google Sheets
- **Drive**: Store and share documents
- **Maps**: Venue locations and directions
- **Analytics**: Track page views

### 10. AI & Analytics
- Predictive analytics
- Booking recommendations
- Pricing optimization
- Demand forecasting
- Performance insights
- Custom dashboards

### 11. Public Pages & SEO
- SEO-optimized event pages
- DJ public profiles
- Venue landing pages
- Social media integration
- Analytics tracking
- Custom domains support

### 12. Payment Processing
- Stripe Connect integration
- Split payments
- Deposit handling
- Refund management
- Invoice generation
- Financial reporting

## User Roles & Permissions

### Setting Up Your First Organization

1. **Sign Up**: Create your account at `/signup`
2. **Create Organization**: After login, you'll be prompted to create an organization
3. **Invite Team Members**: Go to Settings > Organization > Team
4. **Assign Roles**: Set appropriate roles for team members

### Permission Matrix

| Feature | Owner | Admin | Manager | Member | Viewer |
|---------|-------|-------|---------|--------|--------|
| View Events | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Events | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Events | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete Events | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Contracts | ✅ | ✅ | ✅ | ❌ | ❌ |
| Financial Access | ✅ | ✅ | ❌ | ❌ | ❌ |
| Organization Settings | ✅ | ✅ | ❌ | ❌ | ❌ |

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `POST /api/auth/forgot-password` - Request password reset

### Events API
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/[id]` - Get event details
- `PUT /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event

### Venues API
- `GET /api/venues` - List venues
- `POST /api/venues` - Create venue
- `GET /api/venues/[id]` - Get venue details
- `PUT /api/venues/[id]` - Update venue
- `GET /api/venues/[id]/availability` - Check availability

### DJs API
- `GET /api/djs` - List DJs
- `POST /api/djs` - Create DJ profile
- `GET /api/djs/[id]` - Get DJ details
- `PUT /api/djs/[id]` - Update DJ profile
- `GET /api/djs/[id]/availability` - Check DJ availability

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler
- `POST /api/webhooks/google` - Google webhook handler

## Troubleshooting

### Common Issues and Solutions

#### 1. Firebase Connection Issues
```bash
Error: Failed to connect to Firebase
Solution:
- Verify all Firebase environment variables are set
- Check Firebase project exists and is active
- Ensure Firestore and Auth are enabled
```

#### 2. Stripe Integration Issues
```bash
Error: Stripe is not defined
Solution:
- Verify Stripe keys are correct
- Check if using test keys in development
- Ensure webhook endpoint is configured
```

#### 3. Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### 4. Authentication Issues
```bash
Error: User not authenticated
Solution:
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your domain
- Clear browser cookies and try again
```

#### 5. Database Permission Errors
```bash
Error: Missing or insufficient permissions
Solution:
- Deploy latest Firestore rules: firebase deploy --only firestore:rules
- Verify user is member of organization
- Check role permissions
```

### Development Tips

1. **Use Firebase Emulator for Local Development**:
```bash
firebase emulators:start
```

2. **Enable Debug Mode**:
```env
# Add to .env.local
DEBUG=true
LOG_LEVEL=debug
```

3. **Monitor Performance**:
- Use React DevTools
- Check Network tab for API calls
- Monitor Firebase Usage in Console

4. **Testing Different Roles**:
- Create test accounts for each role
- Use Firebase Auth emulator for testing

## Support & Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Getting Help
- GitHub Issues: [Report bugs or request features](https://github.com/hschaen/gigguin-pro/issues)
- Documentation: Check `/docs` folder for detailed guides
- Community: Join our Discord server (coming soon)

### Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on contributing to the project.

### License
This project is proprietary software. All rights reserved.

---

## Quick Start Checklist

- [ ] Clone repository
- [ ] Install dependencies
- [ ] Set up Firebase project
- [ ] Configure environment variables
- [ ] Deploy Firebase rules
- [ ] Run development server
- [ ] Create your first organization
- [ ] Add a venue
- [ ] Create an event
- [ ] Invite team members

Welcome to Gigguin! 🎉