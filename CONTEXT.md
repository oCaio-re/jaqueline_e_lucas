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
A symbolic wedding gift (e.g., "Aula de natação", "Férias da Uber") chosen by a Guest to support the couple. Gifts are represented visually in the PDF file and do not have pre-established values; the actual transaction and amount are completely voluntary.

### Lista de Presentes (Gift List)
A symbolic PDF list of gifts ("Lista de Presentes - Jaqueline & Lucas.pdf") opened via the main page button. Clicking on any item inside the PDF redirects the Guest back to the website at `#presentes`, which automatically triggers a modal displaying region-based payment details (free-amount Pix or IBAN/MB WAY).

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

### 6. Currencies and Regions (Gift List)
The symbolic gift list resides in a PDF file. Guests can switch payment regions inside the payment modal using a segmented tab control at the top ("Brasil (R$ - Pix)" and "Portugal / Europa (€)"). Selecting a region instantly renders the corresponding payment method (MB WAY/IBAN or dynamic Pix QR Code) with a voluntary amount ("Valor Livre").
