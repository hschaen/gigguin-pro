#!/bin/bash

# Gigguin Platform - Initial Setup Script
# This script helps you set up the Gigguin platform for the first time

set -e

echo "=========================================="
echo "  GIGGUIN PLATFORM - INITIAL SETUP"
echo "=========================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Error: Node.js 20 or higher is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi
echo "✅ npm version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check for .env.local file
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local
    echo "✅ .env.local file created from .env.local.example"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.local and add your configuration values"
    echo "   See README.md for detailed instructions on getting these values"
    echo ""
    read -p "Press Enter to continue after you've configured .env.local..."
else
    echo "✅ .env.local file exists"
fi
echo ""

# Install Firebase CLI
echo "🔥 Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    echo "Installing Firebase CLI globally..."
    npm install -g firebase-tools
    echo "✅ Firebase CLI installed"
else
    echo "✅ Firebase CLI is already installed: $(firebase --version)"
fi
echo ""

# Firebase login
echo "🔐 Firebase Authentication"
echo "You need to be logged in to Firebase to deploy rules and indexes"
read -p "Do you want to login to Firebase now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    firebase login
    echo "✅ Firebase login complete"
fi
echo ""

# Initialize Firebase
read -p "Do you want to initialize Firebase for this project? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔥 Initializing Firebase..."
    echo "Please select the following options:"
    echo "  - Firestore"
    echo "  - Storage"
    echo "  - Functions (optional)"
    echo "  - Emulators (optional, but recommended for development)"
    firebase init
    echo "✅ Firebase initialization complete"
fi
echo ""

# Deploy Firebase rules
read -p "Do you want to deploy Firebase security rules? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying Firebase rules..."
    firebase deploy --only firestore:rules,storage:rules
    echo "✅ Firebase rules deployed"
fi
echo ""

# Deploy Firebase indexes
read -p "Do you want to deploy Firebase indexes? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying Firebase indexes..."
    firebase deploy --only firestore:indexes
    echo "✅ Firebase indexes deployed"
fi
echo ""

# Install Playwright browsers for E2E testing
read -p "Do you want to install Playwright browsers for E2E testing? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🎭 Installing Playwright browsers..."
    npx playwright install
    echo "✅ Playwright browsers installed"
fi
echo ""

# Run type checking
echo "🔍 Running type checking..."
npx tsc --noEmit || true
echo ""

# Run linting
echo "🔍 Running linting..."
npm run lint || true
echo ""

# Build the application
read -p "Do you want to build the application now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🏗️  Building application..."
    npm run build
    echo "✅ Build complete"
fi
echo ""

echo "=========================================="
echo "  SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Make sure your .env.local file is properly configured"
echo "2. Start the development server: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Create your account and organization"
echo ""
echo "For more information, see README.md"
echo ""
echo "Happy coding! 🎉"