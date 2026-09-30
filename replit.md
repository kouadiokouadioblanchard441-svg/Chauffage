# Stone by ton - Online Stone & Tile Platform

## Overview

Stone by ton is a French company founded in 2013, based in Six-Fours-les-Plages in the Var. The platform presents a range of natural stone, travertine, tiles, and wall cladding for indoor and outdoor floors and walls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (dark mode default)
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Session Management**: express-session with MemoryStore (development) or connect-pg-simple (production)
- **Authentication**: Session-based auth with bcrypt password hashing
- **API Design**: RESTful JSON API under `/api` prefix

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command
- **Key Tables**: users, products, userProducts, deposits, withdrawals, withdrawalWallets, paymentChannels, tasks, userTasks, transactions, platformSettings

### Authentication & Authorization
- **User Auth**: Phone number + country + password combination
- **Session Storage**: Server-side sessions with httpOnly cookies
- **Role System**: Regular users, Admins, Super Admins
- **Middleware**: `requireAuth` and `requireAdmin` middleware for route protection

### Key Features
- **Multi-country Support**: 7 African countries with different currencies (XAF, XOF, CDF) and payment methods
- **Product System**: Virtual industrial robot products with daily earnings cycles
- **Referral System**: 3-level commission structure for team building
- **Task System**: Invite-based tasks with bonus rewards
- **Admin Panel**: Full CRUD for users, deposits, withdrawals, products, payment channels, and settings

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # UI components including admin panel
│   ├── pages/           # Route pages (home, invest, tasks, team, account, admin)
│   ├── lib/             # Utilities (auth, queryClient, countries)
│   └── hooks/           # Custom React hooks
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations interface
│   ├── db.ts            # Database connection
│   └── seed.ts          # Initial data seeding
├── shared/              # Shared code between client/server
│   └── schema.ts        # Drizzle schema and Zod validators
└── migrations/          # Database migrations
```

## External Dependencies

### Database
- **PostgreSQL**: The application uses the user's single Neon database through `NEON_DATABASE_URL` for application data and sessions in both Replit and Plesk.
- **Drizzle ORM**: Type-safe database queries and schema management
- `SUPABASE_SOURCE_DATABASE_URL` is not used by the application runtime.

### Frontend Libraries
- **Radix UI**: Accessible UI primitives (dialogs, dropdowns, tabs, etc.)
- **TanStack Query**: Server state management and caching
- **Lucide React**: Icon library

### Backend Libraries
- **bcrypt**: Password hashing
- **express-session**: Session management
- **memorystore**: In-memory session store for development

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Backend bundling for production
- **TypeScript**: Type checking across full stack

### Environment Variables Required
- `NEON_DATABASE_URL`: the single Neon PostgreSQL database used by the application in Replit and Plesk
- `SESSION_SECRET`: Secret for session encryption (required)

## Running on Replit

### Prerequisites
- Configure `NEON_DATABASE_URL` and `SESSION_SECRET` as Replit Secrets.

### First-time setup
```bash
npm install          # install dependencies
npm run db:push      # create/update the schema in the configured Neon database
npm run dev          # start the development server on port 5000
```

The PostgreSQL schema is managed from `shared/schema.ts` with Drizzle. On first start, the app seeds countries, tasks, payment channels, and platform settings when empty. Product and staking catalogs are normally administered in the panel. A specifically authorized, one-time catalog migration may add new product versions; it must preserve old product rows referenced by existing purchases and only deactivate them for future sales.

### Initial administrator
The initial administrator is created only when `ADMIN_PASSWORD` is configured as a secret. Existing administrator records keep their own login password; startup only ensures the configured admin role and PIN.

### Workflow
The "Start application" workflow runs `npm run dev` and serves the app on port 5000 (mapped to external port 80).

---

## Recent Changes (February 2026)
- Deposit system now uses dual approach: Soleaspay (automatic) per-country OR manual recharge channels
- Admin can enable Soleaspay globally and select specific countries for automatic payment
- Users from Soleaspay-enabled countries get automatic mobile money flow (no channel selection)
- Users from non-Soleaspay countries see manual recharge channels managed by admin
- Platform setting `soleaspayEnabled` controls global Soleaspay on/off
- Platform setting `soleaspayCountries` stores comma-separated country codes (e.g. "TG,BF,CI")
- Backend enforces Soleaspay for enabled countries (cannot bypass to manual)
- InPay Africa supports direct hosted deposits for enabled countries, signed webhooks, admin-triggered payouts, and balance checks

## Recent Changes (January 2026)
- Completed full frontend implementation with all pages and modals
- Implemented complete backend with all API routes
- Added database seeding for products, tasks, payment channels, and settings
- Removed emoji usage in favor of text country codes

## Business Rules
- **Signup Bonus**: 1000 FCFA
- **Free Daily Product**: 50 FCFA per day
- **Withdrawal Fees**: 16%
- **Minimum Deposit**: 3000 FCFA
- **Minimum Withdrawal**: 1200 FCFA
- **Withdrawal Hours**: 8h-17h (9h-18h for Cameroon/Benin)
- **Max Withdrawals/Day**: 2
- **Referral Commissions**: Level 1 (25%), Level 2 (4%), Level 3 (1%)
- **Product Cycle**: 80 days by default

## Supported Countries
- Cameroun (CM) - XAF - Orange Money, MTN
- Burkina Faso (BF) - XOF - Orange Money, Moov Money
- Togo (TG) - XOF - Moov Money, Mixx by Yas
- Benin (BJ) - XOF - Celtis, Moov Money, MTN, Momo
- Cote d'Ivoire (CI) - XOF - Wave, MTN, Orange Money, Moov Money
- Congo Brazzaville (CG) - XAF - MTN
- RDC (CD) - CDF (4:1 conversion) - Airtel Money