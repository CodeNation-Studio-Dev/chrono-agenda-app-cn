-- ============================================================================
-- Meeting Scheduler - Complete Database Schema
-- ============================================================================
-- PostgreSQL schema for the meeting scheduling application.
-- Run these statements in order to recreate the full database.
-- Compatible with Neon, Supabase, or any standard PostgreSQL instance.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- BETTER AUTH TABLES
-- These four tables are required by Better Auth for authentication.
-- Column names use camelCase to match Better Auth's defaults — do not rename.
-- ----------------------------------------------------------------------------

-- Users table (extended with a `role` column for admin/client differentiation)
-- `email` is nullable so admins can register walk-in clients without an email.
-- `phone` stores an optional contact number; `createdByAdmin` flags walk-ins.
CREATE TABLE IF NOT EXISTS "user" (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT UNIQUE,
  "emailVerified"  BOOLEAN NOT NULL DEFAULT FALSE,
  image            TEXT,
  phone            TEXT,
  role             TEXT NOT NULL DEFAULT 'client', -- 'admin' or 'client'
  "createdByAdmin" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"      TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Active login sessions
CREATE TABLE IF NOT EXISTS "session" (
  id          TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId"    TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Authentication accounts (stores hashed passwords for email/password auth)
CREATE TABLE IF NOT EXISTS "account" (
  id                      TEXT PRIMARY KEY,
  "accountId"             TEXT NOT NULL,
  "providerId"            TEXT NOT NULL,
  "userId"                TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken"           TEXT,
  "refreshToken"          TEXT,
  "idToken"               TEXT,
  "accessTokenExpiresAt"  TIMESTAMP,
  "refreshTokenExpiresAt" TIMESTAMP,
  scope                   TEXT,
  password                TEXT,
  "createdAt"             TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Email verification / password reset tokens
CREATE TABLE IF NOT EXISTS "verification" (
  id          TEXT PRIMARY KEY,
  identifier  TEXT NOT NULL,
  value       TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------------------
-- SCHEDULING APP TABLES (MULTI-TENANT)
-- ----------------------------------------------------------------------------

-- Each admin can own multiple businesses.
-- The slug is used in booking URLs: /[businessSlug]/book
CREATE TABLE IF NOT EXISTS "businesses" (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  "logoUrl"   TEXT,
  slug        TEXT NOT NULL UNIQUE,                        -- URL-safe identifier
  "ownerId"   TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Clients auto-join a business when they visit its booking page while logged in.
-- UNIQUE constraint prevents duplicate memberships.
CREATE TABLE IF NOT EXISTS "business_members" (
  id           SERIAL PRIMARY KEY,
  "businessId" INTEGER NOT NULL REFERENCES "businesses"(id) ON DELETE CASCADE,
  "userId"     TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "joinedAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE ("businessId", "userId")
);

-- Meeting types define the kinds of meetings clients can book.
-- Each meeting type belongs to a specific business.
CREATE TABLE IF NOT EXISTS "meeting_types" (
  id           SERIAL PRIMARY KEY,
  "businessId" INTEGER NOT NULL REFERENCES "businesses"(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  duration     INTEGER NOT NULL,                  -- duration in minutes
  color        TEXT NOT NULL DEFAULT '#3b82f6',   -- hex color for the UI badge
  "isActive"   BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Availability slots are the open time windows the admin opens in the calendar.
-- Each slot belongs to a specific business.
CREATE TABLE IF NOT EXISTS "availability_slots" (
  id           SERIAL PRIMARY KEY,
  "businessId" INTEGER NOT NULL REFERENCES "businesses"(id) ON DELETE CASCADE,
  "adminId"    TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  "startTime"  TIME NOT NULL,
  "endTime"    TIME NOT NULL,
  "isBooked"   BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Bookings link a client to a slot and a meeting type, scoped to a business.
CREATE TABLE IF NOT EXISTS "bookings" (
  id              SERIAL PRIMARY KEY,
  "businessId"    INTEGER NOT NULL REFERENCES "businesses"(id) ON DELETE CASCADE,
  "slotId"        INTEGER NOT NULL REFERENCES "availability_slots"(id) ON DELETE CASCADE,
  "clientId"      TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "meetingTypeId" INTEGER NOT NULL REFERENCES "meeting_types"(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed' | 'cancelled' | 'rescheduled' | 'completed'
  notes           TEXT,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------------------
-- INDEXES (improve query performance for common lookups)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_availability_date  ON "availability_slots"(date);
CREATE INDEX IF NOT EXISTS idx_availability_admin ON "availability_slots"("adminId");
CREATE INDEX IF NOT EXISTS idx_bookings_client    ON "bookings"("clientId");
CREATE INDEX IF NOT EXISTS idx_bookings_slot      ON "bookings"("slotId");


-- ----------------------------------------------------------------------------
-- OPTIONAL: Seed a few default meeting types
-- Uncomment to insert starter meeting types.
-- ----------------------------------------------------------------------------
-- INSERT INTO "businesses" (name, description, slug, "ownerId") VALUES
--   ('My Business', 'A great business', 'my-business', '<admin-user-id>');

-- INSERT INTO "meeting_types" ("businessId", name, description, duration, color) VALUES
--   (1, 'Quick Call',   '15 minute introductory call',     15, '#10b981'),
--   (1, 'Consultation', '30 minute consultation session',  30, '#3b82f6'),
--   (1, 'Deep Dive',    '60 minute in-depth meeting',      60, '#f59e0b');


-- ----------------------------------------------------------------------------
-- OPTIONAL: Promote a user to admin (replace the email below)
-- ----------------------------------------------------------------------------
-- UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';
