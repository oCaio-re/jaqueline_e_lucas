'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Copy, Check, Calendar, MapPin, Menu, X, ChevronDown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { WEDDING_CONFIG } from '@/config/wedding';

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

  // RSVP Form state (basing on casamento Supabase search logic)
  const [rsvpStatus, setRsvpStatus] = useState<'idle' | 'loading' | 'found' | 'confirming' | 'success' | 'error'>('idle');
  const [rsvpError, setRsvpError] = useState('');
  const [hasConfirmed, setHasConfirmed] = useState(true);
  
  const [searchParams, setSearchParams] = useState({ nome: '', telefone: '' });
  
  const [guestId, setGuestId] = useState('');
  const [guestInvite, setGuestInvite] = useState('');
  const [guestMembers, setGuestMembers] = useState('');
  const [guestMessage, setGuestMessage] = useState('');

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
          audio.play().catch(() => {});
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
      audioRef.current.play().catch(() => {});
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
    } catch (_) {}
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
                <h3>Para sempre</h3>
                <p>Chegou o momento de dizermos &ldquo;sim&rdquo; diante de Deus e de quem mais amamos. É o cumprimento de uma promessa.</p>
              </div>
            </div>
          </div>
          <p className="story__closing reveal-up">A nossa relação tem Deus como alicerce. A nossa família é para a honra e glória do Senhor. 🤍</p>
        </div>
      </section>

      {/* 8. OUR SONG SECTION */}
      <section className="song" id="musica">
        <div className="song__overlay"></div>
        <div className="section-frame">
          <p className="overline reveal-up">O sinal do Céu</p>
          <h2 className="script-title reveal-up">A Nossa Música</h2>
          <div className="song__card reveal-up">
            <div className="song__note">♪</div>
            <h3 className="song__title">Só Você</h3>
            <p className="song__artist">Anderson Freire</p>
            <p className="song__story">Íamos a caminho do Parque da Cidade com amigos, ouvindo músicas no aleatório, quando tocou <em>&ldquo;Só Você&rdquo;</em>. Naquele instante, o Espírito Santo trouxe-me à memória uma cena dos meus 16 anos.</p>
            <p className="song__story">Uma amiga apresentou-me essa canção e contou que sonhava casar-se ao som dela. Na época, o rapaz com quem ela namorava chamava-se <strong>Lucas Alves</strong>. Encantada pela música, eu disse que também gostaria de me casar ao som dela um dia.</p>
            <p className="song__story">Anos depois, ao ouvir novamente essa canção, percebi um detalhe que me deixou sem palavras: <strong>Lucas Alves</strong> também é o nome do meu noivo. Naquele momento, Deus trouxe aquela lembrança ao meu coração e confirmou algo que eu já vinha sentindo em oração: era ele. 🤍</p>
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
              <div className="event-card__icon">💒</div>
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
              <div className="event-card__icon">🥂</div>
              <h3>Celebração</h3>
              <p className="event-card__time">13h30</p>
              <p className="event-card__place">Quinta de Marzovelos</p>
              <p className="event-card__addr text-xs pt-1">R. Qta de Baixo n.º 2 B, Viseu</p>
            </article>
          </div>
          <div className="event__actions reveal-up">
            <a 
              className="btn btn--solid inline-flex items-center gap-2" 
              href={getGoogleCalendarUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Calendar className="h-4 w-4" /> Google Agenda
            </a>
            <a 
              className="btn btn--solid inline-flex items-center gap-2" 
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
          <h2 className="script-title reveal-up">Presença &amp; Presentes</h2>
          <p className="gifts__intro reveal-up">
            A sua presença é, sem dúvida, o nosso maior presente. 🤍 Mas, se o seu coração desejar abençoar e ofertar nas nossas vidas, fá-lo-á com toda a liberdade — e com a nossa mais sincera gratidão.
          </p>
          <div className="gifts__methods">
            <div className="pay-card reveal-up">
              <div className="pay-card__icon">🏦</div>
              <p className="pay-card__label">Transferência · IBAN</p>
              <p className="pay-card__value" id="ibanValue">{WEDDING_CONFIG.iban}</p>
              <button 
                className="btn btn--solid btn--sm inline-flex items-center gap-2" 
                onClick={() => handleCopy('iban')}
              >
                {copiedType === 'iban' ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copiar IBAN
                  </>
                )}
              </button>
            </div>
            <div className="pay-card reveal-up">
              <div className="pay-card__icon">📱</div>
              <p className="pay-card__label">MB WAY</p>
              <p className="pay-card__value" id="mbwayValue">{WEDDING_CONFIG.mbway}</p>
              <button 
                className="btn btn--solid btn--sm inline-flex items-center gap-2" 
                onClick={() => handleCopy('mbway')}
              >
                {copiedType === 'mbway' ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copiar número
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="gifts__note reveal-up">Titular: Jaqueline &amp; Lucas</p>
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
          <p className="overline reveal-up">Boa pergunta</p>
          <h2 className="script-title reveal-up">Perguntas Frequentes</h2>

          <div className="dresscode reveal-up">
            <div className="dresscode__icon">👗 🤵</div>
            <div className="dresscode__body">
              <p className="dresscode__label">Dress Code</p>
              <h3 className="dresscode__title">Traje Formal · Cerimónia</h3>
              <p className="dresscode__text">
                Senhoras: vestido de cocktail ou comprido. Senhores: fato. Pedimos, com carinho, que reservem o <strong>branco</strong> para a noiva. 🤍
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
    </>
  );
}
