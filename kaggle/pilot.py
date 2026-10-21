# TopBuzz pilot kernel — runs entirely inside a Kaggle GPU session.
# Installs Blender, clones the TopBuzz repo, renders pilot frames on GPU,
# and saves everything to /kaggle/working/out (kernel output).
import os, re, subprocess, sys, time, urllib.request

REPO = "https://github.com/touilhasan12-png/TopBuzz.git"
WORK = "/kaggle/working"
OUT = os.path.join(WORK, "out")
os.makedirs(OUT, exist_ok=True)

def sh(cmd, env=None, check=False):
    print("$", " ".join(cmd) if isinstance(cmd, list) else cmd, flush=True)
    r = subprocess.run(cmd, shell=isinstance(cmd, str), capture_output=True, text=True,
                       env=env)
    print((r.stdout or "")[-3000:], flush=True)
    if r.returncode != 0:
        print("ERR:", (r.stderr or "")[-3000:], flush=True)
        if check: raise RuntimeError(cmd)
    return r

# 1) GPU sanity
sh(["nvidia-smi"])

# 2) system libs Blender needs on headless linux
sh("apt-get update -qq")
sh("apt-get install -y -qq libgl1 libglib2.0-0 libx11-6 libxi6 libxxf86vm1 "
   "libxfixes3 libxkbcommon0 libsm6 libegl1 libdbus-1-3 xz-utils")

# 3) download Blender (auto-pick newest from release dirs)
def newest_tar(series):
    url = f"https://download.blender.org/release/{series}/"
    html = urllib.request.urlopen(url, timeout=60).read().decode("utf-8", "ignore")
    cands = sorted(set(re.findall(rf"blender-[\d.]+-linux-x64\.tar\.xz", html)))
    return url + cands[-1] if cands else None

tar_url = None
for series in ("Blender4.5", "Blender4.2", "Blender4.3"):
    try:
        tar_url = newest_tar(series)
        if tar_url: break
    except Exception as e:
        print("series fail", series, e)
print("Blender URL:", tar_url)
sh(f"wget -q '{tar_url}' -O /kaggle/working/blender.tar.xz")
sh("mkdir -p /opt/blender && tar -xf /kaggle/working/blender.tar.xz -C /opt/blender --strip-components=1")
BL = "/opt/blender/blender"
sh([BL, "--version"])

# 4) clone repo + run pilot scene
sh(f"git clone --depth 1 {REPO} {WORK}/TopBuzz")
env = dict(os.environ)
env["LD_LIBRARY_PATH"] = "/usr/local/cuda/lib64:" + env.get("LD_LIBRARY_PATH", "")
env["OUT_DIR"] = OUT
t0 = time.time()
r = sh([BL, "-b", "--factory-startup", "--python", f"{WORK}/TopBuzz/pilot/pilot_scene.py"], env=env)
dur = time.time() - t0
with open(os.path.join(OUT, "log.txt"), "w") as f:
    f.write(f"rc={r.returncode}\nduration={dur:.0f}s\n" + (r.stdout or "")[-8000:] + "\n" + (r.stderr or "")[-2000:])

# 5) assemble preview mp4
sh(f"ffmpeg -y -framerate 8 -i {OUT}/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 {OUT}/pilot.mp4")
print("FILES:", os.listdir(OUT), flush=True)
print("PILOT KERNEL FINISHED")
