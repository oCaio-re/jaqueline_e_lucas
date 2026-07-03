'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Copy, Check, Calendar, MapPin, Menu, X, ChevronDown, Gift, ArrowLeft, Landmark, Smartphone, Heart, Church, Sparkles, Music } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { WEDDING_CONFIG } from '@/config/wedding';
import Lenis from 'lenis';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [loaderDone, setLoaderDone] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Proposal video state
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Copy status
  const [copiedType, setCopiedType] = useState<'iban' | 'mbway' | null>(null);
  const [isGiftsModalOpen, setIsGiftsModalOpen] = useState(false);

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
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  // 1. Mount effect & scroll triggers
  useEffect(() => {
    setMounted(true);

    // Hide loader after 1.6s
    const loaderTimer = setTimeout(() => {
      setLoaderDone(true);
    }, 1600);

    // Scroll listener for nav
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
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

  const handleCopy = async (type: 'iban' | 'mbway') => {
    const value = type === 'mbway' ? WEDDING_CONFIG.mbway : WEDDING_CONFIG.iban;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2200);
    } catch (_) { }
  };

  const loadProposalVideo = () => {
    setVideoLoaded(true);
    // Pause background music when proposal video starts playing
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
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

      {/* 3. Navigation Bar */}
      <nav className={`nav ${isScrolled ? 'is-scrolled' : ''}`} id="nav">
        <a href="#hero" className="nav__brand">J <span>&amp;</span> L</a>
        <button
          className="nav__burger md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMenuOpen ? (
            <X className={`h-6 w-6 ${isScrolled ? 'text-navy-dark' : 'text-ivory'}`} />
          ) : (
            <Menu className={`h-6 w-6 ${isScrolled ? 'text-navy-dark' : 'text-ivory'}`} />
          )}
        </button>
        <ul className={`nav__links ${isMenuOpen ? 'is-open' : ''}`} id="navLinks">
          <li><a href="#historia" onClick={() => setIsMenuOpen(false)}>A Nossa História</a></li>
          <li><a href="#musica" onClick={() => setIsMenuOpen(false)}>A Nossa Música</a></li>
          <li><a href="#pedido" onClick={() => setIsMenuOpen(false)}>O Pedido</a></li>
          <li><a href="#evento" onClick={() => setIsMenuOpen(false)}>O Grande Dia</a></li>
          <li><a href="#programa" onClick={() => setIsMenuOpen(false)}>Cronograma</a></li>
          <li><a href="#presentes" onClick={() => setIsMenuOpen(false)}>Presentes</a></li>
          <li>
            <a
              href="#rsvp"
              className="nav__cta"
              onClick={() => setIsMenuOpen(false)}
            >
              Confirmar Presença
            </a>
          </li>
        </ul>
      </nav>

      {/* 4. HERO SECTION */}
      <header className="hero flex flex-col items-center justify-center min-h-screen text-center" id="hero">
        <div className="hero__overlay"></div>
        {/* Falling Petals container */}
        {mounted && (
          <div className="hero__petals" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, i) => {
              const size = 8 + Math.random() * 12;
              const style = {
                left: `${Math.random() * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDuration: `${7 + Math.random() * 9}s`,
                animationDelay: `${Math.random() * 10}s`,
                opacity: 0.3 + Math.random() * 0.4,
              };
              return <span key={i} className="petal" style={style} />;
            })}
          </div>
        )}
        <div className="hero__content">
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
            className="btn btn--ghost reveal"
            style={{ '--d': '1.1s' } as React.CSSProperties}
          >
            Confirme a sua presença
          </a>
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

      {/* 7. OUR STORY TIMELINE SECTION */}
      <section className="story" id="historia">
        <div className="section-frame">
          <p className="overline reveal-up">Um encontro guiado por Deus</p>
          <h2 className="script-title reveal-up">A Nossa História</h2>
          <div className="timeline">
            <div className="timeline__item reveal-up">
              <div className="timeline__dot"></div>
              <div className="timeline__year">Out 2025</div>
              <div className="timeline__card">
                <h3>Onde tudo começou</h3>
                <p>Conhecemo-nos no GC Imersos. O Senhor conduziu o Lucas a orar pelo GC e, logo depois, mostrou-lhe que era para orar por mim. Ele começou a aproximar-se e nasceu uma amizade.</p>
              </div>
            </div>
            <div className="timeline__item reveal-up">
              <div className="timeline__dot"></div>
              <div className="timeline__year">O tempo de espera</div>
              <div className="timeline__card">
                <h3>Dois meses em oração</h3>
                <p>As muitas perguntas levaram-me a afastar e ficámos dois meses sem conversar — mas em oração constante. Desde 2022 que o Lucas orava pela sua esposa. Nesse silêncio, Deus preparava o meu coração.</p>
              </div>
            </div>
            <div className="timeline__item reveal-up">
              <div className="timeline__dot"></div>
              <div className="timeline__year">08 Mar 2026</div>
              <div className="timeline__card">
                <h3>A ligação que mudou tudo</h3>
                <p>O Senhor tocou o coração do Lucas para me ligar. Algo em mim tinha mudado — Deus mostrava-me que eu já estava pronta. Desde esse dia, nunca mais nos afastámos.</p>
              </div>
            </div>
            <div className="timeline__item reveal-up">
              <div className="timeline__dot"></div>
              <div className="timeline__year">18 Mar 2026</div>
              <div className="timeline__card">
                <h3>Juntos em oração</h3>
                <p>O Lucas chamou-me para orar. Ele já tinha a certeza, mas queria que o Senhor ma mostrasse também. A partir daí, passámos a orar e a conversar todos os dias.</p>
              </div>
            </div>
            <div className="timeline__item reveal-up">
              <div className="timeline__dot"></div>
              <div className="timeline__year">08 Abr 2026</div>
              <div className="timeline__card">
                <h3>O pedido de namoro</h3>
                <p>Conhecendo o meu sonho de ser pedida em namoro, o Lucas tornou esse desejo realidade. Foi o início de uma promessa que sabíamos vir do Céu.</p>
              </div>
            </div>
            <div className="timeline__item reveal-up">
              <div className="timeline__dot"></div>
              <div className="timeline__year">28 Mai 2026</div>
              <div className="timeline__card">
                <h3>O pedido de casamento</h3>
                <p>Da maneira mais linda que jamais imaginaria, o Lucas pediu-me em casamento. A cada dia tenho mais clareza: é ele, sempre foi ele.</p>
              </div>
            </div>
            <div className="timeline__item reveal-up">
              <div className="timeline__dot"></div>
              <div className="timeline__year">26 Set 2026</div>
              <div className="timeline__card timeline__card--highlight">
                <h3 style={{ color: '#a98c5b' }}>Para sempre</h3>
                <p>Chegou o momento de dizermos &ldquo;sim&rdquo; diante de Deus e de quem mais amamos. É o cumprimento de uma promessa.</p>
              </div>
            </div>
          </div>
          <p className="story__closing reveal-up">A nossa relação tem Deus como alicerce, e a nossa família nasce para honrar e glorificar o Senhor.</p>
        </div>
      </section>

      {/* 8. OUR SONG SECTION */}
      <section className="song" id="musica">
        <div className="song__overlay"></div>
        <div className="section-frame">
          <p className="overline reveal-up">Uma Confirmação Especial</p>
          <h2 className="script-title reveal-up">A Nossa Música</h2>
          <div className="song__card reveal-up">
            <div className="song__note flex justify-center text-gold mb-3">
              <Music className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <h3 className="song__title">Só Você</h3>
            <p className="song__artist">Anderson Freire</p>
            <p className="song__story">Íamos a caminho do Parque da Cidade com amigos, ouvindo músicas no aleatório, quando tocou <em>&ldquo;Só Você&rdquo;</em>. Naquele instante, o Espírito Santo trouxe-me à memória uma cena dos meus 16 anos.</p>
            <p className="song__story">Uma amiga apresentou-me essa canção e contou que sonhava casar-se ao som dela. Na época, o rapaz com quem ela namorava chamava-se <strong>Lucas Alves</strong>. Encantada pela música, eu disse que também gostaria de me casar ao som dela um dia.</p>
            <p className="song__story">Anos depois, ao ouvir novamente essa canção, percebi um detalhe que me deixou sem palavras: <strong>Lucas Alves</strong> também é o nome do meu noivo. Naquele momento, Deus trouxe aquela lembrança ao meu coração e confirmou algo que eu já vinha sentindo em oração: era ele.</p>
            <button
              className={`song__play ${isPlaying ? 'is-playing' : ''}`}
              onClick={toggleMusic}
              aria-label={isPlaying ? "Pausar música" : "Tocar música"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-ink" />
              ) : (
                <Play className="h-4 w-4 fill-ink" />
              )}
              <span className="song__play-text">
                {isPlaying ? 'A tocar a nossa música' : 'Tocar a nossa música'}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 9. PROPOSAL VIDEO */}
      <section className="proposal" id="pedido">
        <div className="section-frame">
          <p className="overline reveal-up">28 de Maio de 2026</p>
          <h2 className="script-title reveal-up">O Pedido</h2>
          <p className="proposal__intro reveal-up">
            Da maneira mais linda que jamais imaginaríamos, o Lucas contou a nossa história numa animação e pediu-me em casamento. Reviva connosco este momento. 💍
          </p>
          <div className="proposal__frame reveal-up">
            <div className="proposal__video">
              {!videoLoaded ? (
                <button
                  className="proposal__facade"
                  onClick={loadProposalVideo}
                  style={{ backgroundImage: `url(${WEDDING_CONFIG.videoCapaPath})` }}
                  aria-label="Reproduzir o vídeo do pedido"
                >
                  <span className="proposal__play"></span>
                </button>
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${WEDDING_CONFIG.youtubeVideoId}?rel=0&modestbranding=1&playsinline=1&autoplay=1`}
                  title="O pedido de casamento"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              )}
            </div>
          </div>
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

              <p className="pay-card__holder">
                Titular da Conta
                <strong>Lucas Alves &amp; Jaqueline S. Silva</strong>
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
        <GiftsModal isOpen={isGiftsModalOpen} onClose={() => setIsGiftsModalOpen(false)} />
      )}
    </>
  );
}

function GiftsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedGift, setSelectedGift] = useState<{ title: string, image: string } | null>(null);

  // States for the payment flow
  const [step, setStep] = useState<'list' | 'value' | 'checkout_eu' | 'qrcode'>('list');
  const [region, setRegion] = useState<'EU' | 'BR'>('EU');
  const [amount, setAmount] = useState<string>("");
  const [pixData, setPixData] = useState<{ emv: string, qrCodeUrl: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      const t = setTimeout(() => {
        setSelectedGift(null);
        setStep('list');
        setAmount("");
        setPixData(null);
        setErrorMsg("");
        setRegion('EU');
      }, 300);
      return () => clearTimeout(t);
    }
    return () => { document.body.style.overflow = 'unset'; };
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

  const handleSelectGift = (gift: { title: string, image: string }) => {
    setSelectedGift(gift);
    setStep('value');
    setRegion('EU');
    setAmount("");
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

        <div className="flex-1 p-6 md:p-8 text-center flex flex-col h-full relative overflow-hidden text-cream">
          {step === 'list' && (
            <div className="w-full flex flex-col h-full relative z-10 animate-fadeIn">
              <Gift className="w-10 h-10 text-gold mx-auto mb-4 drop-shadow-[0_0_12px_rgba(194,168,120,0.3)]" strokeWidth={1.5} />
              <h3 className="font-serif text-3xl text-ivory mb-2 font-medium">Lista de Presentes</h3>
              <p className="text-sm font-normal text-cream/70 leading-relaxed mb-6">
                O maior presente é a sua presença! Mas se desejar, selecione uma cota divertida abaixo para nos abençoar.
              </p>

              <div className="bg-white/[0.02] p-3 md:p-6 rounded-2xl border border-gold/10 backdrop-blur-sm grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 flex-1 overflow-y-auto w-full content-start scrollbar-thin scrollbar-thumb-gold/20">
                {gifts.map(gift => (
                  <div
                    key={gift.title}
                    className="p-4 rounded-xl group cursor-pointer border border-gold/10 hover:border-gold/40 transition-all bg-white/[0.02] hover:bg-white/[0.06] flex flex-col items-center justify-center text-center"
                    onClick={() => handleSelectGift(gift)}
                  >
                    <div className="w-14 h-14 rounded-full border border-gold/20 overflow-hidden transform group-hover:scale-110 transition-transform mb-2 group-hover:border-gold/50 shadow-md">
                      <img src={gift.image} alt={gift.title} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs md:text-sm font-serif font-semibold text-ivory group-hover:text-gold leading-tight px-1 transition-colors">{gift.title}</p>
                    <p className="text-[10px] md:text-[11px] min-h-[14px] text-gold/60 uppercase tracking-widest font-medium mt-1">Qualquer valor</p>
                  </div>
                ))}
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
                {/* Region Selector Tab */}
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

                {/* Currency Input Field */}
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

                {/* Suggestion Buttons */}
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

                {/* Action Button */}
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
                {/* MB Way Option Card */}
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

                {/* IBAN Option Card */}
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
                {/* QR Code Container */}
                <div className="w-44 h-44 md:w-52 md:h-52 bg-white rounded-2xl shadow-lg border border-gold/10 mb-6 p-4 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={pixData.qrCodeUrl}
                    alt="QR Code PIX"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Pix Copia e Cola */}
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
