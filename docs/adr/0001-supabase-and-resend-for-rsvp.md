# ADR 1: Supabase and Resend for RSVP

## Status
Accepted

## Context
The original site architecture used a pure static HTML page with a Google Apps Script Web App for RSVP confirmations. Confirmations were stored in script properties (without a database or guest verification list) and emailed to the couple. 

To prevent anonymous or duplicate registrations and allow guests to search for their invitation to see their pre-registered family members (matching the sibling `casamento` project), we need a database storage system that supports a guest list, query lookups, and manual admin adjustments.

## Decision
We decided to replace the Google Apps Script Web App with:
1. **Supabase (PostgreSQL)** as the database, using a `convidados` table to store pre-registered guests, family group members, phone numbers, and confirmation statuses.
2. **Resend** as the email notification service, triggering HTML notifications when an RSVP status is updated.
3. **Local Route Handlers** in Next.js (`/api/rsvp` and `/api/admin/rsvp`) to proxy requests securely, avoiding CORS/JSONP and protecting database credentials.

## Consequences
*   **Positives**:
    *   Guests are verified against a master guest list before confirming.
    *   Guests see their family members' names on search, improving personalization.
    *   The admin dashboard gains full CRUD capabilities (adding guests, editing RSVP statuses, and deleting guests).
    *   API keys and credentials are kept secure on the server side.
*   **Negatives**:
    *   Requires the couple to register and configure a Supabase project and a Resend account.
    *   Increases setup complexity (needs database tables and environment variables).
