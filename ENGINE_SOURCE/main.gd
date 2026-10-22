extends Node2D

const WIDTH := 720.0
const HEIGHT := 1280.0
const FPS := 30.0
const DURATION := 8.0
const INK := Color(0.09, 0.12, 0.17, 1.0)
const BRIDGE_RED := Color(0.79, 0.22, 0.16, 1.0)
const BRIDGE_HIGHLIGHT := Color(0.93, 0.36, 0.25, 1.0)

var frame_index := 0

func _process(_delta: float) -> void:
	frame_index += 1
	queue_redraw()

func _draw() -> void:
	var t := clampf(float(frame_index) / FPS, 0.0, DURATION)
	_draw_sky()
	_draw_water(t)
	_draw_distant_shore()
	_draw_sun()
	_draw_clouds(t)
	_draw_bridge()
	_draw_smoke(t)
	_draw_plane(t)
	_draw_caption(t)

func _draw_sky() -> void:
	var top := Color(0.29, 0.58, 0.82, 1.0)
	var bottom := Color(0.57, 0.80, 0.91, 1.0)
	var bands := 24
	for i in range(bands):
		var f := float(i) / float(bands - 1)
		var y := HEIGHT * float(i) / float(bands)
		draw_rect(Rect2(0.0, y, WIDTH, HEIGHT / float(bands) + 1.0), top.lerp(bottom, f))

func _draw_water(t: float) -> void:
	draw_rect(Rect2(0.0, 675.0, WIDTH, HEIGHT - 675.0), Color(0.05, 0.36, 0.59, 1.0))
	for row in range(11):
		var y0 := 812.0 + float(row) * 43.0
		var wave := PackedVector2Array()
		for column in range(13):
			var x := float(column) * 61.0
			var y := y0 + sin(t * 1.1 + float(row) * 0.73 + x * 0.012) * 4.0
			wave.append(Vector2(x, y))
		draw_polyline(wave, Color(0.77, 0.90, 0.93, 0.48), 2.0, true)

func _draw_distant_shore() -> void:
	var shore := PackedVector2Array([
		Vector2(0.0, 694.0), Vector2(65.0, 653.0), Vector2(132.0, 676.0),
		Vector2(216.0, 623.0), Vector2(286.0, 665.0), Vector2(382.0, 620.0),
		Vector2(486.0, 674.0), Vector2(582.0, 628.0), Vector2(720.0, 668.0),
		Vector2(720.0, 760.0), Vector2(0.0, 760.0)
	])
	_draw_shape(shore, Color(0.40, 0.64, 0.48, 1.0), INK, 3.0)
	var ridge := PackedVector2Array([
		Vector2(0.0, 694.0), Vector2(65.0, 653.0), Vector2(132.0, 676.0),
		Vector2(216.0, 623.0), Vector2(286.0, 665.0), Vector2(382.0, 620.0),
		Vector2(486.0, 674.0), Vector2(582.0, 628.0), Vector2(720.0, 668.0)
	])
	draw_polyline(ridge, Color(0.24, 0.43, 0.36, 1.0), 4.0, true)

func _draw_sun() -> void:
	draw_circle(Vector2(611.0, 153.0), 48.0, INK)
	draw_circle(Vector2(611.0, 153.0), 42.0, Color(1.0, 0.83, 0.40, 1.0))

func _draw_clouds(t: float) -> void:
	_draw_cloud(Vector2(112.0 + sin(t * 0.12) * 10.0, 232.0), 150.0, 72.0)
	_draw_cloud(Vector2(531.0 + sin(t * 0.10 + 1.2) * 12.0, 325.0), 174.0, 80.0)
	_draw_cloud(Vector2(105.0 + sin(t * 0.08 + 2.3) * 9.0, 501.0), 128.0, 62.0)
	_draw_cloud(Vector2(625.0 + sin(t * 0.09 + 0.6) * 8.0, 558.0), 122.0, 58.0)

func _draw_cloud(center: Vector2, width: float, height: float) -> void:
	var base_y := center.y + height * 0.18
	var points := PackedVector2Array()
	points.append(Vector2(center.x - width * 0.5, base_y))
	var specs: Array = [
		[-0.33, 0.17, 0.25, 0.39],
		[0.0, 0.17, 0.29, 0.53],
		[0.33, 0.17, 0.25, 0.39]
	]
	for spec in specs:
		var cx := center.x + width * float(spec[0])
		var rx := width * float(spec[1])
		var cy := base_y - height * float(spec[2])
		var ry := height * float(spec[3])
		for i in range(13):
			var angle := PI - float(i) * PI / 12.0
			points.append(Vector2(cx + rx * cos(angle), cy - ry * sin(angle)))
	points.append(Vector2(center.x + width * 0.5, base_y))
	_draw_shape(points, Color(0.97, 0.99, 1.0, 1.0), INK, 4.0)

func _draw_bridge() -> void:
	var cable := PackedVector2Array()
	for i in range(49):
		var x := float(i) * 15.0
		cable.append(Vector2(x, _cable_y(x)))
	draw_polyline(cable, INK, 15.0, true)
	draw_polyline(cable, BRIDGE_RED, 8.0, true)

	for x_int in range(18, 720, 30):
		var x := float(x_int)
		_draw_line_outline(Vector2(x, _cable_y(x)), Vector2(x, _deck_y(x) - 2.0), INK, BRIDGE_HIGHLIGHT, 5.0, 2.4)

	var deck := PackedVector2Array([
		Vector2(0.0, _deck_y(0.0) - 8.0), Vector2(720.0, _deck_y(720.0) - 8.0),
		Vector2(720.0, _deck_y(720.0) + 43.0), Vector2(0.0, _deck_y(0.0) + 48.0)
	])
	_draw_shape(deck, Color(0.73, 0.18, 0.14, 1.0), INK, 7.0)

	_draw_tower(294.0, 386.0, _deck_y(294.0) - 6.0, 64.0)
	_draw_tower(548.0, 474.0, _deck_y(548.0) - 5.0, 42.0)

	for x_int in range(13, 700, 46):
		var x := float(x_int)
		var y := _deck_y(x) + 12.0
		draw_line(Vector2(x, y), Vector2(minf(x + 21.0, 715.0), _deck_y(minf(x + 21.0, 715.0)) + 12.0), Color(1.0, 0.89, 0.63, 0.95), 4.0, true)

func _draw_tower(center_x: float, top_y: float, base_y: float, width: float) -> void:
	var top_left := Vector2(center_x - width * 0.5, top_y)
	var top_right := Vector2(center_x + width * 0.5, top_y)
	var base_left := Vector2(center_x - width * 0.32, base_y)
	var base_right := Vector2(center_x + width * 0.32, base_y)
	_draw_line_outline(top_left, base_left, INK, BRIDGE_HIGHLIGHT, 28.0, 17.0)
	_draw_line_outline(top_right, base_right, INK, BRIDGE_HIGHLIGHT, 28.0, 17.0)
	_draw_line_outline(top_left, top_right, INK, BRIDGE_HIGHLIGHT, 31.0, 19.0)
	for f in [0.18, 0.43, 0.68, 0.91]:
		var y := lerpf(top_y, base_y, float(f))
		var left_x := lerpf(top_left.x, base_left.x, float(f))
		var right_x := lerpf(top_right.x, base_right.x, float(f))
		_draw_line_outline(Vector2(left_x, y), Vector2(right_x, y), INK, BRIDGE_HIGHLIGHT, 13.0, 7.0)
	_draw_line_outline(Vector2(top_left.x + 2.0, top_y + 5.0), Vector2(base_right.x - 2.0, base_y - 8.0), INK, BRIDGE_RED, 7.0, 3.5)
	_draw_line_outline(Vector2(top_right.x - 2.0, top_y + 5.0), Vector2(base_left.x + 2.0, base_y - 8.0), INK, BRIDGE_RED, 7.0, 3.5)

func _draw_smoke(t: float) -> void:
	var progress := clampf((t - 0.9) / 5.5, 0.0, 1.0)
	if progress <= 0.015:
		return
	var center := Vector2(375.0, 493.0)
	var points := PackedVector2Array()
	var samples := 120
	for i in range(samples + 1):
		var fraction := float(i) / float(samples)
		if fraction > progress:
			break
		var angle := -PI * 0.5 + TAU * fraction
		points.append(center + Vector2(cos(angle) * 231.0, sin(angle) * 183.0))
	if points.size() > 1:
		draw_polyline(points, Color(0.13, 0.23, 0.30, 0.42), 12.0, true)
		draw_polyline(points, Color(0.98, 0.99, 1.0, 0.96), 7.0, true)

func _draw_plane(t: float) -> void:
	var progress := clampf((t - 0.9) / 5.5, 0.0, 1.0)
	var center := Vector2(375.0, 493.0)
	var angle := -PI * 0.5 + progress * TAU
	var local_position := Vector2(cos(angle) * 231.0, sin(angle) * 183.0)
	var position := center + local_position
	var tangent := Vector2(-sin(angle) * 231.0, cos(angle) * 183.0)
	var rotation := tangent.angle()
	var scale := 0.84 + 0.11 * (0.5 + 0.5 * sin(angle))

	var wing: Array = [
		Vector2(-15.0, -6.0), Vector2(2.0, -12.0), Vector2(18.0, -38.0),
		Vector2(32.0, -38.0), Vector2(24.0, -7.0), Vector2(17.0, 0.0),
		Vector2(24.0, 7.0), Vector2(32.0, 38.0), Vector2(18.0, 38.0),
		Vector2(2.0, 12.0), Vector2(-15.0, 6.0)
	]
	_draw_shape(_transform_points(wing, position, rotation, scale), INK, INK, 2.0)
	var tail: Array = [
		Vector2(-48.0, -5.0), Vector2(-39.0, -17.0), Vector2(-26.0, -17.0),
		Vector2(-30.0, -5.0), Vector2(-15.0, 0.0), Vector2(-30.0, 5.0),
		Vector2(-26.0, 17.0), Vector2(-39.0, 17.0), Vector2(-48.0, 5.0)
	]
	_draw_shape(_transform_points(tail, position, rotation, scale), INK, INK, 2.0)
	var fuselage: Array = [
		Vector2(-61.0, 0.0), Vector2(-43.0, -7.0), Vector2(31.0, -7.0),
		Vector2(50.0, -3.3), Vector2(59.0, 0.0), Vector2(50.0, 3.3),
		Vector2(31.0, 7.0), Vector2(-43.0, 7.0)
	]
	_draw_shape(_transform_points(fuselage, position, rotation, scale), Color(0.30, 0.38, 0.23, 1.0), INK, 3.2)

	var canopy_center := _world_point(Vector2(-5.0, -8.0), position, rotation, scale)
	draw_circle(canopy_center, 9.0 * scale, INK)
	draw_circle(canopy_center, 6.0 * scale, Color(0.72, 0.90, 0.96, 1.0))
	var face_center := _world_point(Vector2(-7.0, -8.0), position, rotation, scale)
	draw_circle(face_center, 4.0 * scale, Color(0.96, 0.93, 0.84, 1.0))
	draw_circle(_world_point(Vector2(-9.0, -9.0), position, rotation, scale), 1.0 * scale, INK)
	draw_circle(_world_point(Vector2(-5.0, -9.0), position, rotation, scale), 1.0 * scale, INK)

	var star := _star_points(Vector2(12.0, 20.0), 7.0)
	_draw_shape(_transform_points(star, position, rotation, scale), Color(0.96, 0.94, 0.83, 1.0), INK, 1.2)
	var nose := _world_point(Vector2(59.0, 0.0), position, rotation, scale)
	var spin := t * 17.0
	var blade_a := Vector2(cos(spin), sin(spin)) * 13.0 * scale
	var blade_b := Vector2(cos(spin + PI * 0.5), sin(spin + PI * 0.5)) * 13.0 * scale
	draw_line(nose - blade_a, nose + blade_a, INK, 3.0, true)
	draw_line(nose - blade_b, nose + blade_b, INK, 3.0, true)

func _draw_caption(t: float) -> void:
	var caption := "THE GOLDEN GATE"
	if t >= 1.4 and t < 6.7:
		caption = "LOOPING THE BRIDGE"
	elif t >= 6.7:
		caption = "ONE DARING LOOP"
	var font := ThemeDB.fallback_font
	if font == null:
		return
	var position := Vector2(20.0, 1142.0)
	var offsets := [Vector2(-3.0, -2.0), Vector2(3.0, -2.0), Vector2(-3.0, 2.0), Vector2(3.0, 2.0), Vector2(0.0, 3.0)]
	for offset in offsets:
		draw_string(font, position + offset, caption, HORIZONTAL_ALIGNMENT_CENTER, 680.0, 43, INK)
	draw_string(font, position, caption, HORIZONTAL_ALIGNMENT_CENTER, 680.0, 43, Color(1.0, 1.0, 1.0, 1.0))
	draw_string(font, Vector2(56.0, 92.0), "SAN FRANCISCO  •  1942", HORIZONTAL_ALIGNMENT_LEFT, 360.0, 22, Color(1.0, 1.0, 1.0, 0.92))

func _cable_y(x: float) -> float:
	if x <= 294.0:
		var f := x / 294.0
		return lerpf(610.0, 386.0, f) - 20.0 * sin(PI * f)
	var far_fraction := (x - 294.0) / 426.0
	return 386.0 + 262.0 * far_fraction * far_fraction

func _deck_y(x: float) -> float:
	return 780.0 - 0.105 * x

func _draw_line_outline(from: Vector2, to: Vector2, outline: Color, fill: Color, outline_width: float, fill_width: float) -> void:
	draw_line(from, to, outline, outline_width, true)
	draw_line(from, to, fill, fill_width, true)

func _draw_shape(points: PackedVector2Array, fill: Color, outline: Color, outline_width: float) -> void:
	if points.size() < 3:
		return
	draw_colored_polygon(points, fill)
	var closed := points.duplicate()
	closed.append(points[0])
	draw_polyline(closed, outline, outline_width, true)

func _transform_points(points: Array, origin: Vector2, angle: float, scale: float = 1.0) -> PackedVector2Array:
	var result := PackedVector2Array()
	for point_variant in points:
		var point: Vector2 = point_variant
		result.append(origin + Vector2(point.x * cos(angle) - point.y * sin(angle), point.x * sin(angle) + point.y * cos(angle)) * scale)
	return result

func _world_point(point: Vector2, origin: Vector2, angle: float, scale: float = 1.0) -> Vector2:
	return origin + Vector2(point.x * cos(angle) - point.y * sin(angle), point.x * sin(angle) + point.y * cos(angle)) * scale

func _star_points(center: Vector2, radius: float) -> Array:
	var result: Array = []
	for i in range(10):
		var r := radius if i % 2 == 0 else radius * 0.44
		var angle := -PI * 0.5 + float(i) * PI / 5.0
		result.append(center + Vector2(cos(angle), sin(angle)) * r)
	return result
