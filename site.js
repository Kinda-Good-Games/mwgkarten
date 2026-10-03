/* Page navigation */
function showPage(name) {
  const pageUrls = {
    home: 'index.html',
    news: 'news.html',
    cards: 'cards.html',
    tournament: 'tournament.html',
    spielen: 'spielen.html',
    trade: 'spielen.html',
    order: 'order.html'
  };
  window.location.href = pageUrls[name] || 'index.html';
}

function syncActiveNav() {
  const pageName = document.body?.dataset?.page;
  if (!pageName) return;

  document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
  const activeLink = document.getElementById(`nav-${pageName}`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

const DEFAULT_SITE_DATA = {
  contactEmail: 'abi2027.mwg@outlook.de',
  homepageCountdown: {
    enabled: false,
    eventName: 'Nächstes Karten-Event',
    eventDate: '2027-01-01T12:00:00+01:00',
    description: 'Die Zeit läuft.'
  },
  statusEffects: [
    { id: 'inspiration', name: 'Inspiration' },
    { id: 'erschopfung', name: 'Erschöpfung' }
  ],
  rarities: {
      Normal: { borderColor: '#64748b', glowColor: 'rgba(100, 116, 139, 0.22)' },
      Glitter: { borderColor: '#22c55e', glowColor: 'rgba(34, 197, 94, 0.22)' },
      Holo: { borderColor: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.24)' },
      Gold: { borderColor: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.28)' },
      'Full Art': { borderColor: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.28)' }
  },
    sets: [
      {
        name: 'Set 1: The beginnings',
        cards: [
          {
            path: 'cards/Beispiel.jpeg',
            name: 'Beispielkarte',
            rarity: 'Normal',
            type: 'Event'
          }
        ]
      },
      {
        name: 'Set 2: Electric Boogaloo',
        cards: [
          {
            path: 'cards/Beispiel.jpeg',
            name: 'Electric Test',
            rarity: 'Holo',
            type: 'Item'
          }
        ]
      }
    ],
    tournament: {
      view: false,
      upcoming: true,
      title: 'Turnier-Brackets',
      description: 'Hier siehst du die aktuellen Brackets, Stufen und Paarungen des Schulturniers.',
      prizes: [
        { places: '16-9', reward: '1 freies Booster-Pack', image: '' },
        { places: '8-5', reward: '2x Sammelheft', image: '' },
        { places: '4', reward: 'Kostenloses Bundle', image: '' },
        { places: '3', reward: '5 Booster + 1 Bundle', image: '' },
        { places: '2', reward: 'Kopfhörer', image: '' },
        { places: '1', reward: 'iPad', image: '' }
      ],
      stages: [
        {
          name: 'Vorrunde',
          status: 'Stage 1',
          description: 'Die ersten Begegnungen bestimmen, wer ins Halbfinale einzieht.',
          participants: ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta'],
          matches: [
            { label: 'Spiel 1', left: 'Team Alpha', right: 'Team Beta' },
            { label: 'Spiel 2', left: 'Team Gamma', right: 'Team Delta' }
          ]
        },
        {
          name: 'Halbfinale',
          status: 'Stage 2',
          description: 'Hier stehen die Sieger der Vorrunde.',
          participants: ['Sieger Spiel 1', 'Sieger Spiel 2'],
          matches: [
            { label: 'Match A', left: 'Sieger Spiel 1', right: 'Sieger Spiel 2' }
          ]
        },
        {
          name: 'Finale',
          status: 'Stage 3',
          description: 'Das letzte Duell um den Turniersieg.',
          participants: ['Finalist A', 'Finalist B'],
          matches: [
            { label: 'Finale', left: 'Finalist A', right: 'Finalist B' }
          ]
        }
      ]
    },
    products: [
      {
        id: 'booster-packs',
        name: 'Booster-Packs',
        description: 'Zufällige Kartenpakete mit einer gemischten Auswahl aus dem Set.',
        unitLabel: 'Booster-Pack(s)',
        price: 4.50,
        minQuantity: 1,
        maxQuantity: 50,
        defaultQuantity: 1
      }
    ]
  };

  let siteData = { ...DEFAULT_SITE_DATA };
  let siteDataLoaded = false;
  let orderQuantities = createEmptyQuantities(DEFAULT_SITE_DATA.products);
  const siteDataReady = loadSiteData();
  let homeCarouselCards = [];
  let homeCarouselIndex = 0;
  let homeCarouselTimer;
  let homepageCountdownTimer;
  const blogState = {
    loaded: false,
    posts: []
  };

  const BLOG_INDEX_PATH = 'blogs/index.json';

  const PLAY_STATE_STORAGE_KEY = 'mwgkarten.spielen-state';
  const PLAY_SCALE_MAX_EUR = 10000;

  function createDefaultTeacherState() {
    const effects = {};
    getStatusEffectDefinitions().forEach(effect => {
      effects[effect.id] = false;
    });

    return Array.from({ length: 5 }, (_, index) => ({
      name: `Lehrer ${index + 1}`,
      used: false,
      effects: { ...effects }
    }));
  }

  function getStatusEffectDefinitions() {
    const effects = Array.isArray(siteData?.statusEffects) ? siteData.statusEffects : DEFAULT_SITE_DATA.statusEffects;
    const seenIds = new Set();
    return effects.filter(effect => {
      const id = String(effect?.id || '');
      if (!effect || typeof effect !== 'object' || !id || seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    }).map(effect => ({
      id: String(effect.id),
      name: String(effect.name || effect.id)
    }));
  }

  function createDefaultTurnHistory(turnNumber) {
    return [{
      turnNumber: Number.isFinite(Number(turnNumber)) ? Math.max(1, Math.round(Number(turnNumber))) : 1,
      playerDeltas: [0, 0]
    }];
  }

  function createDefaultPlayState() {
    const players = [
      { name: 'Spieler 1', money: 0, amount: 1, teachers: createDefaultTeacherState() },
      { name: 'Spieler 2', money: 0, amount: 1, teachers: createDefaultTeacherState() }
    ];

    return {
      turnIndex: 0,
      turnNumber: 1,
      turnHistory: createDefaultTurnHistory(1),
      players
    };
  }

  function normalizeTeacherState(teachers) {
    const source = Array.isArray(teachers) ? teachers : [];
    return createDefaultTeacherState().map((defaultTeacher, index) => {
      const teacher = source[index] && typeof source[index] === 'object' ? source[index] : {};
      return {
        name: String(teacher.name || defaultTeacher.name),
        used: Boolean(teacher.used),
        effects: getStatusEffectDefinitions().reduce((effects, effect) => {
          effects[effect.id] = Boolean(teacher.effects?.[effect.id]);
          return effects;
        }, { ...defaultTeacher.effects })
      };
    });
  }

  function normalizePlayState(state) {
    const fallback = createDefaultPlayState();
    const source = state && typeof state === 'object' ? state : {};
    const players = Array.isArray(source.players) ? source.players : [];
    const sharedTeachers = Array.isArray(source.teachers) ? source.teachers : [];
    const turnHistorySource = Array.isArray(source.turnHistory) ? source.turnHistory : [];

    const normalizedPlayers = fallback.players.map((defaultPlayer, index) => {
      const player = players[index] && typeof players[index] === 'object' ? players[index] : {};
      const moneyValue = Number(player.money);
      const amountValue = Number(player.amount ?? player.step);
      const playerTeachers = Array.isArray(player.teachers) ? player.teachers : sharedTeachers;

      return {
        name: String(player.name || defaultPlayer.name),
        money: Number.isFinite(moneyValue) ? Math.max(0, Math.round(moneyValue * 100) / 100) : defaultPlayer.money,
        amount: Number.isFinite(amountValue) ? Math.max(1, Math.round(amountValue)) : defaultPlayer.amount,
        teachers: normalizeTeacherState(playerTeachers)
      };
    });

    const normalizedTurnHistory = turnHistorySource.length > 0
      ? turnHistorySource.map((entry, index) => {
          const turnNumber = Number(entry?.turnNumber);
          const deltas = Array.isArray(entry?.playerDeltas) ? entry.playerDeltas : [];
          return {
            turnNumber: Number.isFinite(turnNumber) ? Math.max(1, Math.round(turnNumber)) : index + 1,
            playerDeltas: [0, 1].map(playerIndex => {
              const deltaValue = Number(deltas[playerIndex]);
              return Number.isFinite(deltaValue) ? Math.round(deltaValue * 100) / 100 : 0;
            })
          };
        })
      : createDefaultTurnHistory(Number.isFinite(Number(source.turnNumber)) ? Number(source.turnNumber) : 1);

    return {
      turnIndex: Number.isFinite(Number(source.turnIndex)) ? Math.abs(Number(source.turnIndex)) % fallback.players.length : fallback.turnIndex,
      turnNumber: Number.isFinite(Number(source.turnNumber))
        ? Math.max(1, Math.round(Number(source.turnNumber)))
        : (normalizedTurnHistory[normalizedTurnHistory.length - 1]?.turnNumber || 1),
      turnHistory: normalizedTurnHistory,
      players: normalizedPlayers
    };
  }

  function loadSpielenState() {
    try {
      const rawState = window.localStorage.getItem(PLAY_STATE_STORAGE_KEY);
      return normalizePlayState(rawState ? JSON.parse(rawState) : null);
    } catch (_) {
      return createDefaultPlayState();
    }
  }

  function saveSpielenState() {
    try {
      window.localStorage.setItem(PLAY_STATE_STORAGE_KEY, JSON.stringify(playState));
    } catch (_) {
      // Ignore storage failures and keep the helper usable.
    }
  }

  function getSpielenScale() {
    return PLAY_SCALE_MAX_EUR;
  }

  function getCurrentSpielenTurnEntry() {
    if (!Array.isArray(playState.turnHistory) || playState.turnHistory.length === 0) {
      playState.turnHistory = createDefaultTurnHistory(playState.turnNumber || 1);
    }

    const currentEntry = playState.turnHistory[playState.turnHistory.length - 1];
    if (!currentEntry || currentEntry.turnNumber !== playState.turnNumber) {
      playState.turnHistory.push({
        turnNumber: playState.turnNumber || 1,
        playerDeltas: [0, 0]
      });
    }

    return playState.turnHistory[playState.turnHistory.length - 1];
  }

  function formatSignedMoney(value) {
    const amount = Math.round((Number(value) || 0) * 100) / 100;
    const absoluteAmount = formatMoney(Math.abs(amount));
    if (amount > 0) return `+${absoluteAmount}`;
    if (amount < 0) return `-${absoluteAmount}`;
    return formatMoney(0);
  }

  function recordSpielenTurnDelta(playerIndex, deltaAmount) {
    const currentEntry = getCurrentSpielenTurnEntry();
    const nextValue = (Number(currentEntry.playerDeltas[playerIndex]) || 0) + deltaAmount;
    currentEntry.playerDeltas[playerIndex] = Math.round(nextValue * 100) / 100;
  }

  function advanceSpielenTurn() {
    playState.turnIndex = (playState.turnIndex + 1) % playState.players.length;
    playState.turnNumber = (Number(playState.turnNumber) || 1) + 1;
    playState.turnHistory.push({
      turnNumber: playState.turnNumber,
      playerDeltas: [0, 0]
    });
  }

  function renderSpielenSummary() {
    const panel = document.getElementById('spielenSummaryPanel');
    const list = document.getElementById('spielenSummaryList');
    const totals = document.getElementById('spielenSummaryTotals');
    if (!panel || !list) return;

    const currentTurnNumber = Number(playState.turnNumber) || 1;
    const playerNames = playState.players.map((player, index) => player.name || `Spieler ${index + 1}`);
    const history = Array.isArray(playState.turnHistory) ? playState.turnHistory : [];
    const currentBalances = playState.players.map(player => Math.round((Number(player.money) || 0) * 100) / 100);
    const currentTotalBalance = currentBalances.reduce((sum, value) => sum + value, 0);

    if (totals) {
      totals.innerHTML = `
        <div class="spielen-summary-total-card">
          <span class="spielen-summary-total-label">Aktueller Gesamtstand</span>
          <strong>${formatMoney(currentTotalBalance)}</strong>
        </div>
        ${playerNames.map((name, index) => `
          <div class="spielen-summary-total-card">
            <span class="spielen-summary-total-label">${escapeHtml(name)}</span>
            <strong>${formatMoney(currentBalances[index] || 0)}</strong>
          </div>
        `).join('')}
      `;
    }

    const balancesAfterHistory = [0, 0];

    list.innerHTML = history.map(entry => {
      const isCurrent = entry.turnNumber === currentTurnNumber;
      const deltas = Array.isArray(entry.playerDeltas) ? entry.playerDeltas : [0, 0];
      balancesAfterHistory[0] += Number(deltas[0]) || 0;
      balancesAfterHistory[1] += Number(deltas[1]) || 0;
      const balanceSnapshot = balancesAfterHistory.map(value => Math.max(0, Math.round(value * 100) / 100));
      return `
        <article class="spielen-summary-turn${isCurrent ? ' is-current' : ''}">
          <div class="spielen-summary-turn-head">
            <div>
              <div class="spielen-summary-turn-kicker">Zug ${entry.turnNumber}</div>
              <div class="spielen-summary-turn-title">${isCurrent ? 'Aktueller Zug' : 'Abgeschlossener Zug'}</div>
            </div>
          </div>
          <div class="spielen-summary-turn-grid">
            ${playerNames.map((name, playerIndex) => {
              const delta = Number(deltas[playerIndex]) || 0;
              const deltaClass = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
              return `
                <div class="spielen-summary-turn-item">
                  <div class="spielen-summary-turn-item-main">
                    <span class="spielen-summary-turn-name">${escapeHtml(name)}</span>
                    <span class="spielen-summary-turn-balance">Stand: ${formatMoney(balanceSnapshot[playerIndex] || 0)}</span>
                  </div>
                  <span class="spielen-summary-turn-delta ${deltaClass}">${formatSignedMoney(delta)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </article>
      `;
    }).join('');

    panel.dataset.rendered = 'true';
  }

  function openSpielenSummary() {
    const panel = document.getElementById('spielenSummaryPanel');
    const button = document.getElementById('spielenSummaryButton');
    if (!panel) return;

    panel.hidden = false;
    panel.style.display = 'grid';
    panel.setAttribute('aria-hidden', 'false');
    renderSpielenSummary();

    if (button) {
      button.textContent = 'Spielzusammenfassung verbergen';
    }
  }

  function closeSpielenSummary() {
    const panel = document.getElementById('spielenSummaryPanel');
    const button = document.getElementById('spielenSummaryButton');
    if (!panel) return;

    panel.hidden = true;
    panel.style.display = 'none';
    panel.setAttribute('aria-hidden', 'true');

    if (button) {
      button.textContent = 'Spielzusammenfassung anzeigen';
    }
  }

  function toggleSpielenSummary() {
    const panel = document.getElementById('spielenSummaryPanel');
    if (!panel) return;

    if (panel.hidden) {
      openSpielenSummary();
    } else {
      closeSpielenSummary();
    }
  }

  let spielenSummaryModalBound = false;

  function setupSpielenSummaryModal() {
    if (spielenSummaryModalBound) return;

    const panel = document.getElementById('spielenSummaryPanel');
    const dialog = panel?.querySelector('.spielen-summary-dialog');
    const closeButton = document.getElementById('spielenSummaryClose');

    if (!panel || !dialog || !closeButton) return;

    closeButton.addEventListener('click', closeSpielenSummary);
    panel.addEventListener('click', event => {
      if (event.target === panel) {
        closeSpielenSummary();
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !panel.hidden) {
        closeSpielenSummary();
      }
    });

    spielenSummaryModalBound = true;
  }

  let playState = loadSpielenState();

  function normalizeRarities(rarities) {
    const defaults = DEFAULT_SITE_DATA.rarities;
    const source = rarities && typeof rarities === 'object' ? rarities : {};
    const normalized = {};

    Object.entries(defaults).forEach(([rarityName, fallbackConfig]) => {
      const config = source[rarityName] && typeof source[rarityName] === 'object' ? source[rarityName] : {};
      normalized[rarityName] = {
        borderColor: String(config.borderColor || fallbackConfig.borderColor),
        glowColor: String(config.glowColor || fallbackConfig.glowColor)
      };
    });

    Object.entries(source).forEach(([rarityName, config]) => {
      if (normalized[rarityName] || !config || typeof config !== 'object') return;
      normalized[rarityName] = {
        borderColor: String(config.borderColor || '#c9933a'),
        glowColor: String(config.glowColor || 'rgba(201, 147, 58, 0.22)')
      };
    });

    return normalized;
  }

  function normalizeTournament(tournament) {
    const source = tournament && typeof tournament === 'object' ? tournament : {};
    const defaultTournament = DEFAULT_SITE_DATA.tournament;
    const stageSource = Array.isArray(source.stages) && source.stages.length > 0 ? source.stages : defaultTournament.stages;

    function normalizeMatch(match, matchIndex) {
      const statusValue = String(match.status || match.state || '').trim().toLowerCase();
      const winnerValue = String(match.winner || match.winningTeam || '').trim();
      return {
        label: String(match.label || match.title || `Match ${matchIndex + 1}`),
        left: String(match.left || match.teamA || match.a || '').trim(),
        right: String(match.right || match.teamB || match.b || '').trim(),
        note: String(match.note || '').trim(),
        status: statusValue || (winnerValue ? 'done' : ''),
        winner: winnerValue
      };
    }

    return {
      view: typeof (source.view ?? defaultTournament.view) === 'string'
        ? (source.view ?? defaultTournament.view).toLowerCase() === 'true'
        : Boolean(source.view ?? defaultTournament.view),
      upcoming: Boolean(source.upcoming ?? defaultTournament.upcoming),
      title: String(source.title || defaultTournament.title),
      description: String(source.description || defaultTournament.description),
      prizes: Array.isArray(source.prizes) && source.prizes.length > 0
        ? source.prizes.filter(p => p && typeof p === 'object').map(p => ({
            places: String(p.places || p.place || ''),
            reward: String(p.reward || p.label || ''),
            image: String(p.image || p.img || '')
          }))
        : (Array.isArray(defaultTournament.prizes) ? defaultTournament.prizes : []),
      stages: stageSource
        .filter(stage => stage && typeof stage === 'object')
        .map((stage, stageIndex) => {
          const matches = Array.isArray(stage.matches) ? stage.matches : [];
          const participants = Array.isArray(stage.participants) ? stage.participants : [];
          return {
            name: String(stage.name || `Stage ${stageIndex + 1}`),
            status: String(stage.status || ''),
            description: String(stage.description || ''),
            participants: participants
              .map(participant => String(participant || '').trim())
              .filter(Boolean),
            matches: matches
              .filter(match => match && typeof match === 'object')
              .map((match, matchIndex) => normalizeMatch(match, matchIndex))
              .filter(match => match.left || match.right || match.winner)
          };
        })
        .filter(stage => stage.matches.length > 0 || stage.participants.length > 0)
    };
  }

  function formatTournamentStatusLabel(status) {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'next') return 'Next match';
    if (normalized === 'upcoming') return 'Coming later';
    if (normalized === 'done') return 'Done';
    return normalized;
  }

  async function loadSiteData() {
    try {
      const response = await fetch('data.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('data.json not available');
      const data = await response.json();
      siteData = {
        ...DEFAULT_SITE_DATA,
        ...data,
        rarities: normalizeRarities(data.rarities),
        statusEffects: normalizeStatusEffects(data.statusEffects),
        tournament: normalizeTournament(data.tournament),
        sets: normalizeSets(data.sets ?? data.cardFiles),
        products: normalizeProducts(data.products)
      };
      orderQuantities = mergeQuantities(orderQuantities, siteData.products);
    } catch (_) {
      siteData = {
        ...DEFAULT_SITE_DATA,
        rarities: normalizeRarities(DEFAULT_SITE_DATA.rarities),
        statusEffects: normalizeStatusEffects(DEFAULT_SITE_DATA.statusEffects),
        tournament: normalizeTournament(DEFAULT_SITE_DATA.tournament),
        sets: normalizeSets(DEFAULT_SITE_DATA.sets),
        products: normalizeProducts(DEFAULT_SITE_DATA.products)
      };
      orderQuantities = mergeQuantities(orderQuantities, siteData.products);
    } finally {
      siteDataLoaded = true;
      applySiteData();
      if (cardsLoaded) {
        renderCards(siteData.sets);
      }
    }
    return siteData;
  }

  function applySiteData() {
    const contactLink = document.getElementById('contactEmailLink');
    if (contactLink) {
      contactLink.href = `mailto:${siteData.contactEmail}`;
      contactLink.textContent = siteData.contactEmail;
    }
    renderOrderShelf();
    updateOrderSummary();
    renderHomeCarousel();
    renderHomeCardWhirl();
    renderHomepageCountdown();
  }

  function renderHomepageCountdown() {
    const countdown = document.getElementById('homepageCountdown');
    if (!countdown) return;

    clearInterval(homepageCountdownTimer);
    const settings = siteData.homepageCountdown;
    const eventDate = new Date(settings?.eventDate);
    if (!settings?.enabled || !settings.eventName || Number.isNaN(eventDate.getTime())) {
      countdown.hidden = true;
      return;
    }

    countdown.hidden = false;
    document.getElementById('homepageCountdownName').textContent = settings.eventName;
    document.getElementById('homepageCountdownDescription').textContent = settings.description || '';

    const updateCountdown = () => {
      const remainingSeconds = Math.max(0, Math.floor((eventDate.getTime() - Date.now()) / 1000));
      const days = Math.floor(remainingSeconds / 86400);
      const hours = Math.floor((remainingSeconds % 86400) / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;
      document.getElementById('homepageCountdownDays').textContent = String(days).padStart(2, '0');
      document.getElementById('homepageCountdownHours').textContent = String(hours).padStart(2, '0');
      document.getElementById('homepageCountdownMinutes').textContent = String(minutes).padStart(2, '0');
      document.getElementById('homepageCountdownSeconds').textContent = String(seconds).padStart(2, '0');
    };

    updateCountdown();
    homepageCountdownTimer = setInterval(updateCountdown, 1000);
  }

  function renderHomeCardWhirl() {
    const whirl = document.getElementById('homeCardWhirl');
    if (!whirl) return;

    const cards = siteData.sets.flatMap(set => set.cards).filter(card => card.path);
    whirl.innerHTML = '';
    if (cards.length === 0) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const rowCount = viewportWidth <= 680 ? 2 : viewportWidth >= 1000 || viewportHeight >= 760 ? 4 : 3;
    const rowStep = 100 / rowCount;
    const speedBase = Math.max(42, Math.min(78, 44 + viewportWidth / 48 + viewportHeight / 45));
    const rowGap = Math.max(4, Math.min(10, viewportWidth / 180));
    whirl.style.setProperty('--row-count', rowCount);

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const row = document.createElement('div');
      row.className = 'home-whirl-row';
      row.style.top = `${rowIndex * rowStep - 3}%`;
      row.style.gap = `${rowGap}px`;
      row.style.setProperty('--row-speed', `${Math.round(speedBase + rowIndex * 7)}s`);
      row.style.setProperty('--row-delay', `${rowIndex * -11}s`);

      const rowCards = Array.from({ length: 24 }, (_, index) => cards[(index + rowIndex * 2) % cards.length]);
      rowCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'home-whirl-card';
        cardElement.style.setProperty('--random-x', `${Math.round(Math.random() * 18 - 9)}px`);
        cardElement.style.setProperty('--random-y', `${Math.round(Math.random() * 34 - 17)}px`);
        cardElement.style.setProperty('--random-rotation', `${Math.round(Math.random() * 18 - 9)}deg`);
        cardElement.innerHTML = `<img src="${escapeHtml(card.path)}" alt="" loading="lazy" />`;
        row.appendChild(cardElement);
      });

      Array.from(row.children).forEach(cardElement => {
        row.appendChild(cardElement.cloneNode(true));
      });

      whirl.appendChild(row);
    }
  }

  function renderHomeCarousel() {
    const track = document.getElementById('homeCarouselTrack');
    const dots = document.getElementById('homeCarouselDots');
    if (!track || !dots) return;

    homeCarouselCards = siteData.sets.flatMap(set => set.cards.map(card => ({ ...card, setName: set.name })));
    track.innerHTML = '';
    dots.innerHTML = '';

    if (homeCarouselCards.length === 0) {
      track.innerHTML = '<p class="home-carousel-empty">Noch keine Karten vorhanden.</p>';
      return;
    }

    homeCarouselIndex = Math.min(homeCarouselIndex, homeCarouselCards.length - 1);
    homeCarouselCards.forEach((card, index) => {
      const slide = document.createElement('article');
      slide.className = 'home-carousel-slide';
      slide.setAttribute('aria-label', `${index + 1} von ${homeCarouselCards.length}: ${card.name}`);
      slide.innerHTML = `
        <div class="home-carousel-image-wrap">
          <img src="${escapeHtml(card.path)}" alt="${escapeHtml(card.name)}" loading="${index === homeCarouselIndex ? 'eager' : 'lazy'}" />
        </div>
        <div class="home-carousel-card-info">
          <p class="home-carousel-card-set">${escapeHtml(card.setName)}</p>
          <h3>${escapeHtml(card.name)}</h3>
          <p><span>${escapeHtml(card.type || 'Karte')}</span><span>${escapeHtml(card.rarity || 'Normal')}</span></p>
        </div>`;
      track.appendChild(slide);

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'home-carousel-dot';
      dot.setAttribute('aria-label', `${card.name} anzeigen`);
      dot.addEventListener('click', () => setHomeCarousel(index));
      dots.appendChild(dot);
    });

    updateHomeCarousel();
    clearInterval(homeCarouselTimer);
    if (homeCarouselCards.length > 1) {
      homeCarouselTimer = setInterval(() => moveHomeCarousel(1), 5000);
    }
  }

  function updateHomeCarousel() {
    const track = document.getElementById('homeCarouselTrack');
    const dots = document.querySelectorAll('.home-carousel-dot');
    if (!track || homeCarouselCards.length === 0) return;
    const visibleCards = window.matchMedia('(max-width: 680px)').matches ? 2 : 3;
    const maxIndex = Math.max(0, homeCarouselCards.length - visibleCards);
    homeCarouselIndex = Math.min(homeCarouselIndex, maxIndex);
    track.style.transform = `translateX(-${homeCarouselIndex * (100 / visibleCards)}%)`;
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === homeCarouselIndex);
      dot.setAttribute('aria-current', index === homeCarouselIndex ? 'true' : 'false');
    });
  }

  function setHomeCarousel(index) {
    if (homeCarouselCards.length === 0) return;
    homeCarouselIndex = (index + homeCarouselCards.length) % homeCarouselCards.length;
    updateHomeCarousel();
  }

  function moveHomeCarousel(direction) {
    setHomeCarousel(homeCarouselIndex + direction);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeStatusEffects(statusEffects) {
    const source = Array.isArray(statusEffects) ? statusEffects : DEFAULT_SITE_DATA.statusEffects;
    return source
      .filter(effect => effect && typeof effect === 'object' && effect.id)
      .map(effect => ({
        id: String(effect.id).trim(),
        name: String(effect.name || effect.id).trim()
      }))
      .filter(effect => effect.id && effect.name);
  }

  function formatBlogDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function markdownToHtml(markdown) {
    const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let paragraph = [];
    let listItems = [];
    let listType = null;
    let codeLines = [];
    let inCode = false;

    function flushParagraph() {
      if (!paragraph.length) return;
      blocks.push(`<p>${paragraph.join(' ')}</p>`);
      paragraph = [];
    }

    function flushList() {
      if (!listItems.length) return;
      const tag = listType === 'ol' ? 'ol' : 'ul';
      blocks.push(`<${tag}>${listItems.map(item => `<li>${item}</li>`).join('')}</${tag}>`);
      listItems = [];
      listType = null;
    }

    function flushCode() {
      if (!codeLines.length) return;
      blocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      codeLines = [];
    }

    function inline(text) {
      return escapeHtml(text)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    }

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      if (line.startsWith('```')) {
        if (inCode) {
          inCode = false;
          flushCode();
        } else {
          flushParagraph();
          flushList();
          inCode = true;
        }
        continue;
      }

      if (inCode) {
        codeLines.push(rawLine);
        continue;
      }

      if (!line.trim()) {
        flushParagraph();
        flushList();
        continue;
      }

      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        const level = heading[1].length;
        blocks.push(`<h${level}>${inline(heading[2])}</h${level}>`);
        continue;
      }

      const unordered = line.match(/^[-*]\s+(.+)$/);
      const ordered = line.match(/^\d+\.\s+(.+)$/);
      if (unordered || ordered) {
        flushParagraph();
        const nextType = unordered ? 'ul' : 'ol';
        if (listType && listType !== nextType) flushList();
        listType = nextType;
        listItems.push(inline((unordered || ordered)[1]));
        continue;
      }

      if (line.startsWith('> ')) {
        flushParagraph();
        flushList();
        blocks.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
        continue;
      }

      paragraph.push(inline(line));
    }

    flushParagraph();
    flushList();
    if (inCode) flushCode();

    return blocks.join('');
  }

  async function loadBlogIndex() {
    const response = await fetch(BLOG_INDEX_PATH, { cache: 'no-store' });
    if (!response.ok) throw new Error('blogs/index.json not available');
    const data = await response.json();
    const entries = Array.isArray(data) ? data : Array.isArray(data.posts) ? data.posts : [];
    return entries
      .filter(item => item && typeof item === 'object')
      .map((item, index) => ({
        id: String(item.id || item.slug || `post-${index + 1}`),
        file: String(item.file || item.path || ''),
        title: String(item.title || item.name || `News ${index + 1}`),
        date: String(item.date || ''),
        excerpt: String(item.excerpt || ''),
        order: Number.isFinite(Number(item.order)) ? Number(item.order) : index
      }))
      .filter(item => item.file);
  }

  async function loadNews() {
    const grid = document.getElementById('newsGrid');
    const empty = document.getElementById('newsEmpty');
    const teaser = document.getElementById('homeNewsTeaserSummary');

    if (!grid && !teaser) return;

    if (grid && !blogState.loaded) {
      grid.innerHTML = `
        <div class="news-article">
          <div class="news-article-header">
              <div class="news-post-kicker">Lädt ...</div>
            <div class="news-article-meta">Bitte warten</div>
          </div>
          <div class="news-post-excerpt">Die News werden gerade aus dem Ordner <code>blogs/</code> geladen.</div>
        </div>`;
    }

    try {
      if (!blogState.loaded) {
        const index = await loadBlogIndex();
        const posts = await Promise.all(index.map(async post => {
          const response = await fetch(`blogs/${post.file}`, { cache: 'no-store' });
          if (!response.ok) throw new Error(`Unable to load ${post.file}`);
          const markdown = await response.text();
          const firstHeading = (markdown.match(/^#\s+(.+)$/m) || [])[1];
          const title = post.title || firstHeading || post.file.replace(/\.[^.]+$/, '');
          return {
            ...post,
            title,
            html: markdownToHtml(markdown),
            dateLabel: formatBlogDate(post.date)
          };
        }));

        blogState.posts = posts.sort((left, right) => left.order - right.order);
        blogState.loaded = true;
      }

      const posts = blogState.posts;

      if (teaser) {
        if (posts.length > 0) {
          const latest = posts[0];
          teaser.innerHTML = `<strong>${escapeHtml(latest.title)}</strong>${latest.dateLabel ? ` ${escapeHtml(latest.dateLabel)}` : ''}<br>${escapeHtml(latest.excerpt || 'Neue Meldung im Blog-Stil.')} `;
        } else {
          teaser.textContent = 'Noch keine News-Beiträge vorhanden.';
        }
      }

      if (grid) {
        if (posts.length === 0) {
          grid.innerHTML = '';
          if (empty) empty.style.display = 'block';
          return;
        }

        if (empty) empty.style.display = 'none';
        grid.innerHTML = posts.map(post => `
          <article class="news-article">
            <div class="news-article-header">
              <div>
                <div class="news-post-kicker">${escapeHtml(post.file.replace(/\.[^.]+$/, ''))}</div>
                <h3 class="news-article-title">${escapeHtml(post.title)}</h3>
              </div>
              <div class="news-article-meta">${escapeHtml(post.dateLabel || '')}</div>
            </div>
            ${post.excerpt ? `<div class="news-post-excerpt">${escapeHtml(post.excerpt)}</div>` : ''}
            <div class="news-article-body">${post.html}</div>
          </article>
        `).join('');
        renderNewsMath(grid);
      }
    } catch (error) {
      blogState.loaded = true;
      blogState.posts = [];
      if (grid) grid.innerHTML = '';
      if (empty) {
        empty.style.display = 'block';
        empty.innerHTML = `
          <div class="big-icon">?</div>
          <p>News konnten nicht geladen werden</p>
          <small>Pr++fe <code>blogs/index.json</code> und die dort gelisteten Markdown-Dateien.</small>`;
      }
      if (teaser) {
        teaser.textContent = 'News konnten nicht geladen werden.';
      }
    }
  }

  function renderNewsMath(container) {
    if (!container || typeof window.renderMathInElement !== 'function') return;

    try {
      window.renderMathInElement(container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false,
        errorColor: '#e8bf72'
      });
    } catch (_) {
      // If KaTeX fails to parse a formula, keep the raw text visible.
    }
  }

  function buildTournamentGraph(tournament) {
    const stages = Array.isArray(tournament?.stages) ? tournament.stages : [];
    if (!stages.length) return '';

    const nodeWidth = 200;
    const nodeHeight = 102;
    const columnGap = 220;
    const leafGap = 104;
    const paddingX = 40;
    const paddingY = 44;
    const labelY = 18;
    const roundPositions = [];

    stages.forEach((stage, stageIndex) => {
      const matchCount = Array.isArray(stage.matches) ? stage.matches.length : 0;
      if (stageIndex === 0) {
        roundPositions[stageIndex] = Array.from({ length: matchCount }, (_, matchIndex) => (
          paddingY + matchIndex * leafGap
        ));
        return;
      }

      const previousRound = roundPositions[stageIndex - 1] || [];
      roundPositions[stageIndex] = Array.from({ length: matchCount }, (_, matchIndex) => {
        const left = previousRound[matchIndex * 2];
        const right = previousRound[matchIndex * 2 + 1];
        if (Number.isFinite(left) && Number.isFinite(right)) {
          return (left + right) / 2;
        }
        if (Number.isFinite(left)) {
          return left;
        }
        if (Number.isFinite(right)) {
          return right;
        }
        return paddingY + matchIndex * leafGap * Math.pow(0.5, stageIndex);
      });
    });

    const lastStage = stages.length - 1;
    const svgWidth = paddingX * 2 + lastStage * columnGap + nodeWidth;
    const leafCount = roundPositions[0].length || 1;
    const svgHeight = paddingY * 2 + (leafCount - 1) * leafGap + nodeHeight;

    const connectorPaths = [];
    stages.forEach((stage, stageIndex) => {
      if (stageIndex >= lastStage) return;

      const currentRound = roundPositions[stageIndex] || [];
      const nextRound = roundPositions[stageIndex + 1] || [];
      const sourceX = paddingX + stageIndex * columnGap + nodeWidth;
      const targetX = paddingX + (stageIndex + 1) * columnGap;

      currentRound.forEach((sourceY, sourceIndex) => {
        const targetIndex = Math.floor(sourceIndex / 2);
        const targetY = nextRound[targetIndex];
        if (!Number.isFinite(sourceY) || !Number.isFinite(targetY)) return;

        const sourceCenterY = sourceY + nodeHeight / 2;
        const targetCenterY = targetY + nodeHeight / 2;
        const midX = sourceX + (targetX - sourceX) / 2;
        const path = `M ${sourceX} ${sourceCenterY} H ${midX} V ${targetCenterY} H ${targetX}`;
        connectorPaths.push(`<path class="tournament-graph-link tournament-graph-link--glow" d="${path}"/>`);
        connectorPaths.push(`<path class="tournament-graph-link" d="${path}"/>`);
      });
    });

    const nodes = stages.map((stage, stageIndex) => {
      const stageX = paddingX + stageIndex * columnGap;
      const stageNodes = Array.isArray(stage.matches) ? stage.matches : [];
      const stageLabel = escapeHtml(stage.status || stage.name || `Stage ${stageIndex + 1}`);

      return `
        <g class="tournament-graph-stage">
          <text class="tournament-graph-stage-label" x="${stageX}" y="${labelY}">${stageLabel}</text>
          ${stageNodes.map((match, matchIndex) => {
            const y = roundPositions[stageIndex]?.[matchIndex];
            if (!Number.isFinite(y)) return '';
            const isFinal = stageIndex === lastStage;
            const title = escapeHtml(match.label || `Match ${matchIndex + 1}`);
            const left = escapeHtml(match.left || 'TBD');
            const right = escapeHtml(match.right || 'TBD');
            const status = String(match.status || '').toLowerCase();
            const winner = String(match.winner || '').trim();
            const footerText = winner
              ? `Gewinner: ${escapeHtml(winner)}`
              : status
                ? formatTournamentStatusLabel(status)
                : '';
            const nodeClass = [
              'tournament-graph-node',
              isFinal ? 'tournament-graph-node--final' : '',
              status ? `tournament-graph-node--${status}` : ''
            ].filter(Boolean).join(' ');
            return `
              <g class="${nodeClass}" transform="translate(${stageX}, ${y})">
                <rect rx="12" ry="12" width="${nodeWidth}" height="${nodeHeight}"/>
                ${status ? `<text class="tournament-graph-node-status" x="${nodeWidth - 14}" y="20" text-anchor="end">${escapeHtml(formatTournamentStatusLabel(status))}</text>` : ''}
                <text class="tournament-graph-node-title" x="14" y="24">${title}</text>
                <text class="tournament-graph-node-subtitle" x="14" y="48">${left}</text>
                <text class="tournament-graph-node-subtitle" x="14" y="66">${right}</text>
                ${footerText ? `<text class="tournament-graph-node-footer" x="14" y="90">${footerText}</text>` : ''}
              </g>
            `;
          }).join('')}
        </g>
      `;
    }).join('');

    return `
      <div class="tournament-graphic">
        <div class="tournament-graph-viewport">
          <svg class="tournament-graph" viewBox="0 0 ${svgWidth} ${svgHeight}" role="img" aria-label="Turnier-Bracket mit Siegerpfaden">
            <g class="tournament-graph-tracks">
              ${connectorPaths.join('')}
            </g>
            ${nodes}
          </svg>
        </div>
      </div>
    `;
  }

  function normalizeProducts(products) {
    const source = Array.isArray(products) && products.length > 0 ? products : DEFAULT_SITE_DATA.products;
    const normalized = source
      .filter(product => product && typeof product === 'object')
      .map((product, index) => {
        const minQuantity = Number.isFinite(Number(product.minQuantity)) ? Math.max(1, Number(product.minQuantity)) : 1;
        const maxQuantity = Number.isFinite(Number(product.maxQuantity)) ? Math.max(minQuantity, Number(product.maxQuantity)) : 50;
        const defaultQuantity = Number.isFinite(Number(product.defaultQuantity)) ? Number(product.defaultQuantity) : minQuantity;
        return {
          id: String(product.id || `product-${index + 1}`),
          name: String(product.name || `Produkt ${index + 1}`),
          description: String(product.description || 'Ein bestellbares Produkt aus dem MWG-Sortiment.'),
          unitLabel: String(product.unitLabel || 'St++ck'),
          price: Number.isFinite(Number(product.price)) ? Math.max(0, Number(product.price)) : 0,
          minQuantity,
          maxQuantity,
          defaultQuantity: Math.min(maxQuantity, Math.max(minQuantity, defaultQuantity))
        };
      });
    return normalized.length > 0 ? normalized : DEFAULT_SITE_DATA.products;
  }

  function createEmptyQuantities(products) {
    return Object.fromEntries((products || []).map(product => [product.id, 0]));
  }

  function mergeQuantities(existingQuantities, products) {
    const merged = createEmptyQuantities(products);
    for (const [productId, quantity] of Object.entries(existingQuantities || {})) {
      if (Object.prototype.hasOwnProperty.call(merged, productId)) {
        merged[productId] = Math.max(0, Number(quantity) || 0);
      }
    }
    return merged;
  }

  function getProductQuantity(productId) {
    return Math.max(0, Number(orderQuantities[productId]) || 0);
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
 }

  function getProductCost(productId) {
    const product = siteData.products.find(item => item.id === productId);
    if (!product) return 0;
    return getProductQuantity(productId) * (Number(product.price) || 0);
  }

  function updateProductQuantity(productId, delta) {
    const product = siteData.products.find(item => item.id === productId);
    if (!product) return;

    const nextQuantity = Math.max(0, Math.min(product.maxQuantity, getProductQuantity(productId) + delta));
    orderQuantities = {
      ...orderQuantities,
      [productId]: nextQuantity
    };
    renderOrderShelf();
    updateOrderSummary();
  }

  function renderOrderShelf() {
    const shelf = document.getElementById('productShelf');
    if (!shelf) return;

    shelf.innerHTML = siteData.products.map(product => {
      const quantity = getProductQuantity(product.id);
      const unitPrice = Number(product.price) || 0;
      const selectedClass = quantity > 0 ? ' selected' : '';
      return `
        <article class="product-card${selectedClass}" data-product-id="${product.id}">
          <div class="product-card-top">
            <div>
              <div class="product-card-name">${product.name}</div>
              <div class="product-card-description">${product.description}</div>
            </div>
            <div class="product-card-badge">${product.unitLabel}</div>
          </div>
          <div class="product-card-meta">Maximal ${product.maxQuantity} - Erste Auswahl setzt direkt auf ${product.defaultQuantity}.</div>
                    <div class="product-card-meta">
          <div class="product-card-price">Preis: ${formatMoney(unitPrice)} pro ${product.unitLabel}</div>
          <div class="product-card-footer">
            <div class="quantity-pill" aria-label="Menge f++r ${product.name}">
              <button type="button" aria-label="${product.name} reduzieren" onclick="updateProductQuantity('${product.id}', -1)">-</button>
              <span id="quantity-${product.id}">${quantity}</span>
              <button type="button" aria-label="${product.name} erhöhen" onclick="updateProductQuantity('${product.id}', 1)">+</button>
            </div>
            <div class="order-note-inline">${quantity > 0 ? `${quantity} ausgewählt` : 'Noch nicht ausgewählt'}</div>
          </div>
        </article>
      `;
    }).join('');
  }

  function getSelectedOrderItems() {
    return siteData.products
      .map(product => ({ product, quantity: getProductQuantity(product.id) }))
      .filter(item => item.quantity > 0);
  }

  function updateOrderSummary() {
    const selectedItems = getSelectedOrderItems();
    const summary = document.getElementById('selectedItems');
    const count = document.getElementById('selectedSummaryCount');
    const totalQuantity = document.getElementById('selectedTotalQuantity');
    const totalCost = document.getElementById('selectedTotalCost');
    const hint = document.getElementById('orderShelfHint');
    const orderTotal = selectedItems.reduce((sum, item) => sum + getProductCost(item.product.id), 0);

    if (count) {
      count.textContent = `${selectedItems.length} Produkt${selectedItems.length === 1 ? '' : 'e'} ausgewählt`;
    }

    if (totalQuantity) {
      totalQuantity.textContent = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    if (totalCost) {
      totalCost.textContent = formatMoney(orderTotal);
    }

    if (hint) {
      hint.textContent = selectedItems.length > 0
        ? `${selectedItems.length} Produkt${selectedItems.length === 1 ? '' : 'e'} in der Auswahl`
        : 'Noch keine Produkte ausgewählt.';
    }

    if (!summary) return;

    if (selectedItems.length === 0) {
      summary.className = 'selected-items empty';
      summary.textContent = 'Wähle oben mindestens ein Produkt aus, dann erscheint hier deine Bestellung.';
      return;
    }

    summary.className = 'selected-items';
    summary.innerHTML = selectedItems.map(({ product, quantity }) => `
      <div class="selected-item">
        <div>
          <strong>${product.name}</strong>
          <span>${product.unitLabel}</span>
        </div>
        <div class="selected-item-count">${quantity}</div>
      </div>
    `).join('');
  }
  /* Card gallery */
  /*
    HOW TO ADD CARDS:
    Group cards into sets in data.json under `sets`.
    Each set needs a `name` and a `cards` array.
    Each card can define `path`, `name`, `rarity`, and `type`.

    Products can be configured in data.json under products.
    Each product should include id, name, description, unitLabel, minQuantity, maxQuantity, and defaultQuantity.

    The filename (without extension) is used as a fallback card name.
  */
  let cardsLoaded = false;
  const CARD_COLLECTION_STORAGE_KEY = 'mwgkarten.card-collection-state';
  const CARD_TYPE_OPTIONS = ['Lehrkraft', 'Item', 'Sabotage', 'Raum', 'Event'];
  let cardCollectionState = loadCardCollectionState();

  function loadCardCollectionState() {
    try {
      const rawState = window.localStorage.getItem(CARD_COLLECTION_STORAGE_KEY);
      const parsed = rawState ? JSON.parse(rawState) : {};
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

      const normalized = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (!value || typeof value !== 'object') return;
        normalized[key] = {
          owned: Boolean(value.owned),
          favorite: Boolean(value.favorite)
        };
      });
      return normalized;
    } catch (_) {
      return {};
    }
  }

  function saveCardCollectionState() {
    try {
      window.localStorage.setItem(CARD_COLLECTION_STORAGE_KEY, JSON.stringify(cardCollectionState));
    } catch (_) {
      // Ignore storage failures to keep gallery interactions available.
    }
  }

  function getCardCollectionKey(card, setName) {
    const safeSet = String(setName || 'set').trim().toLowerCase();
    const safePath = String(card?.path || '').trim().toLowerCase();
    const safeName = String(card?.name || '').trim().toLowerCase();
    return `${safeSet}::${safePath}::${safeName}`;
  }

  function getCardCollectionStatus(card, setName) {
    const key = getCardCollectionKey(card, setName);
    const current = cardCollectionState[key] || {};
    return {
      key,
      owned: current.owned === true,
      favorite: current.favorite === true
    };
  }

  function toggleCardOwned(cardKey) {
    const current = cardCollectionState[cardKey] || { owned: false, favorite: false };
    const nextOwned = !current.owned;
    cardCollectionState[cardKey] = {
      owned: nextOwned,
      favorite: Boolean(current.favorite)
    };
    saveCardCollectionState();
    renderCards(siteData.sets);
  }

  function toggleCardFavorite(cardKey) {
    const current = cardCollectionState[cardKey] || { owned: false, favorite: false };
    cardCollectionState[cardKey] = {
      owned: Boolean(current.owned),
      favorite: !current.favorite
    };
    saveCardCollectionState();
    renderCards(siteData.sets);
  }

  function normalizeCardType(value) {
    const raw = String(value || '').trim();
    if (!raw) return 'Event';

    const directMatch = CARD_TYPE_OPTIONS.find(type => type === raw);
    if (directMatch) return directMatch;

    const lower = raw.toLowerCase();
    const fuzzyMatch = CARD_TYPE_OPTIONS.find(type => type.toLowerCase() === lower);
    return fuzzyMatch || 'Event';
  }

  function normalizeCardEntry(entry, index) {
    if (typeof entry === 'string') {
      return {
        path: entry,
        rarity: 'Normal',
        type: 'Event',
        name: prettyName(entry),
        order: index
      };
    }

    if (entry && typeof entry === 'object') {
      const path = String(entry.path || entry.file || entry.src || '');
      return {
        path,
        rarity: String(entry.rarity || 'Normal'),
        type: normalizeCardType(entry.type || entry.cardType || entry.tag),
        name: String(entry.name || prettyName(path)),
        order: index
      };
    }

    return null;
  }

  function normalizeSet(entry, index) {
    if (!entry || typeof entry !== 'object') return null;

    const cards = Array.isArray(entry.cards) ? entry.cards : [];
    return {
      name: String(entry.name || `Set ${index + 1}`),
      description: String(entry.description || ''),
      cards: cards.map((card, cardIndex) => normalizeCardEntry(card, cardIndex)).filter(card => card && card.path)
    };
  }

  function normalizeSets(setsOrCards) {
    if (Array.isArray(setsOrCards) && setsOrCards.length > 0 && typeof setsOrCards[0] === 'object' && Array.isArray(setsOrCards[0].cards)) {
      return setsOrCards.map((set, index) => normalizeSet(set, index)).filter(Boolean);
    }

    if (Array.isArray(setsOrCards) && setsOrCards.length > 0) {
      return [
        {
          name: 'Set 1: The beginnings',
          description: '',
          cards: setsOrCards.map((entry, index) => normalizeCardEntry(entry, index)).filter(card => card && card.path)
        }
      ];
    }

    return DEFAULT_SITE_DATA.sets.map((set, index) => normalizeSet(set, index)).filter(Boolean);
  }

  function populateSetFilter(sets) {
    const select = document.getElementById('cardCollectionFilter');
    if (!select) return;

    const currentValue = select.value || 'all';
    const collections = (sets || []).map(set => set.name).filter(Boolean).sort((left, right) => left.localeCompare(right));

    select.innerHTML = '<option value="all">Alle Sets</option>' + collections.map(collection => `<option value="${collection}">${collection}</option>`).join('');

    if ([...select.options].some(option => option.value === currentValue)) {
      select.value = currentValue;
    } else {
      select.value = 'all';
    }
  }

  function populateTypeFilter(sets) {
    const select = document.getElementById('cardTypeFilter');
    if (!select) return;

    const currentValue = select.value || 'all';
    const availableTypes = new Set();
    (sets || []).forEach(set => {
      (set.cards || []).forEach(card => {
        availableTypes.add(normalizeCardType(card.type));
      });
    });

    const orderedTypes = CARD_TYPE_OPTIONS.filter(type => availableTypes.has(type));
    const extraTypes = [...availableTypes].filter(type => !CARD_TYPE_OPTIONS.includes(type)).sort((left, right) => left.localeCompare(right));
    const allTypes = [...orderedTypes, ...extraTypes];

    select.innerHTML = '<option value="all">Alle Typen</option>' + allTypes.map(type => `<option value="${type}">${type}</option>`).join('');

    if ([...select.options].some(option => option.value === currentValue)) {
      select.value = currentValue;
    } else {
      select.value = 'all';
    }
  }

  function loadCards() {
    if (cardsLoaded) return;
    cardsLoaded = true;
    populateSetFilter(siteData.sets);
    populateTypeFilter(siteData.sets);
    renderCards(siteData.sets);
  }

  function getRarityConfig(rarityName) {
    const key = String(rarityName || 'Normal');
    return siteData.rarities?.[key] || siteData.rarities?.Normal || DEFAULT_SITE_DATA.rarities.Normal;
  }

  function prettyName(path) {
    const base = path.split('/').pop();            // filename.ext
    const name = base.replace(/\.[^.]+$/, '');     // strip extension
    return name.replace(/[_-]/g, ' ')              // underscores -> spaces
               .replace(/\b\w/g, c => c.toUpperCase()); // Title Case
  }

  function renderCards(sets) {
    const grid = document.getElementById('cardsGrid');
    const placeholder = document.getElementById('cardsPlaceholder');
    const search = (document.getElementById('cardSearch')?.value || '').toLowerCase();
    const collectionFilter = document.getElementById('cardCollectionFilter')?.value || 'all';
    const typeFilter = document.getElementById('cardTypeFilter')?.value || 'all';
    const ownedOnly = Boolean(document.getElementById('cardOwnedOnlyFilter')?.checked);
    const favoriteOnly = Boolean(document.getElementById('cardFavoriteOnlyFilter')?.checked);
    const normalizedSets = normalizeSets(sets);
    populateSetFilter(normalizedSets);
    populateTypeFilter(normalizedSets);
    grid.innerHTML = '';

    if (normalizedSets.length === 0) {
      placeholder.style.display = 'block';
      placeholder.innerHTML = `
        <div class="big-icon">??</div>
        <p>Noch keine Karten vorhanden</p>
        <small>Lege Sets und Karten in <code>data.json</code> unter <code>sets</code> an.</small>`;
      return;
    }
    placeholder.style.display = 'none';

    const visibleSets = normalizedSets.filter(set => collectionFilter === 'all' || set.name === collectionFilter);

    visibleSets.forEach(set => {
      const matchingCards = set.cards.filter(card => {
        const cardStatus = getCardCollectionStatus(card, set.name);
        const rarity = (card.rarity || '').toLowerCase();
        const type = normalizeCardType(card.type);
        const matchesSearch = card.name.toLowerCase().includes(search) || rarity.includes(search) || type.toLowerCase().includes(search);
        const matchesType = typeFilter === 'all' || type === typeFilter;
        const matchesOwned = !ownedOnly || cardStatus.owned;
        const matchesFavorite = !favoriteOnly || cardStatus.favorite;
        return matchesSearch && matchesType && matchesOwned && matchesFavorite;
      });
      if (matchingCards.length === 0) return;

      const section = document.createElement('section');
      section.className = 'card-collection';

      const header = document.createElement('div');
      header.className = 'card-collection-header';
      header.innerHTML = `
        <div>
          <h3 class="card-collection-title">${set.name}</h3>
          ${set.description ? `<div class="card-collection-count" style="margin-top:.35rem;">${set.description}</div>` : ''}
        </div>
        <div class="card-collection-count">${matchingCards.length} Karte${matchingCards.length === 1 ? '' : 'n'}</div>
      `;

      const collectionGrid = document.createElement('div');
      collectionGrid.className = 'card-collection-grid';

      matchingCards.forEach((card, cardIndex) => {
        const rarityConfig = getRarityConfig(card.rarity);
        const cardStatus = getCardCollectionStatus(card, set.name);
        const item = document.createElement('div');
        item.className = 'card-item';
        item.dataset.name = card.name.toLowerCase();
        item.dataset.collection = set.name;
        item.dataset.rarity = card.rarity || 'Normal';
        item.dataset.type = card.type || 'Event';
        item.dataset.owned = cardStatus.owned ? 'true' : 'false';
        item.dataset.favorite = cardStatus.favorite ? 'true' : 'false';
        item.style.setProperty('--rarity-color', rarityConfig.borderColor);
        item.style.setProperty('--rarity-glow', rarityConfig.glowColor);
        item.innerHTML = `
          <img src="${card.path}" alt="${card.name}" loading="lazy" onerror="this.parentElement.style.display='none'"/>
          <div class="card-item-top-row">
            <span class="card-item-type-badge">${escapeHtml(card.type || 'Event')}</span>
            <div class="card-item-top-actions">
              <button type="button" class="card-item-owned-marker" data-action="owned" aria-pressed="${cardStatus.owned ? 'true' : 'false'}" title="Als erhalten markieren">${cardStatus.owned ? '✓' : '○'}</button>
              <button type="button" class="card-item-favorite-marker" data-action="favorite" aria-pressed="${cardStatus.favorite ? 'true' : 'false'}" title="Favorit markieren">${cardStatus.favorite ? '★' : '☆'}</button>
            </div>
          </div>
          <div class="card-item-label">
            <span class="card-item-name">${card.name}</span>
            <span class="card-item-rarity">${card.rarity || 'Normal'}</span>
          </div>`;

        const ownedToggle = item.querySelector('[data-action="owned"]');
        const favoriteToggle = item.querySelector('[data-action="favorite"]');

        if (ownedToggle) {
          ownedToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleCardOwned(cardStatus.key);
          });
        }

        if (favoriteToggle) {
          favoriteToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleCardFavorite(cardStatus.key);
          });
        }

        item.addEventListener('click', () => {
          openLightbox({
            src: card.path,
            name: card.name,
            rarity: card.rarity || 'Normal',
            type: card.type || 'Event',
            setName: set.name || 'Unbekanntes Set',
            indexLabel: `${cardIndex + 1} / ${matchingCards.length}`
          });
        });
        collectionGrid.appendChild(item);
      });

      section.appendChild(header);
      section.appendChild(collectionGrid);
      grid.appendChild(section);
    });

    if (!grid.children.length) {
      placeholder.style.display = 'block';
      placeholder.innerHTML = `
        <div class="big-icon">??</div>
        <p>Keine Karten gefunden</p>
        <small>Wähle ein anderes Set oder versuch einen anderen Suchbegriff.</small>`;
    }
  }

  function renderTournament() {
    const board = document.getElementById('tournamentBoard');
    const title = document.getElementById('tournamentTitle');
    const description = document.getElementById('tournamentDescription');
    const upcomingBanner = document.getElementById('tournamentUpcomingBanner');
    const tournament = siteData.tournament || normalizeTournament(DEFAULT_SITE_DATA.tournament);

    if (title) {
      title.textContent = tournament.title;
    }

    if (description) {
      description.textContent = tournament.description;
    }

    if (upcomingBanner) {
      upcomingBanner.style.display = tournament.upcoming ? 'block' : 'none';
      upcomingBanner.textContent = tournament.upcoming ? 'Coming soon' : '';
    }

    if (!board) return;

    if (!tournament.view) {
      board.innerHTML = `
        <div class="tournament-placeholder">
          <div class="tournament-placeholder-mark">✦</div>
          <h3>Coming soon...</h3>
          <p>Das Turnier wird bald hier angekündigt.</p>
        </div>`;
      return;
    }

    // Render prize ladder (if present)
    const prizeHtml = (Array.isArray(tournament.prizes) && tournament.prizes.length > 0)
      ? `
        <div class="tournament-prize-ladder">
          <div class="tournament-prize-title">Preise</div>
          <div class="tournament-prize-grid">
            ${tournament.prizes.map(prize => `
              <div class="tournament-prize-card">
                <div class="tournament-prize-place">${prize.places}</div>
                <div class="tournament-prize-reward">${prize.reward}</div>
                ${prize.image ? `<div style="margin-top:.6rem;text-align:center;z-index:1;"><img src="${prize.image}" alt="${prize.reward}" style="max-width:100%;height:72px;object-fit:contain;" onerror="this.style.display='none'"/></div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `
      : '';

    if (!tournament.stages.length) {
      board.innerHTML = `
        <div class="tournament-empty">
          <div class="big-icon">??</div>
          <p>Noch keine Turnierdaten</p>
          <small>Lege Stufen und Paarungen in <code>data.json</code> unter <code>tournament</code> an.</small>
        </div>${prizeHtml}`;
      return;
    }

    const bracketHtml = buildTournamentGraph(tournament);

    board.innerHTML = prizeHtml + bracketHtml + tournament.stages.map(stage => `
      <article class="tournament-stage">
        <div class="tournament-stage-header">
          <div>
            <div class="tournament-stage-kicker">${stage.status || 'Stage'}</div>
            <h3 class="tournament-stage-title">${stage.name}</h3>
          </div>
        </div>
        ${stage.description ? `<div class="tournament-stage-description">${stage.description}</div>` : ''}
        ${stage.participants.length ? `
          <div class="tournament-participants">
            ${stage.participants.map(participant => `<span class="tournament-participant">${participant}</span>`).join('')}
          </div>
        ` : ''}
        <div class="tournament-matches">
          ${stage.matches.map(match => `
            <div class="tournament-match${match.status ? ` tournament-match--${match.status}` : ''}">
              <div class="tournament-match-head">
                <div class="tournament-match-label">${match.label}</div>
                ${match.status ? `<div class="tournament-match-status">${escapeHtml(formatTournamentStatusLabel(match.status))}</div>` : ''}
              </div>
              <div class="tournament-match-teams">
                <div class="tournament-match-team"><span>${match.left}</span><span>oben</span></div>
                <div class="tournament-match-team"><span>${match.right}</span><span>unten</span></div>
              </div>
              ${match.winner ? `<div class="tournament-match-winner">Gewinner: <strong>${match.winner}</strong></div>` : ''}
              ${match.note ? `<div class="tournament-stage-description" style="margin-top:.55rem; position:relative; z-index:1;">${match.note}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </article>
    `).join('');
  }

  function renderSpielenPage() {
    const playerGrid = document.getElementById('spielenPlayerGrid');
    closeSpielenSummary();
    setupSpielenSummaryModal();

    if (playerGrid && playerGrid.dataset.rendered !== 'true') {
      playerGrid.innerHTML = playState.players.map((player, index) => `
        <article class="spielen-player-card${playState.turnIndex === index ? ' is-active' : ''}" id="spielen-player-card-${index}">
          <div class="spielen-player-head">
            <div>
              <div class="spielen-player-kicker">Spieler ${index + 1}</div>
              <label class="spielen-player-name-field" for="spielen-player-name-${index}">
                <span>Name</span>
                <input
                  id="spielen-player-name-${index}"
                  type="text"
                  value="${escapeHtml(player.name)}"
                  placeholder="Spieler ${index + 1}"
                  onchange="setSpielenPlayerName(${index}, this.value)"
                />
              </label>
            </div>
            <div class="spielen-player-turn" id="spielen-player-turn-${index}">${playState.turnIndex === index ? 'Am Zug' : 'Warten'}</div>
          </div>
          <div class="spielen-money-row">
            <div class="spielen-money-value" id="spielen-money-${index}">${formatMoney(player.money)}</div>
            <div class="spielen-money-caption">Kontostand</div>
          </div>
          <div class="spielen-progress-wrap">
            <div class="spielen-progress">
              <div class="spielen-progress-fill" id="spielen-progress-${index}"></div>
            </div>
            <div class="spielen-progress-caption" id="spielen-progress-caption-${index}"></div>
          </div>
          <div class="spielen-controls">
            <label class="spielen-control">
              <span>Betrag</span>
              <input
                id="spielen-amount-${index}"
                type="number"
                min="0"
                step="100"
                value="${escapeHtml(String(player.amount || 0))}"
                onchange="setSpielenAmount(${index}, this.value)"
              />
            </label>
            <div class="spielen-action-row">
              <button type="button" class="btn btn-primary spielen-action-button" onclick="adjustSpielenMoney(${index}, 1)"><font size=30>+</font></button>
              <button type="button" class="btn btn-outline spielen-action-button" onclick="adjustSpielenMoney(${index}, -1)"><font size=30>-</font></button>
            </div>
          </div>
          <div class="spielen-player-divider"></div>
          <div class="spielen-player-teachers">
            <div class="spielen-player-teachers-head">
              <div class="spielen-player-teachers-kicker">Lehrerstatus</div>
            </div>
            <div class="spielen-teachers-grid" id="spielen-teachers-${index}">
              ${renderSpielenTeacherCards(index)}
            </div>
          </div>
        </article>
      `).join('');
      playerGrid.dataset.rendered = 'true';
    }

    syncSpielenPage();
  }

  function renderSpielenTeacherCards(playerIndex) {
    const playerTeachers = playState.players[playerIndex]?.teachers || createDefaultTeacherState();
    return playerTeachers.map((teacher, teacherIndex) => `
      <article
        class="spielen-teacher-card${teacher.used ? ' is-used' : ''}"
        id="spielen-teacher-card-${playerIndex}-${teacherIndex}"
      >
        <span class="spielen-teacher-kicker">Lehrer ${teacherIndex + 1}</span>
        <span class="spielen-teacher-name">${escapeHtml(teacher.name)}</span>
        <span class="spielen-teacher-status" id="spielen-teacher-status-${playerIndex}-${teacherIndex}">${teacher.used ? 'Fähigkeit verfügbar' : 'Keine Fähigkeit verfügbar'}</span>
        <button type="button" class="spielen-teacher-ability-toggle" onclick="toggleTeacherAbility(${playerIndex}, ${teacherIndex})" aria-pressed="${teacher.used ? 'true' : 'false'}">
          Fähigkeit: <span class="spielen-teacher-toggle" id="spielen-teacher-toggle-${playerIndex}-${teacherIndex}">${teacher.used ? 'Aktiv' : 'Inaktiv'}</span>
        </button>
        <div class="spielen-status-effect-manager">
          <label class="spielen-status-effect-add">
            <span>Status-Effekt hinzufügen</span>
            <select onchange="addTeacherStatusEffect(${playerIndex}, ${teacherIndex}, this.value); this.value = ''">
              <option value="">Effekt auswählen</option>
              ${getStatusEffectDefinitions().filter(effect => !teacher.effects?.[effect.id]).map(effect => `
                <option value="${escapeHtml(effect.id)}">${escapeHtml(effect.name)}</option>
              `).join('')}
            </select>
          </label>
          <div class="spielen-status-effects" aria-label="Aktive Status-Effekte">
            ${getStatusEffectDefinitions().filter(effect => teacher.effects?.[effect.id]).map(effect => `
              <span class="spielen-status-effect">
                <strong>${escapeHtml(effect.name)}</strong>
                <button type="button" class="spielen-status-effect-remove" aria-label="${escapeHtml(effect.name)} entfernen" onclick="removeTeacherStatusEffect(${playerIndex}, ${teacherIndex}, '${escapeHtml(effect.id)}')">×</button>
              </span>
            `).join('') || '<span class="spielen-status-effects-empty">Keine aktiven Effekte</span>'}
          </div>
        </div>
      </article>
    `).join('');
  }

  function syncSpielenPage() {
    const turnName = document.getElementById('spielenTurnName');
    const turnHint = document.getElementById('spielenTurnHint');
    const turnBadge = document.getElementById('spielenTurnBadge');
    const totalEarned = document.getElementById('spielenTotalEarned');
    const progressScale = getSpielenScale();
    const totalMoney = playState.players.reduce((sum, player) => sum + (Number(player.money) || 0), 0);
    const activePlayerName = playState.players[playState.turnIndex]?.name || `Spieler ${playState.turnIndex + 1}`;

    if (turnName) {
      turnName.textContent = activePlayerName;
    }

    if (turnHint) {
      const nextIndex = (playState.turnIndex + 1) % playState.players.length;
      const nextPlayerName = playState.players[nextIndex]?.name || `Spieler ${nextIndex + 1}`;
      turnHint.textContent = `Als Nächstes: ${nextPlayerName}`;
    }

    if (turnBadge) {
      turnBadge.textContent = `Spieler ${playState.turnIndex + 1} am Zug`;
    }

    const currentTurnLabel = document.getElementById('spielenCurrentTurn');
    if (currentTurnLabel) {
      currentTurnLabel.textContent = `Zug ${playState.turnNumber || 1}`;
    }

    if (totalEarned) {
      totalEarned.textContent = formatMoney(totalMoney);
    }

    playState.players.forEach((player, index) => {
      const isActive = index === playState.turnIndex;
      const card = document.getElementById(`spielen-player-card-${index}`);
      const turnMarker = document.getElementById(`spielen-player-turn-${index}`);
      const moneyValue = document.getElementById(`spielen-money-${index}`);
      const progressFill = document.getElementById(`spielen-progress-${index}`);
      const progressCaption = document.getElementById(`spielen-progress-caption-${index}`);
      const amountInput = document.getElementById(`spielen-amount-${index}`);
      const percent = progressScale > 0 ? Math.min(100, Math.max(0, (Number(player.money) || 0) / progressScale * 100)) : 0;

      if (card) {
        card.classList.toggle('is-active', isActive);
      }

      if (turnMarker) {
        turnMarker.textContent = isActive ? 'Am Zug' : 'Warten';
      }

      if (moneyValue) {
        moneyValue.textContent = formatMoney(player.money);
      }

      if (progressFill) {
        progressFill.style.width = `${percent}%`;
      }

      if (progressCaption) {
        progressCaption.textContent = `Ziel: ${formatMoney(progressScale)}`;
      }

      if (amountInput && document.activeElement !== amountInput) {
        amountInput.value = String(player.amount || 1);
      }

      const nameInput = document.getElementById(`spielen-player-name-${index}`);
      if (nameInput && document.activeElement !== nameInput) {
        nameInput.value = player.name;
      }
    });

    playState.players.forEach((player, playerIndex) => {
      const playerTeachers = Array.isArray(player.teachers) ? player.teachers : [];

      playerTeachers.forEach((teacher, teacherIndex) => {
        const card = document.getElementById(`spielen-teacher-card-${playerIndex}-${teacherIndex}`);
        const status = document.getElementById(`spielen-teacher-status-${playerIndex}-${teacherIndex}`);
        const toggle = document.getElementById(`spielen-teacher-toggle-${playerIndex}-${teacherIndex}`);

        if (card) {
          card.classList.toggle('is-used', teacher.used);
        }

        if (status) {
          status.textContent = teacher.used ? 'Fähigkeit verfügbar' : 'Keine Fähigkeit verfügbar';
        }

        if (toggle) {
          toggle.textContent = teacher.used ? 'Aktiv' : 'Inaktiv';
        }

      });
    });

    const summaryPanel = document.getElementById('spielenSummaryPanel');
    if (summaryPanel && !summaryPanel.hidden) {
      renderSpielenSummary();
    }
  }

  function getSpielenAdjustAmount(index) {
    const input = document.getElementById(`spielen-amount-${index}`);
    const fallbackAmount = playState.players[index]?.amount || 1;
    const amount = Number(input?.value ?? fallbackAmount);
    return Number.isFinite(amount) && amount > 0 ? Math.max(1, Math.round(amount)) : fallbackAmount;
  }

  function setSpielenPlayerName(index, value) {
    playState.players[index].name = String(value || '').trim() || `Spieler ${index + 1}`;
    saveSpielenState();
    syncSpielenPage();
  }

  function setSpielenAmount(index, value) {
    const amount = Number(value);
    playState.players[index].amount = Number.isFinite(amount) && amount > 0 ? Math.max(1, Math.round(amount)) : 1;
    saveSpielenState();
    syncSpielenPage();
  }

  function adjustSpielenMoney(index, direction) {
    const amount = getSpielenAdjustAmount(index);
    const delta = direction * amount;
    playState.players[index].money = Math.max(0, Math.round(((Number(playState.players[index].money) || 0) + delta) * 100) / 100);
    recordSpielenTurnDelta(index, delta);
    saveSpielenState();
    syncSpielenPage();
  }

  function switchSpielenTurn() {
    advanceSpielenTurn();
    saveSpielenState();
    syncSpielenPage();
  }

  function toggleTeacherAbility(playerIndex, teacherIndex) {
    playState.players[playerIndex].teachers[teacherIndex].used = !playState.players[playerIndex].teachers[teacherIndex].used;
    saveSpielenState();
    syncSpielenPage();
  }

  function refreshSpielenTeacherCards(playerIndex) {
    const grid = document.getElementById(`spielen-teachers-${playerIndex}`);
    if (!grid) return;
    grid.innerHTML = renderSpielenTeacherCards(playerIndex);
  }

  function addTeacherStatusEffect(playerIndex, teacherIndex, effectId) {
    const teacher = playState.players[playerIndex]?.teachers?.[teacherIndex];
    if (!teacher || !effectId) return;
    teacher.effects = teacher.effects || {};
    teacher.effects[String(effectId)] = true;
    saveSpielenState();
    refreshSpielenTeacherCards(playerIndex);
    syncSpielenPage();
  }

  function removeTeacherStatusEffect(playerIndex, teacherIndex, effectId) {
    const teacher = playState.players[playerIndex]?.teachers?.[teacherIndex];
    if (!teacher || !effectId) return;
    teacher.effects = teacher.effects || {};
    teacher.effects[String(effectId)] = false;
    saveSpielenState();
    refreshSpielenTeacherCards(playerIndex);
    syncSpielenPage();
  }

  function resetSpielenState() {
    const confirmed = window.confirm('Willst du wirklich den aktuellen Spielstand zurücksetzen?');
    if (!confirmed) return;

    playState = createDefaultPlayState();
    saveSpielenState();
    syncSpielenPage();
  }

  function setCardFilterMenuOpen(isOpen) {
    const menu = document.getElementById('cardFilterMenu');
    const toggle = document.getElementById('cardFilterToggle');
    if (!menu || !toggle) return;

    menu.hidden = !isOpen;
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.textContent = isOpen ? 'Filter ausblenden' : 'Filter anzeigen';
  }

  function toggleCardFilterMenu() {
    const menu = document.getElementById('cardFilterMenu');
    if (!menu) return;
    setCardFilterMenuOpen(menu.hidden);
  }

  function filterCards() {
    renderCards(siteData.sets);
  }
  /* Lightbox */
  function openLightbox(cardData) {
    const lightbox = document.getElementById('lightbox');
    const image = document.getElementById('lightboxImg');
    if (!lightbox || !image || !cardData || typeof cardData !== 'object') return;

    const cardName = String(cardData.name || 'Unbekannte Karte');
    const rarity = String(cardData.rarity || 'Normal');
    const type = normalizeCardType(cardData.type);
    const setName = String(cardData.setName || 'Unbekanntes Set');
    const indexLabel = String(cardData.indexLabel || '-');
    const src = String(cardData.src || '');

    image.src = src;
    image.alt = cardName;

    const title = document.getElementById('lightboxTitle');
    const rarityBadge = document.getElementById('lightboxRarity');
    const setField = document.getElementById('lightboxSet');
    const typeField = document.getElementById('lightboxType');
    const indexField = document.getElementById('lightboxIndex');
    const rarityConfig = getRarityConfig(rarity);

    if (title) title.textContent = cardName;
    if (rarityBadge) {
      rarityBadge.textContent = rarity;
      rarityBadge.style.setProperty('--rarity-color', rarityConfig.borderColor);
      rarityBadge.style.setProperty('--rarity-glow', rarityConfig.glowColor);
    }
    if (setField) setField.textContent = setName;
    if (typeField) typeField.textContent = type;
    if (indexField) indexField.textContent = indexLabel;

    lightbox.classList.add('open');
  }

  function closeLightbox(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    if (!e) {
      lightbox.classList.remove('open');
      return;
    }

    if (e.target === lightbox) {
      lightbox.classList.remove('open');
    }
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  function getOrderEmailEndpoint() {
    return `https://formsubmit.co/ajax/${encodeURIComponent(siteData.contactEmail)}`;
  }

  /* Order form - direct email submission */
  async function submitOrder(e) {
    e.preventDefault();
    const name    = document.getElementById('orderName').value.trim();
    const cls     = document.getElementById('orderClass').value.trim(); 
    const note    = document.getElementById('orderNote').value.trim();
    const items   = getSelectedOrderItems();
    const total   = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalCost = items.reduce((sum, item) => sum + getProductCost(item.product.id), 0);
    const status  = document.getElementById('formStatus');
    const btn     = document.getElementById('submitBtn');

    if (!name || !cls) {
      status.className = 'form-status error';
      status.textContent = 'Bitte fülle alle Pflichtfelder aus.';
      return;
    }

    if (items.length === 0) {
      status.className = 'form-status error';
      status.textContent = 'Bitte wähle mindestens ein Produkt mit Menge größer 0 aus.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sende Reservierung';
    status.className = 'form-status';
    status.style.display = 'block';
    status.style.background = 'rgba(201,147,58,.15)';
    status.style.border = '1px solid rgba(201,147,58,.3)';
    status.style.color = 'var(--gold-pale)';
    status.textContent = 'Deine Reservierung wird direkt verschickt.';

    try {
      const payload = new FormData();
      payload.append('Name', name);
      payload.append('Klasse', cls); 
      payload.append('Gesamtmenge', String(total));
      payload.append('Gesamtkosten', formatMoney(totalCost));
      payload.append('Artikelanzahl', String(items.length));
      payload.append('Anmerkung', note || '-');
      items.forEach((item, index) => {
        payload.append(`Produkt ${index + 1}`, item.product.name);
        payload.append(`Produkt ${index + 1} - ID`, item.product.id);
        payload.append(`Produkt ${index + 1} - Menge`, `${item.quantity} ${item.product.unitLabel}`);
        payload.append(`Produkt ${index + 1} - Einzelpreis`, formatMoney(Number(item.product.price) || 0));
        payload.append(`Produkt ${index + 1} - Gesamtpreis`, formatMoney(getProductCost(item.product.id)));
      });
      payload.append('Warenkorb', items.map(item => `${item.quantity}x ${item.product.name}`).join(', '));
      payload.append('_subject', `[MWG Karten] Bestellung von ${name}`);
      payload.append('_template', 'table');
      payload.append('_captcha', 'false'); 

      const response = await fetch(getOrderEmailEndpoint(), {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: payload
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message || 'Die Bestellung konnte nicht gesendet werden.');
      }

      status.className = 'form-status success';
      status.innerHTML = `
        <strong>Gesendet!</strong> Deine Auswahl wurde direkt verschickt. <br>Vielen Dank für deine Bestellung! </br>
        Deine Artikel kannst du dann einfach in der Schule beim nächsten Verkauf abholen.
      `;

      e.target.reset();
      orderQuantities = createEmptyQuantities(siteData.products);
      renderOrderShelf();
      updateOrderSummary();
    } catch (error) {
      status.className = 'form-status error';
      status.textContent = error.message || 'Beim Senden ist ein Fehler aufgetreten.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Auswahl absenden';
    }
  }

  syncActiveNav();

  siteDataReady.then(() => {
    loadNews();
    const pageCardsEl = document.getElementById('page-cards');
    if (pageCardsEl && pageCardsEl.classList.contains('visible')) {
      renderCards(siteData.sets);
    }
    const pageTournamentEl = document.getElementById('page-tournament');
    if (pageTournamentEl && pageTournamentEl.classList.contains('visible')) {
      renderTournament();
    }
    const pageOrderEl = document.getElementById('page-order');
    if (pageOrderEl && pageOrderEl.classList.contains('visible')) {
      renderOrderShelf();
      updateOrderSummary();
    }
    const pageSpielenEl = document.getElementById('page-spielen');
    if (pageSpielenEl && pageSpielenEl.classList.contains('visible')) {
      renderSpielenPage();
    }
  });