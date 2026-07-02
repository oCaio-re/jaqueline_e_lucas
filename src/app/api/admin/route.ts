import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { data: convidados, error } = await supabase
      .from('convidados')
      .select('id, nome_convite, membros, telefone, confirmado, data_confirmacao, mensagem')
      .order('nome_convite', { ascending: true });

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: 'Erro ao buscar convidados.' }, { status: 500 });
    }

    return NextResponse.json({ convidados }, { status: 200 });
  } catch (err) {
    console.error('Admin GET internal error:', err);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, nome_convite, membros, telefone } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
    }

    const updateData: any = {};

    if (status) {
      let confirmado = false;
      let data_confirmacao = null;

      if (status === 'confirmado') {
        confirmado = true;
        data_confirmacao = new Date().toISOString();
      } else if (status === 'rejeitado') {
        confirmado = false;
        data_confirmacao = new Date().toISOString();
      } else if (status === 'pendente') {
        confirmado = false;
        data_confirmacao = null;
      }
      updateData.confirmado = confirmado;
      updateData.data_confirmacao = data_confirmacao;
    }

    if (nome_convite !== undefined) updateData.nome_convite = nome_convite;
    if (membros !== undefined) updateData.membros = membros;
    if (telefone !== undefined) updateData.telefone = telefone;

    const { data, error } = await supabase
      .from('convidados')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Erro ao atualizar convidado.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, convidado: data }, { status: 200 });
  } catch (err) {
    console.error('Admin PATCH internal error:', err);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codigo, nome_convite, membros, telefone } = body;

    if (codigo !== '1111') {
      return NextResponse.json({ error: 'Código secreto inválido.' }, { status: 403 });
    }

    if (!nome_convite || !membros) {
      return NextResponse.json({ error: 'Nome do convite e membros são obrigatórios.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('convidados')
      .insert([
        { nome_convite, membros, telefone: telefone || '', confirmado: false }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Erro ao adicionar convidado.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, convidado: data }, { status: 201 });
  } catch (err) {
    console.error('Admin POST internal error:', err);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id, codigo } = body;

    if (codigo !== '1111') {
      return NextResponse.json({ error: 'Código secreto inválido.' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID do convidado é obrigatório.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('convidados')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Erro ao remover convidado.' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Admin DELETE internal error:', err);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
