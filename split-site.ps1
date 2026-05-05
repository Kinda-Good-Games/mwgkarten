$root = 'd:\Other_Projects\mwgkarten'
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$content = [System.IO.File]::ReadAllText((Join-Path $root 'index.html'), [System.Text.Encoding]::UTF8)

$style = [regex]::Match($content, '<style>(.*?)</style>', 'Singleline').Groups[1].Value.Trim()
$script = [regex]::Match($content, '<script>(.*?)</script>', 'Singleline').Groups[1].Value.Trim()
$nav = [regex]::Match($content, '<nav>.*?</nav>', 'Singleline').Value.Trim()
$footer = [regex]::Match($content, '<footer>.*?</footer>', 'Singleline').Value.Trim()

$sections = @{
  home = [regex]::Match($content, '<!-- ══ HOME PAGE.*?<!-- /home -->', 'Singleline').Value.Trim()
  cards = [regex]::Match($content, '<!-- ══ CARDS PAGE.*?<!-- /cards -->', 'Singleline').Value.Trim()
  news = [regex]::Match($content, '<!-- ══ NEWS PAGE.*?<!-- /news -->', 'Singleline').Value.Trim()
  order = [regex]::Match($content, '<!-- ══ ORDER PAGE.*?<!-- /order -->', 'Singleline').Value.Trim()
  tournament = [regex]::Match($content, '<!-- ══ TOURNAMENT PAGE.*?<!-- /tournament -->', 'Singleline').Value.Trim()
}

$showPagePattern = '(?s)function showPage\(name\) \{.*?\n  \}\n\n  const DEFAULT_SITE_DATA'
$showPageReplacement = @'
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

  const DEFAULT_SITE_DATA
'@
$script = [regex]::Replace($script, $showPagePattern, $showPageReplacement)

$startupPattern = '(?s)siteDataReady\.then\(\(\) => \{.*?\n  \}\);'
$startupReplacement = @'
siteDataReady.then(() => {
    const currentPage = document.body.dataset.page || 'home';
    if (currentPage === 'home') loadNews();
    if (currentPage === 'news') loadNews();
    if (currentPage === 'cards') loadCards();
    if (currentPage === 'tournament') renderTournament();
    if (currentPage === 'order') {
      renderOrderShelf();
      updateOrderSummary();
    }
  });
'@
$script = [regex]::Replace($script, $startupPattern, $startupReplacement)

 [System.IO.File]::WriteAllText((Join-Path $root 'site.css'), $style, $utf8NoBom)
 [System.IO.File]::WriteAllText((Join-Path $root 'site.js'), $script, $utf8NoBom)

function Get-NavHtml {
  param(
    [string]$NavTemplate,
    [string]$ActiveId
  )

  $navHtml = $NavTemplate -replace 'id="nav-home" class="active"', 'id="nav-home"'
  foreach ($id in @('nav-news', 'nav-cards', 'nav-tournament', 'nav-order')) {
    $pattern = 'id="' + [regex]::Escape($id) + '" class="active"'
    $navHtml = $navHtml -replace $pattern, ('id="' + $id + '"')
  }
  $navHtml = $navHtml -replace ('id="' + [regex]::Escape($ActiveId) + '"'), ('id="' + $ActiveId + '" class="active"')
  return $navHtml
}

$pages = @(
  @{ file = 'index.html'; title = 'Das MWG Sammelkarten-Spiel'; page = 'home'; active = 'nav-home'; section = $sections.home },
  @{ file = 'news.html'; title = 'News | Das MWG Sammelkarten-Spiel'; page = 'news'; active = 'nav-news'; section = $sections.news },
  @{ file = 'cards.html'; title = 'Alle Karten | Das MWG Sammelkarten-Spiel'; page = 'cards'; active = 'nav-cards'; section = $sections.cards },
  @{ file = 'tournament.html'; title = 'Turnier | Das MWG Sammelkarten-Spiel'; page = 'tournament'; active = 'nav-tournament'; section = $sections.tournament },
  @{ file = 'order.html'; title = 'Produkte bestellen | Das MWG Sammelkarten-Spiel'; page = 'order'; active = 'nav-order'; section = $sections.order }
)

foreach ($page in $pages) {
  $navHtml = Get-NavHtml -NavTemplate $nav -ActiveId $page.active
  $sectionHtml = $page.section
  if ($page.page -ne 'home') {
    $sectionHtml = $sectionHtml -replace '<div class="page" id="', '<div class="page visible" id="'
  }
  $html = @"
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>$($page.title)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="site.css" />
</head>
<body data-page="$($page.page)">
$navHtml
$sectionHtml
$footer
<script src="site.js"></script>
</body>
</html>
"@
  [System.IO.File]::WriteAllText((Join-Path $root $page.file), $html, $utf8NoBom)
}
