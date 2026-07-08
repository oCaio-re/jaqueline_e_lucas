'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Calendar, MapPin, X, Gift, ArrowLeft, Landmark, Smartphone, Church, Sparkles } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { WEDDING_CONFIG } from '@/config/wedding';
import Lenis from 'lenis';
import { motion, useScroll, useSpring } from 'motion/react';

const GIFTS_LIST = [
  { title: "1kg de café", priceBRL: 492, priceEUR: 75, image: "/gifts/gift_cafe.png" },
  { title: "1 mês de almoço garantido em casa", priceBRL: 400, priceEUR: 60, image: "/gifts/gift_almoco.png" },
  { title: "Academia para os noivos entrarem em forma depois da lua de mel", priceBRL: 480, priceEUR: 75, image: "/gifts/gift_academia.png" },
  { title: "Acessório de última geração para cuidar da casa", priceBRL: 94, priceEUR: 15, image: "/gifts/gift_robot.png" },
  { title: "Acessório para cortar a unha do dedão do noivo", priceBRL: 400, priceEUR: 60, image: "/gifts/gift_grinder.png" },
  { title: "Balança para os noivos não engordarem após o casamento", priceBRL: 80, priceEUR: 15, image: "/gifts/gift_scale.png" },
  { title: "Bolo de cenoura semanal para a noiva", priceBRL: 94, priceEUR: 15, image: "/gifts/gift_carrot_cake.png" },
  { title: "Camisa do time de coração para a alegria do noivo", priceBRL: 240, priceEUR: 40, image: "/gifts/gift_football.png" },
  { title: "Máscara de gás para trocar as fraldas do futuro filho", priceBRL: 265, priceEUR: 40, image: "/gifts/gift_gas_mask.png" },
  { title: "Massagem relaxante para o noivo depois de ver a conta do casamento", priceBRL: 333, priceEUR: 50, image: "/gifts/gift_massage.png" },
  { title: "Muito doce de leite para o noivo comer escondido da noiva", priceBRL: 107, priceEUR: 20, image: "/gifts/gift_dulce.png" },
  { title: "Quer apostar que o noiva vai enfiar o pé na jaca na hora da cerimônia", priceBRL: 1997, priceEUR: 300, image: "/gifts/gift_jaca.png" },
  { title: "Raspadinha da sorte", priceBRL: 134, priceEUR: 20, image: "/gifts/gift_luck.png" },
  { title: "Remedinho para ressaca do noivo", priceBRL: 67, priceEUR: 10, image: "/gifts/gift_pills.png" },
  { title: "Rolo de macarrão para a noiva utilizar quando necessário", priceBRL: 147, priceEUR: 25, image: "/gifts/gift_rolling_pin.png" },
  { title: "Saco e luva de boxe para os noivos aliviarem a tensão", priceBRL: 799, priceEUR: 120, image: "/gifts/gift_boxing.png" },
  { title: "Contribuição Personalizada", priceBRL: 0, priceEUR: 0, image: "/gifts/gift_custom.png" },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [loaderDone, setLoaderDone] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [petals, setPetals] = useState<Array<{ left: string; size: number; duration: string; delay: string; opacity: number }>>([]);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  });
  const [isWeddingDay, setIsWeddingDay] = useState(false);

  // Copy status
  const [copiedType, setCopiedType] = useState<'iban' | 'mbway' | 'pix' | null>(null);
  const [isGiftsModalOpen, setIsGiftsModalOpen] = useState(false);
  const [giftsModalGift, setGiftsModalGift] = useState<{ title: string, image: string, priceBRL?: number, priceEUR?: number } | null>(null);
  const [giftsModalRegion, setGiftsModalRegion] = useState<'EU' | 'BR'>('EU');

  // RSVP Form state (basing on casamento Supabase search logic)
  const [rsvpStatus, setRsvpStatus] = useState<'idle' | 'loading' | 'found' | 'confirming' | 'success' | 'error'>('idle');
  const [rsvpError, setRsvpError] = useState('');
  const [hasConfirmed, setHasConfirmed] = useState(true);

  const [searchParams, setSearchParams] = useState({ nome: '', telefone: '' });

  const [guestId, setGuestId] = useState('');
  const [guestInvite, setGuestInvite] = useState('');
  const [guestMembers, setGuestMembers] = useState('');
  const [guestMessage, setGuestMessage] = useState('');

  // Smooth scrollbar with Lenis
  const lenisRef = useRef<Lenis | null>(null);
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisRef.current = lenis;

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (lenisRef.current) {
      if (isGiftsModalOpen) {
        lenisRef.current.stop();
      } else {
        lenisRef.current.start();
      }
    }
  }, [isGiftsModalOpen]);

  // 1. Mount effect & scroll triggers
  useEffect(() => {
    setMounted(true);

    const generated = Array.from({ length: 24 }).map(() => ({
      left: `${Math.random() * 100}%`,
      size: 6 + Math.random() * 12,
      duration: `${12 + Math.random() * 12}s`,
      delay: `${Math.random() * 12}s`,
      opacity: 0.2 + Math.random() * 0.4,
    }));
    setPetals(generated);

    // Hide loader after 1.6s
    const loaderTimer = setTimeout(() => {
      setLoaderDone(true);
    }, 1600);

    // Scroll listener for nav
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Intersection Observer for scroll animations (reveal-up)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const revealElements = document.querySelectorAll('.reveal, .reveal-up');
    revealElements.forEach((el) => observer.observe(el));

    // Cleanup
    return () => {
      clearTimeout(loaderTimer);
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  // 2. Music Autoplay and synchronization
  useEffect(() => {
    if (!mounted) return;

    // Create audio instance
    const audio = new Audio(WEDDING_CONFIG.bgMusicPath);
    audio.loop = true;
    audio.volume = 0.45;
    audioRef.current = audio;

    // Sync play/pause events
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    // Attempt autostart
    const attemptAutostart = () => {
      audio.play().catch(() => {
        // Fallback: start on first interaction
        const startOnInteraction = () => {
          audio.play().catch(() => { });
          INTERACTION_EVENTS.forEach((ev) => window.removeEventListener(ev, startOnInteraction));
        };
        const INTERACTION_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
        INTERACTION_EVENTS.forEach((ev) => window.addEventListener(ev, startOnInteraction, { passive: true }));
      });
    };

    attemptAutostart();

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.pause();
      audioRef.current = null;
    };
  }, [mounted]);

  // 3. Countdown timer logic
  useEffect(() => {
    if (!mounted) return;

    const targetTime = new Date(WEDDING_CONFIG.weddingDate).getTime();

    const pad = (n: number) => String(n).padStart(2, '0');

    const tick = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setIsWeddingDay(true);
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const days = Math.floor(diff / 864e5);
      const hours = Math.floor((diff % 864e5) / 36e5);
      const minutes = Math.floor((diff % 36e5) / 6e4);
      const seconds = Math.floor((diff % 6e4) / 1e3);

      setTimeLeft({
        days: pad(days),
        hours: pad(hours),
        minutes: pad(minutes),
        seconds: pad(seconds),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [mounted]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => { });
    } else {
      audioRef.current.pause();
    }
  };

  const handleCopy = async (type: 'iban' | 'mbway' | 'pix') => {
    const value = type === 'mbway' ? WEDDING_CONFIG.mbway : type === 'iban' ? WEDDING_CONFIG.iban : WEDDING_CONFIG.pix;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2200);
    } catch (_) { }
  };

  const celebrateConfetti = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#c2a878', '#1f3b5c', '#5e7da6', '#fffdf9', '#a98c5b'];
    for (let i = 0; i < 90; i++) {
      const c = document.createElement('div');
      c.style.cssText = `position:fixed;z-index:700;top:-10px;left:${Math.random() * 100}vw;width:${6 + Math.random() * 8}px;height:${6 + Math.random() * 8}px;background:${colors[i % colors.length]};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};pointer-events:none;opacity:.9;`;
      document.body.appendChild(c);
      const fall = 2500 + Math.random() * 2000;
      c.animate(
        [
          { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
          { transform: `translateY(105vh) rotate(${Math.random() * 720}deg)`, opacity: 0 },
        ],
        { duration: fall, easing: 'cubic-bezier(.2,.7,.3,1)' }
      ).onfinish = () => c.remove();
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchParams.nome || !searchParams.telefone) return;

    setRsvpStatus('loading');
    setRsvpError('');
    try {
      const res = await fetch(`/api/rsvp?nome=${encodeURIComponent(searchParams.nome)}&telefone=${encodeURIComponent(searchParams.telefone)}`);
      const data = await res.json();

      if (!res.ok) {
        setRsvpError(data.error || 'Ocorreu um erro inesperado.');
        setRsvpStatus('error');
        return;
      }

      setGuestId(data.convidado.id);
      setGuestInvite(data.convidado.nome_convite);
      setGuestMembers(data.convidado.membros);
      setRsvpStatus('found');
    } catch (err) {
      setRsvpError('Falha ao comunicar com o servidor. Tente novamente mais tarde.');
      setRsvpStatus('error');
    }
  };

  const handleConfirm = async (isConfirming: boolean) => {
    setRsvpStatus('confirming');
    setHasConfirmed(isConfirming);
    setRsvpError('');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: guestId, mensagem: guestMessage, isConfirming }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRsvpError(data.error || 'Erro ao registrar resposta.');
        setRsvpStatus('error');
        return;
      }

      setRsvpStatus('success');
    } catch (err) {
      setRsvpError('Erro interno, tente novamente.');
      setRsvpStatus('error');
    }
  };

  const resetForm = () => {
    setRsvpStatus('idle');
    setRsvpError('');
    setSearchParams({ nome: '', telefone: '' });
    setGuestId('');
    setGuestInvite('');
    setGuestMembers('');
    setGuestMessage('');
  };

  // Google Agenda link template builder
  const getGoogleCalendarUrl = () => {
    const start = new Date(WEDDING_CONFIG.calendarStart);
    const end = new Date(WEDDING_CONFIG.calendarEnd);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(WEDDING_CONFIG.eventTitle)}` +
      `&dates=${fmt(start)}/${fmt(end)}` +
      `&details=${encodeURIComponent(WEDDING_CONFIG.calendarDescription)}` +
      `&location=${encodeURIComponent(WEDDING_CONFIG.eventLocation)}`;
  };

  return (
    <>
      {/* 1. Monogram Loader */}
      <div className={`loader ${loaderDone ? 'is-done' : ''}`} id="loader">
        <div className="text-center">
          <div className="loader__monogram">J<span>&amp;</span>L</div>
          <div className="loader__bar">
            <span></span>
          </div>
        </div>
      </div>

      {/* 2. Floating Background Music Toggle */}
      {mounted && (
        <button
          className={`music-toggle ${isPlaying ? 'is-playing' : ''}`}
          onClick={toggleMusic}
          aria-label={isPlaying ? "Pausar música" : "Tocar música"}
          title="Só Você — Anderson Freire"
        >
          <span className="music-toggle__icon">
            <span></span><span></span><span></span><span></span>
          </span>
        </button>
      )}

      {/* Scroll progress bar */}
      {mounted && (
        <ScrollProgressBar />
      )}

      {/* 3. DESKTOP: Horizontal top navbar */}
      <nav className={`nav ${isScrolled ? 'is-scrolled' : ''}`} id="nav">
        <a href="#hero" className="nav__brand">J <span>&amp;</span> L</a>
        <ul className="nav__links">
          <li><a href="#evento">O Grande Dia</a></li>
          <li><a href="#programa">Cronograma</a></li>
          <li><a href="#presentes">Presentes</a></li>
          <li>
            <a href="#rsvp" className="nav__cta">Confirmar Presença</a>
          </li>
        </ul>
      </nav>

      {/* 3b. MOBILE: Brand mark fixed top-left */}
      <a
        href="#hero"
        className={`nav__brand-mark ${isScrolled ? 'is-scrolled' : ''}`}
        aria-label="Ir para o início"
      >
        J <span>&amp;</span> L
      </a>

      {/* 3c. MOBILE: Side pill nav fixed right */}
      <nav className="side-nav" aria-label="Navegação principal">
        <div className="side-nav__item">
          <a href="#evento" className="side-nav__btn" aria-label="O Grande Dia">
            <Church className="h-4 w-4" strokeWidth={1.5} />
          </a>
          <span className="side-nav__tooltip">O Grande Dia</span>
        </div>
        <div className="side-nav__item">
          <a href="#programa" className="side-nav__btn" aria-label="Cronograma">
            <Calendar className="h-4 w-4" strokeWidth={1.5} />
          </a>
          <span className="side-nav__tooltip">Cronograma</span>
        </div>
        <div className="side-nav__item">
          <a href="#presentes" className="side-nav__btn" aria-label="Presentes">
            <Gift className="h-4 w-4" strokeWidth={1.5} />
          </a>
          <span className="side-nav__tooltip">Presentes</span>
        </div>
        <div className="side-nav__divider" aria-hidden="true"></div>
        <div className="side-nav__item">
          <a href="#rsvp" className="side-nav__btn side-nav__btn--cta" aria-label="Confirmar Presença">
            <Check className="h-4 w-4" strokeWidth={2} />
          </a>
          <span className="side-nav__tooltip">Confirmar Presença</span>
        </div>
      </nav>

      {/* 4. HERO SECTION */}
      <header className="hero" id="hero">
        <div className="hero__overlay"></div>
        {/* Falling Petals container */}
        {mounted && (
          <div className="hero__petals" aria-hidden="true">
            {petals.map((petal, i) => {
              const style = {
                left: petal.left,
                width: `${petal.size}px`,
                height: `${petal.size}px`,
                animationDuration: petal.duration,
                animationDelay: petal.delay,
                opacity: petal.opacity,
              };
              return <span key={i} className="petal" style={style} />;
            })}
          </div>
        )}
        <div className="hero__content">
          <div className="hero__text-wrap">
            <p className="hero__pretitle reveal">Vamos casar</p>
            <h1 className="hero__names">
              <span className="reveal" style={{ '--d': '.1s' } as React.CSSProperties}>Jaqueline</span>
              <span className="hero__amp reveal" style={{ '--d': '.3s' } as React.CSSProperties}>&amp;</span>
              <span className="reveal" style={{ '--d': '.5s' } as React.CSSProperties}>Lucas</span>
            </h1>
            <div className="hero__divider reveal" style={{ '--d': '.7s' } as React.CSSProperties}>
              <span></span>✦<span></span>
            </div>
            <p className="hero__date reveal" style={{ '--d': '.9s' } as React.CSSProperties}>
              26 de Setembro de 2026 · Viseu, Portugal
            </p>
            <a
              href="#rsvp"
              className="btn btn--solid reveal"
              style={{ '--d': '1.1s' } as React.CSSProperties}
            >
              Confirme a sua presença
            </a>
          </div>
          <div
            className="hero__couple-img-container reveal"
            style={{ '--d': '1.3s' } as React.CSSProperties}
          >
            <img
              src="/foto_casal_sfundo.png"
              alt="Jaqueline e Lucas"
              className="hero__couple-img"
            />
          </div>
        </div>
        <a href="#contagem" className="hero__scroll" aria-label="Descer">
          <span></span>
        </a>
      </header>

      {/* 5. COUNTDOWN SECTION */}
      <section className="countdown" id="contagem">
        <div className="section-frame reveal-up">
          <p className="overline">A contagem começou</p>
          <h2 className="script-title">
            {isWeddingDay ? 'Hoje é o grande dia! 🎉' : 'Falta pouco para o "Sim"'}
          </h2>
          <div className="countdown__grid">
            <div className="countdown__cell">
              <span className="countdown__num" id="cd-days">{timeLeft.days}</span>
              <span className="countdown__label">Dias</span>
            </div>
            <div className="countdown__cell">
              <span className="countdown__num" id="cd-hours">{timeLeft.hours}</span>
              <span className="countdown__label">Horas</span>
            </div>
            <div className="countdown__cell">
              <span className="countdown__num" id="cd-min">{timeLeft.minutes}</span>
              <span className="countdown__label">Minutos</span>
            </div>
            <div className="countdown__cell">
              <span className="countdown__num" id="cd-sec">{timeLeft.seconds}</span>
              <span className="countdown__label">Segundos</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BIBLE VERSE SECTION */}
      <section className="verse" id="versiculo">
        <div className="section-frame">
          <div className="verse__cord reveal-up" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <p className="verse__text reveal-up">
            &ldquo;E, se alguém quiser prevalecer contra um, os dois lhe resistirão; e o cordão de três dobras não se quebra tão depressa.&rdquo;
          </p>
          <p className="verse__ref reveal-up">Eclesiastes 4:12</p>
        </div>
      </section>



      {/* 10. THE BIG DAY (Quinta details) */}
      <section className="event" id="evento">
        <div className="section-frame">
          <p className="overline reveal-up">Guarde a data</p>
          <h2 className="script-title reveal-up">O Grande Dia</h2>
          <div className="event__cards">
            <article className="event-card reveal-up">
              <div className="event-card__icon flex justify-center text-gold-deep mb-4">
                <Church className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <h3>Cerimónia</h3>
              <p className="event-card__time">12h00</p>
              <p className="event-card__place">Quinta de Marzovelos</p>
              <p className="event-card__addr text-xs pt-1">Viseu · Receção a partir das 11h00</p>
            </article>
            <div className="event__date reveal-up">
              <span className="event__day">Sáb</span>
              <span className="event__num">26</span>
              <span className="event__month">Setembro</span>
              <span className="event__yr">2026</span>
            </div>
            <article className="event-card reveal-up">
              <div className="event-card__icon flex justify-center text-gold-deep mb-4">
                <Sparkles className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <h3>Celebração</h3>
              <p className="event-card__time">13h30</p>
              <p className="event-card__place">Quinta de Marzovelos</p>
              <p className="event-card__addr text-xs pt-1">R. Qta de Baixo n.º 2 B, Viseu</p>
            </article>
          </div>
          <div className="event__actions reveal-up">
            <a
              className="inline-flex items-center gap-2 bg-gold text-navy-dark hover:bg-gold-deep hover:text-ivory transition-all duration-300 font-semibold uppercase tracking-wider text-xs px-6 py-3.5 rounded-full shadow-md cursor-pointer"
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Calendar className="h-4 w-4" /> Google Agenda
            </a>
            <a
              className="inline-flex items-center gap-2 border border-gold text-gold-deep hover:bg-gold hover:text-navy-dark transition-all duration-300 font-semibold uppercase tracking-wider text-xs px-6 py-3.5 rounded-full cursor-pointer"
              href="https://maps.google.com/?q=Quinta+de+Marzovelos,+R.+Qta+de+Baixo+2B,+3510-014+Viseu"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin className="h-4 w-4" /> Ver no mapa
            </a>
          </div>
        </div>
      </section>

      {/* 11. DAY SCHEDULE (Cronograma) */}
      <section className="schedule" id="programa">
        <div className="section-frame">
          <p className="overline reveal-up">Como vai ser o dia</p>
          <h2 className="script-title reveal-up">Cronograma</h2>
          <div className="schedule__list">
            <div className="schedule__item reveal-up">
              <span className="schedule__time">11:00</span>
              <span className="schedule__dot"></span>
              <div>
                <h3>Receção &amp; Welcome Drink</h3>
                <p>Recebemos os nossos convidados com um brinde de boas-vindas.</p>
              </div>
            </div>
            <div className="schedule__item reveal-up">
              <span className="schedule__time">12:00</span>
              <span className="schedule__dot"></span>
              <div>
                <h3>Cerimónia</h3>
                <p>O momento mais esperado: diante de Deus e de quem mais amamos, dizemos o nosso &ldquo;sim&rdquo;.</p>
              </div>
            </div>
            <div className="schedule__item reveal-up">
              <span className="schedule__time">13:30</span>
              <span className="schedule__dot"></span>
              <div>
                <h3>Buffet de Entradas</h3>
                <p>Um buffet de entradas para abrir o apetite e a celebração.</p>
              </div>
            </div>
            <div className="schedule__item reveal-up">
              <span className="schedule__time">14:30</span>
              <span className="schedule__dot"></span>
              <div>
                <h3>Almoço</h3>
                <p>Sentamo-nos à mesa para partilhar uma refeição preparada com todo o carinho.</p>
              </div>
            </div>
            <div className="schedule__item reveal-up">
              <span className="schedule__time">16:30</span>
              <span className="schedule__dot"></span>
              <div>
                <h3>Sunset &amp; Corte do Bolo</h3>
                <p>Ao pôr do sol, cortamos o bolo — servido como sobremesa.</p>
              </div>
            </div>
            <div className="schedule__item reveal-up">
              <span className="schedule__time">18:00</span>
              <span className="schedule__dot"></span>
              <div>
                <h3>Encerramento</h3>
                <p>Um até já cheio de gratidão e memórias para guardar para sempre.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. GIFTS SECTION (Presença & Presentes) */}
      <section className="gifts" id="presentes">
        <div className="section-frame">
          <p className="overline reveal-up">Com todo o carinho</p>
          <h2 className="script-title reveal-up">Presentes</h2>
          <p className="gifts__intro reveal-up">
            A sua presença é o nosso maior presente. No entanto, se desejar abençoar a nossa nova caminhada com uma oferta, partilhamos abaixo os nossos dados com profunda gratidão.
          </p>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center w-full max-w-4xl mx-auto mt-8">
            <div className="pay-card reveal-up">
              <Landmark className="pay-card__icon" />
              <h3 className="pay-card__label">Transferência Bancária</h3>

              <div className="pay-card__ornament">
                <span className="ornament-line"></span>
                <span className="ornament-diamond">♦</span>
                <span className="ornament-line"></span>
              </div>

              <div className="pay-card__content">
                <span className="pay-card__value" id="ibanValue">{WEDDING_CONFIG.iban}</span>
                <button
                  className="pay-card__copy-btn"
                  onClick={() => handleCopy('iban')}
                  aria-label="Copiar IBAN"
                >
                  {copiedType === 'iban' ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copiar IBAN
                    </>
                  )}
                </button>
              </div>

              <p className="pay-card__holder">
                Titular da Conta
                <strong>Lucas Alves &amp; Jaqueline S. Silva</strong>
              </p>
            </div>

            <div className="pay-card reveal-up">
              <Smartphone className="pay-card__icon" />
              <h3 className="pay-card__label">MB WAY</h3>

              <div className="pay-card__ornament">
                <span className="ornament-line"></span>
                <span className="ornament-diamond">♦</span>
                <span className="ornament-line"></span>
              </div>

              <div className="pay-card__content">
                <span className="pay-card__value" id="mbwayValue">{WEDDING_CONFIG.mbway}</span>
                <button
                  className="pay-card__copy-btn"
                  onClick={() => handleCopy('mbway')}
                  aria-label="Copiar número"
                >
                  {copiedType === 'mbway' ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copiar Número
                    </>
                  )}
                </button>
              </div>

            </div>

            <div className="pay-card reveal-up">
              <Smartphone className="pay-card__icon" />
              <h3 className="pay-card__label">PIX (Brasil)</h3>

              <div className="pay-card__ornament">
                <span className="ornament-line"></span>
                <span className="ornament-diamond">♦</span>
                <span className="ornament-line"></span>
              </div>

              <div className="pay-card__content flex-1 flex flex-col justify-between">
                <p className="text-xs text-ink-soft leading-relaxed mb-4">
                  Apoie a nossa união gerando um QR Code ou copiando a chave de forma rápida e segura.
                </p>
                <button
                  className="pay-card__copy-btn w-full cursor-pointer inline-flex items-center justify-center gap-2"
                  onClick={() => {
                    setGiftsModalGift({ title: "Presente Livre (PIX)", image: "/gifts/gift_custom.png" });
                    setGiftsModalRegion('BR');
                    setIsGiftsModalOpen(true);
                  }}
                  aria-label="Contribuir via PIX"
                >
                  <Gift className="h-4 w-4" /> Contribuir via PIX
                </button>
              </div>

              <p className="pay-card__holder">
                Titular da Conta
                <strong>Lucas Alves da Silva</strong>
              </p>
            </div>
          </div>
          <div className="flex justify-center mt-10 reveal-up">
            <button
              onClick={() => setIsGiftsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-navy text-ivory hover:bg-gold hover:text-navy-dark transition-all duration-300 font-bold uppercase tracking-widest text-xs md:text-sm py-4 px-10 rounded-full shadow-lg hover:shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Gift className="h-4 w-4 animate-bounce" />
              Escolher da Lista de Presentes
            </button>
          </div>
        </div>
      </section>

      {/* 13. RSVP CONFIRMATION FORM */}
      <section className="rsvp" id="rsvp">
        <div className="rsvp__overlay"></div>
        <div className="section-frame">
          <p className="overline reveal-up">Mal podemos esperar por si</p>
          <h2 className="script-title reveal-up">Confirme a Sua Presença</h2>
          <p className="rsvp__deadline reveal-up">Por favor, responda até <strong>15 de Agosto de 2026</strong>.</p>

          <div className="rsvp__form reveal-up min-h-[300px] flex flex-col justify-center">
            {rsvpStatus === 'idle' && (
              <form onSubmit={handleSearch} className="flex flex-col gap-5">
                <div className="field">
                  <input
                    type="text"
                    id="search_name"
                    required
                    placeholder=" "
                    value={searchParams.nome}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, nome: e.target.value }))}
                  />
                  <label htmlFor="search_name">Nome no Convite</label>
                </div>
                <div className="field">
                  <input
                    type="tel"
                    id="search_phone"
                    required
                    placeholder=" "
                    value={searchParams.telefone}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, telefone: e.target.value.replace(/[^0-9]/g, '') }))}
                  />
                  <label htmlFor="search_phone">Telefone (9 dígitos)</label>
                </div>
                <button type="submit" className="btn btn--solid btn--block cursor-pointer">
                  Buscar Convite
                </button>
              </form>
            )}

            {(rsvpStatus === 'loading' || rsvpStatus === 'confirming') && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-ivory">
                <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                <p className="font-medium animate-pulse text-sm">
                  {rsvpStatus === 'loading' ? 'Procurando o seu convite...' : 'A gravar a sua resposta...'}
                </p>
              </div>
            )}

            {rsvpStatus === 'found' && (
              <div className="flex flex-col gap-5 text-center">
                <div className="text-left">
                  <p className="text-ivory text-sm mb-3">Seu convite inclui: <strong className="text-gold font-bold">{guestMembers}</strong></p>
                  <p className="text-ivory/80 text-xs mb-5">Ficamos muito felizes por celebrar este dia consigo!</p>
                </div>

                <div className="field text-left">
                  <textarea
                    id="guest_message"
                    rows={3}
                    placeholder=" "
                    value={guestMessage}
                    onChange={(e) => setGuestMessage(e.target.value)}
                  ></textarea>
                  <label htmlFor="guest_message">Deixe uma mensagem aos noivos (Opcional)</label>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleConfirm(true)}
                    className="btn btn--solid btn--block cursor-pointer"
                  >
                    Confirmar Presença
                  </button>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleConfirm(false)}
                      className="flex-1 px-4 py-2 bg-transparent border border-rose-400 text-rose-300 hover:bg-rose-950/20 rounded-full text-xs uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      Não poderei comparecer
                    </button>
                    <button
                      onClick={resetForm}
                      className="flex-1 px-4 py-2 bg-transparent border border-gray-400 text-gray-300 hover:bg-gray-850/20 rounded-full text-xs uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {rsvpStatus === 'success' && (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center border border-gold">
                  <span className="text-2xl">🎉</span>
                </div>
                <div>
                  <h3 className="text-2xl font-serif text-gold font-medium mb-2">Obrigado!</h3>
                  <p className="text-ivory text-sm">
                    {hasConfirmed
                      ? 'A sua presença foi confirmada com sucesso. Aguardamos por si!'
                      : 'A sua resposta foi registada. Sentiremos a sua falta!'}
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="mt-4 px-6 py-2 bg-transparent text-gold border border-gold/40 hover:bg-gold/10 rounded-full text-xs tracking-wider uppercase font-semibold cursor-pointer"
                >
                  Confirmar outro convidado
                </button>
              </div>
            )}

            {rsvpStatus === 'error' && (
              <div className="flex flex-col items-center py-6 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-950/20 flex items-center justify-center border border-red-500/50">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-lg font-serif text-rose-300 font-medium mb-2">Ops...</h3>
                  <p className="text-rose-200 text-xs px-4">{rsvpError}</p>
                </div>
                <button
                  onClick={() => setRsvpStatus('idle')}
                  className="mt-4 px-6 py-2 bg-gold text-navy rounded-full text-xs tracking-wider uppercase font-semibold cursor-pointer"
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 14. FAQ SECTION WITH SHADCN ACCORDION */}
      <section className="faq">
        <div className="section-frame">
          <p className="overline reveal-up">Informações Úteis</p>
          <h2 className="script-title reveal-up">Dúvidas Frequentes</h2>

          <div className="dresscode reveal-up">
            <div className="dresscode__icon flex justify-center text-gold-deep">
              <Sparkles className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <div className="dresscode__body">
              <p className="dresscode__label">Dress Code</p>
              <h3 className="dresscode__title">Traje Formal · Cerimónia</h3>
              <p className="dresscode__text">
                Senhoras: vestido de cocktail ou comprido. Senhores: fato. Pedimos, com carinho, que reservem a cor <strong>branca</strong> exclusivamente para a noiva.
              </p>
            </div>
          </div>

          <div className="faq__list reveal-up max-w-[720px] mx-auto">
            <Accordion className="w-full">
              <AccordionItem value="item-1" className="border-b border-cream-deep py-2">
                <AccordionTrigger className="font-serif text-[1.25rem] text-navy-dark font-medium hover:no-underline py-4">
                  Há estacionamento no local?
                </AccordionTrigger>
                <AccordionContent className="text-ink-soft text-[0.98rem] leading-relaxed pb-4">
                  Sim, a Quinta de Marzovelos dispõe de estacionamento gratuito para todos os convidados.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-b border-cream-deep py-2">
                <AccordionTrigger className="font-serif text-[1.25rem] text-navy-dark font-medium hover:no-underline py-4">
                  Até quando posso confirmar?
                </AccordionTrigger>
                <AccordionContent className="text-ink-soft text-[0.98rem] leading-relaxed pb-4">
                  Pedimos que confirme a sua presença até 15 de Agosto de 2026, para garantirmos que tudo corre na perfeição.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* 15. FOOTER */}
      <footer className="footer">
        <div className="footer__monogram">J <span>&amp;</span> L</div>
        <p className="footer__quote">&ldquo;Sempre foi ele. No momento certo, o Senhor permitiu o nosso encontro.&rdquo;</p>
        <p className="footer__date">26 · 09 · 2026</p>
        <p className="footer__credit">Feito com ♥ para celebrar a Jaqueline &amp; o Lucas</p>
      </footer>

      {isGiftsModalOpen && (
        <GiftsModal
          isOpen={isGiftsModalOpen}
          onClose={() => {
            setIsGiftsModalOpen(false);
            setGiftsModalGift(null);
            setGiftsModalRegion('EU');
          }}
          initialGift={giftsModalGift}
          initialRegion={giftsModalRegion}
        />
      )}
    </>
  );
}



function GiftsModal({
  isOpen,
  onClose,
  initialGift = null,
  initialRegion = 'EU'
}: {
  isOpen: boolean;
  onClose: () => void;
  initialGift?: { title: string, image: string, priceBRL?: number, priceEUR?: number } | null;
  initialRegion?: 'EU' | 'BR';
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedGift, setSelectedGift] = useState<{ title: string, image: string, priceBRL?: number, priceEUR?: number } | null>(null);

  // States for the payment flow
  const [step, setStep] = useState<'list' | 'value' | 'checkout_eu' | 'qrcode'>('list');
  const [region, setRegion] = useState<'EU' | 'BR'>('EU');
  const [currencyToggle, setCurrencyToggle] = useState<'EU' | 'BR'>('EU');
  const [amount, setAmount] = useState<string>("");
  const [pixData, setPixData] = useState<{ emv: string, qrCodeUrl: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (initialGift) {
        setSelectedGift(initialGift);
        setStep('value');
        setRegion(initialRegion);
        setCurrencyToggle(initialRegion || 'EU');
      } else {
        setStep('list');
        setCurrencyToggle('EU');
      }
    } else {
      document.body.style.overflow = 'unset';
      const t = setTimeout(() => {
        setSelectedGift(null);
        setStep('list');
        setAmount("");
        setPixData(null);
        setErrorMsg("");
        setRegion('EU');
        setCurrencyToggle('EU');
      }, 300);
      return () => clearTimeout(t);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, initialGift, initialRegion]);

  if (!isOpen) return null;

  const handleAmountChange = (val: string, currentRegion: 'EU' | 'BR') => {
    const cleanVal = val.replace(/\D/g, "");
    if (!cleanVal) {
      setAmount("");
      return;
    }
    const numeric = parseFloat(cleanVal) / 100;
    if (currentRegion === 'BR') {
      const formatted = numeric.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      setAmount(formatted);
    } else {
      const formatted = numeric.toLocaleString("pt-PT", {
        style: "currency",
        currency: "EUR",
      });
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
      setErrorMsg("Por favor, insira um valor válido.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftTitle: selectedGift?.title,
          amount: rawValue
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao gerar PIX");
      }

      setPixData({
        emv: data.pixCopiaECola,
        qrCodeUrl: data.qrCodeUrl
      });
      setStep('qrcode');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Ocorreu um erro ao gerar o PIX. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectGift = (gift: { title: string, priceBRL: number, priceEUR: number, image: string }) => {
    setSelectedGift(gift);
    setStep('value');
    setRegion(currencyToggle);
    if (gift.priceBRL === 0) {
      setAmount("");
    } else {
      const price = currencyToggle === 'BR' ? gift.priceBRL : gift.priceEUR;
      handleAmountChange((price * 100).toString(), currencyToggle);
    }
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (_) { }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300">
      <div className="bg-gradient-to-br from-navy-dark via-navy to-navy-dark w-[95vw] md:w-[80vw] max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative border border-gold/15 h-[85vh] min-h-[500px] flex flex-col transition-transform duration-300 scale-100">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gold/70 hover:text-gold transition-colors z-20 backdrop-blur-sm cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 p-6 md:p-8 text-center flex flex-col min-h-0 relative text-cream">
          {step === 'list' && (
            <div className="w-full flex flex-col h-full relative z-10 animate-fadeIn">
              <Gift className="w-10 h-10 text-gold mx-auto mb-4 drop-shadow-[0_0_12px_rgba(194,168,120,0.3)]" strokeWidth={1.5} />
              <h3 className="font-serif text-3xl text-ivory mb-2 font-medium">Lista de Presentes</h3>
              <p className="text-sm font-normal text-cream/70 leading-relaxed mb-6">
                O maior presente é a sua presença! Mas se desejar, selecione uma cota divertida abaixo para nos abençoar.
              </p>

              <div className="flex rounded-xl bg-white/[0.04] p-1 border border-white/[0.08] mb-6 max-w-xs md:max-w-sm w-full mx-auto shadow-md">
                <button
                  type="button"
                  onClick={() => setCurrencyToggle('EU')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${currencyToggle === 'EU' ? 'bg-gold text-navy-dark shadow font-bold' : 'text-cream/60 hover:text-cream'}`}
                >
                  Portugal / Europa (€)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrencyToggle('BR')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${currencyToggle === 'BR' ? 'bg-gold text-navy-dark shadow font-bold' : 'text-cream/60 hover:text-cream'}`}
                >
                  Brasil (R$ - Pix)
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0" data-lenis-prevent>
              <div className="p-3 md:p-6 rounded-2xl border border-gold/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full bg-gray-50/5" style={{ gridAutoRows: 'min-content' }}>
                {GIFTS_LIST.map((gift) => (
                  <div
                    key={gift.title}
                    className="gift-product-card"
                    onClick={() => handleSelectGift(gift)}
                  >
                    <div className="gift-product-card__img-wrap">
                      <img
                        src={gift.image}
                        alt={gift.title}
                        className="gift-product-card__img"
                        loading="lazy"
                      />
                    </div>
                    <div className="gift-product-card__body">
                      <h4 className="gift-product-card__title">
                        {gift.title}
                      </h4>
                      <div className="gift-product-card__footer">
                        <span className="gift-product-card__price">
                          {gift.priceBRL === 0 ? (
                            "Valor Livre"
                          ) : currencyToggle === 'BR' ? (
                            gift.priceBRL.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            })
                          ) : (
                            gift.priceEUR.toLocaleString('pt-PT', {
                              style: 'currency',
                              currency: 'EUR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            })
                          )}
                        </span>
                        <button className="gift-product-card__btn">
                          Oferecer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}

          {step === 'value' && selectedGift && (
            <div className="w-full h-full flex flex-col items-center justify-center pt-8 relative z-10 animate-fadeIn">
              <button
                onClick={() => {
                  setSelectedGift(null);
                  setStep('list');
                  setAmount("");
                  setErrorMsg("");
                }}
                className="absolute left-4 top-4 flex items-center gap-2 text-gold/50 hover:text-gold transition-colors focus:outline-none z-20 bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/[0.06] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[11px] md:text-xs uppercase tracking-widest font-bold">Voltar</span>
              </button>

              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-gold/20 mx-auto border-4 border-gold/40 overflow-hidden relative">
                <img src={selectedGift.image} alt={selectedGift.title} className="w-full h-full object-cover" />
              </div>

              <h3 className="font-serif text-xl md:text-2xl text-ivory mb-2 font-medium leading-relaxed">
                Contribuir para:<br />
                <span className="text-gold/80 italic">"{selectedGift.title}"</span>
              </h3>

              <p className="text-xs text-gold/60 uppercase tracking-widest font-medium mb-4">
                Escolha a sua região e o valor do presente
              </p>

              <div className="w-full max-w-sm px-4 flex flex-col gap-4">
                <div className="flex rounded-xl bg-white/[0.04] p-1 border border-white/[0.08] mb-2">
                  <button
                    type="button"
                    onClick={() => { setRegion('EU'); setAmount(""); setErrorMsg(""); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${region === 'EU' ? 'bg-gold text-navy-dark shadow font-bold' : 'text-cream/60 hover:text-cream'}`}
                  >
                    Portugal / Europa (€)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRegion('BR'); setAmount(""); setErrorMsg(""); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${region === 'BR' ? 'bg-gold text-navy-dark shadow font-bold' : 'text-cream/60 hover:text-cream'}`}
                  >
                    Brasil (R$ - Pix)
                  </button>
                </div>

                <div className="relative rounded-xl border border-gold/35 bg-white/[0.02] p-3 shadow-inner focus-within:border-gold transition-colors">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-gold/60">
                    {region === 'BR' ? 'R$' : '€'}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={region === 'BR' ? amount.replace("R$", "").trim() : amount.replace("€", "").trim()}
                    onChange={(e) => handleAmountChange(e.target.value, region)}
                    placeholder="0,00"
                    className="w-full text-center text-2xl font-semibold bg-transparent border-none text-ivory placeholder-ivory/20 focus:outline-none pl-8 pr-2"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {(region === 'BR' ? [100, 200, 500, 1000] : [20, 50, 100, 200]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelectSuggestedValue(val, region)}
                      className={`py-2 rounded-lg text-xs md:text-sm font-medium border transition-all cursor-pointer ${amount.includes(val.toString()) && amount.length < 13
                        ? "bg-gold border-transparent text-navy-dark shadow font-bold"
                        : "bg-white/[0.04] border-gold/15 text-gold/80 hover:bg-white/[0.08] hover:text-gold"
                        }`}
                    >
                      {region === 'BR' ? `R$ ${val}` : `${val} €`}
                    </button>
                  ))}
                </div>

                {errorMsg && (
                  <p className="text-xs md:text-sm text-red-400 font-medium leading-relaxed bg-red-950/20 p-2 rounded-lg border border-red-900/30">
                    {errorMsg}
                  </p>
                )}

                {region === 'EU' ? (
                  <button
                    onClick={() => {
                      if (!amount || parseFloat(getRawAmount(amount)) <= 0) {
                        setErrorMsg("Por favor, insira um valor válido.");
                        return;
                      }
                      setStep('checkout_eu');
                    }}
                    disabled={!amount}
                    className="w-full py-3.5 rounded-full font-bold text-sm tracking-widest uppercase cursor-pointer transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] mt-2 bg-gold text-navy-dark hover:bg-gold-deep border border-transparent"
                  >
                    Confirmar Presente
                  </button>
                ) : (
                  <button
                    onClick={generatePix}
                    disabled={isGenerating || !amount}
                    className="w-full py-3.5 rounded-full font-bold text-sm tracking-widest uppercase cursor-pointer transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] mt-2 relative overflow-hidden flex items-center justify-center gap-2 bg-gold text-navy-dark hover:bg-gold-deep border border-transparent"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-navy-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Gerando Pix...</span>
                      </>
                    ) : (
                      <span>Gerar PIX</span>
                    )}
                  </button>
                )}
                {region === 'BR' && (
                  <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-gold/15 backdrop-blur-sm shadow-md">
                    <p className="text-[10px] text-cream/70 uppercase tracking-widest font-semibold mb-2">
                      Ou transfira para a chave PIX direta (CPF)
                    </p>
                    <div className="flex items-center justify-between bg-white/[0.04] px-4 py-2.5 rounded-xl border border-gold/5">
                      <span className="text-xs md:text-sm font-semibold text-ivory font-mono">{WEDDING_CONFIG.pix}</span>
                      <button
                        onClick={() => handleCopy(WEDDING_CONFIG.pix, 'pix')}
                        className="p-2 rounded-full bg-gold/10 hover:bg-gold/25 text-gold transition-all cursor-pointer"
                        title="Copiar Chave PIX"
                      >
                        {copied === 'pix' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-cream/40 mt-2 leading-relaxed">
                      Titular: Lucas Alves da Silva
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'checkout_eu' && selectedGift && (
            <div className="w-full h-full flex flex-col items-center justify-center pt-8 relative z-10 animate-fadeIn">
              <button
                onClick={() => setStep('value')}
                className="absolute left-4 top-4 flex items-center gap-2 text-gold/50 hover:text-gold transition-colors focus:outline-none z-20 bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/[0.06] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[11px] md:text-xs uppercase tracking-widest font-bold">Voltar</span>
              </button>

              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-md mx-auto border-2 border-gold/40 overflow-hidden relative">
                <img src={selectedGift.image} alt={selectedGift.title} className="w-full h-full object-cover" />
              </div>

              <h3 className="font-serif text-lg md:text-xl text-ivory mb-1 font-medium leading-relaxed">
                Quase lá! Transfira o seu presente
              </h3>
              <p className="text-xs text-gold/80 font-medium mb-6 bg-white/[0.04] border border-gold/10 px-3 py-1 rounded-full backdrop-blur-sm">
                Cota de presente: {amount}
              </p>

              <div className="w-full max-w-md px-4 flex flex-col gap-4">
                <div className="bg-white/[0.03] border border-gold/15 rounded-2xl p-4 flex flex-col gap-2 relative shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-gold/60 font-bold">📱 Opção 1: MB WAY</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 bg-white/[0.04] p-3 rounded-xl border border-gold/5">
                    <span className="text-sm font-semibold text-ivory">{WEDDING_CONFIG.mbway}</span>
                    <button
                      onClick={() => handleCopy(WEDDING_CONFIG.mbway, 'mbway')}
                      className="p-2 rounded-full bg-gold/10 hover:bg-gold/25 text-gold transition-all cursor-pointer"
                    >
                      {copied === 'mbway' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-cream/50 text-left leading-relaxed mt-1">
                    * Ao enviar por MB WAY, por favor adicione na descrição da app: <strong className="text-gold/80">"Presente: {selectedGift.title.substring(0, 15)}"</strong>.
                  </p>
                </div>

                <div className="bg-white/[0.03] border border-gold/15 rounded-2xl p-4 flex flex-col gap-2 relative shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-gold/60 font-bold">🏦 Opção 2: Transferência Bancária (IBAN)</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 bg-white/[0.04] p-3 rounded-xl border border-gold/5">
                    <span className="text-[11px] md:text-xs font-semibold text-ivory font-mono break-all text-left">{WEDDING_CONFIG.iban}</span>
                    <button
                      onClick={() => handleCopy(WEDDING_CONFIG.iban, 'iban')}
                      className="p-2 rounded-full bg-gold/10 hover:bg-gold/25 text-gold transition-all shrink-0 ml-2 cursor-pointer"
                    >
                      {copied === 'iban' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-cream/50 text-left leading-relaxed">
                    Titular: Lucas Alves &amp; Jaqueline Santos da Silva
                  </p>
                </div>

                <p className="text-[10px] text-ivory/40 text-center mt-2 leading-relaxed">
                  Agradecemos imenso pelo vosso carinho e generosidade! 💖
                </p>
              </div>
            </div>
          )}

          {step === 'qrcode' && selectedGift && pixData && (
            <div className="w-full h-full flex flex-col items-center justify-center pt-8 relative z-10 animate-fadeIn">
              <button
                onClick={() => {
                  setStep('value');
                  setCopied(null);
                }}
                className="absolute left-4 top-4 flex items-center gap-2 text-gold/50 hover:text-gold transition-colors focus:outline-none z-20 bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/[0.06] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[11px] md:text-xs uppercase tracking-widest font-bold">Voltar</span>
              </button>

              <div className="w-16 h-16 rounded-full border border-gold/20 flex items-center justify-center mb-3 shadow-md overflow-hidden relative">
                <img src={selectedGift.image} alt={selectedGift.title} className="w-full h-full object-cover" />
              </div>

              <h3 className="font-serif text-lg md:text-xl text-ivory mb-1 font-medium leading-relaxed">
                Quase lá! Escaneie o PIX abaixo
              </h3>
              <p className="text-xs text-gold/80 font-medium mb-5 bg-white/[0.04] border border-gold/10 px-3 py-1 rounded-full backdrop-blur-sm">
                Cota de presente: {amount}
              </p>

              <div className="flex flex-col items-center w-full max-w-sm px-4">
                <div className="w-44 h-44 md:w-52 md:h-52 bg-white rounded-2xl shadow-lg border border-gold/10 mb-6 p-4 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={pixData.qrCodeUrl}
                    alt="QR Code PIX"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div
                  className="flex items-center gap-3 bg-white/[0.08] backdrop-blur-sm px-4 py-2.5 border border-gold/15 rounded-full group cursor-pointer hover:bg-white/[0.14] transition-colors w-full shadow-sm"
                  onClick={() => handleCopy(pixData.emv, 'pix')}
                >
                  <div className="flex flex-col items-start flex-1 px-2 border-r border-gold/15 overflow-hidden">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-gold/50 font-bold mb-0.5">PIX Copia e Cola</span>
                    <span className="text-xs md:text-sm font-medium text-ivory/90 truncate w-full text-left">{pixData.emv}</span>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/25 transition-colors ml-1 shrink-0">
                    {copied === 'pix' ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400" /> : <Copy className="w-3.5 h-3.5 md:w-4 md:h-4 text-gold/70" />}
                  </div>
                </div>

                <p className="text-[10px] text-ivory/40 text-center mt-4 leading-relaxed">
                  Muito obrigado por fazer parte da nossa história e contribuir com o nosso lar! 💖
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="scroll-progress-bar" aria-hidden="true">
      <motion.div
        className="scroll-progress-bar__fill"
        style={{ scaleX }}
      />
    </div>
  );
}
