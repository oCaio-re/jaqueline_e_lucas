# Context: Casamento RSVP

This glossary defines the core domain terms and rules for the wedding RSVP confirmation system.

## Glossary

### Convidado (Guest)
A person or family group registered on the guest list. A Guest is identified by an **Invitation Name** (`nome_convite`) and a **Phone Number** (`telefone`).

### Membros (Members)
The individuals included under a single Guest invitation (e.g., "João, Maria, e filhos").

### Confirmação (RSVP / Confirmation)
The response submitted by a Guest, marking their presence ("Sim") or absence ("Não") for the wedding, along with an optional message and dietary restrictions.

### Lista de Convidados (Guest List)
The master list of all invited Guests stored in the database.

### Presente (Gift)
A symbolic wedding gift (e.g., "Romance Dinner", "Spa Day") chosen by a Guest to support the couple. Gifts are represented visually and have suggested monetary values, but the actual transaction is voluntary.

### Lista de Presentes (Gift List)
A curated list of symbolic Gifts displayed on the website. Guests can select a Gift, customize or choose a suggested monetary value, and receive instructions on how to transfer the funds.

### Pix
A Brazilian instant payment system. If selected as the payment method for a Gift, the system generates a dynamic BR Code payload (including the amount and a description) and displays a QR Code along with a copy-paste code.

---

## Domain Rules

### 1. Database Integration
All guest data and RSVP status updates are stored in a **Supabase PostgreSQL database** under the `convidados` table.

### 2. Email Notifications
On successful RSVP submission (confirmation or declination), an automated HTML email notification is sent to the couple using the **Resend API**.

### 3. User Interface Transitions
UI state changes on the RSVP form are handled using React state and lightweight Tailwind CSS animations, keeping package dependencies clean.

### 4. Admin Security Model
To mirror the sibling project, admin modifications (adding a new guest or deleting a guest) are protected by a simple passcode check (`codigo === '1111'`), while listing and updating are open.

### 5. Phone Matching (Portugal)
Phone matching cleans all non-digits, strips the Portuguese country code (`351`) if present, and compares the remaining 9-digit national number. This permits flexible guest inputs (e.g., matching `+351 912345678` with `912345678`).
