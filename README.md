# diet-app

A Next.js 14 application for tracking diet and nutrition, built with TypeScript and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Date Handling**: date-fns
- **Linting**: ESLint with Next.js config

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Run verification tests
npm run test:setup
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
├── src/
│   └── app/
│       ├── layout.tsx      # Root layout with metadata
│       ├── page.tsx        # Home page
│       └── globals.css     # Global styles with Tailwind
├── verify-setup.test.js    # Setup verification tests
├── next.config.mjs         # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── postcss.config.mjs      # PostCSS configuration
└── tsconfig.json           # TypeScript configuration (strict mode)
```

## Verification

Run the setup verification tests to ensure all requirements are met:

```bash
npm run test:setup
```

This verifies:
- ✓ All required dependencies are installed
- ✓ TypeScript is configured with strict mode
- ✓ Tailwind CSS is properly configured
- ✓ App Router structure is in place
- ✓ ESLint configuration exists
