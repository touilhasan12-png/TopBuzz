#!/usr/bin/env python3
"""Fetch all licensed archival assets for the Hormuz documentary.

Everything is public-domain / CC / free-with-attribution and logged to
assets_credits.json (drives the video's credit roll + LICENSES.md).
Defensive: every item is wrapped; failures degrade, never abort.
"""
import io, json, os, re, sys, time, zipfile
import urllib.request, urllib.parse, urllib.error

OUT = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "assets_out"
ONLY = None
if "--only" in sys.argv:
    ONLY = set(sys.argv[sys.argv.index("--only") + 1].split(","))
os.makedirs(OUT, exist_ok=True)
MAN = json.load(open(os.path.join(os.path.dirname(__file__), "..", "assets", "manifest.json")))
CRED = []

def get(url, dest=None, timeout=120, binary=True, headers=None):
    try:
        req = urllib.request.Request(url, headers=headers or {"User-Agent": "hormuz-doc/1.0 (research; contact: owner)"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = r.read()
        if dest:
            os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
            with open(dest, "wb") as f:
                f.write(data)
        return data if binary else data.decode("utf-8", "ignore")
    except Exception as e:
        print("FAIL", url[:110], repr(e)[:140], flush=True)
        return None

def credit(kind, name, source, license_, url, note=""):
    CRED.append({"kind": kind, "name": name, "source": source,
                 "license": license_, "url": url, "note": note})

# ---------------- Natural Earth ----------------
def natural_earth():
    for k, url in MAN["natural_earth"].items():
        if k == "license":
            continue
        p = os.path.join(OUT, "geo", f"{k}.geojson")
        if get(url, p):
            credit("data", f"Natural Earth {k} 10m", "naturalearthdata.com",
                   "public domain", url)
    print("natural earth done", flush=True)

# ---------------- Sentinel-2 thumbnail via Earth Search STAC ----------------
def sentinel():
    s = MAN["sentinel2"]
    body = json.dumps({
        "collections": [s["collection"]],
        "bbox": s["bbox"], "limit": 5,
        "datetime": s["datetime"],
        "query": {"eo:cloud_cover": {"lt": s["max_cloud"]}},
        "sortby": [{"field": "properties.datetime", "direction": "desc"}],
    }).encode()
    try:
        req = urllib.request.Request(s["stac"], data=body,
            headers={"Content-Type": "application/json", "User-Agent": "hormuz-doc/1.0"})
        res = json.loads(urllib.request.urlopen(req, timeout=120).read())
        feats = res.get("features", [])
    except Exception as e:
        feats = []
        print("STAC fail", repr(e)[:140], flush=True)
    ok = False
    for f in feats:
        a = f.get("assets", {})
        href = (a.get("rendered_preview") or a.get("thumbnail") or {}).get("href")
        if href and get(href, os.path.join(OUT, "sat", "sat_strait.jpg")):
            dt = f.get("properties", {}).get("datetime", "")[:10]
            credit("image", f"Sentinel-2 scene {f.get('id','')[:40]} ({dt})",
                   "Copernicus/Element84 Earth Search",
                   "Copernicus license — " + s["attribution"], href)
            ok = True
            break
    if not ok:
        # fallback: Natural Earth 50m shaded relief+water
        z = get("https://naciscdn.org/naturalearth/50m/raster/NE2_50M_SR_W.zip")
        if z:
            zz = zipfile.ZipFile(io.BytesIO(z))
            for n in zz.namelist():
                if n.endswith(".jpg") or n.endswith(".tif"):
                    zz.extract(n, os.path.join(OUT, "sat"))
                    credit("image", "Natural Earth 50m raster (sat fallback)",
                           "naturalearthdata.com", "public domain",
                           "naciscdn.org")
                    break
    print("sentinel/sat done", flush=True)

# ---------------- Brent daily CSV ----------------
def brent():
    if get(MAN["brent_csv"], os.path.join(OUT, "data", "brent-daily.csv")):
        credit("data", "Brent spot price daily (EIA source)", "datahub.io",
               "open data", MAN["brent_csv"])

# ---------------- Fonts (OFL) ----------------
def fonts():
    d = os.path.join(OUT, "fonts")
    for name, url in MAN["fonts"].items():
        ext = ".ttf"
        get(url, os.path.join(d, name + ext))
    credit("fonts", "Inter / Archivo / IBM Plex Mono", "Google Fonts",
           "SIL Open Font License 1.1",
           "github.com/google/fonts")

# ---------------- Kevin MacLeod music (CC-BY 4.0) ----------------
def music():
    d = os.path.join(OUT, "music")
    m = MAN["music_kevin_macleod"]
    got = 0
    for t in m["tracks"]:
        if got >= 2:
            break
        p = os.path.join(d, urllib.parse.unquote(t).replace(" ", "_").lower())
        if get(m["base"] + t, p, timeout=180):
            got += 1
            credit("music", urllib.parse.unquote(t)[:-4],
                   "Kevin MacLeod (incompetech.com)",
                   "CC BY 4.0", m["base"] + t,
                   note="credit text in video description + end credits")
    print("music:", got, "tracks", flush=True)

# ---------------- SFX (synthesis is primary; externals optional) ----------------
def sfx():
    here = os.path.dirname(__file__)
    import subprocess
    subprocess.run([sys.executable, os.path.join(here, "synth_sfx.py"),
                    "--out", os.path.join(OUT, "sfx")], check=False)
    credit("sfx", "Synthesized SFX suite (braam/whoosh/riser/sonar/telex/impact)",
           "generated in-repo (scripts/synth_sfx.py)", "CC0 (our own work)", "-",
           note="no third-party sound used unless listed later")

# ---------------- Wikimedia Commons video (PD / CC) ----------------
def commons_video():
    d = os.path.join(OUT, "footage", "commons")
    found = []
    for q in MAN["footage_commons_queries"]:
        if len(found) >= 14:
            break
        params = {
            "action": "query", "format": "json",
            "generator": "search", "gsrlimit": "12",
            "gsrsearch": f'"{q}" filetype:video', "gsrnamespace": "6",
            "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata",
            "iiurlwidth": "1280",
        }
        url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "hormuz-doc/1.0"})
            data = json.loads(urllib.request.urlopen(req, timeout=90).read())
        except Exception as e:
            print("commons qfail", q, repr(e)[:100], flush=True)
            continue
        pages = (data.get("query") or {}).get("pages", {})
        for pid, pg in sorted(pages.items()):
            ii = (pg.get("imageinfo") or [{}])[0]
            mime = ii.get("mime", "")
            if not mime.startswith("video/"):
                continue
            if ii.get("width", 0) < 480:
                continue
            em = ii.get("extmetadata", {})
            lic = (em.get("LicenseShortName", {}) or {}).get("value", "")
            title = pg.get("title", "file")
            if not re.search(r"public domain|cc by|cc0|attribution", lic, re.I):
                continue
            dl = ii.get("url")
            sz = ii.get("size", 0)
            if sz > 600_000_000:
                dl = ii.get("derivativeurl") or ii.get("thumburl") or dl
            safe = re.sub(r"[^A-Za-z0-9_.-]+", "_", title.replace("File:", ""))[:90]
            dest = os.path.join(d, f"{len(found):02d}_{safe}")
            if get(dl, dest, timeout=300):
                if not os.path.splitext(dest)[1]:
                    os.rename(dest, dest + ".webm")
                    dest += ".webm"
                artist = re.sub(r"<[^>]+>", "",
                                (em.get("Artist", {}) or {}).get("value", ""))
                found.append(dest)
                credit("footage", title, "Wikimedia Commons" +
                       (f" / {artist}" if artist else ""), lic or "PD",
                       pg.get("fullurl", dl))
    print("commons footage:", len(found), flush=True)

# ---------------- Internet Archive (gov/fedflix public domain) ----------------
def archive_footage():
    d = os.path.join(OUT, "footage", "ia")
    got = 0
    seen = set()
    for q in MAN["footage_archive_queries"]:
        if got >= 10:
            break
        query = (f'({q}) AND mediatype:movies AND '
                 '(collection:FedFlix OR collection:usgovfilms OR '
                 'collection:PublicDomainFilms OR collection:PrelingerFedFlix '
                 'OR collection:fedora_gov OR collection:nasa)')
        url = ("https://archive.org/advancedsearch.php?output=json&rows=16&"
               + urllib.parse.urlencode({"q": query})
               + "&fl[]=identifier&fl[]=title&fl[]=downloads")
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "hormuz-doc/1.0"})
            res = json.loads(urllib.request.urlopen(req, timeout=90).read())
            docs = res.get("response", {}).get("docs", [])
        except Exception as e:
            print("ia qfail", q, repr(e)[:100], flush=True)
            continue
        docs.sort(key=lambda x: -(x.get("downloads") or 0))
        for doc in docs:
            if got >= 10:
                break
            ident = doc["identifier"]
            if ident in seen:
                continue
            seen.add(ident)
            try:
                meta = json.loads(urllib.request.urlopen(
                    f"https://archive.org/metadata/{ident}", timeout=90).read())
            except Exception:
                continue
            lic = (meta.get("metadata", {}).get("licenseurl") or "")
            coll = " ".join(meta.get("metadata", {}).get("collection", [])
                            if isinstance(meta.get("metadata", {}).get("collection"), list)
                            else [str(meta.get("metadata", {}).get("collection", ""))])
            if not re.search(r"publicdomain|public domain|usgov|creativecommons", lic + " " + coll, re.I):
                continue
            best = None
            for f in meta.get("files", []):
                n = f.get("name", "")
                if not re.search(r"\.(mp4|mpg|mpeg|m4v)$", n, re.I):
                    continue
                sz = int(f.get("size", 0) or 0)
                pref = 3 if "512kb" in n else 2 if sz > 8_000_000 else 1
                if sz and sz < 500_000_000:
                    if best is None or pref > best[0]:
                        best = (pref, n)
            if not best:
                continue
            fn = best[1]
            dl = f"https://archive.org/download/{ident}/{fn}"
            dest = os.path.join(d, f"{got:02d}_{ident[:50]}.mp4")
            if get(dl, dest, timeout=420):
                got += 1
                credit("footage", f'{doc.get("title","")} ({ident})',
                       "Internet Archive", "public domain", dl)
    print("archive footage:", got, flush=True)

TASKS = {
    "geo": natural_earth, "sat": sentinel, "data": brent, "fonts": fonts,
    "music": music, "sfx": sfx, "commons": commons_video, "ia": archive_footage,
}
for name, fn in TASKS.items():
    if ONLY and name not in ONLY:
        continue
    try:
        fn()
    except Exception as e:
        print("TASK ERROR", name, repr(e)[:160], flush=True)

os.makedirs(OUT, exist_ok=True)
json.dump(CRED, open(os.path.join(OUT, "assets_credits.json"), "w"),
          indent=2, ensure_ascii=False)
print(f"CREDITS: {len(CRED)} entries", flush=True)
