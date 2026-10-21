#!/usr/bin/env python3
"""Footage hunt v2 — throttle-friendly, relevance-tuned.

Adds: archival PHOTOS (Ken Burns material) + 1280px video derivatives +
IA collection allow-list fix + sleep/retry etiquette for Wikimedia.
"""
import json, os, re, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "assets_out"
CRED_PATH = os.path.join(OUT, "assets_credits.json")
CRED = json.load(open(CRED_PATH)) if os.path.exists(CRED_PATH) else []
UA = {"User-Agent": "hormuz-doc/1.0 (documentary research; low-volume client)"}

def get(url, dest=None, timeout=240, tries=3):
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                data = r.read()
            if dest:
                os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
                open(dest, "wb").write(data)
            print("ok", (dest or url)[:110], flush=True)
            return data
        except Exception as e:
            wait = 5 * (k + 1)
            print(f"retry{k} ({wait}s)", repr(e)[:90], flush=True)
            time.sleep(wait)
    return None

def credit(kind, name, source, license_, url):
    CRED.append({"kind": kind, "name": name, "source": source,
                 "license": license_, "url": url})

def commons_search(q, extra, limit=10):
    params = {
        "action": "query", "format": "json", "generator": "search",
        "gsrlimit": str(limit), "gsrsearch": f"{q} {extra}",
        "gsrnamespace": "6", "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata", "iiurlwidth": "1600",
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    try:
        req = urllib.request.Request(url, headers=UA)
        data = json.loads(urllib.request.urlopen(req, timeout=90).read())
        return sorted((data.get("query") or {}).get("pages", {}).values(),
                      key=lambda p: p.get("index", 99))
    except Exception as e:
        print("qfail", q, repr(e)[:90], flush=True)
        return []

PHOTO_Q = [
    "Strait of Hormuz tanker", "USS Bridgeton mine", "Operation Earnest Will",
    "USS Stark FFG-31", "moored naval mine", "naval mine sweeper",
    "Larak Island", "Qeshm island", "Bandar Abbas port", "Kharg Island oil",
    "VLCC supertanker", "oil tanker at sea aerial",
    "aircraft carrier flight deck night", "F/A-18 catapult launch",
    "guided missile destroyer arabian sea", "Royal Navy frigate gulf",
    "Musandam Oman", "persian gulf aerial", "USS Vincennes CG-49",
    "Operation Praying Mantis", "mine countermeasures MH-53",
    "Floating dock gulf navy", "EH-101 merlin royal navy",
    "patrol boat Gulf", "Gulf of Oman ships",
]
VIDEO_Q = [
    "Strait of Hormuz", "Earnest Will", "Operation Praying Mantis",
    "aircraft carrier launch recovery", "Persian Gulf carrier",
    "destroyer underway sea", "tanker convoy escort",
    "CENTCOM navy", "fast attack craft", "mine countermeasures",
]
IA_Q = [
    "operation praying mantis", "destryed iranian oil platform",
    "operation earnest will", "sea power navy",
    "tanker war", "persian gulf", "uss stark", "naval aviation",
    "minesweeping", "convoy escort",
]
IA_COLLS = r"(FedFlix|usgovfilms|PrelingerFedFlix|PublicDomainFilms|nasa|PeriscopeFilm)"

def lic_ok(lic):
    return bool(re.search(r"public domain|cc0|cc by|cc-by|attribution", lic, re.I))

def hunt_photos(cap=26):
    ddir = os.path.join(OUT, "footage", "photos")
    got = 0
    for q in PHOTO_Q:
        if got >= cap:
            break
        for pg in commons_search(q, "filetype:bitmap", limit=8):
            if got >= cap:
                break
            ii = (pg.get("imageinfo") or [{}])[0]
            if not str(ii.get("mime", "")).startswith("image/"):
                continue
            if ii.get("width", 0) < 1100:
                continue
            em = ii.get("extmetadata", {})
            lic = (em.get("LicenseShortName", {}) or {}).get("value", "")
            if not lic_ok(lic):
                continue
            title = pg.get("title", "photo")
            safe = re.sub(r"[^A-Za-z0-9_.-]+", "_", title.replace("File:", ""))[:80]
            ext = os.path.splitext(ii.get("url", ""))[1][:5] or ".jpg"
            dest = os.path.join(ddir, f"p{got:02d}_{safe}{ext}")
            src = ii.get("thumburl") or ii.get("url")
            if get(src, dest):
                time.sleep(0.9)
                got += 1
                artist = re.sub(r"<[^>]+>", "", (em.get("Artist", {}) or {}).get("value", ""))
                credit("photo", title, f"Wikimedia Commons / {artist[:60]}",
                       lic, pg.get("fullurl", src))
    print("PHOTOS:", got, flush=True)

def hunt_video(cap=10):
    ddir = os.path.join(OUT, "footage", "commons")
    have = len(os.listdir(ddir)) if os.path.isdir(ddir) else 0
    got = 0
    for q in VIDEO_Q:
        if got >= cap:
            break
        for pg in commons_search(q, "filetype:video", limit=8):
            if got >= cap:
                break
            ii = (pg.get("imageinfo") or [{}])[0]
            if not str(ii.get("mime", "")).startswith("video/"):
                continue
            if ii.get("width", 0) < 480:
                continue
            em = ii.get("extmetadata", {})
            lic = (em.get("LicenseShortName", {}) or {}).get("value", "")
            if not lic_ok(lic):
                continue
            title = pg.get("title", "clip")
            safe = re.sub(r"[^A-Za-z0-9_.-]+", "_", title.replace("File:", ""))[:70]
            src = ii.get("thumburl") or ii.get("derivativeurl")
            fmt = "mp4" if src and "mp4" in src else None
            if not fmt or not src:
                for d in ii.get("derivatives", []):
                    if "transcoded" in (d.get("src", "") or "") and ".mp4" in d.get("src", ""):
                        src, fmt = d["src"], "mp4"
                        break
            if not src:
                continue
            dest = os.path.join(ddir, f"v{have+got:02d}_{safe}.{fmt}")
            if get(src, dest):
                time.sleep(1.4)
                got += 1
                artist = re.sub(r"<[^>]+>", "", (em.get("Artist", {}) or {}).get("value", ""))
                credit("footage", title, f"Wikimedia Commons / {artist[:60]}",
                       lic, pg.get("fullurl", src))
    print("VIDEO(new):", got, flush=True)

def hunt_ia(cap=8):
    ddir = os.path.join(OUT, "footage", "ia")
    got = 0
    for q in IA_Q:
        if got >= cap:
            break
        query = f"({q}) AND mediatype:movies AND collection:{IA_COLLS}"
        url = ("https://archive.org/advancedsearch.php?output=json&rows=14&"
               + urllib.parse.urlencode({"q": query})
               + "&fl[]=identifier&fl[]=title&fl[]=downloads&sort[]=downloads+desc")
        try:
            req = urllib.request.Request(url, headers=UA)
            res = json.loads(urllib.request.urlopen(req, timeout=90).read())
            docs = res.get("response", {}).get("docs", [])
        except Exception as e:
            print("ia qfail", q, repr(e)[:90], flush=True)
            continue
        for doc in docs:
            if got >= cap:
                break
            ident = doc["identifier"]
            try:
                meta = json.loads(urllib.request.urlopen(
                    f"https://archive.org/metadata/{ident}", timeout=90).read())
            except Exception:
                continue
            coll = " ".join(meta.get("metadata", {}).get("collection", [])
                            if isinstance(meta.get("metadata", {}).get("collection"), list)
                            else [str(meta.get("metadata", {}).get("collection", ""))])
            if not re.search(IA_COLLS, coll):
                continue
            best = None
            for f in meta.get("files", []):
                n = f.get("name", "")
                if not re.search(r"\.(mp4|mpg|mpeg|m4v|avi)$", n, re.I):
                    continue
                sz = int(f.get("size", 0) or 0)
                pref = 3 if "512kb" in n else 2 if 8_000_000 < sz < 400_000_000 else 1
                if sz and sz < 450_000_000 and (best is None or pref > best[0]):
                    best = (pref, n)
            if not best:
                continue
            dl = f"https://archive.org/download/{ident}/{urllib.parse.quote(best[1])}"
            dest = os.path.join(ddir, f"ia{got:02d}_{ident[:48]}.mp4")
            if get(dl, dest, timeout=420):
                time.sleep(1.0)
                got += 1
                credit("footage", f'{doc.get("title","")} ({ident})',
                       "Internet Archive", "public domain", dl)
    print("IA:", got, flush=True)

hunt_photos()
hunt_video()
hunt_ia()
json.dump(CRED, open(CRED_PATH, "w"), indent=2, ensure_ascii=False)
print("CREDITS NOW:", len(CRED), flush=True)
