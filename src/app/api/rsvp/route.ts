import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { resend } from '@/lib/resend';

export const dynamic = 'force-dynamic';

function cleanPhone(p: string): string {
  return p.replace(/\D/g, '');
}

// Adapting phone matching for Portuguese phone numbers (9 digits starting with 9 or 2)
// Strips country code 351 if present.
function phonesMatch(phoneA: string, phoneB: string): boolean {
  const cleanA = cleanPhone(phoneA);
  const cleanB = cleanPhone(phoneB);
  
  if (!cleanA || !cleanB) return false;
  
  if (cleanA === cleanB) return true;
  
  // Strip Portuguese country code (351) if present and followed by a valid 9-digit national number
  let numA = cleanA.startsWith('351') && cleanA.length > 9 ? cleanA.slice(3) : cleanA;
  let numB = cleanB.startsWith('351') && cleanB.length > 9 ? cleanB.slice(3) : cleanB;
  
  if (numA === numB) return true;
  
  // Fallback: match ending suffix of at least 8 digits (for local formatting differences)
  if (numA.length >= 8 && numB.length >= 8) {
    if (numA.endsWith(numB) || numB.endsWith(numA)) {
      return true;
    }
  }
  
  return false;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function namesMatch(dbName: string, inputName: string, dbMembers?: string): boolean {
  const normDb = normalizeName(dbName);
  const normInput = normalizeName(inputName);
  
  if (normDb.includes(normInput) || normInput.includes(normDb)) {
    return true;
  }
  
  if (dbMembers) {
    const normMembers = normalizeName(dbMembers);
    if (normMembers.includes(normInput)) {
      return true;
    }
  }
  
  return false;
}

// GET: Verifies guest details by name and phone number
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nome = searchParams.get('nome');
  const telefone = searchParams.get('telefone');

  const TEST_GUEST = {
    nome_convite: 'Convidado de Teste',
    membros: 'João, Maria',
    telefone: '912345678' // Portuguese test phone
  };

  if (!nome || !telefone) {
    return NextResponse.json(
      { error: 'Nome e telefone são obrigatórios.' },
      { status: 400 }
    );
  }

  // Handle local mock test guest
  if (namesMatch(TEST_GUEST.nome_convite, nome, TEST_GUEST.membros) && phonesMatch(TEST_GUEST.telefone, telefone)) {
    return NextResponse.json({ 
      convidado: { id: 'test-id-123', nome_convite: TEST_GUEST.nome_convite, membros: TEST_GUEST.membros } 
    }, { status: 200 });
  }

  try {
    const { data: convidados, error } = await supabase
      .from('convidados')
      .select('id, nome_convite, membros, telefone, confirmado, data_confirmacao');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Erro ao buscar convidado. Tente novamente mais tarde.' }, { status: 500 });
    }

    if (!convidados || convidados.length === 0) {
      return NextResponse.json(
        { error: 'Não encontramos nenhum convidado na lista cadastrada.' },
        { status: 404 }
      );
    }

    const matchedConvidado = convidados.find(c => 
      namesMatch(c.nome_convite, nome, c.membros) && phonesMatch(c.telefone, telefone)
    );

    if (!matchedConvidado) {
      return NextResponse.json(
        { error: 'Não encontramos nenhum convidado com esse nome e telefone na lista. Verifique os dados e tente novamente.' },
        { status: 404 }
      );
    }

    if (matchedConvidado.confirmado) {
      return NextResponse.json(
        { error: 'Sua presença já foi confirmada anteriormente. Estamos ansiosos para celebrar com você!' },
        { status: 400 }
      );
    }

    if (matchedConvidado.data_confirmacao && !matchedConvidado.confirmado) {
       return NextResponse.json(
        { error: 'Você já declinou o convite anteriormente. Se mudou de ideia, entre em contato conosco!' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      convidado: { 
        id: matchedConvidado.id, 
        nome_convite: matchedConvidado.nome_convite, 
        membros: matchedConvidado.membros 
      } 
    }, { status: 200 });
  } catch (err) {
    console.error('Internal error:', err);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}

// POST: Confirms or declines RSVP
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, mensagem, isConfirming = true } = body;

    if (!id) {
      return NextResponse.json({ error: 'O ID do convidado é obrigatório.' }, { status: 400 });
    }

    let data;
    
    // Handle local mock test guest
    if (id === 'test-id-123') {
      data = {
        nome_convite: 'Convidado de Teste',
        membros: 'João, Maria',
        telefone: '912345678',
        mensagem: mensagem || 'Mensagem de teste',
        isConfirming
      };
    } else {
      const dbMensagem = isConfirming ? (mensagem || null) : `[DECLINOU] ${mensagem || ''}`.trim();

      // Update in Supabase
      const { data: updateData, error } = await supabase
        .from('convidados')
        .update({
          confirmado: isConfirming,
          data_confirmacao: new Date().toISOString(),
          mensagem: dbMensagem,
        })
        .eq('id', id)
        .select('nome_convite, membros, telefone, mensagem')
        .single();

      if (error || !updateData) {
        console.error('Failed to update guest:', error);
        return NextResponse.json({ error: 'Erro ao registrar resposta. Tente novamente.' }, { status: 500 });
      }
      data = { ...updateData, isConfirming };
    }

    // Trigger Resend email
    const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const emailTo = process.env.EMAIL_TO || 'jasasilva@outlook.pt'; 

    const subject = data.isConfirming 
      ? `Nova Confirmação de Presença: ${data.nome_convite}`
      : `Convite Declinado: ${data.nome_convite}`;
      
    const title = data.isConfirming ? 'Presença Confirmada 🎉' : 'Convite Declinado 😔';

    try {
      await resend.emails.send({
        from: `Casamento RSVP <${emailFrom}>`,
        to: [emailTo],
        cc: ['lucasalvessilva646.la@gmail.com'],
        subject: subject,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #20283a;">
            <h1 style="color: #1f3b5c;">${title}</h1>
            <p><strong>Convite:</strong> ${data.nome_convite}</p>
            <p><strong>Membros:</strong> ${data.membros}</p>
            <p><strong>Telefone:</strong> ${data.telefone}</p>
            <p><strong>Mensagem aos noivos:</strong> <br/> ${data.mensagem ? data.mensagem : '<em>Sem mensagem.</em>'}</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
    }

    return NextResponse.json({ success: true, message: data.isConfirming ? 'Presença confirmada com sucesso!' : 'Resposta registrada com sucesso.' }, { status: 200 });
  } catch (err) {
    console.error('RSVP POST error:', err);
    return NextResponse.json({ error: 'Erro interno. Verifique os dados e tente novamente.' }, { status: 500 });
  }
}
