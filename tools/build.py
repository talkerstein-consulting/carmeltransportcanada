#!/usr/bin/env python3
"""Build the static site in ./site from the raw wget mirror in ./mirror.

Content and markup are left as-is; only these changes are applied:
  * absolute https://carmeltransport.com URLs -> root-relative (canonical, og:url,
    shortlink and admin-ajax endpoints stay absolute)
  * Google Fonts self-hosted as woff2 (same families/weights/display=swap)
  * versioned asset filenames ("x.css?ver=1.css") renamed so static servers resolve them
  * visible phone numbers wrapped in tel: links that inherit the original styling
  * WordPress emoji detection script removed (unused on the site)
  * PNG/JPEG recompressed in place (pngquant / jpegoptim), same dimensions
"""
import os, re, shutil, subprocess, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC, FINAL = ROOT / "mirror", ROOT / "site"
OUT = ROOT / "site.tmp"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
WEIGHTS = "100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic"
FONTS = {"Inter": "inter", "Instrument+Sans": "instrument-sans"}

PHONE = re.compile(r"(?<![\d>])(\(\d{3}\) \d{3}-\d{4}|\d{3}-\d{3}-\d{4})(?![\d<]*</a>)")


def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60).read()


FONT_CACHE = ROOT / "tools" / "font-cache"


def build_fonts():
    """Self-host the Google Fonts. Order: live download (cached) -> project cache -> original TTFs from the mirror."""
    fdir = OUT / "fonts"
    fdir.mkdir(exist_ok=True)
    FONT_CACHE.mkdir(exist_ok=True)
    for fam, slug in FONTS.items():
        cached_css = FONT_CACHE / f"{slug}.css"
        try:
            css = fetch(f"https://fonts.googleapis.com/css?family={fam}:{WEIGHTS}&display=swap").decode()
            def local(m):
                url = m.group(1)
                name = url.split("/s/", 1)[1].replace("/", "_")
                if not (FONT_CACHE / name).exists():
                    (FONT_CACHE / name).write_bytes(fetch(url))
                return f"url(/fonts/{name})"
            cached_css.write_text(re.sub(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", local, css))
        except OSError as err:
            if not cached_css.exists():
                print(f"fonts: offline ({err}); using original TTFs for {fam}")
                src = next(SRC.glob(f"css?family={fam}:*"))
                def ttf(m):
                    rel = m.group(1).split("fonts.gstatic.com/", 1)[1]
                    name = rel.split("s/", 1)[1].replace("/", "_")
                    shutil.copy(SRC / rel, FONT_CACHE / name)
                    return f"url(/fonts/{name})"
                cached_css.write_text(re.sub(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", ttf, src.read_text()))
            else:
                print(f"fonts: offline ({err}); using cached {slug}")
        css = cached_css.read_text()
        (fdir / f"{slug}.css").write_text(css)
        for name in re.findall(r"url\(/fonts/([^)]+)\)", css):
            shutil.copy(FONT_CACHE / name, fdir / name)


def tel_link(m):
    num = m.group(1)
    digits = re.sub(r"\D", "", num)
    return f'<a href="tel:+1{digits}" class="ct-tel">{num}</a>'


def add_tel_links(html):
    # Only phone numbers in text nodes, never fax lines.
    def text(m):
        seg = m.group(0)
        return seg if "Fax" in seg else PHONE.sub(tel_link, seg)
    return re.sub(r"(?<=>)[^<>]*?(?:\(\d{3}\) \d{3}-\d{4}|\d{3}-\d{3}-\d{4})[^<>]*(?=<)", text, html)


def process_html(path):
    s = path.read_text(encoding="utf-8")
    keep = {}
    def protect(m):
        keep[f"@@KEEP{len(keep)}@@"] = m.group(0)
        return f"@@KEEP{len(keep) - 1}@@"
    s = re.sub(r'<link rel=["\'](?:canonical|shortlink)["\'][^>]*>|<meta property="og:url"[^>]*>|https?:(?:\\/|/){2}carmeltransport\.com(?:\\/|/)wp-admin(?:\\/|/)admin-ajax\.php', protect, s)
    s = s.replace("https://carmeltransport.com/", "/").replace("https://carmeltransport.com", "/")
    s = s.replace("https:\\/\\/carmeltransport.com\\/", "\\/").replace("https:\\/\\/carmeltransport.com", "\\/")
    for fam, slug in FONTS.items():
        s = re.sub(rf"https://fonts\.googleapis\.com/css\?family={re.escape(fam)}:[^'\"]*", f"/fonts/{slug}.css", s)
    s = re.sub(r"<script[^>]*>\s*window\._wpemojiSettings.*?</script>", "", s, flags=re.S)
    s = re.sub(r'<script[^>]*src="[^"]*wp-emoji-release[^"]*"[^>]*></script>', "", s)
    s = re.sub(r"<script[^>]*id=['\"]wp-emoji-settings['\"][^>]*>.*?</script>", "", s, flags=re.S)
    s = re.sub(r"<script\b(?:(?!</script>).)*?wpEmojiSettingsSupports.*?</script>", "", s, flags=re.S)
    s = re.sub(r"<style id=['\"]wp-emoji-styles-inline-css['\"].*?</style>", "", s, flags=re.S)
    # Styleguide: remove cursor flare; Booking button on Inter + Navy
    s = re.sub(r'<div class="cursor-gradient"></div>\s*<style>\s*\.cursor-gradient.*?</style>\s*<script>.*?</script>', "", s, flags=re.S)
    s = re.sub(r"(\.fab-booking \{[^}]*?)background: #1a1a2e;", r"\1background: #1B263B;", s)
    s = re.sub(r"(\.fab-booking \{[^}]*?)font-family: sans-serif;", r'\1font-family: "Inter", sans-serif;', s)
    # Navbar: Home as the first item in the desktop menu and the mobile dropdown
    s = s.replace('<ul id="menu-1-2d59c41" class="elementor-nav-menu">',
                  '<ul id="menu-1-2d59c41" class="elementor-nav-menu"><li class="menu-item menu-item-home"><a href="/" class="elementor-item">Home</a></li>', 1)
    s = s.replace('<ul id="menu-2-2d59c41" class="elementor-nav-menu">',
                  '<ul id="menu-2-2d59c41" class="elementor-nav-menu"><li class="menu-item menu-item-home"><a href="/" class="elementor-item" tabindex="-1">Home</a></li>', 1)
    body = s.find("<body")
    s = s[:body] + add_tel_links(s[body:])
    s = s.replace("</head>", '<link rel="stylesheet" href="/carmel-contrast.css">\n<link rel="stylesheet" href="/carmel-ux.css">\n</head>', 1)
    s = s.replace("</body>", '<script src="/carmel-ux.js" defer></script>\n</body>', 1)
    # Interactions: one entrance animation everywhere (fade up)
    s = re.sub(r"(&quot;_?animation(?:_tablet|_mobile)?&quot;:&quot;)(?:fadeInLeft|fadeInRight|fadeIn)(&quot;)", r"\1fadeInUp\2", s)
    if "ct-tel" in s:
        s = s.replace("</head>", "<style>a.ct-tel{color:inherit;text-decoration:inherit;font:inherit}</style>\n</head>", 1)
    for k, v in keep.items():
        s = s.replace(k, v)
    path.write_text(s, encoding="utf-8")


FONT_SIZE = {"9": "11", "14": "15", "16": "15", "19": "18", "22": "24", "25": "24", "27": "24", "34": "35", "48": "50", "60": "50"}
RADIUS = {"5": "8", "6": "8", "10": "8", "12": "8", "28": "25"}
GAP = {"10": "12", "14": "12", "15": "16", "50": "60"}


# Contrast fixes (WCAG AA), element ids found by auditing every page in the browser.
YELLOW_BUTTONS = "d3841b9 5ff2e1b 768a01a c5fcc53 c801f8a dbd3dd7 d0fad10 fc0816f a779757 649f379b 251c32b 7b75c72 15236df ddb2a41".split()
BLUE_BUTTONS = "6fbc162 e8158f3 0bd8998".split()
BLUE_TEXT = """8d6e7fb 5fcb4ab 16c7882 05455f8 d5a6698 4d8eb55 764eccf 383a7dc 892e33b 66ef1b0 242da2c 2338fc1 c67af4b 02509d2
090d082 fcbe630 e7b5b2a 3eb6838 9576dcc 24137e2 6ce0a70 46c048f b470412 3881bab 57479ff 6482323 59503e4 ddc9c8f bb16c6c
c64ea31 9ecaf7b b1166cf 390e126 eba2d59 16bff10 ca24fcf edbc440 8df2b94 74d71af 94ddb28""".split()
GREY_TEXT = "049178d 52b16ec a2128bb 8a2da80 2bcac0a".split()
# Yellow fails on light backgrounds: primary buttons there switch to Navy, yellow text to link blue.
YELLOW_ON_LIGHT_BUTTONS = "15236df 251c32b 649f379b 768a01a 7b75c72 a779757 c5fcc53 c801f8a d0fad10 dbd3dd7 ddb2a41 fc0816f".split()
YELLOW_ON_LIGHT_TEXT = "7183313 1a05e01 5ca0a6a 79a5ea3 bcb3361 e3dba3f".split()


def contrast_css():
    sel = lambda ids, tail="": ",".join(f".elementor-element-{i}{tail}" for i in ids)
    btn = " :is(.elementor-button,button,input[type=submit])"
    return "\n".join([
        "/* WCAG AA contrast fixes (approved styleguide) */",
        f"{sel(YELLOW_BUTTONS, btn)},{sel(YELLOW_BUTTONS, btn + ' *')}{{color:#1B263B!important;fill:#1B263B!important}}",
        f"{sel(BLUE_BUTTONS, btn)}{{background:#2563EB!important}}",
        f"{sel(BLUE_TEXT)},{sel(BLUE_TEXT, ' *')}{{color:#2563EB!important}}",
        f"{sel(GREY_TEXT)},{sel(GREY_TEXT, ' *')}{{color:#64718D!important}}",
        f"{sel(YELLOW_ON_LIGHT_BUTTONS, btn)}{{background:#1B263B!important}}",
        f"{sel(YELLOW_ON_LIGHT_BUTTONS, btn + ':is(:hover,:focus-visible)')}{{background:#0d141a!important}}",
        f"{sel(YELLOW_ON_LIGHT_BUTTONS, btn)},{sel(YELLOW_ON_LIGHT_BUTTONS, btn + ' *')}{{color:#fff!important;fill:#fff!important}}",
        ".faq-num, .faq-num *{color:#1B263B!important}",
        f"{sel(YELLOW_ON_LIGHT_TEXT, ' a')},{sel(YELLOW_ON_LIGHT_TEXT, ' a *')}{{color:#2563EB!important}}",
    ]) + "\n"


def apply_styleguide(css):
    """Snap Elementor page CSS onto the approved type, spacing, radius and button scales."""
    css = re.sub(r"font-size:(\d+)px", lambda m: f"font-size:{FONT_SIZE.get(m.group(1), m.group(1))}px", css)
    css = re.sub(r"font-size:40px;font-weight:700", "font-size:40px;font-weight:900", css)
    css = re.sub(r"(border-radius:)([^;}]+)", lambda m: m.group(1) + re.sub(r"\b(\d+)px", lambda n: RADIUS.get(n.group(1), n.group(1)) + "px", m.group(2)), css)
    css = re.sub(r"((?:^|[;{])(?:row-|column-)?gap:)([^;}]+)", lambda m: m.group(1) + re.sub(r"\b(\d+)px", lambda n: GAP.get(n.group(1), n.group(1)) + "px", m.group(2)), css)
    css = css.replace("padding:20px 35px 20px 35px", "padding:20px 32px 20px 32px")
    # Blue gradient buttons: medium size, md radius
    css = re.sub(r"background-color:transparent;background-image:linear-gradient\(45deg, #2563EB 0%, #3B82FF 100%\);border-radius:8px 8px 8px 8px", "background-color:#2563EB;background-image:none;border-radius:15px 15px 15px 15px;padding:16px 28px 16px 28px", css)
    # Custom-CSS form buttons that force the light blue with !important
    css = re.sub(r"(button\{\s*height: 50px;\s*background: )#3B82FF( !important;\s*border: none;\s*border-radius: )8px", r"\g<1>#2563EB\g<2>15px", css)
    return css


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SRC, OUT, ignore=shutil.ignore_patterns("css?family=*", "s"))
    for p in list(OUT.rglob("*?*")):
        base = p.name.split("?", 1)[0]
        p.rename(p.with_name(base))
    build_fonts()
    for p in OUT.rglob("*.html"):
        process_html(p)
    for p in (OUT / "wp-content/uploads/elementor/css").glob("post-*.css"):
        p.write_text(apply_styleguide(p.read_text(encoding="utf-8")), encoding="utf-8")
    if "--no-images" not in sys.argv:
        pngs = [str(p) for p in OUT.rglob("*.png")]
        jpgs = [str(p) for p in OUT.rglob("*.jp*g")]
        if pngs:
            subprocess.run(["pngquant", "--skip-if-larger", "--quality=80-95", "--speed=1", "--force", "--ext", ".png", *pngs])
        if jpgs:
            subprocess.run(["jpegoptim", "-q", "--strip-all", "-m85", *jpgs])
    (OUT / "carmel-contrast.css").write_text(contrast_css())
    for f in ("carmel-ux.css", "carmel-ux.js"):
        shutil.copy(ROOT / "tools" / f, OUT / f)
    shutil.copy(ROOT / "tools" / ".htaccess", OUT / ".htaccess")
    shutil.copytree(ROOT / "styleguide", OUT / "styleguide")
    old = ROOT / "site.old"
    if old.exists():
        shutil.rmtree(old)
    if FINAL.exists():
        FINAL.rename(old)
    OUT.rename(FINAL)
    shutil.rmtree(old, ignore_errors=True)
    print("built", FINAL)


if __name__ == "__main__":
    main()
