#!/usr/bin/env python3
"""
Downloads and unpacks the official precompiled Synfig Studio v1.5.5 Linux x86_64 AppImage
purely in user space (7zz + stdlib zlib zisofs decompression + ELF SONAME symlinks),
requiring zero sudo, zero FUSE kernel support, and zero apt package locks.
"""
import os
import re
import stat
import struct
import subprocess
import sys
import urllib.request
import zlib

SYNFIG_URL = "https://github.com/synfig/synfig/releases/download/v1.5.5/SynfigStudio-1.5.5-2026.03.15-linux64-79bf7.appimage"
SEVENZIP_URL = "https://github.com/ip7z/7zip/releases/download/24.09/7z2409-linux-x64.tar.xz"
ZISO_MAGIC = b"\x37\xe4\x53\x96\xc9\xdb\xd6\x07"


def ensure_synfig(target_root="/tmp/synfig_bin"):
    bin_path = os.path.join(target_root, "extracted/usr/bin/synfig")
    if os.path.isfile(bin_path) and os.access(bin_path, os.X_OK):
        return bin_path

    os.makedirs(target_root, exist_ok=True)
    seven_dir = os.path.join(target_root, "7z")
    os.makedirs(seven_dir, exist_ok=True)
    seven_bin = os.path.join(seven_dir, "7zz")
    if not os.path.isfile(seven_bin):
        txz = os.path.join(target_root, "7z.tar.xz")
        urllib.request.urlretrieve(SEVENZIP_URL, txz)
        subprocess.run(["tar", "-xJf", txz, "-C", seven_dir], check=True)
        os.remove(txz)

    appimage = os.path.join(target_root, "synfig.appimage")
    extracted = os.path.join(target_root, "extracted")
    print(f"[Synfig] Downloading official SynfigStudio v1.5.5 binary...", flush=True)
    urllib.request.urlretrieve(SYNFIG_URL, appimage)
    subprocess.run([seven_bin, "x", "-y", appimage, f"-o{extracted}"], stdout=subprocess.DEVNULL, check=True)
    os.remove(appimage)

    # Decompress zisofs transparent blocks via stdlib zlib
    for root, _, files in os.walk(extracted):
        for fn in files:
            p = os.path.join(root, fn)
            if os.path.islink(p):
                continue
            os.chmod(p, 0o755)
            with open(p, "rb") as f:
                hdr = f.read(16)
                if len(hdr) < 16 or hdr[:8] != ZISO_MAGIC:
                    continue
                uncomp_size, hdr_div4, shift = struct.unpack("<IBBxx", hdr[8:16])
                bsz = 1 << shift
                nblocks = (uncomp_size + bsz - 1) // bsz
                f.seek(hdr_div4 * 4)
                ptrs = struct.unpack("<" + "I" * (nblocks + 1), f.read(4 * (nblocks + 1)))
                out = bytearray()
                for i in range(nblocks):
                    s, e = ptrs[i], ptrs[i + 1]
                    if s == e:
                        out.extend(b"\x00" * min(bsz, uncomp_size - len(out)))
                    else:
                        f.seek(s)
                        out.extend(zlib.decompress(f.read(e - s)))
            with open(p, "wb") as f:
                f.write(out[:uncomp_size])
            os.chmod(p, 0o755)

    # Remove old bundled libselinux so modern glibc host libselinux is used cleanly
    libdir = os.path.join(extracted, "usr/lib")
    for fn in list(os.listdir(libdir)):
        if fn.startswith("libselinux.so"):
            os.remove(os.path.join(libdir, fn))

    # Recreate ELF SONAME symlinks
    for fn in os.listdir(libdir):
        p = os.path.join(libdir, fn)
        if os.path.isfile(p) and ".so" in fn and not os.path.islink(p):
            out = subprocess.run(["readelf", "-d", p], capture_output=True, text=True).stdout
            m = re.search(r"SONAME.*?\[([^\]]+)\]", out)
            if m:
                dst = os.path.join(libdir, m.group(1))
                if not os.path.exists(dst):
                    os.symlink(fn, dst)

    os.chmod(bin_path, 0o755)
    return bin_path


if __name__ == "__main__":
    p = ensure_synfig()
    print(p)
