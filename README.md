# Gigguin Pro - Multi-Role DJ Booking Platform

A comprehensive booking and event management platform for promoters, venues, and DJs. This platform integrates the functionality from the DJ Booking Tool and Host Check-In App into a unified multi-tenant solution.

## 🚀 Features

### For Promoters
- Multi-venue event management with pipeline tracking
- DJ database with availability and booking management
- Marketing studio with asset generator for flyers
- Guest list management with QR code check-in
- Financial management with invoicing and payments

### For Venues
- Visual calendar with holds and bookings
- Promoter roster management
- Tech specs and hospitality notes
- Settlement tools and financial reporting
- Brand pack management

### For DJs
- Professional EPK (Electronic Press Kit) pages
- Availability calendar
- Direct gig applications
- Automated invoicing and payouts via Stripe Connect
- Portfolio and media management

### Platform Features
- **Payment Processing**: Full Stripe integration with escrow deposits
- **Asset Generation**: Create professional flyers with customizable templates
- **Guest Management**: RSVP system with QR codes and real-time check-in
- **Google Integration**: Two-way sync with Google Sheets and Drive
- **AI-Powered Tools**: Copy generation, DJ recommendations, smart scheduling
- **Multi-Tenancy**: Organization-based isolation with custom domains

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth + NextAuth.js
- **Styling**: Tailwind CSS + shadcn/ui
- **Payments**: Stripe (including Connect for payouts)
- **File Storage**: Firebase Storage
- **Email**: Resend
- **SMS**: Twilio (optional)
- **AI**: OpenAI API

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gigguin-pro.git
cd gigguin-pro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your API keys and configuration

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔧 Configuration

### Required Environment Variables

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Google Services
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_SERVICE_ACCOUNT_KEY=

# Email & SMS
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# OpenAI
OPENAI_API_KEY=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
```

## 📱 Key Pages

- `/` - Landing page with platform overview
- `/dj-booking` - DJ booking form (Sushi Sundays compatible)
- `/asset-generator` - Flyer and asset creation tool
- `/events` - Event management dashboard
- `/checkin` - Guest check-in interface
- `/venues` - Venue management
- `/djs` - DJ directory and profiles

## 🏗️ Project Structure

```
gigguin-pro/
├── app/                    # Next.js app router pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── AssetGenerator/   # Asset creation components
│   └── ...              # Feature-specific components
├── lib/                   # Utilities and services
│   ├── firebase.ts       # Firebase configuration
│   ├── stripe-config.ts  # Stripe setup
│   ├── google-sheets.ts  # Google Sheets integration
│   └── ...              # Other services
├── public/               # Static assets
└── types/               # TypeScript type definitions
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

### Self-Hosted
1. Build the production bundle:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## 🔐 Security

- Firebase Security Rules enforce role-based access control
- All payment processing handled by Stripe
- Sensitive data encrypted at rest
- API endpoints protected with authentication
- Cross-organization data isolation

## 🤝 Contributing

This is a private project integrating:
- DJ Booking Tool (for Sushi Sundays events)
- Host Check-In App
- New multi-tenant features for Gigguin platform

## 📝 License

Private - All rights reserved

## 🆘 Support

For issues or questions, please contact the development team.

---

Built with ❤️ for the event management industry
