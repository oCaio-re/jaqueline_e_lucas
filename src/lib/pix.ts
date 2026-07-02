/**
 * Utilitário de Geração de PIX Estático (BR Code)
 * Implementação em TypeScript puro, livre de dependências externas.
 * Compatível com o padrão EMV QRCPS-MPM do Banco Central do Brasil.
 */

/**
 * Remove acentos, caracteres especiais e converte para caixa alta
 * para garantir conformidade com as regras rígidas do padrão BR Code.
 */
function cleanString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, "") // Mantém apenas letras, números e espaços
    .toUpperCase();
}

/**
 * Formata um campo no padrão Tag-Length-Value (TLV)
 */
function formatTag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/**
 * Calcula o checksum CRC16 (CCITT, polinômio 0x1021, valor inicial 0xFFFF)
 */
export function calcularCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
  }

  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

interface PixParams {
  key: string;      // Chave PIX (CPF, Telefone, E-mail ou Aleatória)
  name: string;     // Nome do recebedor (Max 25 caracteres)
  city: string;     // Cidade do recebedor (Max 15 caracteres)
  amount?: number | string; // Valor da transação (Opcional)
  description?: string;     // Mensagem/Descrição da transação (Opcional)
}

/**
 * Gera a string do PIX Copia e Cola (BR Code) completa com o CRC16
 */
export function gerarPayloadPix({ key, name, city, amount, description }: PixParams): string {
  const cleanedKey = key.trim();
  const cleanedName = cleanString(name).substring(0, 25);
  const cleanedCity = cleanString(city).substring(0, 15);

  // ID 26: Merchant Account Information
  const gui = formatTag("00", "br.gov.bcb.pix");
  const keyTag = formatTag("01", cleanedKey);
  const merchantInfo = formatTag("26", `${gui}${keyTag}`);

  const payloadParts = [
    formatTag("00", "01"), // ID 00: Payload Format Indicator (Sempre "01")
    merchantInfo,          // ID 26: Merchant Account Information
    formatTag("52", "0000"), // ID 52: Merchant Category Code (Sempre "0000")
    formatTag("53", "986"),  // ID 53: Transaction Currency (BRL = "986")
  ];

  // ID 54: Transaction Amount (Opcional)
  if (amount !== undefined && amount !== null) {
    const numericAmount = typeof amount === "number" ? amount : parseFloat(amount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      payloadParts.push(formatTag("54", numericAmount.toFixed(2)));
    }
  }

  payloadParts.push(
    formatTag("58", "BR"), // ID 58: Country Code (Sempre "BR")
    formatTag("59", cleanedName), // ID 59: Merchant Name
    formatTag("60", cleanedCity)  // ID 60: Merchant City
  );

  // ID 62: Additional Data Field (TxID)
  // Para PIX estático, o Banco Central recomenda usar "***" ou um identificador alfanumérico sem espaços
  const txid = description 
    ? cleanString(description).replace(/\s+/g, "").substring(0, 25) 
    : "***";
  
  const txidTag = formatTag("05", txid || "***");
  payloadParts.push(formatTag("62", txidTag));

  // ID 63: CRC16 (Sempre o último tag, com tamanho "04" e o valor calculado ao final)
  const incompletePayload = payloadParts.join("") + "6304";
  const crc = calcularCRC16(incompletePayload);

  return incompletePayload + crc;
}
