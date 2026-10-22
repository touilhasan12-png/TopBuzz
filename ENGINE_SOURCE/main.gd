extends Node2D

# 2D layered cut-out production. Art is prepared as separate image assets in assets/ready;
# this script moves them, manages camera targets, captions and final compositing only.
const W: float = 720.0
const H: float = 1280.0
const FPS: float = 30.0
const LENGTH: float = 84.0
const INK := Color(0.13, 0.15, 0.17, 1.0)
const PAPER := Color(0.96, 0.93, 0.84, 0.90)
const RUST := Color(0.48, 0.18, 0.13, 1.0)

var frame_index: int = 0
var art: Dictionary = {}
var serif: Font
var sans: Font

func _ready() -> void:
	var paths := {
		"golden": "res://assets/ready/golden_gate_bg.png",
		"airfield": "res://assets/ready/airfield_bg.png",
		"neighborhood": "res://assets/ready/neighborhood_bg.png",
		"operations": "res://assets/ready/operations_bg.png",
		"map": "res://assets/ready/pacific_map_bg.png",
		"battle": "res://assets/ready/battle_bg.png",
		"award": "res://assets/ready/award_bg.png",
		"winter": "res://assets/ready/winter_home_bg.png",
		"desk": "res://assets/ready/newspaper_desk_bg.png",
		"memorial": "res://assets/ready/memorial_bg.png",
		"clouds": "res://assets/ready/clouds.png",
		"p38": "res://assets/ready/p38_flying.png",
		"p38_parked": "res://assets/ready/p38_parked.png",
		"bong": "res://assets/ready/bong_walking.png",
		"zero": "res://assets/ready/zero_fighter.png",
		"p80": "res://assets/ready/p80_jet.png",
		"falling_pilot": "res://assets/ready/falling_pilot.png",
		"parachute": "res://assets/ready/parachute_canopy.png",
		"medal": "res://assets/ready/medal.png",
		"cockpit": "res://assets/ready/cockpit_frame.png",
		"family": "res://assets/ready/homecoming_family.png"
	}
	for key in paths:
		art[key] = load(paths[key])
	serif = load("res://assets/fonts/DejaVuSerif.ttf")
	sans = load("res://assets/fonts/DejaVuSans.ttf")

func _process(_delta: float) -> void:
	frame_index += 1
	queue_redraw()

func _draw() -> void:
	var t: float = minf(float(frame_index) / FPS, LENGTH)
	var shot: int = _shot_for(t)
	match shot:
		0: _shot_golden_gate(t)
		1: _shot_airfield(t)
		2: _shot_neighborhood(t)
		3: _shot_operations(t)
		4: _shot_map(t)
		5: _shot_battle(t)
		6: _shot_cockpit(t)
		7: _shot_score(t)
		8: _shot_award(t)
		9: _shot_homecoming(t)
		10: _shot_jet(t)
		11: _shot_fuel(t)
		12: _shot_bailout(t)
		13: _shot_parachute(t)
		14: _shot_newspaper(t)
		15: _shot_memorial(t)
	_draw_editorial_overlay(shot, t)
	_draw_cut_transition(t)

func _shot_for(t: float) -> int:
	if t < 5.0: return 0
	if t < 10.0: return 1
	if t < 15.0: return 2
	if t < 20.0: return 3
	if t < 24.0: return 4
	if t < 29.0: return 5
	if t < 34.0: return 6
	if t < 39.0: return 7
	if t < 44.0: return 8
	if t < 49.0: return 9
	if t < 54.0: return 10
	if t < 59.0: return 11
	if t < 63.0: return 12
	if t < 68.0: return 13
	if t < 74.0: return 14
	return 15

func _shot_start(shot: int) -> float:
	var starts := [0.0, 5.0, 10.0, 15.0, 20.0, 24.0, 29.0, 34.0,
		39.0, 44.0, 49.0, 54.0, 59.0, 63.0, 68.0, 74.0]
	return float(starts[shot])

func _u(t: float, shot: int) -> float:
	var ends := [5.0, 10.0, 15.0, 20.0, 24.0, 29.0, 34.0, 39.0,
		44.0, 49.0, 54.0, 59.0, 63.0, 68.0, 74.0, 84.0]
	return clampf((t - _shot_start(shot)) / (float(ends[shot]) - _shot_start(shot)), 0.0, 1.0)

func _smooth(u: float) -> float:
	var x := clampf(u, 0.0, 1.0)
	return x*x*(3.0 - 2.0*x)

func _bezier(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, u: float) -> Vector3:
	var x := clampf(u, 0.0, 1.0)
	var v := 1.0 - x
	var px := v*v*v*p0.x + 3.0*v*v*x*p1.x + 3.0*v*x*x*p2.x + x*x*x*p3.x
	var py := v*v*v*p0.y + 3.0*v*v*x*p1.y + 3.0*v*x*x*p2.y + x*x*x*p3.y
	var dx := 3.0*v*v*(p1.x-p0.x) + 6.0*v*x*(p2.x-p1.x) + 3.0*x*x*(p3.x-p2.x)
	var dy := 3.0*v*v*(p1.y-p0.y) + 6.0*v*x*(p2.y-p1.y) + 3.0*x*x*(p3.y-p2.y)
	return Vector3(px, py, atan2(dy, dx))

func _camera(target: Vector2, home: Vector2, follow: float) -> Vector2:
	# Damped analytic follow target; no debug marker is drawn in the final film.
	return (target - home) * follow

func _bg(key: String, cam: Vector2 = Vector2.ZERO, zoom: float = 1.045, tint: Color = Color.WHITE) -> void:
	var tex: Texture2D = art.get(key)
	if tex == null: return
	var size := Vector2(W, H) * zoom
	var top_left := (Vector2(W, H) - size) * 0.5 - cam
	draw_texture_rect(tex, Rect2(top_left, size), false, tint)

func _sprite(key: String, position: Vector2, width: float, rotation: float = 0.0, tint: Color = Color.WHITE) -> void:
	var tex: Texture2D = art.get(key)
	if tex == null or width <= 0.0: return
	var scale: float = width / float(tex.get_width())
	draw_set_transform(position, rotation, Vector2(scale, scale))
	draw_texture(tex, -tex.get_size() * 0.5, tint)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _label(text: String, x: float, y: float, size: int, color: Color = INK, align: HorizontalAlignment = HORIZONTAL_ALIGNMENT_LEFT, width: float = 650.0, use_serif: bool = false) -> void:
	var f: Font = serif if use_serif else sans
	draw_string(f, Vector2(x + 1.5, y + 2.0), text, align, width, size, Color(0.10, 0.10, 0.10, 0.35))
	draw_string(f, Vector2(x, y), text, align, width, size, color)

func _cloud(key_pos: Vector2, width: float, alpha: float = 0.65, rotation: float = 0.0) -> void:
	_sprite("clouds", key_pos, width, rotation, Color(1.0, 1.0, 1.0, alpha))

func _draw_editorial_overlay(shot: int, t: float) -> void:
	var labels := ["SAN FRANCISCO  /  1942", "HAMILTON FIELD", "SAN FRANCISCO", "SQUADRON OPERATIONS", "THE PACIFIC", "NEW GUINEA", "COCKPIT VIEW", "SQUADRON BOARD", "AWARD CEREMONY", "HOME  /  1944", "CALIFORNIA  /  1945", "FUEL WARNING", "TEST FLIGHT", "TOO LOW", "AUGUST 6  /  1945", "RICHARD IRA BONG  /  1920–1945"]
	var captions := ["THE LOOP THAT NEARLY GROUNDED HIM", "A NEW PILOT. A NEW P-38.", "LOW OVER THE NEIGHBORHOOD", "THE COMMANDER CALLED HIM IN", "THE PACIFIC THEATER", "FORTY CONFIRMED VICTORIES", "ONE SECOND TO TURN", "THE SCORE KEPT RISING", "THE MEDAL OF HONOR", "HOME, AT LAST", "THE NEW P-80", "FUEL PRESSURE DROPPING", "TOO LOW FOR THE PARACHUTE", "THE GROUND RUSHED CLOSER", "A LAST TEST FLIGHT", "FORTY VICTORIES. ONE LASTING LEGACY."]
	# Thin archival locator, kept away from the animated subject's safe area.
	var fade := 1.0
	if t < 0.45: fade = _smooth(t / 0.45)
	draw_line(Vector2(34.0, 91.0), Vector2(82.0, 91.0), Color(RUST.r, RUST.g, RUST.b, 0.86*fade), 3.0, true)
	_label(str(labels[shot]), 94.0, 98.0, 20, Color(0.19, 0.21, 0.21, 0.94*fade))
	var local := t - _shot_start(shot)
	var fade_in := _smooth(clampf(local / 0.25, 0.0, 1.0))
	var shot_len := float([5,5,5,5,4,5,5,5,5,5,5,5,4,5,6,10][shot])
	var fade_out := _smooth(clampf((shot_len - local) / 0.25, 0.0, 1.0))
	var caption_fade := minf(fade_in, fade_out)
	if caption_fade > 0.0:
		draw_rect(Rect2(30.0, 1085.0, 660.0, 88.0), Color(PAPER.r, PAPER.g, PAPER.b, 0.80*caption_fade))
		draw_line(Vector2(52.0, 1102.0), Vector2(104.0, 1102.0), Color(RUST.r, RUST.g, RUST.b, caption_fade), 3.0, true)
		_label(str(captions[shot]), 52.0, 1148.0, 27, Color(INK.r, INK.g, INK.b, caption_fade), HORIZONTAL_ALIGNMENT_LEFT, 616.0, true)
	# A faint print edge and vignette keep the layered images inside one visual world.
	draw_rect(Rect2(18.0, 18.0, W-36.0, H-36.0), Color(0.19, 0.17, 0.14, 0.10), false, 1.5)

func _draw_cut_transition(t: float) -> void:
	var cuts := [5.0, 10.0, 15.0, 20.0, 24.0, 29.0, 34.0, 39.0, 44.0, 49.0, 54.0, 59.0, 63.0, 68.0, 74.0]
	for cut in cuts:
		var d := absf(t - float(cut))
		if d < 0.05:
			draw_rect(Rect2(0.0, 0.0, W, H), Color(0.93, 0.88, 0.75, (0.05-d)*1.6))
			return

# ── 01 Golden Gate: the aircraft is the tracked subject; clouds have independent drift.
func _shot_golden_gate(t: float) -> void:
	var u := _u(t, 0)
	var p: Vector3
	if u < 0.55:
		p = _bezier(Vector2(-230, 690), Vector2(-30, 580), Vector2(160, 375), Vector2(350, 520), u/0.55)
	else:
		p = _bezier(Vector2(350, 520), Vector2(440, 680), Vector2(470, 410), Vector2(510, 350), (u-0.55)/0.45)
	var target := Vector2(p.x, p.y)
	var cam := _camera(target, Vector2(360, 520), 0.20)
	_bg("golden", cam, 1.07)
	_cloud(Vector2(310.0 - 27.0*u, 426.0) - cam*0.72, 900.0, 0.82)
	_cloud(Vector2(680.0 - 18.0*u, 315.0) - cam*0.42, 555.0, 0.30)
	var scale_w := 350.0 + 55.0*sin(PI*u) - 15.0*u
	_sprite("p38", target - cam, scale_w, clampf(p.z*0.55, -0.22, 0.22))

# ── 02 Hamilton Field: foot anchor stays on runway while camera eases with Bong.
func _shot_airfield(t: float) -> void:
	var u := _smooth(_u(t, 1))
	var x := 98.0 + 210.0*u
	var foot_y := 1010.0 + 2.8*sin((t-5.0)*8.5)
	var target := Vector2(x, foot_y-135.0)
	var cam := _camera(target, Vector2(300, 780), 0.13)
	_bg("airfield", cam, 1.06)
	_sprite("p38_parked", Vector2(498, 930)-cam, 395.0, 0.0, Color(1,1,1,0.97))
	var walk_phase := (t-5.0)*5.3
	_sprite("bong", Vector2(x, foot_y-350.0)-cam, 176.0, 0.015*sin(walk_phase))
	_cloud(Vector2(790.0-(t-5.0)*12.0, 280.0)-cam*0.35, 610.0, 0.22)

# ── 03 Low neighborhood pass: camera follows the P-38; buildings remain an anchor.
func _shot_neighborhood(t: float) -> void:
	var u := _smooth(_u(t, 2))
	var pos := Vector2(-190.0 + 940.0*u, 480.0 + 28.0*sin(u*TAU))
	var cam := _camera(pos, Vector2(355, 480), 0.19)
	_bg("neighborhood", cam, 1.08)
	_cloud(Vector2(400.0-40.0*u, 270.0)-cam*0.4, 920.0, 0.50)
	_sprite("p38", pos-cam, 330.0+22.0*sin(PI*u), -0.04+0.06*sin(u*TAU))

# ── 04 Operations room: map route is the focus target before attention shifts to Bong.
func _shot_operations(t: float) -> void:
	var u := _smooth(_u(t, 3))
	var focus := Vector2(340.0-55.0*u, 488.0+70.0*u)
	var cam := _camera(focus, Vector2(350, 600), 0.10)
	_bg("operations", cam, 1.06)
	# The Pacific chart is a separate printed prop placed onto the room wall.
	var chart := art.get("map") as Texture2D
	if chart != null:
		draw_texture_rect(chart, Rect2(Vector2(63, 245)-cam*0.55, Vector2(244, 430)), false)
	var route := PackedVector2Array([Vector2(105, 440), Vector2(157, 505), Vector2(230, 554), Vector2(277, 632)])
	_draw_partial_path(route, u, Color(0.70,0.23,0.13,0.95), 4.0)
	_sprite("bong", Vector2(482.0+15.0*sin(u*PI), 855.0)-cam, 200.0, 0.0)
	_label("OPERATIONAL MAP", 88.0-cam.x*0.55, 723.0-cam.y*0.55, 17, Color(0.31,0.28,0.22,0.90))

# ── 05 Pacific map: route, marker and aircraft share one coordinate system.
func _shot_map(t: float) -> void:
	var u := _smooth(_u(t, 4))
	var pts := PackedVector2Array([Vector2(155, 336), Vector2(273, 410), Vector2(386, 514), Vector2(499, 635), Vector2(578, 795)])
	var marker := _point_on_path(pts, u)
	var cam := _camera(marker, Vector2(360, 620), 0.13)
	_bg("map", cam, 1.05)
	_draw_partial_path(pts, u, Color(0.68,0.22,0.13,0.94), 5.0, -cam)
	_sprite("p38", marker-cam, 104.0, -0.30)
	_label("NEW GUINEA", 385.0-cam.x, 812.0-cam.y, 22, Color(0.22,0.25,0.25,0.95), HORIZONTAL_ALIGNMENT_LEFT, 250.0, true)
	_label("LAE", 440.0-cam.x, 670.0-cam.y, 17, Color(0.22,0.25,0.25,0.95))

# ── 06 Aerial combat: tracked lead aircraft, separate wingman and Zero tracks.
func _shot_battle(t: float) -> void:
	var u := _smooth(_u(t, 5))
	var lead := Vector2(80.0+560.0*u, 368.0+64.0*sin(u*TAU))
	var zero := Vector2(650.0-470.0*u, 528.0-115.0*sin(PI*u))
	var cam := _camera(lead, Vector2(360, 440), 0.18)
	_bg("battle", cam, 1.075)
	_cloud(Vector2(435.0-25.0*u, 284.0)-cam*0.42, 900.0, 0.36)
	_sprite("zero", zero-cam*0.88, 270.0, PI+0.08*sin(u*TAU))
	_sprite("p38", Vector2(lead.x-250.0, lead.y+145.0)-cam*0.72, 185.0, -0.10)
	_sprite("p38", lead-cam, 375.0+20.0*sin(PI*u), -0.08+0.18*sin(u*TAU))
	if u > 0.42 and u < 0.66:
		_draw_burst(Vector2(420.0, 468.0)-cam, 22.0*(1.0-absf(u-0.54)/0.12))

# ── 07 Cockpit: fixed frame; visible gunsight tracks the enemy aircraft.
func _shot_cockpit(t: float) -> void:
	var u := _smooth(_u(t, 6))
	_bg("battle", Vector2.ZERO, 1.06)
	_cloud(Vector2(356.0, 505.0), 760.0, 0.22)
	var target := Vector2(358.0+108.0*sin(u*TAU), 905.0+34.0*cos(u*TAU*0.7))
	_sprite("zero", target, 245.0, 0.12*sin(u*TAU))
	# Cockpit and gunsight stay fixed; the target crosses the sight as the pilot tracks it.
	_sprite("cockpit", Vector2(360, 834), 920.0, 0.0)
	_draw_gunsight(Vector2(360.0, 948.0), 28.0)

# ── 08 Scoreboard: typography carries the changing tally; pilot remains a separate track.
func _shot_score(t: float) -> void:
	var u := _smooth(_u(t, 7))
	var focus := Vector2(360.0, 525.0)
	var cam := _camera(focus, Vector2(360, 560), 0.08)
	_bg("operations", cam, 1.06)
	# A paper-mounted squadron tally, designed as editorial typography rather than a full plate.
	draw_rect(Rect2(78-cam.x*0.4, 247-cam.y*0.4, 560, 450), Color(0.13,0.17,0.18,0.94))
	draw_rect(Rect2(90-cam.x*0.4, 259-cam.y*0.4, 536, 426), Color(0.80,0.78,0.67,0.16), false, 2.0)
	_label("SQUADRON TALLY", 360-cam.x*0.4, 324-cam.y*0.4, 27, Color(0.91,0.88,0.77,0.95), HORIZONTAL_ALIGNMENT_CENTER, 500.0, true)
	var score := int(lerpf(26.0, 40.0, u))
	_label(str(score), 360-cam.x*0.4, 514-cam.y*0.4, 112, Color(0.97,0.94,0.82,1.0), HORIZONTAL_ALIGNMENT_CENTER, 500.0, true)
	_label("CONFIRMED VICTORIES", 360-cam.x*0.4, 577-cam.y*0.4, 21, Color(0.88,0.83,0.70,0.95), HORIZONTAL_ALIGNMENT_CENTER, 500.0)
	_sprite("bong", Vector2(545.0, 938.0), 168.0, 0.0)

# ── 09 Award: medal tracks to the pilot's chest and settles there.
func _shot_award(t: float) -> void:
	var u := _smooth(_u(t, 8))
	var pilot := Vector2(352.0, 874.0)
	var cam := _camera(pilot, Vector2(360, 830), 0.08)
	_bg("award", cam, 1.055)
	_sprite("bong", pilot-cam, 252.0, 0.0)
	var medal_pos := Vector2(353.0, 564.0).lerp(Vector2(351.0, 795.0), _smooth(clampf(u*1.45,0.0,1.0))) - cam
	var medal_scale := 96.0 + 16.0*sin(PI*u)
	_sprite("medal", medal_pos, medal_scale, -0.04+0.04*sin(u*TAU))

# ── 10 Homecoming: camera follows the reunion; snow drifts in separate depth layers.
func _shot_homecoming(t: float) -> void:
	var u := _smooth(_u(t, 9))
	var pilot_x := 170.0+142.0*u
	var focus := Vector2(370.0, 860.0)
	var cam := _camera(focus, Vector2(360, 860), 0.12)
	_bg("winter", cam, 1.06)
	_draw_snow(t, 24, 0.42, 0.58)
	_sprite("family", Vector2(528.0, 850.0)-cam*0.95, 232.0, 0.0)
	_sprite("bong", Vector2(pilot_x, 852.0)-cam, 162.0, 0.02*sin(u*TAU))
	_draw_snow(t+0.5, 12, 0.72, 0.90)

# ── 11 P-80 test-flight takeoff: camera follows the jet while runway shifts in parallax.
func _shot_jet(t: float) -> void:
	var u := _smooth(_u(t, 10))
	var pos := Vector2(104.0+500.0*u, 954.0-260.0*u)
	var cam := _camera(pos, Vector2(370, 780), 0.23)
	_bg("airfield", cam, 1.08)
	_sprite("p80", pos-cam, 470.0-35.0*u, -0.06-0.27*u)
	_cloud(Vector2(650.0-28.0*u, 352.0)-cam*0.4, 655.0, 0.20)

# ── 12 Fuel warning: the gaze shifts from the pilot's view to the instrument.
func _shot_fuel(t: float) -> void:
	var u := _smooth(_u(t, 11))
	_bg("battle", Vector2.ZERO, 1.05, Color(0.72,0.78,0.79,1.0))
	_cloud(Vector2(340, 460), 850.0, 0.18)
	_sprite("cockpit", Vector2(360, 834), 920.0, 0.0)
	_draw_fuel_gauge(Vector2(535, 975), u)
	var warning_alpha := clampf((u-0.38)*2.6,0.0,0.75)
	_label("FUEL LOW", 535.0, 1060.0, 17, Color(0.75,0.22,0.12,warning_alpha), HORIZONTAL_ALIGNMENT_CENTER, 150.0)

# ── 13 Bailout: falling pilot and damaged jet use divergent, independently tracked paths.
func _shot_bailout(t: float) -> void:
	var u := _u(t, 12)
	var pilot_pos := Vector2(290.0+28.0*sin(u*PI*2.4), 370.0+205.0*u)
	var jet_pos := Vector2(472.0+148.0*u, 245.0+150.0*u)
	var cam := _camera(pilot_pos, Vector2(360, 540), 0.16)
	_bg("battle", cam, 1.07)
	_sprite("clouds", jet_pos-Vector2(170,55)-cam*0.85, 305.0, 0.16, Color(0.39,0.40,0.39,0.60))
	_sprite("p80", jet_pos-cam, 318.0-40.0*u, 0.28+0.08*u)
	_sprite("falling_pilot", pilot_pos-cam, 230.0, 0.06*sin(u*PI*2.0))

# ── 14 Parachute: canopy and pilot are separately anchored and gently descend together.
func _shot_parachute(t: float) -> void:
	var u := _smooth(_u(t, 13))
	var rig_y := 520.0+98.0*u
	var focus := Vector2(360.0, rig_y+170.0)
	var cam := _camera(focus, Vector2(360, 675), 0.12)
	_bg("battle", cam, 1.06)
	_cloud(Vector2(245.0-20.0*u, 310.0)-cam*0.5, 790.0, 0.27)
	_sprite("parachute", Vector2(360.0, rig_y)-cam, 430.0, 0.015*sin(u*TAU))
	_sprite("falling_pilot", Vector2(360.0, rig_y+275.0)-cam, 152.0, PI*0.5+0.02*sin(u*TAU))
	_draw_snow(t+12.0, 10, 0.35, 0.45)

# ── 15 Newspaper: typography is laid onto a paper prop; camera tracks the headline.
func _shot_newspaper(t: float) -> void:
	var u := _smooth(_u(t, 14))
	var cam_y := 68.0*u
	_bg("desk", Vector2(0, cam_y*0.16), 1.06)
	var sheet := Rect2(70.0, 148.0-cam_y, 580.0, 890.0)
	draw_rect(sheet.grow(7.0), Color(0.10,0.08,0.06,0.26))
	draw_rect(sheet, Color(0.92,0.88,0.76,0.98))
	draw_rect(Rect2(sheet.position+Vector2(17,17),Vector2(sheet.size.x-34,2)), Color(0.25,0.22,0.18,0.65))
	_label("THE EVENING HERALD", 360.0, 215.0-cam_y, 28, Color(0.17,0.16,0.14,1.0), HORIZONTAL_ALIGNMENT_CENTER, 520.0, true)
	_label("BONG KILLED IN TEST FLIGHT", 360.0, 295.0-cam_y, 31, Color(0.12,0.12,0.11,1.0), HORIZONTAL_ALIGNMENT_CENTER, 525.0, true)
	_label("AUGUST 6, 1945", 360.0, 337.0-cam_y, 17, Color(0.26,0.23,0.19,0.95), HORIZONTAL_ALIGNMENT_CENTER, 520.0)
	_sprite("p38", Vector2(360.0, 532.0-cam_y), 315.0, -0.03, Color(0.78,0.76,0.69,0.90))
	for row in range(8):
		var yy := 670.0+float(row)*24.0-cam_y
		draw_line(Vector2(112,yy),Vector2(608,yy),Color(0.31,0.28,0.23,0.44),2.0,true)
	_label("40 VICTORIES. A LIFE OF SERVICE.", 360.0, 915.0-cam_y, 20, Color(0.18,0.17,0.15,0.96), HORIZONTAL_ALIGNMENT_CENTER, 500.0, true)

# ── 16 Memorial: attention moves from the last aircraft pass to name and medal.
func _shot_memorial(t: float) -> void:
	var u := _smooth(_u(t, 15))
	_bg("memorial", Vector2.ZERO, 1.045)
	var jet_u := clampf(u*1.45,0.0,1.0)
	var jet_pos := Vector2(820.0-550.0*jet_u, 660.0+10.0*sin(u*TAU))
	_sprite("p80", jet_pos, 265.0, PI+0.02*sin(u*TAU), Color(0.86,0.88,0.88,0.60))
	var medal_alpha := _smooth(clampf((u-0.18)/0.28,0.0,1.0))
	_sprite("medal", Vector2(360.0, 442.0), 166.0+5.0*sin(u*TAU), 0.0, Color(1,1,1,medal_alpha))
	var title_alpha := _smooth(clampf((u-0.28)/0.24,0.0,1.0))
	_label("RICHARD IRA BONG", 360.0, 834.0, 42, Color(0.97,0.94,0.84,title_alpha), HORIZONTAL_ALIGNMENT_CENTER, 660.0, true)
	_label("AMERICA'S ACE OF ACES", 360.0, 890.0, 24, Color(0.95,0.91,0.81,title_alpha), HORIZONTAL_ALIGNMENT_CENTER, 660.0)
	_label("40 VICTORIES  /  MEDAL OF HONOR", 360.0, 946.0, 19, Color(0.86,0.72,0.48,title_alpha), HORIZONTAL_ALIGNMENT_CENTER, 660.0)
	_label("1920 — AUGUST 6, 1945", 360.0, 992.0, 18, Color(0.83,0.84,0.81,title_alpha), HORIZONTAL_ALIGNMENT_CENTER, 660.0)

# ── Movement and effect helpers ──────────────────────────────────────────────
func _point_on_path(points: PackedVector2Array, progress: float) -> Vector2:
	if points.size() < 2: return Vector2.ZERO
	var total := float(points.size()-1)
	var v := clampf(progress,0.0,1.0)*total
	var idx := mini(int(floor(v)), points.size()-2)
	return points[idx].lerp(points[idx+1],v-float(idx))

func _draw_partial_path(points: PackedVector2Array, progress: float, color: Color, width: float, offset: Vector2 = Vector2.ZERO) -> void:
	if points.size() < 2: return
	var count := 40
	var visible := PackedVector2Array()
	for i in range(count+1):
		var u := float(i)/float(count)
		if u > progress: break
		visible.append(_point_on_path(points,u)+offset)
	if visible.size() > 1:
		draw_polyline(visible,color,width,true)
	var marker := _point_on_path(points,progress)+offset
	draw_circle(marker,8.0,Color(0.97,0.90,0.69,0.95))
	draw_arc(marker,12.0,0.0,TAU,40,color,2.0,true)

func _draw_gunsight(center: Vector2, radius: float) -> void:
	var c := Color(0.70,0.18,0.13,0.88)
	draw_arc(center,radius,0.0,TAU,48,c,2.0,true)
	draw_line(center+Vector2(-radius-14,0),center+Vector2(-7,0),c,2.0,true)
	draw_line(center+Vector2(7,0),center+Vector2(radius+14,0),c,2.0,true)
	draw_line(center+Vector2(0,-radius-14),center+Vector2(0,-7),c,2.0,true)
	draw_line(center+Vector2(0,7),center+Vector2(0,radius+14),c,2.0,true)
	draw_circle(center,2.5,c)

func _draw_fuel_gauge(center: Vector2, u: float) -> void:
	draw_circle(center,53.0,Color(0.08,0.10,0.10,0.92))
	draw_arc(center,49.0,0.0,TAU,64,Color(0.82,0.79,0.69,0.94),2.0,true)
	for i in range(9):
		var a := deg_to_rad(140.0+float(i)*32.5)
		var a0 := center+Vector2(cos(a),sin(a))*37.0
		var a1 := center+Vector2(cos(a),sin(a))*44.0
		draw_line(a0,a1,Color(0.89,0.87,0.77,0.86),1.7,true)
	var needle := deg_to_rad(140.0+150.0*(1.0-u))
	draw_line(center,center+Vector2(cos(needle),sin(needle))*33.0,Color(0.82,0.25,0.15,0.97),3.0,true)
	draw_circle(center,4.5,Color(0.91,0.85,0.70,1.0))
	_label("FUEL",center.x,center.y+71.0,15,Color(0.92,0.89,0.80,0.95),HORIZONTAL_ALIGNMENT_CENTER,120.0)

func _draw_burst(center: Vector2, radius: float) -> void:
	if radius <= 0.0: return
	var warm := Color(0.93,0.70,0.34,0.78)
	draw_arc(center,radius,0.0,TAU,24,warm,2.0,true)
	for i in range(8):
		var a := TAU*float(i)/8.0
		draw_line(center+Vector2(cos(a),sin(a))*radius*1.2,center+Vector2(cos(a),sin(a))*radius*1.7,warm,1.4,true)

func _draw_snow(seed_time: float, count: int, alpha: float, speed: float) -> void:
	for i in range(count):
		var x0 := fposmod(float(i)*137.0+sin(seed_time*0.23+float(i))*31.0,W)
		var y := fposmod(float(i)*193.0+seed_time*54.0*speed,H)
		var r := 1.2+float(i%3)*0.55
		draw_circle(Vector2(x0,y),r,Color(1.0,0.97,0.88,alpha))
