#!/bin/bash

echo "=================================================="
echo "NextAuth Authentication Test Runner"
echo "=================================================="
echo ""

echo "Step 1: Installing dependencies..."
npm install

echo ""
echo "Step 2: Generating Prisma client..."
npx prisma generate

echo ""
echo "Step 3: Running authentication tests..."
npm run test:auth

echo ""
echo "=================================================="
echo "Test run complete!"
echo "=================================================="
