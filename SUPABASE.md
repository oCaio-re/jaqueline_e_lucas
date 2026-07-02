# 🛠️ Supabase Database Setup

To make the search-based RSVP validation function correctly, you must set up the `convidados` table in your Supabase project.

## 1. Create the Table

Go to the **SQL Editor** in your Supabase dashboard, paste the following SQL script, and click **Run**:

```sql
-- Create convidados (guests) table
create table convidados (
  id uuid default gen_random_uuid() primary key,
  nome_convite text not null,
  membros text not null,
  telefone text,
  confirmado boolean default false,
  data_confirmacao timestamptz,
  mensagem text,
  created_at timestamptz default now()
);

-- Enable Row-Level Security (RLS)
alter table convidados enable row level security;

-- Create policies to allow public read, insert, update, and delete.
-- (Required for open dashboard actions and anonymous form submissions)
create policy "Allow public read of all guests" on convidados
  for select using (true);

create policy "Allow public update of guests" on convidados
  for update using (true);

create policy "Allow public delete of guests" on convidados
  for delete using (true);

create policy "Allow public insert of guests" on convidados
  for insert with check (true);
```

---

## 2. Retrieve Environment Credentials

Go to **Project Settings** ➔ **API** in your Supabase dashboard and grab the following keys to put into your `.env.local` file:

*   **`NEXT_PUBLIC_SUPABASE_URL`**: Your Project URL (under Project API keys).
*   **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Your Anon public key.
*   **`SUPABASE_SERVICE_ROLE_KEY`**: Your secret Service Role Key (click *Reveal* to view). This key allows server-side operations to bypass RLS policies.
