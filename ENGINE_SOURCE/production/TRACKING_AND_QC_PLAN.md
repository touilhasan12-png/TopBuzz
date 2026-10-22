# Shot tracking & visual QC plan — Richard Bong short

## What “track every moving element” means in this build

Each moving element gets a named **anchor/pivot**, a timed path, and an intended screen-space destination. Each shot has one dominant subject and a camera target that either follows it smoothly or deliberately stays fixed. Secondary layers (clouds, smoke, maps, props) get their own motion curves and depth speeds. During review, tracking points, motion paths, frame-safe guides, and object bounds are shown as **debug overlays only**; they are removed from the viewer-facing film. Visible tracking devices appear only when the story supports them (for example, the cockpit gunsight or a route marker on a map), never as decorative UI.

## Per-shot tracker map

| Time | Shot / dominant subject | Track anchor and camera behavior | Secondary motion and checks |
|---|---|---|---|
| 00–05 | Golden Gate opening / P-38 | Track the aircraft near its center of mass; a restrained follow-pan keeps its flight arc legible while the bridge remains a location anchor. | Clouds drift at separate parallax speeds. Check aircraft stays out of caption safe-area and does not clip during the intended entrance/exit. |
| 05–10 | Hamilton Field / walking pilot | Track Bong's upper torso, with the walking path ending at the parked P-38. | Feet must meet runway plane; walk cycle advances with distance; mechanic and parked aircraft remain anchored. |
| 10–15 | Neighborhood flyby / P-38 | Follow the low aircraft through the pass, then let the camera settle on the civilian reaction. | Laundry moves only after the aircraft passes; fence and buildings remain fixed. Check no accidental collision with rooftops or captions. |
| 15–20 | Commander's office / map route | Start attention on the route endpoint, then ease the camera toward the two-person exchange. | Route line draws toward a precise map point; gaze/head directions agree with the conversation; desk props stay pinned. |
| 20–24 | Pacific map / route marker | Track the route marker and small aircraft icon along the drawn path. | Labels stay legible and geographically anchored; marker cannot jump ahead of the route line. |
| 24–29 | Aerial combat / lead P-38 | Chase target follows the lead aircraft with a small lag; avoid a rigid “stuck to center” camera. | Wingman and opposing aircraft have independent paths and depth. Check separation, readable silhouettes, speed continuity, and no unintended overlap. |
| 29–34 | Cockpit / target aircraft | Keep cockpit and gunsight fixed; the pilot's tracked view is the camera target, while the enemy plane moves through the sight. | Reticle stays registered to the cockpit; target crosses the sight smoothly. If the view pans, move exterior layers together behind the cockpit, never the gunsight itself. |
| 34–39 | Squadron board / score | Track the chalkboard score as it counts up, then shift attention to Bong's reaction. | Score advances monotonically; faces and gaze point to the board; hands do not intersect the lettering. |
| 39–44 | Award / medal | Focus target is the medal placement at upper torso; camera push is slow and measured. | Medal, hand, and jacket stay aligned; check hand occlusion and consistent character proportions. |
| 44–49 | Homecoming / family | Track the center of the embrace, not a single face; ease the framing to preserve all three figures. | Snow has foreground/background speeds; feet remain grounded; arms and bodies maintain contact through the embrace. |
| 49–54 | P-80 takeoff | Track aircraft from runway roll through lift-off, with a smooth pan and small upward tilt. | Runway texture moves opposite the camera; wheels leave the ground at the right moment; mechanic remains safely in the foreground. |
| 54–59 | Fuel warning / cockpit gauge | Shift focus from pilot's gaze to the fuel gauge; gauge face is the camera target for the warning beat. | Needle moves continuously toward empty; warning light is restrained; cockpit remains fixed to avoid confusing camera shake with gauge motion. |
| 59–63 | Bailout / falling pilot | Track the pilot's torso through the fall; keep the damaged jet on a separate, diverging track. | Smoke follows the jet, not the pilot. Check enough separation between pilot and aircraft and preserve readable silhouette. |
| 63–68 | Parachute descent | Follow the pilot-canopy pair as one primary unit, with a slight lag on the hanging figure. | Suspension lines remain attached and taut; city/cloud layers use parallax; descent is steady and scale changes are gradual. |
| 68–74 | Newspaper | Camera tracks across the paper to the date/headline and settles. | Headline stays registered to the page; paper corner motion is subtle; coffee/pencil remain anchored to the desk. |
| 74–84 | Memorial | Begin with the aircraft pass, then settle focus on Bong's name and medal. | Jet stays behind the memorial text; medal pulse is minimal; final text remains in a protected safe area and holds long enough to read. |

## Review pass applied to every shot

1. **Path:** sample the motion at start, midpoint, and end; verify acceleration/easing and intended direction.
2. **Anchor:** confirm pivots are at real joints, aircraft centers, page corners, or other meaningful points—not arbitrary screen coordinates.
3. **Camera:** verify the camera target follows the primary subject without losing the location or disorienting the viewer.
4. **Layering:** check foreground/background ordering, occlusion, and parallax; no green-key edges, clipping, or detached shadows.
5. **Composition:** preserve title/caption safe areas and the key silhouette at 720×1280.
6. **Continuity:** compare adjacent frames and shots for scale, pose, speed, and screen direction.
7. **Final view:** remove all debug markers and watch the shot at full speed and full size before accepting it.

## Current approved look-development sample

The 6-second opening preview is composed from separate background, cloud-bank, and P-38 assets, with the existing English narration. The plane's path is tracked during rendering and will be given an explicit camera target in the full shot build. It is a look-development sample—not a final shot and not a complete rig; the aircraft will be split further where the motion needs independent propeller/wing or control-surface animation.
