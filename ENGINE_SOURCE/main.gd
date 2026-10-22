extends Node2D

# Original vector/cutout animation: separately drawn characters, limbs, aircraft,
# props, smoke, and backgrounds. No full-frame AI plates are used.
const W := 720.0
const H := 1280.0
const FPS := 30.0
const LENGTH := 84.0
const INK := Color(0.075, 0.085, 0.12, 1.0)
const SKY := Color(0.35, 0.66, 0.88, 1.0)
const SKY_LIGHT := Color(0.68, 0.85, 0.93, 1.0)
const RED := Color(0.78, 0.22, 0.16, 1.0)
const RED_LIGHT := Color(0.94, 0.39, 0.28, 1.0)
const OLIVE := Color(0.31, 0.39, 0.25, 1.0)
const OLIVE_LIGHT := Color(0.45, 0.51, 0.34, 1.0)
const CREAM := Color(0.97, 0.94, 0.84, 1.0)
const WOOD := Color(0.40, 0.25, 0.17, 1.0)
const NIGHT := Color(0.08, 0.12, 0.25, 1.0)

var frame_index: int = 0

func _process(_delta: float) -> void:
	frame_index += 1
	queue_redraw()

func _draw() -> void:
	var t := minf(float(frame_index) / FPS, LENGTH)
	var shot := _shot_for(t)
	match shot:
		0: _scene_bridge(t)
		1: _scene_airfield(t)
		2: _scene_neighborhood(t)
		3: _scene_office(t)
		4: _scene_map(t)
		5: _scene_battle(t)
		6: _scene_cockpit(t)
		7: _scene_scoreboard(t)
		8: _scene_award(t)
		9: _scene_homecoming(t)
		10: _scene_jet(t)
		11: _scene_fuel(t)
		12: _scene_bailout(t)
		13: _scene_parachute(t)
		14: _scene_newspaper(t)
		15: _scene_memorial(t)
	_draw_bottom_shade()
	_draw_top_label(shot, t)
	_draw_caption(t)
	_draw_cut_flash(t)

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

# ── 01: the Golden Gate hook ────────────────────────────────────────────────
func _scene_bridge(t: float) -> void:
	_draw_sky(t, false)
	_draw_sun(Vector2(595.0, 158.0), 42.0)
	_draw_cloud(Vector2(116.0 + sin(t * 0.6) * 7.0, 226.0), 176.0, 82.0)
	_draw_cloud(Vector2(575.0 - sin(t * 0.5) * 9.0, 365.0), 150.0, 70.0)
	_draw_bay_and_hills(t)
	_draw_golden_gate()
	var p := clampf((t - 0.55) / 3.9, 0.0, 1.0)
	_draw_ellipse_trail(Vector2(390.0, 515.0), Vector2(225.0, 188.0), p)
	var a := -PI * 0.5 + p * TAU
	var plane_pos := Vector2(390.0 + cos(a) * 225.0, 515.0 + sin(a) * 188.0)
	var tangent := Vector2(-sin(a) * 225.0, cos(a) * 188.0)
	_draw_p38(plane_pos, tangent.angle(), 0.86, t)
	if t > 3.4:
		_draw_speed_lines(plane_pos, tangent.normalized(), 3, 0.42)

# ── 02: training base ───────────────────────────────────────────────────────
func _scene_airfield(t: float) -> void:
	var u := t - 5.0
	_draw_sky(t, false)
	_draw_cloud(Vector2(140.0 + sin(u * 0.3) * 9.0, 200.0), 165.0, 70.0)
	_draw_hills()
	_draw_hangar(Vector2(394.0, 470.0), 1.0)
	_draw_runway()
	_draw_parked_p38(Vector2(535.0, 780.0), 0.62)
	_draw_flag(Vector2(630.0, 410.0), u)
	var walk_x := 115.0 + clampf(u / 4.6, 0.0, 1.0) * 175.0
	_draw_person(Vector2(walk_x, 1010.0), 1.12, "pilot", 1, 1, t)
	_draw_person(Vector2(602.0, 1008.0), 0.82, "mechanic", 0, 0, t)
	if u > 2.3:
		_draw_dust(Vector2(walk_x + 34.0, 1008.0), u)

# ── 03: neighborhood flyby ──────────────────────────────────────────────────
func _scene_neighborhood(t: float) -> void:
	var u := t - 10.0
	_draw_sky(t, false)
	_draw_cloud(Vector2(112.0, 194.0), 155.0, 69.0)
	_draw_cloud(Vector2(590.0, 255.0), 140.0, 65.0)
	_draw_neighborhood()
	_draw_fence_and_clothesline(u)
	var fly := 800.0 - clampf(u / 4.8, 0.0, 1.0) * 950.0
	var plane_y := 400.0 + sin(u * 1.7) * 28.0
	_draw_p38(Vector2(fly, plane_y), -0.06, 0.58, t)
	_draw_person(Vector2(435.0, 1010.0), 1.02, "civilian", 2, 2, t)
	if u > 1.4:
		_draw_laundry_blowoff(u)

# ── 04: the office ──────────────────────────────────────────────────────────
func _scene_office(t: float) -> void:
	var u := t - 15.0
	_draw_wood_wall(0.0, 0.0, W, H)
	_draw_window(Vector2(442.0, 274.0), Vector2(202.0, 234.0))
	_draw_wall_map(Vector2(60.0, 145.0), Vector2(252.0, 198.0), u)
	_draw_desk(Vector2(0.0, 779.0), W, 269.0)
	_draw_papers(Vector2(282.0, 786.0), u)
	_draw_lamp(Vector2(572.0, 541.0))
	_draw_person(Vector2(502.0, 1008.0), 1.0, "commander", 2, 2, t)
	_draw_person(Vector2(233.0 + sin(u * 0.6) * 4.0, 1009.0), 1.04, "pilot", 1, 0, t)
	if u > 2.0:
		_draw_route_line(Vector2(126.0, 241.0), Vector2(235.0, 184.0), clampf((u - 2.0) / 2.0, 0.0, 1.0))

# ── 05: map to the Pacific ──────────────────────────────────────────────────
func _scene_map(t: float) -> void:
	var u := t - 20.0
	draw_rect(Rect2(0.0, 0.0, W, H), Color(0.08, 0.16, 0.29, 1.0))
	for i in range(15):
		var y := 80.0 + float(i) * 78.0
		draw_line(Vector2(0.0, y), Vector2(W, y), Color(0.19, 0.30, 0.42, 0.45), 1.2, true)
	var map_pts := PackedVector2Array([
		Vector2(34.0, 240.0), Vector2(109.0, 190.0), Vector2(188.0, 203.0), Vector2(251.0, 280.0),
		Vector2(340.0, 300.0), Vector2(431.0, 274.0), Vector2(506.0, 309.0), Vector2(639.0, 266.0),
		Vector2(704.0, 310.0), Vector2(673.0, 527.0), Vector2(574.0, 569.0), Vector2(466.0, 536.0),
		Vector2(354.0, 585.0), Vector2(252.0, 541.0), Vector2(166.0, 583.0), Vector2(82.0, 525.0), Vector2(30.0, 410.0)
	])
	_draw_shape(map_pts, Color(0.84, 0.78, 0.61, 1.0), INK, 5.0)
	_draw_island(Vector2(503.0, 497.0), 103.0, 50.0, Color(0.43, 0.60, 0.43, 1.0))
	_draw_map_labels()
	_draw_route_line(Vector2(102.0, 311.0), Vector2(538.0, 491.0), clampf(u / 3.8, 0.0, 1.0))
	var marker := Vector2(102.0, 311.0).lerp(Vector2(538.0, 491.0), clampf(u / 3.8, 0.0, 1.0))
	_draw_p38(marker, 0.38, 0.34, t)
	_draw_caption_card("THE PACIFIC", Vector2(360.0, 902.0), 44)

# ── 06: aerial combat ────────────────────────────────────────────────────────
func _scene_battle(t: float) -> void:
	var u := t - 24.0
	_draw_sky(t, false)
	_draw_ocean(t)
	_draw_cloud(Vector2(154.0 + sin(u * 0.55) * 11.0, 305.0), 196.0, 102.0)
	_draw_cloud(Vector2(552.0 - sin(u * 0.45) * 12.0, 489.0), 225.0, 112.0)
	_draw_cloud(Vector2(226.0, 706.0 + sin(u * 0.4) * 8.0), 249.0, 108.0)
	var p1 := Vector2(95.0 + fposmod(u * 168.0, 760.0), 380.0 + sin(u * 2.1) * 34.0)
	var p2 := Vector2(695.0 - fposmod(u * 143.0, 730.0), 604.0 + cos(u * 1.8) * 43.0)
	_draw_p38(p1, 0.08 + sin(u * 2.0) * 0.22, 0.67, t)
	_draw_p38(p2, PI + sin(u * 1.7) * 0.20, 0.47, t)
	_draw_enemy_plane(Vector2(560.0 - fposmod(u * 190.0, 710.0), 452.0 + sin(u * 2.5) * 72.0), PI + 0.12)
	_draw_speed_lines(p1, Vector2.RIGHT, 4, 0.52)
	if sin(u * 5.2) > 0.72:
		_draw_burst(Vector2(352.0 + sin(u * 13.0) * 180.0, 471.0 + cos(u * 9.0) * 150.0), 15.0)
	if u > 7.0:
		_draw_caption_card("FORTY CONFIRMED", Vector2(360.0, 900.0), 44)

# ── 07: cockpit / gunsight ───────────────────────────────────────────────────
func _scene_cockpit(t: float) -> void:
	var u := t - 29.0
	_draw_sky(t, false)
	_draw_cloud(Vector2(175.0, 446.0), 221.0, 105.0)
	_draw_cloud(Vector2(559.0, 424.0), 208.0, 98.0)
	_draw_enemy_plane(Vector2(390.0 + sin(u * 1.6) * 103.0, 425.0 + cos(u * 2.1) * 74.0), 0.18)
	_draw_cockpit_frame()
	_draw_reticle(Vector2(366.0 + sin(u * 3.3) * 92.0, 456.0 + cos(u * 2.0) * 62.0), u)
	_draw_cockpit_gauges(false, u)
	_draw_pilot_back(Vector2(360.0, 1000.0), 1.35)

# ── 08: scoreboard ───────────────────────────────────────────────────────────
func _scene_scoreboard(t: float) -> void:
	var u := t - 34.0
	_draw_wood_wall(0.0, 0.0, W, H)
	_draw_chalkboard(Rect2(55.0, 196.0, 610.0, 522.0))
	_draw_center_text("MOST KILLS", Vector2(360.0, 273.0), 36, Color(0.96, 0.95, 0.84, 1.0))
	_draw_aircraft_silhouette(Vector2(183.0, 403.0), 1.4, CREAM)
	var score := int(lerpf(26.0, 40.0, clampf(u / 4.9, 0.0, 1.0)))
	_draw_center_text(str(score), Vector2(178.0, 563.0), 105, Color(1.0, 0.97, 0.86, 1.0))
	_draw_center_text("CONFIRMED", Vector2(185.0, 626.0), 22, Color(0.92, 0.91, 0.83, 1.0))
	_draw_person(Vector2(515.0, 1008.0), 1.05, "pilot", 1, 2, t)
	_draw_person(Vector2(142.0, 1010.0), 0.79, "mechanic", 1, 0, t)
	_draw_person(Vector2(245.0, 1012.0), 0.83, "commander", 1, 0, t)
	_draw_person(Vector2(629.0, 1010.0), 0.76, "mechanic", 0, 0, t)
	_draw_hanging_lamp(Vector2(360.0, 74.0))

# ── 09: award / hero moment ──────────────────────────────────────────────────
func _scene_award(t: float) -> void:
	var u := t - 39.0
	_draw_wood_wall(0.0, 0.0, W, H)
	_draw_drapes()
	_draw_medal_emblem(Vector2(360.0, 253.0), 82.0)
	_draw_person(Vector2(287.0, 1012.0), 1.11, "pilot", 1, 2, t)
	_draw_person(Vector2(484.0, 1008.0), 1.02, "commander", 1, 2, t)
	_draw_medal_star(Vector2(291.0, 823.0), 18.0)
	_draw_flash_bulbs(u)

# ── 10: homecoming ───────────────────────────────────────────────────────────
func _scene_homecoming(t: float) -> void:
	var u := t - 44.0
	_draw_night_sky(t)
	_draw_house(Vector2(355.0, 450.0), 1.05, true)
	_draw_snow(u)
	_draw_person(Vector2(229.0 + clampf(u / 4.6, 0.0, 1.0) * 52.0, 1013.0), 1.0, "pilot", 1, 1, t)
	_draw_person(Vector2(339.0, 1011.0), 0.96, "civilian", 1, 2, t)
	_draw_person(Vector2(438.0, 1017.0), 0.68, "child", 1, 2, t)
	if u > 2.7:
		_draw_hearts(Vector2(349.0, 830.0), u)

# ── 11: the new jet ──────────────────────────────────────────────────────────
func _scene_jet(t: float) -> void:
	var u := t - 49.0
	_draw_sky(t, false)
	_draw_hills()
	_draw_hangar(Vector2(510.0, 468.0), 0.95)
	_draw_runway()
	var lift := clampf(u / 4.2, 0.0, 1.0)
	_draw_jet(Vector2(170.0 + lift * 390.0, 795.0 - lift * 245.0), -0.10 - lift * 0.30, 0.93, t)
	_draw_person(Vector2(103.0, 1008.0), 0.9, "mechanic", 2, 0, t)
	_draw_speed_lines(Vector2(361.0, 740.0), Vector2.RIGHT, 4, 0.43)

# ── 12: fuel warning ────────────────────────────────────────────────────────
func _scene_fuel(t: float) -> void:
	var u := t - 54.0
	_draw_cockpit_sky(t)
	_draw_cockpit_frame()
	_draw_cockpit_gauges(true, u)
	_draw_gauge_warning(Vector2(542.0, 673.0), clampf(1.0 - u / 4.5, 0.0, 1.0))
	_draw_pilot_back(Vector2(338.0, 1000.0), 1.29)
	if u > 2.2:
		_draw_warning_flash(u)

# ── 13: bail out ─────────────────────────────────────────────────────────────
func _scene_bailout(t: float) -> void:
	var u := t - 59.0
	_draw_sky(t, false)
	_draw_cloud(Vector2(112.0, 248.0), 188.0, 85.0)
	_draw_cloud(Vector2(580.0, 340.0), 193.0, 88.0)
	var damaged_jet := Vector2(444.0 + u * 46.0, 202.0 + u * 62.0)
	_draw_smoke_trail(damaged_jet, 0.44, u)
	_draw_jet(damaged_jet, 0.44, 0.63, t)
	var falling_y := 286.0 + u * 122.0
	_draw_falling_pilot(Vector2(291.0 + sin(u * 3.2) * 24.0, falling_y), u)
	_draw_motion_streaks(Vector2(291.0, falling_y), 4, 0.42)

# ── 14: parachute / ground below ─────────────────────────────────────────────
func _scene_parachute(t: float) -> void:
	var u := t - 63.0
	_draw_sky(t, false)
	_draw_cloud(Vector2(143.0, 197.0), 180.0, 78.0)
	_draw_cloud(Vector2(604.0, 313.0), 190.0, 88.0)
	_draw_low_city()
	var falling := Vector2(362.0 + sin(u * 1.6) * 17.0, 478.0 + u * 76.0)
	_draw_motion_streaks(falling, 5, 0.32)
	_draw_parachute_person(falling, u)
	_draw_snow_like_specks(t, 18)

# ── 15: newspaper ending ─────────────────────────────────────────────────────
func _scene_newspaper(t: float) -> void:
	var u := t - 68.0
	_draw_desk_top()
	_draw_coffee(Vector2(105.0, 990.0))
	_draw_pencil(Vector2(580.0, 1050.0), -0.22)
	_draw_newspaper(Vector2(120.0, 140.0), Vector2(490.0, 865.0), u)

func _scene_memorial(t: float) -> void:
	var u := t - 74.0
	_draw_sky(t, true)
	for i in range(34):
		var x := fposmod(float(i) * 151.0 + sin(u * 0.7 + float(i)) * 13.0, W)
		var y := fposmod(float(i) * 89.0, 600.0)
		_ellipse(Vector2(x, y), 1.6 + float(i % 3) * 0.7, Color(1.0, 0.97, 0.83, 0.82), Color(1.0, 0.97, 0.83, 0.0), 0.0)
	_draw_shape([Vector2(0.0, 856.0), Vector2(119.0, 819.0), Vector2(248.0, 848.0), Vector2(380.0, 797.0), Vector2(523.0, 842.0), Vector2(720.0, 806.0), Vector2(720.0, 1280.0), Vector2(0.0, 1280.0)], Color(0.13, 0.19, 0.26, 1.0), INK, 4.0)
	var medal_pulse := 1.0 + sin(u * 2.0) * 0.025
	_draw_medal_emblem(Vector2(360.0, 346.0), 112.0 * medal_pulse)
	var travel := clampf(u / 4.2, 0.0, 1.0)
	var jet_pos := Vector2(790.0 - 430.0 * travel, 627.0 + sin(u * 1.7) * 10.0)
	_draw_jet(jet_pos, PI + sin(u * 1.6) * 0.035, 1.25, t)
	_draw_speed_lines(jet_pos, Vector2.LEFT, 3, 0.24)
	_draw_center_text("RICHARD IRA BONG", Vector2(360.0, 838.0), 48, CREAM)
	_draw_center_text("AMERICA'S ACE OF ACES", Vector2(360.0, 894.0), 25, Color(0.98, 0.95, 0.84, 1.0))
	_draw_center_text("40 VICTORIES  •  MEDAL OF HONOR", Vector2(360.0, 946.0), 22, Color(1.0, 0.82, 0.42, 1.0))
	_draw_center_text("1920 — AUGUST 6, 1945", Vector2(360.0, 988.0), 20, Color(0.90, 0.92, 0.94, 1.0))

# ── backgrounds and props ────────────────────────────────────────────────────
func _draw_sky(t: float, dusk: bool) -> void:
	var top := Color(0.24, 0.51, 0.78, 1.0) if not dusk else Color(0.96, 0.55, 0.34, 1.0)
	var bottom := Color(0.68, 0.84, 0.93, 1.0) if not dusk else Color(0.96, 0.79, 0.54, 1.0)
	for i in range(28):
		var f := float(i) / 27.0
		var y := float(i) * H / 28.0
		draw_rect(Rect2(0.0, y, W, H / 28.0 + 1.0), top.lerp(bottom, f))
	if t < 0.0:
		return

func _draw_sun(pos: Vector2, r: float) -> void:
	_ellipse(pos, r + 4.0, INK)
	_ellipse(pos, r, Color(1.0, 0.84, 0.44, 1.0), INK, 2.0)

func _draw_bay_and_hills(t: float) -> void:
	draw_rect(Rect2(0.0, 661.0, W, H - 661.0), Color(0.07, 0.39, 0.62, 1.0))
	_draw_shape([Vector2(0, 692), Vector2(98, 594), Vector2(205, 637), Vector2(320, 579), Vector2(438, 636), Vector2(555, 588), Vector2(720, 645), Vector2(720, 777), Vector2(0, 777)], Color(0.43, 0.63, 0.48, 1.0), INK, 3.0)
	for row in range(8):
		var pts := PackedVector2Array()
		var y0 := 815.0 + float(row) * 48.0
		for col in range(13):
			var x := float(col) * 61.0
			pts.append(Vector2(x, y0 + sin(t * 1.2 + float(row) + x * 0.013) * 4.0))
		draw_polyline(pts, Color(0.81, 0.91, 0.94, 0.58), 2.0, true)

func _draw_golden_gate() -> void:
	var cable := PackedVector2Array()
	for i in range(49):
		var x := float(i) * 15.0
		cable.append(Vector2(x, _bridge_cable_y(x)))
	draw_polyline(cable, INK, 17.0, true)
	draw_polyline(cable, RED, 9.0, true)
	for xi in range(13, 720, 27):
		var x := float(xi)
		_line_outline(Vector2(x, _bridge_cable_y(x)), Vector2(x, _bridge_deck_y(x) - 3.0), INK, RED_LIGHT, 4.0, 2.0)
	_draw_shape([Vector2(0, 751), Vector2(720, 669), Vector2(720, 720), Vector2(0, 806)], Color(0.73, 0.17, 0.13, 1.0), INK, 7.0)
	_draw_bridge_tower(285.0, 382.0, 752.0, 67.0)
	_draw_bridge_tower(548.0, 472.0, 729.0, 43.0)
	for xi in range(16, 710, 46):
		var x := float(xi)
		var endx := minf(x + 20.0, 715.0)
		draw_line(Vector2(x, _bridge_deck_y(x) + 12.0), Vector2(endx, _bridge_deck_y(endx) + 12.0), CREAM, 4.0, true)

func _bridge_cable_y(x: float) -> float:
	if x < 285.0:
		var f := x / 285.0
		return lerpf(597.0, 382.0, f) - 16.0 * sin(PI * f)
	var f2 := (x - 285.0) / 435.0
	return 382.0 + 269.0 * f2 * f2

func _bridge_deck_y(x: float) -> float:
	return 762.0 - 0.115 * x

func _draw_bridge_tower(cx: float, top: float, base: float, width: float) -> void:
	var tl := Vector2(cx - width * 0.5, top)
	var tr := Vector2(cx + width * 0.5, top)
	var bl := Vector2(cx - width * 0.31, base)
	var br := Vector2(cx + width * 0.31, base)
	_line_outline(tl, bl, INK, RED_LIGHT, 29.0, 17.0)
	_line_outline(tr, br, INK, RED_LIGHT, 29.0, 17.0)
	_line_outline(tl, tr, INK, RED_LIGHT, 30.0, 18.0)
	for f in [0.18, 0.41, 0.65, 0.88]:
		var y := lerpf(top, base, float(f))
		_line_outline(Vector2(lerpf(tl.x, bl.x, float(f)), y), Vector2(lerpf(tr.x, br.x, float(f)), y), INK, RED, 12.0, 6.0)
	_line_outline(Vector2(tl.x + 3, top + 10), Vector2(br.x - 2, base - 6), INK, RED, 6.0, 3.0)
	_line_outline(Vector2(tr.x - 3, top + 10), Vector2(bl.x + 2, base - 6), INK, RED, 6.0, 3.0)

func _draw_hills() -> void:
	_draw_shape([Vector2(0, 698), Vector2(118, 570), Vector2(232, 647), Vector2(376, 555), Vector2(507, 642), Vector2(616, 586), Vector2(720, 657), Vector2(720, 812), Vector2(0, 812)], Color(0.39, 0.58, 0.40, 1.0), INK, 4.0)
	_draw_shape([Vector2(0, 724), Vector2(167, 633), Vector2(287, 700), Vector2(446, 617), Vector2(602, 694), Vector2(720, 641), Vector2(720, 817), Vector2(0, 817)], Color(0.51, 0.66, 0.45, 1.0), Color(0.20, 0.33, 0.27, 1.0), 3.0)

func _draw_hangar(pos: Vector2, scale: float) -> void:
	draw_set_transform(pos, 0.0, Vector2.ONE * scale)
	_draw_shape([Vector2(-241, 137), Vector2(-227, -65), Vector2(-76, -183), Vector2(150, -183), Vector2(248, -66), Vector2(250, 137)], Color(0.70, 0.60, 0.43, 1.0), INK, 5.0)
	_draw_shape([Vector2(-75, 137), Vector2(-73, -55), Vector2(0, -130), Vector2(80, -55), Vector2(82, 137)], Color(0.24, 0.25, 0.23, 1.0), INK, 5.0)
	for x in [-196, -145, -94, 111, 165, 215]:
		draw_line(Vector2(x, -98), Vector2(x, 130), Color(0.44, 0.38, 0.30, 1.0), 5.0, true)
	for y in [-43, 4, 54, 104]:
		draw_line(Vector2(-72, y), Vector2(80, y), Color(0.48, 0.40, 0.30, 1.0), 4.0, true)
	draw_line(Vector2(-237, -64), Vector2(247, -64), INK, 6.0, true)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _draw_runway() -> void:
	_draw_shape([Vector2(0, 710), Vector2(720, 652), Vector2(720, 1280), Vector2(0, 1280)], Color(0.34, 0.35, 0.34, 1.0), INK, 4.0)
	for i in range(7):
		var y := 744.0 + float(i * i) * 10.0
		var w := 25.0 + float(i) * 9.0
		draw_rect(Rect2(360.0 - w * 0.5, y, w, 10.0 + float(i) * 2.0), Color(0.91, 0.85, 0.67, 0.86))
	for x in [92.0, 630.0]:
		draw_line(Vector2(x, 740.0), Vector2(x * 0.54 + 130.0, 1275.0), Color(0.76, 0.74, 0.64, 0.55), 3.0, true)

func _draw_neighborhood() -> void:
	draw_rect(Rect2(0.0, 650.0, W, 630.0), Color(0.36, 0.67, 0.34, 1.0))
	_draw_house_block(Vector2(0.0, 533.0), Vector2(248.0, 353.0), Color(0.83, 0.67, 0.48, 1.0))
	_draw_house_block(Vector2(234.0, 500.0), Vector2(246.0, 387.0), Color(0.71, 0.78, 0.61, 1.0))
	_draw_house_block(Vector2(468.0, 547.0), Vector2(269.0, 347.0), Color(0.72, 0.57, 0.48, 1.0))
	for x in [84.0, 318.0, 552.0, 678.0]:
		_ellipse(Vector2(x, 701.0), 34.0, Color(0.32, 0.56, 0.28, 1.0), INK, 3.0)
		draw_rect(Rect2(x - 6.0, 699.0, 12.0, 73.0), Color(0.33, 0.28, 0.22, 1.0))

func _draw_house_block(pos: Vector2, size: Vector2, color: Color) -> void:
	var p := PackedVector2Array([pos, pos + Vector2(size.x * 0.5, -82.0), pos + Vector2(size.x, 0.0), pos + Vector2(size.x, size.y), pos + Vector2(0.0, size.y)])
	_draw_shape(p, color, INK, 5.0)
	draw_line(pos + Vector2(size.x * 0.5, -82.0), pos + Vector2(size.x * 0.5, 0.0), INK, 5.0, true)
	for wx in [0.22, 0.70]:
		for wy in [0.23, 0.52]:
			_draw_shape([pos + Vector2(size.x * wx, size.y * wy), pos + Vector2(size.x * wx + 43.0, size.y * wy), pos + Vector2(size.x * wx + 43.0, size.y * wy + 52.0), pos + Vector2(size.x * wx, size.y * wy + 52.0)], Color(0.65, 0.84, 0.89, 1.0), INK, 3.0)
	_draw_shape([pos + Vector2(size.x * 0.43, size.y), pos + Vector2(size.x * 0.43, size.y - 96.0), pos + Vector2(size.x * 0.61, size.y - 96.0), pos + Vector2(size.x * 0.61, size.y)], Color(0.46, 0.30, 0.22, 1.0), INK, 4.0)

func _draw_fence_and_clothesline(u: float) -> void:
	draw_rect(Rect2(0.0, 1000.0, W, 27.0), Color(0.92, 0.89, 0.79, 1.0))
	draw_line(Vector2(0.0, 1000.0), Vector2(W, 1000.0), INK, 4.0, true)
	draw_line(Vector2(0.0, 1027.0), Vector2(W, 1027.0), INK, 4.0, true)
	for x in range(8, 720, 33):
		_draw_shape([Vector2(float(x), 990.0), Vector2(float(x + 7), 990.0), Vector2(float(x + 7), 1090.0), Vector2(float(x + 14), 1110.0), Vector2(float(x + 21), 1090.0), Vector2(float(x + 21), 990.0)], Color(0.94, 0.91, 0.82, 1.0), INK, 3.0)
	draw_line(Vector2(70.0, 676.0), Vector2(641.0, 690.0), INK, 4.0, true)
	_draw_laundry(Vector2(188.0, 683.0), Color(0.95, 0.93, 0.85, 1.0), u)
	_draw_laundry(Vector2(298.0, 686.0), Color(0.84, 0.33, 0.28, 1.0), u + 0.4)
	_draw_laundry(Vector2(420.0, 688.0), Color(0.55, 0.75, 0.60, 1.0), u + 0.7)

func _draw_laundry(pos: Vector2, color: Color, u: float) -> void:
	var flutter := sin(u * 10.0) * 8.0
	_draw_shape([pos, pos + Vector2(67.0, 1.0), pos + Vector2(59.0 + flutter, 71.0), pos + Vector2(8.0 + flutter, 66.0)], color, INK, 3.0)
	for x in [15.0, 48.0]:
		draw_line(pos + Vector2(x, 0), pos + Vector2(x + flutter * 0.2, 12), INK, 2.0, true)

func _draw_laundry_blowoff(u: float) -> void:
	var colors := [Color(0.95, 0.92, 0.83, 1.0), Color(0.82, 0.31, 0.27, 1.0), Color(0.55, 0.74, 0.59, 1.0)]
	for i in range(3):
		var elapsed := maxf(u - 1.45 - float(i) * 0.38, 0.0)
		var progress := clampf(elapsed / 2.45, 0.0, 1.0)
		var flutter := sin(u * 11.0 + float(i) * 2.1) * 15.0
		var pos := Vector2(266.0 + float(i) * 48.0 + progress * 211.0, 657.0 - progress * (56.0 + float(i) * 14.0) + sin(u * 6.0 + float(i)) * 8.0)
		_draw_shape([pos, pos + Vector2(54.0, -4.0), pos + Vector2(48.0 + flutter, 45.0), pos + Vector2(7.0 + flutter, 41.0)], colors[i], INK, 3.0)
		for x in [13.0, 40.0]:
			draw_line(pos + Vector2(x, -4.0), pos + Vector2(x + flutter * 0.25, 7.0), INK, 2.0, true)
	for i in range(3):
		var y := 635.0 + float(i) * 27.0 + sin(u * 9.0 + float(i)) * 5.0
		draw_line(Vector2(490.0 + float(i) * 12.0, y), Vector2(556.0 + float(i) * 14.0, y - 7.0), Color(1.0, 1.0, 1.0, 0.54), 3.0, true)

func _draw_wood_wall(x: float, y: float, w: float, h: float) -> void:
	draw_rect(Rect2(x, y, w, h), Color(0.35, 0.22, 0.16, 1.0))
	for i in range(1, 15):
		var yy := float(i) * H / 15.0
		draw_line(Vector2(0.0, yy), Vector2(W, yy), Color(0.52, 0.34, 0.24, 0.58), 3.0, true)
	for xx in [48.0, 284.0, 472.0, 680.0]:
		for yy in [103.0, 391.0, 699.0, 1007.0]:
			_ellipse(Vector2(xx, yy), 3.2, Color(0.22, 0.14, 0.10, 1.0), Color(0.22, 0.14, 0.10, 1.0), 1.0)

func _draw_window(center: Vector2, size: Vector2) -> void:
	_draw_shape([center - size * 0.5, center + Vector2(size.x * 0.5, -size.y * 0.5), center + size * 0.5, center + Vector2(-size.x * 0.5, size.y * 0.5)], Color(0.31, 0.57, 0.74, 1.0), INK, 8.0)
	draw_line(Vector2(center.x, center.y - size.y * 0.5), Vector2(center.x, center.y + size.y * 0.5), CREAM, 5.0, true)
	draw_line(Vector2(center.x - size.x * 0.5, center.y), Vector2(center.x + size.x * 0.5, center.y), CREAM, 5.0, true)
	_draw_cloud(center + Vector2(-36.0, -18.0), 82.0, 36.0)

func _draw_wall_map(pos: Vector2, size: Vector2, u: float) -> void:
	_draw_shape([pos, pos + Vector2(size.x, 0), pos + size, pos + Vector2(0, size.y)], Color(0.82, 0.73, 0.55, 1.0), INK, 5.0)
	_draw_shape([pos + Vector2(21.0, 20.0), pos + Vector2(size.x - 17.0, 23.0), pos + Vector2(size.x - 26.0, size.y - 15.0), pos + Vector2(24.0, size.y - 25.0)], Color(0.88, 0.81, 0.65, 1.0), Color(0.22, 0.18, 0.14, 1.0), 2.0)
	_draw_island(pos + Vector2(147.0, 94.0), 50.0, 27.0, Color(0.56, 0.67, 0.45, 1.0))
	_draw_route_line(pos + Vector2(44.0, 150.0), pos + Vector2(203.0, 56.0), clampf(u / 4.0, 0.0, 1.0))

func _draw_desk(pos: Vector2, width: float, height: float) -> void:
	_draw_shape([pos, pos + Vector2(width, 0), pos + Vector2(width - 25.0, height), pos + Vector2(25.0, height)], Color(0.44, 0.28, 0.19, 1.0), INK, 6.0)
	draw_line(pos + Vector2(0.0, 21.0), pos + Vector2(width, 21.0), Color(0.74, 0.48, 0.31, 1.0), 5.0, true)
	_draw_shape([pos + Vector2(48.0, 90.0), pos + Vector2(230.0, 90.0), pos + Vector2(230.0, 209.0), pos + Vector2(48.0, 209.0)], Color(0.34, 0.21, 0.15, 1.0), INK, 4.0)
	_draw_shape([pos + Vector2(width - 241.0, 91.0), pos + Vector2(width - 59.0, 91.0), pos + Vector2(width - 59.0, 210.0), pos + Vector2(width - 241.0, 210.0)], Color(0.34, 0.21, 0.15, 1.0), INK, 4.0)

func _draw_papers(pos: Vector2, u: float) -> void:
	_draw_shape([pos, pos + Vector2(138.0, -5.0), pos + Vector2(168.0, 70.0), pos + Vector2(18.0, 89.0)], Color(0.95, 0.91, 0.79, 1.0), Color(0.22, 0.18, 0.15, 1.0), 3.0)
	for i in range(4):
		draw_line(pos + Vector2(29.0, 24.0 + float(i) * 12.0), pos + Vector2(132.0 - float(i * 3), 15.0 + float(i) * 12.0), Color(0.43, 0.38, 0.31, 0.8), 2.0, true)
	var pen_a := Vector2(172.0, 21.0 + sin(u * 2.0) * 8.0)
	draw_line(pos + pen_a, pos + pen_a + Vector2(82.0, -28.0), Color(0.73, 0.19, 0.14, 1.0), 8.0, true)

func _draw_lamp(pos: Vector2) -> void:
	draw_line(pos, pos + Vector2(0.0, -156.0), INK, 7.0, true)
	draw_line(pos + Vector2(0.0, -156.0), pos + Vector2(48.0, -156.0), INK, 7.0, true)
	_draw_shape([pos + Vector2(18.0, -154.0), pos + Vector2(71.0, -154.0), pos + Vector2(60.0, -104.0), pos + Vector2(28.0, -104.0)], Color(1.0, 0.79, 0.34, 1.0), INK, 4.0)
	_ellipse(pos + Vector2(44.0, -96.0), 7.0, Color(1.0, 0.94, 0.67, 1.0))

func _draw_route_line(a: Vector2, b: Vector2, progress: float) -> void:
	var pts := PackedVector2Array()
	var count := 40
	for i in range(count + 1):
		var f := float(i) / float(count)
		if f > progress: break
		var x := lerpf(a.x, b.x, f)
		var y := lerpf(a.y, b.y, f) - sin(PI * f) * 27.0
		pts.append(Vector2(x, y))
	if pts.size() > 1:
		draw_polyline(pts, Color(0.72, 0.13, 0.10, 1.0), 5.0, true)

func _draw_island(center: Vector2, rx: float, ry: float, color: Color) -> void:
	var p := PackedVector2Array()
	for i in range(21):
		var a := TAU * float(i) / 20.0
		var wobble := 1.0 + 0.11 * sin(3.0 * a) + 0.06 * cos(5.0 * a)
		p.append(center + Vector2(cos(a) * rx * wobble, sin(a) * ry * wobble))
	_draw_shape(p, color, INK, 3.0)

func _draw_map_labels() -> void:
	_draw_small_text("PACIFIC", Vector2(278.0, 386.0), 25, Color(0.22, 0.30, 0.35, 1.0))
	_draw_small_text("SAN FRANCISCO", Vector2(79.0, 281.0), 16, INK)
	_draw_small_text("NEW GUINEA", Vector2(465.0, 554.0), 18, INK)
	_draw_compass(Vector2(610.0, 456.0))

func _draw_ocean(t: float) -> void:
	draw_rect(Rect2(0.0, 754.0, W, 526.0), Color(0.06, 0.32, 0.54, 1.0))
	for i in range(12):
		var y := 799.0 + float(i) * 38.0
		var pts := PackedVector2Array()
		for j in range(12):
			var x := float(j) * 66.0
			pts.append(Vector2(x, y + sin(t * 1.7 + x * 0.02 + float(i)) * 5.0))
		draw_polyline(pts, Color(0.71, 0.85, 0.89, 0.55), 2.0, true)

func _draw_cockpit_frame() -> void:
	_draw_shape([Vector2(0, 839), Vector2(93, 694), Vector2(148, 657), Vector2(173, 679), Vector2(125, 865), Vector2(99, 1280), Vector2(0, 1280)], Color(0.18, 0.20, 0.21, 1.0), INK, 7.0)
	_draw_shape([Vector2(720, 839), Vector2(627, 694), Vector2(572, 657), Vector2(547, 679), Vector2(595, 865), Vector2(621, 1280), Vector2(720, 1280)], Color(0.18, 0.20, 0.21, 1.0), INK, 7.0)
	draw_rect(Rect2(0.0, 1016.0, W, 264.0), Color(0.13, 0.15, 0.17, 1.0))
	draw_rect(Rect2(0.0, 1016.0, W, 264.0), INK, false, 6.0, true)
	draw_line(Vector2(73.0, 1009.0), Vector2(647.0, 1009.0), Color(0.44, 0.45, 0.42, 1.0), 8.0, true)

func _draw_cockpit_gauges(emergency: bool, u: float) -> void:
	for i in range(4):
		var cx := 143.0 + float(i) * 145.0
		var cy := 1111.0 + (0.0 if i % 2 == 0 else 24.0)
		_ellipse(Vector2(cx, cy), 43.0, Color(0.21, 0.23, 0.22, 1.0), INK, 5.0)
		_ellipse(Vector2(cx, cy), 33.0, Color(0.87, 0.84, 0.72, 1.0), Color(0.05, 0.06, 0.07, 1.0), 3.0)
		for tick in range(7):
			var a := -PI * 0.82 + float(tick) * PI * 0.23
			var p1 := Vector2(cx, cy) + Vector2(cos(a), sin(a)) * 22.0
			var p2 := Vector2(cx, cy) + Vector2(cos(a), sin(a)) * 28.0
			draw_line(p1, p2, INK, 2.0, true)
		var needle_angle := -PI * 0.73 + 0.15 * sin(u * 4.0 + float(i))
		if emergency and i == 2:
			needle_angle = lerpf(-PI * 0.65, PI * 0.25, clampf(u / 4.5, 0.0, 1.0))
		draw_line(Vector2(cx, cy), Vector2(cx, cy) + Vector2(cos(needle_angle), sin(needle_angle)) * 23.0, Color(0.77, 0.17, 0.12, 1.0), 3.0, true)

func _draw_gauge_warning(pos: Vector2, amount: float) -> void:
	_ellipse(pos, 53.0, Color(0.11, 0.12, 0.13, 1.0), INK, 5.0)
	_ellipse(pos, 43.0, Color(0.87, 0.83, 0.71, 1.0), INK, 2.0)
	_draw_arc_line(pos, 33.0, PI * 1.05, PI * 1.92, Color(0.79, 0.15, 0.10, 1.0), 8.0)
	var a := lerpf(-PI * 0.65, PI * 0.34, amount)
	draw_line(pos, pos + Vector2(cos(a), sin(a)) * 31.0, INK, 4.0, true)
	_draw_small_text("FUEL", pos + Vector2(-22.0, 21.0), 16, INK)

func _draw_parachute_person(pos: Vector2, u: float) -> void:
	var canopy_center := pos + Vector2(0.0, -190.0)
	var canopy_width := lerpf(28.0, 92.0, clampf(u / 4.0, 0.0, 1.0))
	_draw_parachute(canopy_center, canopy_width, u)
	for fraction in [-0.72, -0.32, 0.32, 0.72]:
		draw_line(canopy_center + Vector2(canopy_width * fraction, 34.0), pos + Vector2(canopy_width * fraction * 0.18, -55.0), INK, 3.0, true)
	_draw_person(pos, 0.78, "pilot", 0, 3, u)

func _draw_parachute(center: Vector2, radius: float, u: float) -> void:
	var pts := PackedVector2Array([center + Vector2(-radius, 32.0)])
	for i in range(25):
		var a := PI + PI * float(i) / 24.0
		pts.append(center + Vector2(cos(a) * radius, sin(a) * 58.0))
	pts.append(center + Vector2(radius, 32.0))
	_draw_shape(pts, Color(0.93, 0.88, 0.73, 1.0), INK, 5.0)
	for i in range(1, 5):
		var x := -radius + float(i) * radius * 0.4
		draw_line(center + Vector2(x, 7.0), center + Vector2(x * 0.7, 32.0), Color(0.78, 0.19, 0.13, 1.0), 5.0, true)

func _draw_cockpit_sky(t: float) -> void:
	_draw_sky(t, false)
	_draw_cloud(Vector2(145.0, 407.0), 207.0, 95.0)
	_draw_cloud(Vector2(571.0, 423.0), 197.0, 92.0)

func _draw_low_city() -> void:
	_draw_shape([Vector2(0, 915), Vector2(106, 844), Vector2(182, 902), Vector2(270, 812), Vector2(356, 901), Vector2(480, 825), Vector2(590, 886), Vector2(720, 807), Vector2(720, 1280), Vector2(0, 1280)], Color(0.40, 0.61, 0.45, 1.0), INK, 4.0)
	for i in range(9):
		var x := 15.0 + float(i) * 83.0
		var h := 72.0 + float((i * 37) % 90)
		_draw_shape([Vector2(x, 1090.0 - h), Vector2(x + 61.0, 1090.0 - h), Vector2(x + 61.0, 1090.0), Vector2(x, 1090.0)], Color(0.72, 0.68, 0.53, 1.0), INK, 2.5)
		for wx in [x + 13.0, x + 37.0]:
			draw_rect(Rect2(wx, 1042.0 - h, 10.0, 18.0), Color(0.76, 0.86, 0.83, 1.0))
			draw_rect(Rect2(wx, 1042.0 - h, 10.0, 18.0), INK, false, 1.5, true)

func _draw_desk_top() -> void:
	draw_rect(Rect2(0.0, 0.0, W, H), Color(0.31, 0.19, 0.14, 1.0))
	for i in range(10):
		var y := 80.0 + float(i) * 126.0
		draw_line(Vector2(0.0, y), Vector2(W, y + sin(float(i)) * 9.0), Color(0.52, 0.34, 0.24, 0.5), 2.0, true)

func _draw_coffee(pos: Vector2) -> void:
	_ellipse(pos, 59.0, Color(0.67, 0.50, 0.36, 1.0), INK, 5.0)
	_ellipse(pos, 45.0, Color(0.20, 0.12, 0.09, 1.0), Color(0.14, 0.09, 0.07, 1.0), 3.0)
	draw_arc(pos + Vector2(52.0, 1.0), 25.0, -PI * 0.5, PI * 0.5, 20, INK, 7.0, true)

func _draw_pencil(pos: Vector2, angle: float) -> void:
	draw_set_transform(pos, angle, Vector2.ONE)
	_draw_shape([Vector2(-115, -8), Vector2(90, -8), Vector2(112, 0), Vector2(90, 8), Vector2(-115, 8)], Color(0.77, 0.18, 0.13, 1.0), INK, 3.0)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _draw_newspaper(pos: Vector2, size: Vector2, u: float) -> void:
	var lift := sin(minf(u / 2.0, 1.0) * PI) * 17.0
	var p := PackedVector2Array([pos + Vector2(lift, 0), pos + Vector2(size.x + lift, 0), pos + size, pos + Vector2(0, size.y)])
	_draw_shape(p, Color(0.94, 0.90, 0.78, 1.0), INK, 6.0)
	_draw_small_text("THE DAILY STAR", Vector2(pos.x + 54.0, pos.y + 62.0), 28, Color(0.11, 0.12, 0.14, 1.0))
	draw_line(Vector2(pos.x + 32.0, pos.y + 79.0), Vector2(pos.x + size.x - 30.0, pos.y + 79.0), INK, 3.0, true)
	_draw_center_text("ATOMIC BOMB", Vector2(pos.x + size.x * 0.5, pos.y + 146.0), 39, INK)
	_draw_center_text("HITS JAPAN", Vector2(pos.x + size.x * 0.5, pos.y + 190.0), 37, INK)
	_draw_shape([Vector2(pos.x + 38.0, pos.y + 220.0), Vector2(pos.x + size.x - 37.0, pos.y + 220.0), Vector2(pos.x + size.x - 37.0, pos.y + 439.0), Vector2(pos.x + 38.0, pos.y + 439.0)], Color(0.79, 0.76, 0.65, 1.0), Color(0.23, 0.22, 0.19, 1.0), 3.0)
	_draw_mushroom_cloud(Vector2(pos.x + size.x * 0.5, pos.y + 362.0), 91.0)
	_draw_small_text("HIROSHIMA", Vector2(pos.x + 45.0, pos.y + 473.0), 23, INK)
	draw_line(Vector2(pos.x + 40.0, pos.y + 505.0), Vector2(pos.x + size.x - 35.0, pos.y + 505.0), INK, 2.5, true)
	_draw_center_text("AMERICA'S TOP ACE", Vector2(pos.x + size.x * 0.5, pos.y + 567.0), 27, INK)
	_draw_center_text("KILLED IN TEST CRASH", Vector2(pos.x + size.x * 0.5, pos.y + 609.0), 24, INK)
	_draw_person(Vector2(pos.x + 122.0, pos.y + 818.0), 0.69, "pilot", 0, 0, 0.0)
	for i in range(5):
		draw_line(Vector2(pos.x + 220.0, pos.y + 691.0 + float(i) * 23.0), Vector2(pos.x + size.x - 42.0, pos.y + 691.0 + float(i) * 23.0), Color(0.31, 0.32, 0.32, 0.72), 2.0, true)

# ── plane and character rigs ─────────────────────────────────────────────────
func _draw_p38(pos: Vector2, angle: float, scale: float, t: float) -> void:
	draw_set_transform(pos, angle, Vector2.ONE * scale)
	# Broad wing and twin-boom silhouette.
	_draw_shape([Vector2(-35, -11), Vector2(-8, -19), Vector2(14, -83), Vector2(35, -82), Vector2(27, -18), Vector2(18, 0), Vector2(27, 18), Vector2(35, 82), Vector2(14, 83), Vector2(-8, 19)], Color(0.34, 0.42, 0.26, 1.0), INK, 4.0)
	_draw_shape([Vector2(-64, -25), Vector2(-31, -19), Vector2(27, -16), Vector2(44, -10), Vector2(51, -4), Vector2(70, 0), Vector2(51, 4), Vector2(44, 10), Vector2(27, 16), Vector2(-31, 19), Vector2(-64, 25)], OLIVE, INK, 4.0)
	_draw_shape([Vector2(-50, -21), Vector2(-18, -34), Vector2(18, -34), Vector2(23, -21), Vector2(-16, -16)], OLIVE_LIGHT, INK, 3.0)
	_draw_shape([Vector2(-50, 21), Vector2(-18, 34), Vector2(18, 34), Vector2(23, 21), Vector2(-16, 16)], OLIVE_LIGHT, INK, 3.0)
	_draw_shape([Vector2(-69, -27), Vector2(-56, -46), Vector2(-44, -44), Vector2(-49, -24)], Color(0.34, 0.42, 0.26, 1.0), INK, 3.0)
	_draw_shape([Vector2(-69, 27), Vector2(-56, 46), Vector2(-44, 44), Vector2(-49, 24)], Color(0.34, 0.42, 0.26, 1.0), INK, 3.0)
	_draw_shape([Vector2(-23, -7), Vector2(25, -6), Vector2(63, 0), Vector2(25, 6), Vector2(-23, 7)], Color(0.45, 0.52, 0.34, 1.0), INK, 3.0)
	_draw_shape([Vector2(-6, -6), Vector2(12, -5), Vector2(25, 0), Vector2(12, 5), Vector2(-6, 6)], Color(0.51, 0.77, 0.86, 1.0), INK, 2.5)
	_draw_star(Vector2(-5.0, -26.0), 8.0)
	_draw_star(Vector2(-5.0, 26.0), 8.0)
	for side in [-1.0, 1.0]:
		var side_f := float(side)
		var prop := Vector2(-54.0, side_f * 35.0)
		var spin: float = t * 21.0 + side_f
		draw_line(prop + Vector2(cos(spin), sin(spin)) * 10.0, prop - Vector2(cos(spin), sin(spin)) * 10.0, INK, 3.0, true)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _draw_parked_p38(pos: Vector2, scale: float) -> void:
	_draw_p38(pos, 0.0, scale, 0.0)
	# Landing gear, drawn below the aircraft.
	for x in [-24.0, 28.0]:
		draw_line(pos + Vector2(x, 12.0) * scale, pos + Vector2(x, 33.0) * scale, INK, 4.0, true)
		_ellipse(pos + Vector2(x, 34.0) * scale, 5.0 * scale, Color(0.14, 0.16, 0.15, 1.0))

func _draw_jet(pos: Vector2, angle: float, scale: float, t: float) -> void:
	draw_set_transform(pos, angle, Vector2.ONE * scale)
	_draw_shape([Vector2(-66, -8), Vector2(-28, -13), Vector2(37, -8), Vector2(65, 0), Vector2(37, 8), Vector2(-28, 13)], Color(0.72, 0.74, 0.73, 1.0), INK, 4.0)
	_draw_shape([Vector2(-7, -7), Vector2(3, -12), Vector2(14, -68), Vector2(26, -70), Vector2(21, -8), Vector2(11, 0), Vector2(21, 8), Vector2(26, 70), Vector2(14, 68), Vector2(3, 12)], Color(0.67, 0.70, 0.69, 1.0), INK, 3.5)
	_draw_shape([Vector2(-49, -9), Vector2(-37, -27), Vector2(-18, -27), Vector2(-21, -8)], Color(0.63, 0.67, 0.67, 1.0), INK, 3.0)
	_draw_shape([Vector2(-49, 9), Vector2(-37, 27), Vector2(-18, 27), Vector2(-21, 8)], Color(0.63, 0.67, 0.67, 1.0), INK, 3.0)
	_draw_shape([Vector2(2, -7), Vector2(20, -5), Vector2(30, 0), Vector2(20, 5), Vector2(2, 7)], Color(0.34, 0.63, 0.76, 1.0), INK, 2.0)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _draw_enemy_plane(pos: Vector2, angle: float) -> void:
	draw_set_transform(pos, angle, Vector2.ONE * 0.57)
	_draw_shape([Vector2(-30, -7), Vector2(-8, -14), Vector2(7, -53), Vector2(20, -51), Vector2(16, -10), Vector2(30, 0), Vector2(16, 10), Vector2(20, 51), Vector2(7, 53), Vector2(-8, 14)], Color(0.56, 0.40, 0.31, 1.0), INK, 3.0)
	_draw_shape([Vector2(-47, 0), Vector2(-25, -5), Vector2(23, -4), Vector2(43, 0), Vector2(23, 4), Vector2(-25, 5)], Color(0.62, 0.47, 0.34, 1.0), INK, 3.0)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _draw_person(pos: Vector2, scale: float, kind: String, face: int, pose: int, t: float) -> void:
	var walk := sin(t * 8.0 + pos.x * 0.01) * 7.0 if pose == 1 else 0.0
	draw_set_transform(pos, 0.0, Vector2.ONE * scale)
	# Shadow and short legs.
	_ellipse(Vector2(0.0, -3.0), 28.0, Color(0.10, 0.12, 0.11, 0.20), Color(0.10, 0.12, 0.11, 0.0), 0.0)
	if kind == "civilian" or kind == "child":
		var dress := Color(0.82, 0.30, 0.33, 1.0) if kind == "civilian" else Color(0.38, 0.62, 0.47, 1.0)
		_draw_shape([Vector2(-15, -57), Vector2(15, -57), Vector2(28, -9), Vector2(-27, -9)], dress, INK, 4.0)
		_line_outline(Vector2(-10, -14), Vector2(-14 + walk, 0), INK, Color(0.89, 0.73, 0.57, 1.0), 10.0, 6.0)
		_line_outline(Vector2(10, -14), Vector2(16 - walk, 0), INK, Color(0.89, 0.73, 0.57, 1.0), 10.0, 6.0)
		_draw_boot(Vector2(-14 + walk, 0), Color(0.39, 0.25, 0.20, 1.0))
		_draw_boot(Vector2(16 - walk, 0), Color(0.39, 0.25, 0.20, 1.0))
	else:
		_line_outline(Vector2(-11, -42), Vector2(-13 + walk, 0), INK, Color(0.43, 0.34, 0.25, 1.0), 12.0, 7.0)
		_line_outline(Vector2(11, -42), Vector2(15 - walk, 0), INK, Color(0.43, 0.34, 0.25, 1.0), 12.0, 7.0)
		_draw_boot(Vector2(-13 + walk, 0), Color(0.27, 0.20, 0.16, 1.0))
		_draw_boot(Vector2(15 - walk, 0), Color(0.27, 0.20, 0.16, 1.0))
		var jacket := Color(0.42, 0.29, 0.20, 1.0) if kind == "pilot" else Color(0.37, 0.42, 0.30, 1.0)
		_draw_shape([Vector2(-23, -96), Vector2(-15, -110), Vector2(15, -110), Vector2(23, -96), Vector2(20, -47), Vector2(-20, -47)], jacket, INK, 4.0)
		_draw_shape([Vector2(-11, -107), Vector2(0, -94), Vector2(11, -107), Vector2(6, -86), Vector2(-5, -86)], Color(0.81, 0.73, 0.60, 1.0), INK, 2.5)
		for py in [-81.0, -65.0]:
			_draw_shape([Vector2(-17, py - 6), Vector2(-4, py - 6), Vector2(-4, py + 6), Vector2(-17, py + 6)], Color(0.51, 0.37, 0.24, 1.0), INK, 2.0)
			_ellipse(Vector2(0.0, py), 2.0, CREAM)
		var arm_color := jacket
		if pose == 2:
			_line_outline(Vector2(18, -91), Vector2(37, -111), INK, arm_color, 15.0, 9.0)
			_line_outline(Vector2(37, -111), Vector2(29, -137), INK, arm_color, 13.0, 8.0)
			_ellipse(Vector2(28.0, -139.0), 7.0, Color(0.94, 0.87, 0.75, 1.0), INK, 2.0)
		else:
			var swing := walk * 0.7 if pose == 1 else 0.0
			_line_outline(Vector2(-19, -91), Vector2(-28 + swing, -57), INK, arm_color, 15.0, 9.0)
			_line_outline(Vector2(19, -91), Vector2(28 - swing, -59), INK, arm_color, 15.0, 9.0)
	# Head, face, and expression.
	var head_y := -135.0 if kind != "child" else -113.0
	var r := 30.0 if kind != "child" else 23.0
	_ellipse(Vector2(0.0, head_y), r, Color(0.97, 0.94, 0.87, 1.0), INK, 4.0)
	if kind == "civilian" or kind == "child":
		_ellipse(Vector2(0.0, head_y - 17.0), r * 0.83, Color(0.34, 0.22, 0.16, 1.0), INK, 3.0)
		_draw_shape([Vector2(-23, head_y - 8), Vector2(-18, head_y - 25), Vector2(4, head_y - 29), Vector2(25, head_y - 13), Vector2(24, head_y - 5), Vector2(-23, head_y - 5)], Color(0.97, 0.94, 0.87, 1.0), Color(0.97, 0.94, 0.87, 0.0), 0.0)
	else:
		_draw_shape([Vector2(-31, head_y - 4), Vector2(-29, head_y - 27), Vector2(-16, head_y - 41), Vector2(14, head_y - 41), Vector2(29, head_y - 25), Vector2(31, head_y - 4), Vector2(18, head_y - 11), Vector2(-19, head_y - 10)], Color(0.36, 0.25, 0.18, 1.0), INK, 4.0)
		_line_outline(Vector2(-24, head_y - 20), Vector2(23, head_y - 20), INK, Color(0.71, 0.50, 0.31, 1.0), 7.0, 3.0)
		_ellipse(Vector2(-11.0, head_y - 19.0), 8.0, Color(0.72, 0.90, 0.95, 1.0), INK, 2.0)
		_ellipse(Vector2(11.0, head_y - 19.0), 8.0, Color(0.72, 0.90, 0.95, 1.0), INK, 2.0)
	# Eyes and brows move slightly with the expression.
	var brow_y := head_y - 4.0 if face != 2 else head_y - 1.0
	if face == 2:
		draw_line(Vector2(-15.0, brow_y), Vector2(-4.0, brow_y - 4.0), INK, 3.0, true)
		draw_line(Vector2(5.0, brow_y - 4.0), Vector2(16.0, brow_y), INK, 3.0, true)
	else:
		draw_line(Vector2(-16.0, brow_y), Vector2(-5.0, brow_y - 1.0), INK, 3.0, true)
		draw_line(Vector2(5.0, brow_y - 1.0), Vector2(16.0, brow_y), INK, 3.0, true)
	_ellipse(Vector2(-9.0, head_y + 3.0), 3.4, INK, INK, 1.0)
	_ellipse(Vector2(9.0, head_y + 3.0), 3.4, INK, INK, 1.0)
	if face == 1:
		draw_arc(Vector2(0.0, head_y + 9.0), 8.0, 0.15, PI - 0.15, 16, INK, 3.0, true)
	elif face == 2:
		draw_arc(Vector2(0.0, head_y + 19.0), 7.0, PI + 0.2, TAU - 0.2, 16, INK, 3.0, true)
	else:
		draw_line(Vector2(-5.0, head_y + 17.0), Vector2(5.0, head_y + 17.0), INK, 3.0, true)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _draw_person_back(pos: Vector2, scale: float, t: float) -> void:
	draw_set_transform(pos, 0.0, Vector2.ONE * scale)
	_ellipse(Vector2(0, -132), 32.0, Color(0.35, 0.24, 0.17, 1.0), INK, 4.0)
	_draw_shape([Vector2(-30, -135), Vector2(-26, -158), Vector2(-12, -171), Vector2(12, -171), Vector2(27, -157), Vector2(30, -135)], Color(0.39, 0.27, 0.19, 1.0), INK, 4.0)
	_draw_shape([Vector2(-25, -90), Vector2(-18, -107), Vector2(18, -107), Vector2(25, -90), Vector2(22, -45), Vector2(-22, -45)], Color(0.37, 0.25, 0.18, 1.0), INK, 4.0)
	_line_outline(Vector2(-18, -88), Vector2(-30, -57 + sin(t * 4.0) * 4.0), INK, Color(0.37, 0.25, 0.18, 1.0), 15.0, 9.0)
	_line_outline(Vector2(18, -88), Vector2(30, -57 - sin(t * 4.0) * 4.0), INK, Color(0.37, 0.25, 0.18, 1.0), 15.0, 9.0)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _draw_boot(pos: Vector2, color: Color) -> void:
	_draw_shape([pos + Vector2(-8, -3), pos + Vector2(7, -3), pos + Vector2(11, 7), pos + Vector2(17, 11), pos + Vector2(17, 17), pos + Vector2(-10, 17)], color, INK, 2.5)

func _draw_p38_dummy_for_map(pos: Vector2, t: float) -> void:
	_draw_p38(pos, -0.4, 0.30, t)

func _draw_ellipse_trail(center: Vector2, radii: Vector2, progress: float) -> void:
	if progress < 0.02: return
	var pts := PackedVector2Array()
	for i in range(131):
		var f := float(i) / 130.0
		if f > progress: break
		var a := -PI * 0.5 + TAU * f
		pts.append(center + Vector2(cos(a) * radii.x, sin(a) * radii.y))
	if pts.size() > 1:
		draw_polyline(pts, Color(0.10, 0.18, 0.23, 0.42), 14.0, true)
		draw_polyline(pts, Color(0.98, 0.99, 1.0, 0.94), 8.0, true)

func _draw_shape(points, fill: Color, outline: Color = INK, width: float = 4.0) -> void:
	if points.size() < 3: return
	var p := PackedVector2Array()
	for point in points:
		p.append(point)
	draw_colored_polygon(p, fill)
	if width > 0.0 and outline.a > 0.0:
		var closed := p.duplicate()
		closed.append(p[0])
		draw_polyline(closed, outline, width, true)

func _line_outline(a: Vector2, b: Vector2, outline: Color, color: Color, outer: float, inner: float) -> void:
	draw_line(a, b, outline, outer, true)
	draw_line(a, b, color, inner, true)

func _ellipse(pos: Vector2, radius: float, fill: Color, outline: Color = INK, line_width: float = 3.0) -> void:
	if line_width > 0.0 and outline.a > 0.0:
		draw_circle(pos, radius + line_width * 0.5, outline)
	draw_circle(pos, radius, fill)

func _draw_cloud(pos: Vector2, width: float, height: float) -> void:
	var centers := [Vector2(-0.31, 0.02), Vector2(0.0, -0.08), Vector2(0.31, 0.02)]
	var radii := [Vector2(width * 0.22, height * 0.31), Vector2(width * 0.27, height * 0.48), Vector2(width * 0.22, height * 0.31)]
	for i in range(3):
		var c: Vector2 = pos + Vector2(centers[i].x * width, centers[i].y * height)
		var r: Vector2 = radii[i]
		draw_circle(c, maxf(r.x, r.y) + 3.0, Color(0.96, 0.99, 1.0, 1.0))
	# Build an outlined cloud silhouette over the overlapping lobes.
	var pts := PackedVector2Array()
	pts.append(pos + Vector2(-width * 0.49, height * 0.17))
	for i in range(3):
		var c2: Vector2 = pos + Vector2(centers[i].x * width, centers[i].y * height)
		var rx: float = float(radii[i].x)
		var ry: float = float(radii[i].y)
		for j in range(13):
			var a := PI - float(j) * PI / 12.0
			pts.append(Vector2(c2.x + rx * cos(a), c2.y - ry * sin(a)))
	pts.append(pos + Vector2(width * 0.49, height * 0.17))
	draw_colored_polygon(pts, Color(0.97, 0.99, 1.0, 1.0))
	var closed := pts.duplicate(); closed.append(pts[0])
	draw_polyline(closed, INK, 4.0, true)
	draw_line(pos + Vector2(-width * 0.48, height * 0.17), pos + Vector2(width * 0.48, height * 0.17), INK, 4.0, true)

func _draw_person_simple(pos: Vector2, color: Color, scale: float) -> void:
	_draw_person(pos, scale, "mechanic", 0, 0, 0.0)

func _draw_flag(pos: Vector2, t: float) -> void:
	draw_line(pos, pos + Vector2(0.0, -142.0), INK, 5.0, true)
	var sway := sin(t * 5.0) * 11.0
	_draw_shape([pos + Vector2(0.0, -137.0), pos + Vector2(80.0, -128.0 + sway), pos + Vector2(70.0, -96.0 + sway), pos + Vector2(0.0, -106.0)], Color(0.72, 0.23, 0.17, 1.0), INK, 3.0)

func _draw_speed_lines(pos: Vector2, direction: Vector2, count: int, alpha: float) -> void:
	var d := direction.normalized()
	for i in range(count):
		var offset := Vector2(0.0, float(i - count / 2) * 13.0)
		var start := pos - d * (73.0 + float(i) * 9.0) + offset
		draw_line(start, start - d * (34.0 + float(i) * 3.0), Color(0.98, 0.99, 1.0, alpha * (1.0 - float(i) * 0.11)), 3.0, true)

func _draw_motion_streaks(pos: Vector2, count: int, alpha: float) -> void:
	for i in range(count):
		var yy := float(i - count / 2) * 17.0
		draw_line(pos + Vector2(58.0, yy), pos + Vector2(96.0, yy + 6.0), Color(1.0, 1.0, 1.0, alpha), 3.0, true)

func _draw_smoke_trail(pos: Vector2, angle: float, u: float) -> void:
	var backward := Vector2(-cos(angle), -sin(angle))
	for i in range(13):
		var f := float(i) / 12.0
		var swirl := sin(u * 5.0 + float(i) * 0.9) * (5.0 + f * 13.0)
		var puff := pos + backward * (28.0 + f * 148.0) + Vector2(0.0, swirl)
		var alpha := 0.55 - f * 0.32
		var radius := 5.0 + f * 12.0
		_ellipse(puff, radius, Color(0.20, 0.22, 0.24, alpha), Color(0.20, 0.22, 0.24, 0.0), 0.0)

func _draw_burst(pos: Vector2, radius: float) -> void:
	_ellipse(pos, radius, Color(1.0, 0.78, 0.31, 0.82), Color(1.0, 0.95, 0.81, 0.86), 3.0)
	for i in range(8):
		var a := TAU * float(i) / 8.0
		draw_line(pos + Vector2(cos(a), sin(a)) * (radius + 5.0), pos + Vector2(cos(a), sin(a)) * (radius + 17.0), Color(1.0, 0.78, 0.31, 0.76), 3.0, true)

func _draw_cockpit_frame_placeholder() -> void:
	_draw_cockpit_frame()

func _draw_reticle(center: Vector2, u: float) -> void:
	draw_arc(center, 47.0, 0.0, TAU, 36, Color(1.0, 0.73, 0.27, 0.94), 3.0, true)
	draw_line(center + Vector2(-64.0, 0), center + Vector2(-20.0, 0), Color(1.0, 0.73, 0.27, 0.94), 3.0, true)
	draw_line(center + Vector2(20.0, 0), center + Vector2(64.0, 0), Color(1.0, 0.73, 0.27, 0.94), 3.0, true)
	draw_line(center + Vector2(0, -64.0), center + Vector2(0, -20.0), Color(1.0, 0.73, 0.27, 0.94), 3.0, true)
	draw_line(center + Vector2(0, 20.0), center + Vector2(0, 64.0), Color(1.0, 0.73, 0.27, 0.94), 3.0, true)
	_ellipse(center, 5.0 + sin(u * 8.0) * 1.3, Color(1.0, 0.83, 0.4, 1.0), INK, 1.5)

func _draw_pilot_back(pos: Vector2, scale: float) -> void:
	_draw_person_back(pos, scale, 0.0)

func _draw_chalkboard(rect: Rect2) -> void:
	_draw_shape([rect.position, rect.position + Vector2(rect.size.x, 0), rect.position + rect.size, rect.position + Vector2(0, rect.size.y)], Color(0.16, 0.28, 0.23, 1.0), Color(0.22, 0.15, 0.10, 1.0), 14.0)
	_draw_shape([rect.position + Vector2(15, 15), rect.position + Vector2(rect.size.x - 15, 15), rect.position + Vector2(rect.size.x - 15, rect.size.y - 15), rect.position + Vector2(15, rect.size.y - 15)], Color(0.15, 0.29, 0.23, 1.0), Color(0.68, 0.48, 0.31, 1.0), 4.0)
	for i in range(15):
		var x := rect.position.x + 43.0 + float(i) * 37.0
		draw_line(Vector2(x, rect.position.y + 49.0 + sin(float(i)) * 8.0), Vector2(x + 21.0, rect.position.y + 52.0), Color(0.94, 0.93, 0.81, 0.16), 1.0, true)

func _draw_aircraft_silhouette(pos: Vector2, scale: float, color: Color) -> void:
	draw_set_transform(pos, 0.0, Vector2.ONE * scale)
	_draw_shape([Vector2(-54, -6), Vector2(-12, -11), Vector2(3, -32), Vector2(12, -32), Vector2(12, -8), Vector2(39, -5), Vector2(54, 0), Vector2(39, 5), Vector2(12, 8), Vector2(12, 32), Vector2(3, 32), Vector2(-12, 11), Vector2(-54, 6)], color, color, 1.0)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _draw_hanging_lamp(pos: Vector2) -> void:
	draw_line(Vector2(pos.x, 0), pos, INK, 4.0, true)
	_draw_shape([pos + Vector2(-42, 0), pos + Vector2(42, 0), pos + Vector2(29, 50), pos + Vector2(-29, 50)], Color(1.0, 0.82, 0.44, 1.0), INK, 3.0)

func _draw_medal_emblem(center: Vector2, radius: float) -> void:
	_ellipse(center, radius, Color(0.88, 0.69, 0.28, 1.0), INK, 5.0)
	_ellipse(center, radius - 12.0, Color(0.97, 0.85, 0.52, 1.0), Color(0.55, 0.32, 0.12, 1.0), 4.0)
	_draw_star(center, radius * 0.55, Color(0.80, 0.22, 0.13, 1.0))

func _draw_medal_star(pos: Vector2, radius: float) -> void:
	_draw_star(pos, radius, Color(0.90, 0.71, 0.25, 1.0))

func _draw_star(center: Vector2, radius: float, color: Color = CREAM) -> void:
	var pts := PackedVector2Array()
	for i in range(10):
		var r := radius if i % 2 == 0 else radius * 0.43
		var a := -PI * 0.5 + float(i) * PI / 5.0
		pts.append(center + Vector2(cos(a), sin(a)) * r)
	_draw_shape(pts, color, INK, 1.6)

func _draw_drapes() -> void:
	_draw_shape([Vector2(0, 0), Vector2(125, 0), Vector2(103, 511), Vector2(16, 482)], Color(0.50, 0.11, 0.12, 1.0), INK, 4.0)
	_draw_shape([Vector2(720, 0), Vector2(596, 0), Vector2(617, 511), Vector2(705, 482)], Color(0.50, 0.11, 0.12, 1.0), INK, 4.0)
	for x in [30.0, 63.0, 96.0, 626.0, 660.0, 693.0]:
		draw_line(Vector2(x, 0.0), Vector2(x - 9.0, 480.0), Color(0.73, 0.19, 0.18, 0.52), 3.0, true)

func _draw_flash_bulbs(u: float) -> void:
	for i in range(5):
		var x := 80.0 + float(i) * 142.0
		var flash := 1.0 if fposmod(u * 2.7 + float(i), 3.2) < 0.12 else 0.25
		_ellipse(Vector2(x, 366.0 + sin(u * 2.0 + float(i)) * 17.0), 6.0 + flash * 7.0, Color(1.0, 0.94, 0.68, flash), Color(1.0, 0.94, 0.68, flash), 1.0)

func _draw_night_sky(t: float) -> void:
	draw_rect(Rect2(0.0, 0.0, W, H), NIGHT)
	for i in range(54):
		var x := fposmod(float(i) * 131.0 + sin(t + float(i)) * 19.0, W)
		var y := fposmod(float(i) * 79.0, 617.0)
		_ellipse(Vector2(x, y), 1.5 + float(i % 3) * 0.6, Color(0.92, 0.94, 0.97, 0.8), Color(0.92, 0.94, 0.97, 0.8), 1.0)

func _draw_house(pos: Vector2, scale: float, lit: bool) -> void:
	draw_set_transform(pos, 0.0, Vector2.ONE * scale)
	_draw_shape([Vector2(-255, 250), Vector2(-237, -38), Vector2(0, -200), Vector2(241, -39), Vector2(256, 250)], Color(0.46, 0.31, 0.22, 1.0), INK, 6.0)
	_draw_shape([Vector2(-271, -34), Vector2(0, -231), Vector2(275, -34), Vector2(264, 8), Vector2(0, -172), Vector2(-260, 9)], Color(0.26, 0.28, 0.31, 1.0), INK, 7.0)
	_draw_shape([Vector2(-82, 250), Vector2(-82, 61), Vector2(79, 61), Vector2(79, 250)], Color(0.24, 0.16, 0.13, 1.0), INK, 5.0)
	for x in [-180.0, 137.0]:
		var glow := Color(1.0, 0.78, 0.37, 1.0) if lit else Color(0.36, 0.57, 0.74, 1.0)
		_draw_shape([Vector2(x, 40), Vector2(x + 64, 40), Vector2(x + 64, 126), Vector2(x, 126)], glow, INK, 5.0)
		draw_line(Vector2(x + 32, 40), Vector2(x + 32, 126), INK, 3.0, true)
		draw_line(Vector2(x, 83), Vector2(x + 64, 83), INK, 3.0, true)
	_draw_shape([Vector2(-94, 268), Vector2(-94, 255), Vector2(94, 255), Vector2(94, 268)], Color(0.72, 0.64, 0.51, 1.0), INK, 3.0)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _draw_snow(u: float) -> void:
	_draw_shape([Vector2(0, 1100), Vector2(100, 1030), Vector2(215, 1080), Vector2(345, 1022), Vector2(498, 1082), Vector2(612, 1019), Vector2(720, 1071), Vector2(720, 1280), Vector2(0, 1280)], Color(0.92, 0.94, 0.95, 1.0), INK, 3.0)
	for i in range(64):
		var x := fposmod(float(i) * 97.0 + sin(u * 1.1 + float(i)) * 14.0, W)
		var y := fposmod(float(i) * 61.0 + u * (54.0 + float(i % 5) * 9.0), 1060.0)
		_ellipse(Vector2(x, y), 2.0 + float(i % 3), Color(0.96, 0.98, 1.0, 0.9), Color(0.96, 0.98, 1.0, 0.9), 1.0)

func _draw_hearts(pos: Vector2, u: float) -> void:
	for i in range(3):
		var x := pos.x + sin(u * 2.0 + float(i)) * 42.0
		var y := pos.y - 38.0 - fposmod(u * 35.0 + float(i) * 28.0, 90.0)
		_draw_heart(Vector2(x, y), 10.0, Color(0.81, 0.22, 0.20, 0.86))

func _draw_heart(c: Vector2, s: float, color: Color) -> void:
	_draw_shape([c + Vector2(0, s), c + Vector2(-s, 0), c + Vector2(-s, -s * 0.55), c + Vector2(-s * 0.45, -s), c, c + Vector2(s * 0.45, -s), c + Vector2(s, -s * 0.55), c + Vector2(s, 0)], color, INK, 1.8)

func _draw_warning_flash(u: float) -> void:
	var pulse := 0.12 + 0.11 * (0.5 + 0.5 * sin(u * 13.0))
	draw_rect(Rect2(0.0, 0.0, W, H), Color(0.88, 0.08, 0.05, pulse))

func _draw_falling_pilot(pos: Vector2, u: float) -> void:
	var rotation := sin(u * 4.0) * 0.22
	draw_set_transform(pos, rotation, Vector2.ONE * 0.71)
	_line_outline(Vector2(-10, -46), Vector2(-28, -9), INK, Color(0.42, 0.29, 0.20, 1.0), 13.0, 8.0)
	_line_outline(Vector2(10, -46), Vector2(28, -11), INK, Color(0.42, 0.29, 0.20, 1.0), 13.0, 8.0)
	_draw_shape([Vector2(-21, -103), Vector2(21, -103), Vector2(18, -43), Vector2(-18, -43)], Color(0.42, 0.29, 0.20, 1.0), INK, 4.0)
	_ellipse(Vector2(0, -129), 27.0, Color(0.97, 0.94, 0.87, 1.0), INK, 4.0)
	_draw_shape([Vector2(-27, -139), Vector2(-20, -158), Vector2(0, -170), Vector2(22, -159), Vector2(28, -139)], Color(0.39, 0.27, 0.19, 1.0), INK, 3.0)
	_ellipse(Vector2(-8, -129), 3.0, INK, INK, 1.0)
	_ellipse(Vector2(8, -129), 3.0, INK, INK, 1.0)
	draw_arc(Vector2(0, -114), 7.0, PI, TAU, 14, INK, 3.0, true)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _draw_snow_like_specks(t: float, count: int) -> void:
	for i in range(count):
		var x := fposmod(float(i) * 59.0 + sin(t + float(i)) * 11.0, W)
		var y := fposmod(float(i) * 103.0 + t * 18.0, H)
		_ellipse(Vector2(x, y), 2.0, Color(0.97, 0.98, 1.0, 0.75), Color(0.97, 0.98, 1.0, 0.75), 1.0)

func _draw_mushroom_cloud(center: Vector2, width: float) -> void:
	_ellipse(center + Vector2(0.0, 58.0), 17.0, Color(0.60, 0.60, 0.56, 1.0), INK, 2.0)
	_draw_shape([center + Vector2(-17, 67), center + Vector2(17, 67), center + Vector2(11, 18), center + Vector2(-11, 18)], Color(0.66, 0.65, 0.61, 1.0), INK, 2.0)
	_ellipse(center + Vector2(0.0, -12.0), width * 0.5, Color(0.70, 0.69, 0.66, 1.0), INK, 3.0)
	for i in range(5):
		var x := center.x - width * 0.36 + float(i) * width * 0.18
		_ellipse(Vector2(x, center.y - 21.0 - sin(float(i)) * 8.0), 19.0, Color(0.74, 0.72, 0.67, 1.0), INK, 2.0)

func _draw_dust(pos: Vector2, u: float) -> void:
	for i in range(5):
		var x := pos.x + float(i) * 13.0 + fposmod(u * 18.0, 20.0)
		var y := pos.y + 8.0 + float(i % 2) * 8.0
		_ellipse(Vector2(x, y), 4.0 + float(i % 3), Color(0.83, 0.75, 0.58, 0.42), Color(0.83, 0.75, 0.58, 0.0), 0.0)

func _draw_fence_line_placeholder() -> void:
	pass

# ── text overlays ────────────────────────────────────────────────────────────
func _draw_top_label(shot: int, t: float) -> void:
	var labels := ["SAN FRANCISCO  •  1942", "HAMILTON FIELD", "SAN FRANCISCO", "THE COMMANDER'S OFFICE", "PACIFIC THEATER", "NEW GUINEA", "COCKPIT VIEW", "SQUADRON BOARD", "AWARD CEREMONY", "HOME  •  1944", "CALIFORNIA  •  1945", "FUEL WARNING", "TEST FLIGHT", "TOO LOW", "AUGUST 6  •  1945", "RICHARD BONG  •  1920–1945"]
	var label: String = str(labels[mini(shot, labels.size() - 1)])
	_draw_text_outline(label, Vector2(38.0, 79.0), 22, HORIZONTAL_ALIGNMENT_LEFT, 650.0, Color(1.0, 1.0, 1.0, 0.96))

func _draw_caption(t: float) -> void:
	var caption := "SAN FRANCISCO, 1942"
	if t >= 2.2 and t < 5.0: caption = "THE LOOP THAT NEARLY GROUNDED HIM"
	elif t < 10.0 and t >= 5.0: caption = "A NEW PILOT. A NEW P-38."
	elif t < 15.0 and t >= 10.0: caption = "LOW OVER THE NEIGHBORHOOD"
	elif t < 20.0 and t >= 15.0: caption = "THE COMMANDER CALLED HIM IN"
	elif t < 24.0 and t >= 20.0: caption = "THE PACIFIC"
	elif t < 29.0 and t >= 24.0: caption = "NEW GUINEA"
	elif t < 34.0 and t >= 29.0: caption = "ONE SECOND TO TURN"
	elif t < 39.0 and t >= 34.0: caption = "THE SCORE KEPT RISING"
	elif t < 44.0 and t >= 39.0: caption = "FORTY CONFIRMED VICTORIES"
	elif t < 49.0 and t >= 44.0: caption = "HOME, AT LAST"
	elif t < 54.0 and t >= 49.0: caption = "THE NEW P-80"
	elif t < 59.0 and t >= 54.0: caption = "FUEL PRESSURE DROPPING"
	elif t < 63.0 and t >= 59.0: caption = "TOO LOW FOR THE PARACHUTE"
	elif t < 68.0 and t >= 63.0: caption = "THE GROUND RUSHED CLOSER"
	elif t >= 68.0 and t < 74.0: caption = "AUGUST 6, 1945"
	elif t >= 74.0: caption = "FORTY VICTORIES. ONE LASTING LEGACY."
	_draw_text_outline(caption, Vector2(20.0, 1146.0), 40, HORIZONTAL_ALIGNMENT_CENTER, 680.0, Color(1.0, 1.0, 1.0, 1.0))

func _draw_bottom_shade() -> void:
	for i in range(32):
		var f := float(i) / 31.0
		var alpha := 0.52 * f * f
		var y := 1000.0 + float(i) * (280.0 / 32.0)
		draw_rect(Rect2(0.0, y, W, 281.0 / 32.0), Color(0.02, 0.035, 0.065, alpha))

func _draw_cut_flash(t: float) -> void:
	var cuts := [5.0, 10.0, 15.0, 20.0, 24.0, 29.0, 34.0, 39.0, 44.0, 49.0, 54.0, 59.0, 63.0, 68.0, 74.0]
	for cut in cuts:
		var delta := absf(t - float(cut))
		if delta < 0.055:
			draw_rect(Rect2(0.0, 0.0, W, H), Color(1.0, 0.97, 0.86, (0.055 - delta) * 2.0))
			return

func _draw_text_outline(text: String, pos: Vector2, size: int, align: int, width: float, color: Color) -> void:
	var font := ThemeDB.fallback_font
	if font == null: return
	for offset in [Vector2(-3, -2), Vector2(3, -2), Vector2(-3, 2), Vector2(3, 2), Vector2(0, 3)]:
		draw_string(font, pos + offset, text, align, width, size, INK)
	draw_string(font, pos, text, align, width, size, color)

func _draw_small_text(text: String, pos: Vector2, size: int, color: Color) -> void:
	var font := ThemeDB.fallback_font
	if font != null:
		draw_string(font, pos, text, HORIZONTAL_ALIGNMENT_LEFT, -1.0, size, color)

func _draw_center_text(text: String, pos: Vector2, size: int, color: Color) -> void:
	_draw_text_outline(text, Vector2(pos.x - 330.0, pos.y), size, HORIZONTAL_ALIGNMENT_CENTER, 660.0, color)

func _draw_caption_card(text: String, pos: Vector2, size: int) -> void:
	_draw_text_outline(text, Vector2(pos.x - 320.0, pos.y), size, HORIZONTAL_ALIGNMENT_CENTER, 640.0, Color(0.98, 0.97, 0.86, 1.0))

func _draw_compass(pos: Vector2) -> void:
	_ellipse(pos, 30.0, Color(0.92, 0.87, 0.72, 1.0), INK, 3.0)
	_draw_shape([pos + Vector2(0, -22), pos + Vector2(8, 0), pos + Vector2(0, 22), pos + Vector2(-8, 0)], RED, INK, 2.0)

func _draw_arc_line(center: Vector2, radius: float, start_a: float, end_a: float, color: Color, width: float) -> void:
	draw_arc(center, radius, start_a, end_a, 28, color, width, true)
