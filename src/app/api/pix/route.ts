import { NextRequest, NextResponse } from "next/server";
import { gerarPayloadPix } from "../../../lib/pix";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { giftTitle, amount } = body;

    if (!giftTitle) {
      return NextResponse.json(
        { error: "O título do presente é obrigatório." },
        { status: 400 }
      );
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "O valor do PIX deve ser um número positivo maior que zero." },
        { status: 400 }
      );
    }

    // Recupera configurações do arquivo .env
    const pixKey = process.env.NEXT_PUBLIC_PIX_KEY;
    const pixName = process.env.NEXT_PUBLIC_PIX_NAME;
    const pixCity = process.env.NEXT_PUBLIC_PIX_CITY;

    if (!pixKey || !pixName || !pixCity) {
      console.error("Configuração de PIX ausente no arquivo .env.local");
      return NextResponse.json(
        { error: "A integração com PIX não está configurada no servidor." },
        { status: 500 }
      );
    }

    // Limita e higieniza a descrição da cobrança
    const description = `Presente: ${giftTitle}`;

    // Gera o payload do PIX Copia e Cola (BR Code)
    const pixCopiaECola = gerarPayloadPix({
      key: pixKey,
      name: pixName,
      city: pixCity,
      amount: parseFloat(amount),
      description: description,
    });

    // Gera a imagem do QR Code em formato Base64 DataURL de alta qualidade
    const qrCodeUrl = await QRCode.toDataURL(pixCopiaECola, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 400,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      pixCopiaECola,
      qrCodeUrl,
    });
  } catch (error: any) {
    console.error("Erro ao gerar cobrança PIX:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a solicitação de PIX." },
      { status: 500 }
    );
  }
}
