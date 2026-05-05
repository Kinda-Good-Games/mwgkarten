/* ÔöÇÔöÇ Page navigation ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */
  function showPage(name) {
    const pageUrls = {
      home: 'index.html',
      news: 'news.html',
      cards: 'cards.html',
      tournament: 'tournament.html',
      order: 'order.html'
    };
    window.location.href = pageUrls[name] || 'index.html';
  }

  const DEFAULT_SITE_DATA = {
    contactEmail: 'abi2027.mwg@outlook.de',
    rarities: {
      Common: { borderColor: '#64748b', glowColor: 'rgba(100, 116, 139, 0.22)' },
      Uncommon: { borderColor: '#22c55e', glowColor: 'rgba(34, 197, 94, 0.22)' },
      Rare: { borderColor: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.24)' },
      Epic: { borderColor: '#a855f7', glowColor: 'rgba(168, 85, 247, 0.26)' },
      Legendary: { borderColor: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.28)' }
    },
    sets: [
      {
        name: 'Set 1: The beginnings',
        cards: [
          {
            path: 'cards/Beispiel.jpeg',
            name: 'Beispielkarte',
            rarity: 'Common'
          }
        ]
      },
      {
        name: 'Set 2: Electric Boogaloo',
        cards: [
          {
            path: 'cards/Beispiel.jpeg',
            name: 'Electric Test',
            rarity: 'Rare'
          }
        ]
      }
    ],
    tournament: {
      upcoming: true,
      title: 'Turnier-Brackets',
      description: 'Hier siehst du die aktuellen Brackets, Stufen und Paarungen des Schulturniers.',
      prizes: [
        { places: '16-9', reward: '1 freies Booster-Pack', image: '' },
        { places: '8-5', reward: '2x Sammelheft', image: '' },
        { places: '4', reward: 'Kostenloses Bundle', image: '' },
        { places: '3', reward: '5 Booster + 1 Bundle', image: '' },
        { places: '2', reward: 'Kopfh├Ârer', image: '' },
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
        description: 'Zuf├ñllige Kartenpakete mit einer gemischten Auswahl aus dem Set.',
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
  const blogState = {
    loaded: false,
    posts: []
  };

  const BLOG_INDEX_PATH = 'blogs/index.json';

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
        tournament: normalizeTournament(data.tournament),
        sets: normalizeSets(data.sets ?? data.cardFiles),
        products: normalizeProducts(data.products)
      };
      orderQuantities = mergeQuantities(orderQuantities, siteData.products);
    } catch (_) {
      siteData = {
        ...DEFAULT_SITE_DATA,
        rarities: normalizeRarities(DEFAULT_SITE_DATA.rarities),
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
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
            <div class="news-post-kicker">L├ñdt ÔÇª</div>
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
          teaser.innerHTML = `<strong>${escapeHtml(latest.title)}</strong>${latest.dateLabel ? ` ┬À ${escapeHtml(latest.dateLabel)}` : ''}<br>${escapeHtml(latest.excerpt || 'Neue Meldung im Blog-Stil.')} `;
        } else {
          teaser.textContent = 'Noch keine News-Beitr├ñge vorhanden.';
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
          <div class="big-icon">­ƒô░</div>
          <p>News konnten nicht geladen werden</p>
          <small>Pr├╝fe <code>blogs/index.json</code> und die dort gelisteten Markdown-Dateien.</small>`;
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
          unitLabel: String(product.unitLabel || 'St├╝ck'),
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
      currency: 'EUR'
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
          <div class="product-card-meta">Maximal ${product.maxQuantity} ┬À Erste Auswahl setzt direkt auf ${product.defaultQuantity}</div>
          <div class="product-card-price">Preis: ${formatMoney(unitPrice)} pro ${product.unitLabel}</div>
          <div class="product-card-footer">
            <div class="quantity-pill" aria-label="Menge f├╝r ${product.name}">
              <button type="button" aria-label="${product.name} reduzieren" onclick="updateProductQuantity('${product.id}', -1)">ÔêÆ</button>
              <span id="quantity-${product.id}">${quantity}</span>
              <button type="button" aria-label="${product.name} erh├Âhen" onclick="updateProductQuantity('${product.id}', 1)">+</button>
            </div>
            <div class="order-note-inline">${quantity > 0 ? `${quantity} ausgew├ñhlt` : 'Noch nicht ausgew├ñhlt'}</div>
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
      count.textContent = `${selectedItems.length} Produkt${selectedItems.length === 1 ? '' : 'e'} ausgew├ñhlt`;
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
        : 'Noch keine Produkte ausgew├ñhlt.';
    }

    if (!summary) return;

    if (selectedItems.length === 0) {
      summary.className = 'selected-items empty';
      summary.textContent = 'W├ñhle oben mindestens ein Produkt aus, dann erscheint hier deine Bestellung.';
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

  /* ÔöÇÔöÇ Card gallery ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */
  /*
    HOW TO ADD CARDS:
    Group cards into sets in data.json under `sets`.
    Each set needs a `name` and a `cards` array.
    Each card can define `path`, `name`, and `rarity`.

    Products can be configured in data.json under products.
    Each product should include id, name, description, unitLabel, minQuantity, maxQuantity, and defaultQuantity.

    The filename (without extension) is used as a fallback card name.
  */
  let cardsLoaded = false;

  function normalizeCardEntry(entry, index) {
    if (typeof entry === 'string') {
      return {
        path: entry,
        rarity: 'Common',
        name: prettyName(entry),
        order: index
      };
    }

    if (entry && typeof entry === 'object') {
      const path = String(entry.path || entry.file || entry.src || '');
      return {
        path,
        rarity: String(entry.rarity || 'Common'),
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

  function loadCards() {
    if (cardsLoaded) return;
    cardsLoaded = true;
    populateSetFilter(siteData.sets);
    renderCards(siteData.sets);
  }

  function getRarityConfig(rarityName) {
    const key = String(rarityName || 'Common');
    return siteData.rarities?.[key] || siteData.rarities?.Common || DEFAULT_SITE_DATA.rarities.Common;
  }

  function prettyName(path) {
    const base = path.split('/').pop();            // filename.ext
    const name = base.replace(/\.[^.]+$/, '');     // strip extension
    return name.replace(/[_-]/g, ' ')              // underscores ÔåÆ spaces
               .replace(/\b\w/g, c => c.toUpperCase()); // Title Case
  }

  function renderCards(sets) {
    const grid = document.getElementById('cardsGrid');
    const placeholder = document.getElementById('cardsPlaceholder');
    const search = (document.getElementById('cardSearch')?.value || '').toLowerCase();
    const collectionFilter = document.getElementById('cardCollectionFilter')?.value || 'all';
    const normalizedSets = normalizeSets(sets);
    grid.innerHTML = '';

    if (normalizedSets.length === 0) {
      placeholder.style.display = 'block';
      placeholder.innerHTML = `
        <div class="big-icon">­ƒÄ┤</div>
        <p>Noch keine Karten vorhanden</p>
        <small>Lege Sets und Karten in <code>data.json</code> unter <code>sets</code> an.</small>`;
      return;
    }
    placeholder.style.display = 'none';

    const visibleSets = normalizedSets.filter(set => collectionFilter === 'all' || set.name === collectionFilter);

    visibleSets.forEach(set => {
      const matchingCards = set.cards.filter(card => {
        const rarity = (card.rarity || '').toLowerCase();
        return card.name.toLowerCase().includes(search) || rarity.includes(search);
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

      matchingCards.forEach(card => {
        const rarityConfig = getRarityConfig(card.rarity);
        const item = document.createElement('div');
        item.className = 'card-item';
        item.dataset.name = card.name.toLowerCase();
        item.dataset.collection = set.name;
        item.dataset.rarity = card.rarity || 'Common';
        item.style.setProperty('--rarity-color', rarityConfig.borderColor);
        item.style.setProperty('--rarity-glow', rarityConfig.glowColor);
        item.innerHTML = `
          <img src="${card.path}" alt="${card.name}" loading="lazy" onerror="this.parentElement.style.display='none'"/>
          <div class="card-item-label">
            <span class="card-item-name">${card.name}</span>
            <span class="card-item-rarity">${card.rarity || 'Common'}</span>
          </div>`;
        item.addEventListener('click', () => openLightbox(card.path, card.name));
        collectionGrid.appendChild(item);
      });

      section.appendChild(header);
      section.appendChild(collectionGrid);
      grid.appendChild(section);
    });

    if (!grid.children.length) {
      placeholder.style.display = 'block';
      placeholder.innerHTML = `
        <div class="big-icon">­ƒöì</div>
        <p>Keine Karten gefunden</p>
        <small>W├ñhle ein anderes Set oder versuch einen anderen Suchbegriff.</small>`;
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
          <div class="big-icon">­ƒÅå</div>
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

  function filterCards() {
    renderCards(siteData.sets);
  }

  /* ÔöÇÔöÇ Lightbox ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */
  function openLightbox(src, alt) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightboxImg').alt = alt;
    document.getElementById('lightbox').classList.add('open');
  }
  function closeLightbox(e) {
    if (!e || e.target !== document.getElementById('lightboxImg')) {
      document.getElementById('lightbox').classList.remove('open');
    }
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  function getOrderEmailEndpoint() {
    return `https://formsubmit.co/ajax/${encodeURIComponent(siteData.contactEmail)}`;
  }

  /* ÔöÇÔöÇ Order form ÔåÆ direct email submission ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */
  async function submitOrder(e) {
    e.preventDefault();
    const name    = document.getElementById('orderName').value.trim();
    const cls     = document.getElementById('orderClass').value.trim();
    const email   = document.getElementById('orderEmail').value.trim();
    const note    = document.getElementById('orderNote').value.trim();
    const items   = getSelectedOrderItems();
    const total   = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalCost = items.reduce((sum, item) => sum + getProductCost(item.product.id), 0);
    const status  = document.getElementById('formStatus');
    const btn     = document.getElementById('submitBtn');

    if (!name || !cls || !email) {
      status.className = 'form-status error';
      status.textContent = 'Bitte f├╝lle alle Pflichtfelder aus.';
      return;
    }

    if (items.length === 0) {
      status.className = 'form-status error';
      status.textContent = 'Bitte w├ñhle mindestens ein Produkt mit Menge gr├Â├ƒer 0 aus.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'ÔÅ│ Sende Reservierung ÔÇª';
    status.className = 'form-status';
    status.style.display = 'block';
    status.style.background = 'rgba(201,147,58,.15)';
    status.style.border = '1px solid rgba(201,147,58,.3)';
    status.style.color = 'var(--gold-pale)';
    status.textContent = 'Deine Reservierung wird direkt verschickt ÔÇª';

    try {
      const payload = new FormData();
      payload.append('Name', name);
      payload.append('Klasse', cls);
      payload.append('E-Mail', email);
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
        <strong>Gesendet!</strong> Deine Auswahl wurde direkt verschickt. <br>Vielen Dank f├╝r deine Bestellung! </br>
        Deine Artikel kannst du dann einfach in der Schule beim n├ñchsten Verkauf abholen.
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
      btn.textContent = '­ƒÄ┤ Auswahl absenden';
    }
  }

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
  });