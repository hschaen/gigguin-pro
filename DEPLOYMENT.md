# Gigguin Platform - Deployment Guide

## Prerequisites

1. **Node.js** (v20 or higher)
2. **Firebase CLI** installed globally
3. **Vercel CLI** installed globally
4. **Git** configured with repository access
5. **Environment variables** configured

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Run development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## Testing

### Unit Tests
```bash
npm run test
npm run test:watch  # Watch mode
npm run test:coverage  # With coverage
```

### E2E Tests
```bash
# Install Playwright
npx playwright install

# Run E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run with UI
npx playwright test --ui
```

## Deployment Process

### 1. Pre-deployment Checklist

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] ESLint warnings resolved
- [ ] Environment variables configured
- [ ] Firebase project created
- [ ] Vercel project linked
- [ ] Stripe account configured

### 2. Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize project
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy Cloud Functions
firebase deploy --only functions
```

### 3. Vercel Deployment

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 4. Environment Variables

Configure these in Vercel Dashboard:

#### Required Variables
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_BASE_URL`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### 5. Database Migration

```bash
# Run migrations (if applicable)
npm run migrate:prod

# Seed initial data
npm run seed:prod
```

### 6. Post-deployment

1. **Verify deployment**
   - Check all pages load correctly
   - Test authentication flow
   - Verify Firebase connections
   - Test Stripe integration
   - Check email sending

2. **Configure webhooks**
   - Stripe: `https://your-domain.com/api/webhooks/stripe`
   - Google: `https://your-domain.com/api/webhooks/google`

3. **Set up monitoring**
   - Configure error tracking (Sentry)
   - Set up analytics (Google Analytics)
   - Configure uptime monitoring
   - Set up alerts

## CI/CD Pipeline

The project uses GitHub Actions for CI/CD:

### Continuous Integration
- Runs on every PR to main
- Executes linting, type checking, and tests
- Builds the application
- Runs E2E tests

### Continuous Deployment
- Triggers on merge to main
- Deploys to Vercel production
- Updates Firebase rules and functions
- Runs smoke tests
- Sends deployment notifications

## Rollback Procedure

### Vercel Rollback
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Firebase Rollback
```bash
# Rollback functions
firebase functions:delete [function-name]
firebase deploy --only functions:[function-name]

# Restore previous rules
git checkout [previous-commit] firestore.rules
firebase deploy --only firestore:rules
```

## Monitoring & Logs

### Application Logs
```bash
# Vercel logs
vercel logs

# Firebase functions logs
firebase functions:log
```

### Performance Monitoring
- Vercel Analytics: `https://vercel.com/[org]/[project]/analytics`
- Firebase Performance: Firebase Console > Performance
- Google Analytics: `https://analytics.google.com`

## Security Checklist

- [ ] Environment variables secured
- [ ] Firebase rules properly configured
- [ ] API rate limiting enabled
- [ ] CORS configured correctly
- [ ] Content Security Policy set
- [ ] HTTPS enforced
- [ ] Secrets rotated regularly
- [ ] Dependencies up to date
- [ ] Security headers configured

## Troubleshooting

### Common Issues

1. **Build failures**
   - Check Node version
   - Clear cache: `rm -rf .next node_modules`
   - Reinstall dependencies: `npm ci`

2. **Firebase connection issues**
   - Verify project ID matches
   - Check service account permissions
   - Validate API keys

3. **Stripe webhook failures**
   - Verify webhook secret
   - Check endpoint URL
   - Review webhook logs in Stripe Dashboard

4. **Environment variable issues**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify format (especially multiline keys)

## Support

For deployment issues:
1. Check deployment logs
2. Review error tracking dashboard
3. Contact DevOps team
4. Create issue in GitHub repository

## Production URLs

- **Application**: https://gigguin.com
- **API**: https://api.gigguin.com
- **Documentation**: https://docs.gigguin.com
- **Status Page**: https://status.gigguin.com