#!/usr/bin/env python3
"""
Scrapes Swedish traffic signs from Transportstyrelsen and generates:
  - public/signs/<id>.png  (one image per sign)
  - src/data/signs.ts       (TypeScript data file)

Run from the repo root:
  python3 scripts/scrape.py
"""

import os
import re
import sys
import json
import time
import hashlib
import urllib.request
import urllib.parse
from html.parser import HTMLParser
from pathlib import Path

BASE_URL = "https://www.transportstyrelsen.se"
ROOT_PAGE = "/sv/vagtrafik/trafikregler-och-vagmarken/vagmarken/"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
}

SCRIPT_DIR = Path(__file__).parent
REPO_ROOT  = SCRIPT_DIR.parent
OUT_IMAGES = REPO_ROOT / "public" / "signs"
OUT_TS     = REPO_ROOT / "src" / "data" / "signs.ts"
OUT_JSON   = SCRIPT_DIR / "scraped.json"  # intermediate, for inspection

OUT_IMAGES.mkdir(parents=True, exist_ok=True)

# ── Category metadata (slug → (letter, display name)) ────────────────────────
CATEGORIES = {
    "varningsmarken":                                           ("A", "Varningsmärken"),
    "vajnings-och-stoppmarken":                                 ("B", "Väjnings- och stoppmärken"),
    "forbudsmarken":                                            ("C", "Förbudsmärken"),
    "pabudsmarken":                                             ("D", "Påbudsmärken"),
    "anvisningsmarken":                                         ("E", "Anvisningsmärken"),
    "lokaliseringsmarken-for-vagvisning":                       ("F", "Lokaliseringsmärken – vägvisning"),
    "lokaliseringsmarken-for-gang-och-cykeltrafik":             ("F2","Lokaliseringsmärken – gång- och cykeltrafik"),
    "lokaliseringsmarken-for-upplysning-om-allmanna-inrattningar-med-mera": ("G", "Lokaliseringsmärken – allmänna inrättningar"),
    "lokaliseringsmarken-for-upplysning-om-serviceanlaggningar-med-mera":   ("H", "Lokaliseringsmärken – serviceanläggningar"),
    "tillaggstavlor":                                           ("T", "Tilläggstavlor"),
}


# ── Simple HTML scraping helpers ──────────────────────────────────────────────

def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read()
            # try utf-8 then latin-1
            try:
                return raw.decode("utf-8")
            except UnicodeDecodeError:
                return raw.decode("latin-1")
    except Exception as exc:
        print(f"  ⚠  fetch failed: {url}  ({exc})")
        return ""


def download_image(url: str, dest: Path) -> bool:
    if dest.exists():
        return True
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            dest.write_bytes(resp.read())
        return True
    except Exception as exc:
        print(f"  ⚠  image download failed: {url}  ({exc})")
        return False


class LinkParser(HTMLParser):
    """Collects all <a href> links."""
    def __init__(self):
        super().__init__()
        self.links: list[str] = []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            d = dict(attrs)
            if "href" in d:
                self.links.append(d["href"])


class SignPageParser(HTMLParser):
    """
    Extracts (name, image_url) pairs from a category sign-listing page.

    Transportstyrelsen pages use an article/section layout where each sign
    has an <img> and a nearby heading or paragraph with the sign name.
    This parser collects all images and text nodes, then pairs them up.
    """
    def __init__(self, page_url: str):
        super().__init__()
        self.page_url = page_url
        self.entries: list[dict] = []   # [{name, img_url, sign_url}, ...]
        # state
        self._stack: list[str] = []
        self._current_text: list[str] = []
        self._current_img: str | None = None
        self._current_link: str | None = None
        self._in_heading = False
        self._depth_at_entry = 0
        self._current_depth = 0
        # collect all imgs and headings to pair up later
        self._imgs: list[tuple[int, str]] = []   # (position, url)
        self._headings: list[tuple[int, str]] = []  # (position, text)
        self._links: list[tuple[int, str]] = []
        self._pos = 0

    def handle_starttag(self, tag, attrs):
        self._stack.append(tag)
        self._current_depth += 1
        d = dict(attrs)
        if tag == "img":
            src = d.get("src", "")
            alt = d.get("alt", "")
            # Only capture actual sign images (skip decorative/nav images).
            # Heuristic: sign images tend to be in a path containing 'vagmarken',
            # 'contentassets', 'signs', or have a sign-like alt text.
            if src and (
                any(k in src.lower() for k in [
                    "vagmarken", "vägmarken", "contentassets", "/signs/",
                    "trafikregler", "marke", "märke"
                ])
                or re.search(r"\b[A-H]\d", alt)
            ):
                full = self._abs(src)
                self._imgs.append((self._pos, full, alt))
                self._pos += 1
        elif tag in ("h1","h2","h3","h4","h5","h6","figcaption"):
            self._in_heading = True
            self._current_text = []
        elif tag == "a":
            href = d.get("href", "")
            if href:
                self._links.append((self._pos, self._abs(href)))
        elif tag == "figure":
            self._pos += 1

    def handle_endtag(self, tag):
        if self._stack:
            self._stack.pop()
        self._current_depth -= 1
        if tag in ("h1","h2","h3","h4","h5","h6","figcaption"):
            text = " ".join(self._current_text).strip()
            if text:
                self._headings.append((self._pos, text))
            self._in_heading = False
            self._current_text = []

    def handle_data(self, data):
        if self._in_heading:
            self._current_text.append(data.strip())

    def _abs(self, url: str) -> str:
        if url.startswith("http"):
            return url
        if url.startswith("//"):
            return "https:" + url
        return urllib.parse.urljoin(self.page_url, url)

    def get_entries(self) -> list[dict]:
        """Pair each image with the nearest heading by position."""
        results = []
        for img_pos, img_url, alt in self._imgs:
            # Find the closest heading (before or after)
            best_name = alt
            best_dist = 9999
            for h_pos, h_text in self._headings:
                dist = abs(h_pos - img_pos)
                if dist < best_dist:
                    best_dist = dist
                    best_name = h_text
            # Find the closest link (usually the sign's detail page)
            best_link = ""
            best_dist2 = 9999
            for l_pos, l_url in self._links:
                dist = abs(l_pos - img_pos)
                if dist < best_dist2 and ROOT_PAGE in l_url:
                    best_dist2 = dist
                    best_link = l_url
            if img_url:
                results.append({
                    "name": best_name,
                    "img_url": img_url,
                    "sign_url": best_link,
                })
        return results


class DetailPageParser(HTMLParser):
    """
    Extracts (name, image_url) from an individual sign detail page.
    e.g. /sv/vagtrafik/.../vagmarken/varningsmarken/farlig-kurva/
    """
    def __init__(self, page_url: str):
        super().__init__()
        self.page_url = page_url
        self.title: str = ""
        self.img_url: str = ""
        self._in_h1 = False
        self._h1_parts: list[str] = []
        self._found_img = False

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "h1":
            self._in_h1 = True
            self._h1_parts = []
        elif tag == "img" and not self._found_img:
            src = d.get("src","")
            if src and any(k in src.lower() for k in [
                "vagmarken","contentassets","signs","marke"
            ]):
                self.img_url = self._abs(src)
                self._found_img = True

    def handle_endtag(self, tag):
        if tag == "h1":
            self.title = " ".join(self._h1_parts).strip()
            self._in_h1 = False

    def handle_data(self, data):
        if self._in_h1:
            self._h1_parts.append(data.strip())

    def _abs(self, url: str) -> str:
        if url.startswith("http"):
            return url
        if url.startswith("//"):
            return "https:" + url
        return urllib.parse.urljoin(self.page_url, url)


# ── Sign ID assignment ────────────────────────────────────────────────────────

def slugify(name: str) -> str:
    """Convert a Swedish sign name to a URL-slug-like string."""
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def assign_ids(signs: list[dict], cat_letter: str) -> list[dict]:
    """
    Try to extract the official sign ID (e.g. A1, C27) from the sign's
    detail URL slug, alt text, or name.  Falls back to sequential numbering.
    """
    # Pattern: letter + digits (with optional hyphen+digits for sub-variants)
    id_pattern = re.compile(
        r"\b([A-H])[-_]?(\d+)(?:[-_](\d+))?\b", re.IGNORECASE
    )

    for i, sign in enumerate(signs, start=1):
        text_to_search = " ".join([
            sign.get("name",""),
            sign.get("sign_url",""),
            sign.get("img_url",""),
        ])
        m = id_pattern.search(text_to_search)
        if m:
            letter = m.group(1).upper()
            num    = m.group(2)
            sub    = m.group(3)
            sign["id"] = f"{letter}{num}-{sub}" if sub else f"{letter}{num}"
        else:
            # Fall back to sequential: A1, A2, ...
            sign["id"] = f"{cat_letter}{i}"

    return signs


# ── Image filename ────────────────────────────────────────────────────────────

def image_extension(url: str) -> str:
    path = urllib.parse.urlparse(url).path
    ext  = os.path.splitext(path)[1].lower()
    return ext if ext in (".png", ".svg", ".jpg", ".jpeg", ".webp") else ".png"


# ── Main scraper ──────────────────────────────────────────────────────────────

def scrape_category(slug: str, cat_letter: str, cat_name: str) -> list[dict]:
    cat_url = BASE_URL + ROOT_PAGE + slug + "/"
    print(f"\n{'─'*60}")
    print(f"  Category: {cat_name}  ({cat_letter})  →  {cat_url}")

    html = fetch(cat_url)
    if not html:
        print("  ✗ empty page, skipping")
        return []

    # 1. Try to find signs directly on the listing page
    parser = SignPageParser(cat_url)
    parser.feed(html)
    entries = parser.get_entries()

    print(f"  Found {len(entries)} image entries on listing page")

    # 2. If listing page yielded nothing (or few results), try following
    #    links to individual sign sub-pages
    if len(entries) < 3:
        print("  → trying individual sign sub-pages...")
        link_parser = LinkParser()
        link_parser.feed(html)
        sub_links = [
            l for l in link_parser.links
            if slug in l and l.count("/") > ROOT_PAGE.count("/") + 1
        ]
        sub_links = list(dict.fromkeys(sub_links))  # deduplicate, preserve order
        print(f"  → {len(sub_links)} sub-page links found")
        for sub_url in sub_links:
            if not sub_url.startswith("http"):
                sub_url = BASE_URL + sub_url
            sub_html = fetch(sub_url)
            if not sub_html:
                continue
            dp = DetailPageParser(sub_url)
            dp.feed(sub_html)
            if dp.img_url:
                entries.append({
                    "name": dp.title or sub_url.rstrip("/").split("/")[-1],
                    "img_url": dp.img_url,
                    "sign_url": sub_url,
                })
            time.sleep(0.2)

    # 3. Deduplicate by image URL
    seen_imgs: set[str] = set()
    unique: list[dict] = []
    for e in entries:
        if e["img_url"] not in seen_imgs:
            seen_imgs.add(e["img_url"])
            unique.append(e)
    entries = unique

    # 4. Assign IDs
    entries = assign_ids(entries, cat_letter)

    # 5. Download images
    signs: list[dict] = []
    for entry in entries:
        sign_id = entry["id"]
        ext     = image_extension(entry["img_url"])
        filename = f"{sign_id}{ext}"
        dest    = OUT_IMAGES / filename

        ok = download_image(entry["img_url"], dest)
        if ok:
            print(f"  ✓  {sign_id:10s}  {entry['name'][:60]}")
        else:
            print(f"  ✗  {sign_id:10s}  {entry['name'][:60]}  (image failed)")

        signs.append({
            "id":           sign_id,
            "name":         entry["name"],
            "category":     cat_letter,
            "categoryName": cat_name,
            "imageFile":    filename,
        })
        time.sleep(0.1)

    return signs


# ── TypeScript generator ──────────────────────────────────────────────────────

TS_HEADER = """\
// AUTO-GENERATED by scripts/scrape.py – do not edit by hand.
// Run `python3 scripts/scrape.py` to regenerate.

export interface TrafficSign {
  id: string
  name: string
  category: string
  categoryName: string
  imageFile: string
}

export function getImageUrl(sign: TrafficSign): string {
  return import.meta.env.BASE_URL + 'signs/' + sign.imageFile
}

export const SIGNS: TrafficSign[] = [
"""

TS_FOOTER = "]\n"


def write_ts(all_signs: list[dict]) -> None:
    lines = [TS_HEADER]
    prev_cat = None
    for s in all_signs:
        if s["category"] != prev_cat:
            lines.append(
                f"  // ── {s['category']}: {s['categoryName']} "
                + "─" * max(0, 60 - len(s['categoryName'])) + "\n"
            )
            prev_cat = s["category"]
        name_escaped = s["name"].replace("'", "\\'")
        cat_escaped  = s["categoryName"].replace("'", "\\'")
        lines.append(
            f"  {{ id: '{s['id']}', name: '{name_escaped}', "
            f"category: '{s['category']}', categoryName: '{cat_escaped}', "
            f"imageFile: '{s['imageFile']}' }},\n"
        )
    lines.append(TS_FOOTER)
    OUT_TS.write_text("".join(lines), encoding="utf-8")
    print(f"\n✅  Wrote {OUT_TS}  ({len(all_signs)} signs)")


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    all_signs: list[dict] = []

    for slug, (letter, name) in CATEGORIES.items():
        signs = scrape_category(slug, letter, name)
        all_signs.extend(signs)
        time.sleep(0.5)

    # Save intermediate JSON for inspection
    OUT_JSON.write_text(
        json.dumps(all_signs, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"\n📄  Intermediate JSON: {OUT_JSON}")

    if not all_signs:
        print("\n❌  No signs found – check the site structure and try again.")
        sys.exit(1)

    write_ts(all_signs)
    print(f"\n🖼   Images saved to: {OUT_IMAGES}")
    print(
        "\nNext steps:\n"
        "  1. Review scripts/scraped.json to confirm sign names/IDs look right\n"
        "  2. `npm run build` to rebuild the app\n"
        "  3. `git add public/signs src/data/signs.ts && git commit -m 'Add official sign images'`\n"
        "  4. Push to main to trigger GitHub Pages deploy\n"
    )


if __name__ == "__main__":
    main()
