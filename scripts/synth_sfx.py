#!/usr/bin/env python3
"""Synthesize the documentary SFX suite locally (CC0, our own work).

Guaranteed baseline so the mix never depends on third-party downloads.
Output: 48kHz stereo WAVs into --out dir.
"""
import argparse, math, os
import numpy as np
import wave

SR = 48000

def save(path, x):
    x = np.clip(x, -1.0, 1.0)
    st = np.stack([x, x], axis=-1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())

def env_dur(n, attack, release):
    e = np.ones(n)
    a = max(1, int(attack * SR))
    r = max(1, int(release * SR))
    e[:a] = np.linspace(0, 1, a)
    e[-r:] = np.linspace(1, 0, r)
    return e

def lowpass(x, alpha):
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += alpha * (x[i] - acc)
        y[i] = acc
    return y

def braam(dur=2.6, f0=55.0):
    t = np.arange(int(dur * SR)) / SR
    saw = lambda f: 2 * ((t * f) % 1) - 1
    x = (0.5 * saw(f0) + 0.3 * saw(f0 * 0.5) + 0.2 * saw(f0 * 1.5 + 1.7))
    x = lowpass(x, 0.06)
    x *= env_dur(len(x), 0.02, dur * 0.55)
    return x * 0.9

def whoosh(dur=1.1):
    n = int(dur * SR)
    rng = np.random.default_rng(7)
    nz = rng.standard_normal(n)
    t = np.arange(n) / SR
    # moving band emphasis: multiply smoothed noise by rising sine window
    sm = lowpass(nz, 0.10 + 0.30 * (t / dur))
    return sm * np.sin(np.pi * t / dur) ** 1.5 * 0.8

def riser(dur=2.0):
    t = np.arange(int(dur * SR)) / SR
    f = 90 + (700 - 90) * (t / dur) ** 2
    ph = np.cumsum(f / SR) * 2 * np.pi
    x = np.sin(ph) * 0.5 + 0.3 * np.sin(ph * 0.5)
    x = lowpass(x, 0.25)
    x *= np.linspace(0.05, 1.0, len(x)) ** 1.5
    x *= env_dur(len(x), 0.03, 0.03)
    return x * 0.8

def sonar_ping(dur=1.8, f=2100.0):
    t = np.arange(int(dur * SR)) / SR
    ping = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.25)
    echo = np.sin(2 * np.pi * f * (t - 0.45).clip(0)) * np.exp(-(t - 0.45).clip(0) / 0.35) * (t >= 0.45)
    return (ping + 0.45 * echo) * 0.55

def telex(dur=1.6):
    n = int(dur * SR)
    rng = np.random.default_rng(3)
    x = np.zeros(n)
    for st, d, f in [(int(s * SR), int(0.05 * SR), 1650)
                     for s in [0.0, 0.18, 0.36, 0.62, 0.8, 1.15]]:
        tt = np.arange(d) / SR
        x[st:st + d] += np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.02)
    return x * 0.5

def impact(dur=0.8):
    t = np.arange(int(dur * SR)) / SR
    x = np.sin(2 * np.pi * (60 + 90 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.12)
    x += 0.4 * np.random.default_rng(11).standard_normal(len(t)) * np.exp(-t / 0.03)
    return lowpass(x, 0.2) * 0.9

def heartbeat(dur=1.6):
    t = np.arange(int(dur * SR)) / SR
    x = np.zeros_like(t)
    for off in [0.0, 0.22, 0.9, 1.12]:
        tt = t - off
        x += np.where(tt > 0, np.sin(2 * np.pi * 58 * tt) * np.exp(-np.clip(tt, 0, None) / 0.09), 0)
    return x * 0.75

def tick(dur=0.25, f=3200.0):
    t = np.arange(int(dur * SR)) / SR
    return np.sin(2 * np.pi * f * t) * np.exp(-t / 0.03) * 0.35

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="sfx_out")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    items = {
        "braam.wav": braam(), "whoosh.wav": whoosh(), "riser.wav": riser(),
        "sonar_ping.wav": sonar_ping(), "telex.wav": telex(),
        "impact.wav": impact(), "heartbeat.wav": heartbeat(), "tick.wav": tick(),
    }
    for n, x in items.items():
        save(os.path.join(a.out, n), x)
        print("sfx", n, f"{len(x)/SR:.2f}s", flush=True)

if __name__ == "__main__":
    main()
