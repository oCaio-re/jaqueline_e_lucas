import { X, Check, Copy, Gift, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { WEDDING_CONFIG } from '@/config/wedding';

interface GiftsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GiftsModal({ isOpen, onClose }: GiftsModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedGift, setSelectedGift] = useState<{ title: string; image: string } | null>(null);

  // States for the payment flow
  const [step, setStep] = useState<'list' | 'value' | 'checkout_eu' | 'qrcode'>('list');
  const [region, setRegion] = useState<'EU' | 'BR'>('EU');
  const [amount, setAmount] = useState<string>('');
  const [pixData, setPixData] = useState<{ emv: string; qrCodeUrl: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      const t = setTimeout(() => {
        setSelectedGift(null);
        setStep('list');
        setAmount('');
        setPixData(null);
        setErrorMsg('');
        setRegion('EU');
      }, 300);
      return () => clearTimeout(t);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const gifts = [
    { title: "Um tijolo para a nossa casinha", image: "/gifts/gift_brick.png" },
    { title: "Jantar Romântico na Lua de Mel", image: "/gifts/gift_dinner.png" },
    { title: "Vinho para cada mês de casados", image: "/gifts/gift_wine.png" },
    { title: "Dia de Spa para a Noiva", image: "/gifts/gift_spa.png" },
    { title: "Ajudar a pagar a primeira conta", image: "/gifts/gift_keys.png" },
    { title: "Adoção do primeiro cãozinho", image: "/gifts/gift_puppy.png" },
    { title: "Cota Open Bar para a festa", image: "/gifts/gift_cocktails.png" },
    { title: "Massagem nos pés pós-festa", image: "/gifts/gift_foot_massage.png" },
    { title: "Pequeno-almoço na cama", image: "/gifts/gift_breakfast.png" },
    { title: "Ceia da madrugada", image: "/gifts/gift_burger.png" },
    { title: "Ramo especial para a noiva", image: "/gifts/gift_bouquet.png" },
    { title: "Upgrade no quarto de hotel", image: "/gifts/gift_hotel.png" },
    { title: "Passeio de barco na lua de mel", image: "/gifts/gift_boat.png" },
    { title: "Subscrição de streaming do casal", image: "/gifts/gift_streaming.png" },
    { title: "Fritadeira de ar quente (Airfryer)", image: "/gifts/gift_airfryer.png" },
    { title: "Robô aspirador para manter a paz", image: "/gifts/gift_robot.png" },
  ];

  const handleAmountChange = (val: string, currentRegion: 'EU' | 'BR') => {
    const cleanVal = val.replace(/\D/g, "");
    if (!cleanVal) {
      setAmount('');
      return;
    }
    const numeric = parseFloat(cleanVal) / 100;
    if (currentRegion === 'BR') {
      const formatted = numeric.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      setAmount(formatted);
    } else {
      const formatted = numeric.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
      setAmount(formatted);
    }
  };

  const handleSelectSuggestedValue = (value: number, currentRegion: 'EU' | 'BR') => {
    const cents = value * 100;
    handleAmountChange(cents.toString(), currentRegion);
  };

  const getRawAmount = (formatted: string) => {
    const cleanVal = formatted.replace(/\D/g, "");
    return (parseFloat(cleanVal) / 100).toFixed(2);
  };

  const generatePix = async () => {
    const rawValue = getRawAmount(amount);
    if (!rawValue || parseFloat(rawValue) <= 0) {
      setErrorMsg('Por favor, insira um valor válido.');
      return;
    }
    setIsGenerating(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giftTitle: selectedGift?.title, amount: rawValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar PIX');
      setPixData({ emv: data.pixCopiaECola, qrCodeUrl: data.qrCodeUrl });
      setStep('qrcode');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocorreu um erro ao gerar o PIX. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectGift = (gift: { title: string; image: string }) => {
    setSelectedGift(gift);
    setStep('value');
    setRegion('EU');
    setAmount('');
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (_) {}
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300">
      <div className="bg-gradient-to-br from-navy-dark via-navy to-navy-dark w-[95vw] md:w-[80vw] max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative border border-gold/15 h-[85vh] min-h-[500px] flex flex-col transition-transform duration-300 scale-100">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gold/70 hover:text-gold transition-colors z-20 backdrop-blur-sm cursor-pointer">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 p-6 md:p-8 text-center flex flex-col h-full relative overflow-hidden text-cream">
          {/* Modal steps implementation omitted for brevity. */}
        </div>
      </div>
    </div>
  );
}
