# Client Meeting Scheduler

A modern web application for managing client meetings and bookings. Allows admins to set availability and manage meeting types, while clients can browse and book available time slots.

## Features

### Admin Features
- **Dashboard**: View and manage all bookings and meeting statistics
- **Availability Management**: Set open time slots for client bookings
- **Meeting Types Manager**: Create and configure different meeting types with durations and colors
- **Branding Manager**: Customize business logo, name, and description
- **Users Manager**: View and manage all users and clients
- **Schedule for Clients**: Manually create bookings for walk-in or phone clients
- **Meeting History**: View past and completed meetings

### Client Features
- **Browse Meetings**: View available meeting types and their details
- **Book Slots**: Interactive calendar to select and book available time slots
- **View Bookings**: See all confirmed and past bookings
- **User Authentication**: Secure sign-up and login with email/password
- **Email Verification**: Verify email before accessing the platform
- **Password Reset**: Request password reset via email link

### Technical Features
- **Role-Based Access Control**: Separate admin and client interfaces
- **Email Verification**: Required email verification before login
- **Email Notifications**: Password reset and verification emails via Resend
- **Multi-Language Support**: i18n configuration for internationalization (English/Spanish)
- **Responsive Design**: Mobile-friendly UI with Radix UI components
- **Type Safety**: Full TypeScript support with Drizzle ORM
- **Protected Routes**: Middleware-based route protection

## Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) 16.2.6
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4.2.0
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Date Utilities**: [date-fns](https://date-fns.org/)

### Backend & Database
- **Runtime**: Next.js API Routes
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Neon](https://neon.tech/))
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) 0.45.2
- **Connection Pool**: [pg](https://node-postgres.com/) 8.21.0

### Authentication
- **Auth Framework**: [Better Auth](https://www.better-auth.com/) 1.6.14
- **Auth Plugins**: Email verification, password reset, email/password authentication
- **Adapter**: [@better-auth/drizzle-adapter](https://www.better-auth.com/)
- **Email Service**: [Resend](https://resend.com/) 6.12.4
- **Route Protection**: Next.js middleware for access control

## Project Structure

```
client-meeting-scheduler/
├── app/                          # Next.js app directory
│   ├── api/
│   │   ├── auth/                 # Authentication endpoints
│   │   └── setup-admin/          # Admin initialization endpoint
│   ├── admin/                    # Admin dashboard pages
│   ├── book/                     # Client booking page
│   ├── bookings/                 # Client bookings list page
│   ├── profile/                  # User profile and settings page
│   ├── reset-password/           # Password reset page
│   ├── verify-email/             # Email verification page
│   ├── sign-in/                  # Login page
│   ├── sign-up/                  # Registration page
│   ├── actions/                  # Server actions
│   │   ├── business.ts           # Business settings actions
│   │   └── scheduling.ts         # Scheduling actions
│   ├── context/
│   │   └── language-context.tsx  # Language/i18n context provider
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   │   ├── admin-dashboard.tsx
│   │   ├── admin-bookings-list.tsx
│   │   ├── availability-manager.tsx
│   │   ├── branding-manager.tsx
│   │   ├── meeting-types-manager.tsx
│   │   ├── schedule-for-client-dialog.tsx
│   │   ├── businesses-manager.tsx
│   │   ├── users-manager.tsx
│   │   └── meeting-history.tsx
│   ├── ui/                       # Reusable UI components (button, dialog, etc.)
│   ├── auth-form.tsx             # Sign in/up form
│   ├── reset-password-form.tsx   # Password reset form
│   ├── verify-email-form.tsx     # Email verification form
│   ├── profile-view.tsx          # User profile/settings component
│   ├── booking-calendar.tsx      # Calendar for selecting booking slots
│   ├── bookings-list.tsx         # List of bookings
│   ├── book-page-content.tsx
│   ├── navbar.tsx                # Top navigation with profile menu
│   ├── theme-provider.tsx
│   └── language-selector.tsx
│
├── hooks/                        # Custom React hooks
│   ├── use-mobile.ts             # Mobile detection hook
│   └── use-toast.ts              # Toast notification hook
│
├── lib/                          # Utility functions and configuration
│   ├── db/
│   │   ├── index.ts              # Drizzle ORM instance
│   │   └── schema.ts             # Database schema definitions
│   ├── i18n/
│   │   ├── language-context.tsx  # i18n context provider
│   │   └── translations.ts       # Centralized translation strings
│   ├── auth.ts                   # Better Auth configuration with email verification
│   ├── auth-client.ts            # Client-side auth utilities
│   ├── calendar.ts               # Calendar utilities
│   ├── email.ts                  # Email sending utilities (Resend)
│   └── utils.ts                  # General utilities
│
├── public/                       # Static assets
├── scripts/
│   └── schema.sql                # Database schema SQL file
│
├── middleware.ts                 # Next.js middleware for route protection
├── .env.example                  # Example environment variables
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── next.config.mjs               # Next.js configuration
├── postcss.config.mjs            # PostCSS configuration
└── README.md                     # This file
```

## Database Schema

The application uses PostgreSQL with the following main tables:

### Authentication (Better Auth)
- **user**: User accounts with roles (admin/client), optional email, phone
- **session**: Active login sessions
- **account**: Authentication credentials and tokens
- **verification**: Email verification and password reset tokens

### Scheduling
- **meeting_types**: Available meeting types (consultation, quick call, etc.)
- **availability_slots**: Admin's available time windows
- **bookings**: Client booking records
- **business_settings**: Business branding and configuration

See [scripts/schema.sql](scripts/schema.sql) for the complete SQL schema.

## Setup & Installation

### Prerequisites
- Node.js 18+ or higher
- pnpm or npm
- PostgreSQL database (Neon account or local PostgreSQL)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd client-meeting-scheduler
pnpm install
# or
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database Connection (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Email Service (Resend - required for password reset and email verification)
# Get your API key from https://resend.com/api-keys
RESEND_API_KEY=re_your_api_key_here

# Email sender address (must be verified in Resend)
# For development, use: Chrono <onboarding@resend.dev>
# For production, use verified domain: Chrono <noreply@yourdomain.com>
EMAIL_FROM=Chrono <onboarding@resend.dev>

# Auth Configuration
BETTER_AUTH_URL=http://localhost:3000

# Optional: Admin setup secret (for manual admin creation via API)
ADMIN_SETUP_SECRET=your-secret-key

# Optional: Vercel deployment variables
VERCEL_URL=your-vercel-url
VERCEL_PROJECT_PRODUCTION_URL=your-production-url
```

**Important: Email Configuration**

The application requires Resend for:
- Email verification when users sign up
- Password reset functionality

1. Create a free account at [resend.com](https://resend.com)
2. Get your API key from the API Keys dashboard
3. For development, use `onboarding@resend.dev` as the sender email
4. For production, verify your domain and use your custom email

See `.env.example` for a complete template.

### 3. Initialize the Database

Run the schema migration to create all tables:

```bash
psql $DATABASE_URL < scripts/schema.sql
```

Or if using a Neon project:
1. Go to Neon dashboard → SQL Editor
2. Copy and paste the contents of `scripts/schema.sql`
3. Execute the SQL

### 4. Create First Admin User

The application requires at least one admin user to manage meetings and settings.

**Option A: Via API Endpoint**

```bash
curl -X POST http://localhost:3000/api/setup-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "secret": "your-admin-setup-secret"
  }'
```

**Option B: Manual SQL**

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'admin@example.com';
```

**Option C: Sign up first, then promote**

1. Sign up at http://localhost:3000/sign-up
2. Call the setup endpoint with your email
3. Refresh and you'll have admin access

### 5. Run Development Server

```bash
pnpm dev
# or
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Available Scripts

```bash
# Development server (hot reload)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## Usage

### Email Verification Flow

When users sign up, they must verify their email before accessing the platform:

1. User fills the sign-up form with name, email, and password
2. Receives a verification email with a link
3. Clicks the verification link in the email
4. Email is marked as verified in the database
5. User can now sign in to the platform

### For Admins

1. **Sign Up** at http://localhost:3000/sign-up
2. **Verify Email** by clicking the link in the confirmation email
3. **Sign In** with verified email
4. **Promote to Admin** using the setup endpoint or SQL
5. Navigate to **/admin** dashboard
6. Set availability slots
7. Create meeting types
8. Manage client bookings
9. Customize business branding
10. View profile and reset password at **/profile**

### For Clients

1. **Sign Up** at http://localhost:3000/sign-up
2. **Verify Email** by clicking the link in the confirmation email
3. **Sign In** with verified email
4. Navigate to **/book** page
5. Select a meeting type
6. Choose an available time slot
7. Confirm booking
8. View confirmed bookings at **/bookings**
9. Access account settings at **/profile**

### Password Reset

Users can reset their password from the sign-in page:

1. Click **"Forgot your password?"** on the sign-in form
2. Enter your email address
3. Click the reset link sent to your email
4. Set a new password
5. Sign in with your new password

## Key Features Implementation

### Authentication & Authorization
- Uses Better Auth for secure email/password authentication with email verification plugin
- Email verification required before users can access the platform
- Password reset functionality via email links with time-limited tokens
- Role-based access control (admin vs client)
- Sessions stored in PostgreSQL with 7-day expiration
- Supports walk-in clients created by admins (optional email)
- Route protection via Next.js middleware
- User profile page for account management and password changes

### Email Verification & Password Reset
- Automatic email verification when users sign up
- Verification link sent via Resend email service
- Token-based password reset with 1-hour expiration
- Users can request password reset from sign-in page
- Password change option available in user profile
- Email verification required before login (enforced by middleware)

### Availability Management
- Admins set open time slots (date, start time, end time)
- Slots are marked as booked when a client reserves them
- Calendar visualization for easy scheduling
- KPI metrics showing utilization rates and booking statistics

### Booking System
- Clients browse available meeting types with durations
- Interactive calendar shows available slots
- Bookings linked to specific slots, meeting types, and clients
- Status tracking (confirmed, cancelled, rescheduled, completed)
- Calendar view option for admins to visualize bookings

### Business Branding
- Admins can set business name, description, and logo
- Branding displayed on booking and home pages
- Logo image URL stored in business_settings
- Multi-tenant support (multiple businesses per admin)

### Email Notifications
- Uses Resend for sending transactional emails
- Email verification sent upon sign-up
- Password reset links sent on request
- Booking confirmations sent to clients
- Configured in [lib/email.ts](lib/email.ts)

## Security

### Access Control
- **Route Protection**: Next.js middleware enforces authentication on protected routes
- **Email Verification**: Required before users can access the platform
- **Session Management**: 7-day session expiration for inactive users
- **Password Security**: Passwords hashed with industry-standard algorithms
- **CORS & CSRF**: Protected against common web vulnerabilities

### Email Security
- **Verified Senders**: Email addresses verified in Resend for transactional emails
- **Token Expiration**: Password reset and verification tokens expire automatically
- **Secure Links**: Email links include time-limited tokens to prevent unauthorized access
- **No Sensitive Data**: Passwords and tokens never transmitted in plain text

### Environment Variables
- All secrets stored in `.env.local` (never committed to repository)
- Required variables documented in `.env.example`
- API keys and database credentials protected

## Internationalization (i18n)

The application is configured for multi-language support. Language files are located in `lib/i18n/`.

Language selector is available in the navbar. Currently supports multiple languages with easy extensibility for more.

## Styling & UI

- **Tailwind CSS 4.2.0** for utility-first styling
- **Radix UI** for accessible, unstyled components
- **Dark mode** support via next-themes
- **Responsive design** for mobile, tablet, and desktop
- **Custom theme colors** via Tailwind config

## Troubleshooting

### Database Connection Issues

**Error: "ECONNREFUSED"**
- Verify DATABASE_URL is correct
- Check that PostgreSQL/Neon is running and accessible
- Ensure SSL/TLS settings match your database provider

**Error: "Invalid connection string"**
- Double-check credentials in .env.development.local
- Test connection: `psql $DATABASE_URL`

### Authentication Issues

**"Session expired" or "Not authenticated"**
- Check BETTER_AUTH_URL is set correctly
- Clear browser cookies
- Restart development server

**Admin setup endpoint 401**
- Verify ADMIN_SETUP_SECRET matches in .env file
- Check the secret being sent in the API request

**Email verification not working**
- Verify RESEND_API_KEY is set and valid in `.env.local`
- Check that EMAIL_FROM matches a verified email in Resend
- For development, use `onboarding@resend.dev` (automatically verified)
- Check email spam/promotions folder
- Ensure `/verify-email` route is not blocked by middleware

**"Invalid verification token" error**
- Token may have expired (24-hour default)
- Try requesting a new verification email
- Check that token URL parameter matches the sent token

**Password reset email not received**
- Verify RESEND_API_KEY and EMAIL_FROM are configured
- Check email spam/promotions folder
- Ensure the email address exists in the database
- Check Resend dashboard for sending errors

### Build/Run Issues

**"Module not found" errors**
- Run `pnpm install` to ensure all dependencies are installed
- Delete `node_modules` and `.next` folders and reinstall: `rm -rf node_modules .next && pnpm install`

**Port 3000 already in use**
```bash
# Run on different port
pnpm dev -- -p 3001
```

## Development Tips

### Adding a New Page
1. Create folder in `app/`
2. Add `page.tsx` with React component
3. Use `useAuth()` hook for authentication checks
4. Query database via server actions in `app/actions/`

### Adding Database Queries
1. Update schema in `lib/db/schema.ts` if needed
2. Create server action in `app/actions/`
3. Use `db` instance for Drizzle queries
4. Call from client components via `use server`

### Adding UI Components
- Reusable components in `components/ui/` (buttons, dialogs, etc.)
- Page-specific components in `components/` root
- Admin-specific in `components/admin/`

## Production Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL`
- `RESEND_API_KEY`
- `BETTER_AUTH_URL` (production domain)
- `ADMIN_SETUP_SECRET`

### Environment Variables for Production

```env
# Database (use production PostgreSQL)
DATABASE_URL=postgresql://user:password@prod-host:5432/chrono

# Resend Email Service (required)
# Get API key from https://resend.com/api-keys
RESEND_API_KEY=re_your_production_key_here

# Email sender (must be verified in Resend)
# For custom domain: verify domain in Resend first
EMAIL_FROM=Chrono <noreply@yourdomain.com>

# Better Auth
BETTER_AUTH_URL=https://yourdomain.com

# Security
ADMIN_SETUP_SECRET=your-secure-secret-key

# Environment
NODE_ENV=production
```

**Resend Production Setup:**
1. Verify your sender domain in Resend dashboard
2. Update EMAIL_FROM to use your verified domain
3. Use production RESEND_API_KEY (not development key)
4. Test email delivery before going live

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Add your license here]

## Support

For issues, questions, or feedback, please open an issue in the repository.

---

**Last Updated**: June 2026  
**Node Version**: 18+  
**Package Manager**: pnpm or npm
