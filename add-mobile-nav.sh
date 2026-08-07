#!/usr/bin/env bash
set -e

echo "Adding mobile nav CSS..."
perl -0777 -i -pe '
s/(nav\.primary a\.active\{\s*\n\s*color:var\(--orange-bright\);\s*\n\s*border-color:var\(--line\);\s*\n\s*background:var\(--panel\);\s*\n\}\s*\n)/$1
\/* ---------- mobile nav toggle ---------- *\/
.nav-toggle\{
  display:none;
  flex:none;
  width:40px; height:34px;
  background:transparent;
  border:1px solid var\(--line\);
  padding:0;
  position:relative;
  cursor:pointer;
\}
.nav-toggle span\{
  position:absolute; left:9px; right:9px;
  height:2px; background:var\(--steel\);
  transition:transform .2s ease, opacity .2s ease;
\}
.nav-toggle span:nth-child\(1\)\{ top:11px; \}
.nav-toggle span:nth-child\(2\)\{ top:17px; \}
.nav-toggle span:nth-child\(3\)\{ top:23px; \}
.nav-toggle\[aria-expanded="true"\] span:nth-child\(1\)\{ transform:translateY\(6px\) rotate\(45deg\); \}
.nav-toggle\[aria-expanded="true"\] span:nth-child\(2\)\{ opacity:0; \}
.nav-toggle\[aria-expanded="true"\] span:nth-child\(3\)\{ transform:translateY\(-6px\) rotate\(-45deg\); \}
.nav-toggle:focus-visible\{ outline:2px solid var\(--yellow\); outline-offset:2px; \}

.nav-scrim\{
  display:none;
  position:fixed; inset:0;
  background:rgba\(0,0,0,.6\);
  z-index:55;
\}
.nav-scrim.open\{ display:block; \}

\@media \(max-width:860px\)\{
  .nav-toggle\{ display:block; \}
  nav.primary\{
    position:fixed;
    top:0; right:0;
    height:100vh;
    width:min\(78vw,320px\);
    margin:0;
    background:var\(--black\);
    border-left:1px solid var\(--line\);
    flex-direction:column;
    flex-wrap:nowrap;
    align-items:stretch;
    gap:0;
    padding:80px 20px 24px;
    transform:translateX\(100%\);
    transition:transform .25s ease;
    z-index:60;
    overflow-y:auto;
  \}
  nav.primary.open\{ transform:translateX\(0\); \}
  nav.primary a\{
    padding:14px 6px;
    border-bottom:1px solid var\(--line\);
    font-size:.82rem;
  \}
  nav.primary a:hover\{ background:transparent; border-color:var\(--line\); \}
  nav.primary a.cart-link\{
    margin-top:10px;
    justify-content:flex-start;
  \}
  body.nav-open\{ overflow:hidden; \}
\}
/s
' css/styles.css

echo "Creating js/nav.js..."
mkdir -p js
cat > js/nav.js << 'EOF'
// Mobile burger menu toggle for the primary nav.
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('nav.primary');
  var scrim = document.querySelector('.nav-scrim');
  if (!toggle || !nav) return;

  function openNav() {
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
    if (scrim) scrim.classList.add('open');
  }

  function closeNav() {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    if (scrim) scrim.classList.remove('open');
  }

  toggle.addEventListener('click', function () {
    if (nav.classList.contains('open')) {
      closeNav();
    } else {
      openNav();
    }
  });

  if (scrim) scrim.addEventListener('click', closeNav);

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 860 && nav.classList.contains('open')) closeNav();
  });
});
EOF

echo "Updating HTML files..."
for f in *.html; do
  # Insert burger button before <nav class="primary">
  perl -0777 -i -pe 's{(</a>\s*\n\s*<nav class="primary">)}{</a>\n    <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">\n      <span></span><span></span><span></span>\n    </button>\n    <nav class="primary">}s unless /nav-toggle/' "$f"

  # Insert scrim div before </header>
  perl -0777 -i -pe 's{(</nav>\s*\n\s*</div>\s*\n</header>)}{</nav>\n  </div>\n  <div class="nav-scrim"></div>\n</header>}s unless /nav-scrim/' "$f"

  # Add nav.js script tag
  if ! grep -q "js/nav.js" "$f"; then
    if grep -q 'js/cart.js' "$f"; then
      perl -0777 -i -pe 's{(<script src="js/cart\.js"></script>)}{$1\n<script src="js/nav.js"></script>}' "$f"
    else
      perl -0777 -i -pe 's{(</body>)}{<script src="js/nav.js"></script>\n$1}' "$f"
    fi
  fi

  echo "  updated $f"
done

