# Richard Bong — Ace of Aces

An approximately 84-second English-language portrait animation about Richard Bong, created from original 2D vector drawings in Godot. Characters, facial features, limbs, aircraft, scenery, smoke, props, flight paths, and transitions are drawn as separate shapes and animated in code. The long-form project uses no full-frame generated-image plates or camera-pan substitute animation.

## Video target

- Portrait, 720 × 1280 (9:16)
- 30 frames per second
- 84 seconds (the four narration clips total approximately 83.8 seconds)
- English narration and English on-screen text
- H.264 video with AAC audio, `yuv420p`

## Story beats

Golden Gate opening; Hamilton Field training; a low neighborhood flyby; the commander’s office; Pacific deployment; aerial combat and the confirmed-victory tally; Medal of Honor; homecoming; the P-80 test-flight sequence; and a closing memorial card.

## Render on GitHub

The `Render Richard Bong epic short` workflow is manually dispatched so a push does not start a render automatically:

1. Open the repository’s **Actions** tab.
2. Select **Render Richard Bong epic short**.
3. Choose **Run workflow** on `main`.
4. Download the `richard-bong-ace-of-aces-84s` artifact when the run completes. The artifact is retained for seven days.

The workflow validates the Godot project, renders 2,520 frames with Godot 4.4.1, joins the four English narration clips, muxes the final MP4, and checks the stream dimensions, frame rate, codec, and duration.

## Project files

- `main.gd` — hand-drawn vector scenes, character rigs, aircraft, motion, captions, and transitions
- `main.tscn` — scene entry point
- `audio/narration_01.mp3` … `audio/narration_04.mp3` — English narration segments
- `project.godot` — 720 × 1280 portrait project settings
- `TEST_PLAN.md` — acceptance checks

## Historical references

- [National WWII Museum: Richard Bong and the Medal of Honor](https://www.nationalww2museum.org/war/articles/richard-bong-medal-of-honor)
- [National Museum of the U.S. Air Force: America’s Top Two Aces](https://www.nationalmuseum.af.mil/Visit/Museum-Exhibits/Fact-Sheets/Display/Article/196781/americas-top-two-aces/)
