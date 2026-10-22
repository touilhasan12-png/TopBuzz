extends Node2D

const WIDTH := 720.0
const HEIGHT := 1280.0
const FPS := 30.0
const DURATION := 8.0
const ORBIT_CENTER := Vector2(430.0, 520.0)
const ORBIT_RADIUS_X := 194.0
const ORBIT_RADIUS_Y := 194.0
const INK := Color(0.055, 0.085, 0.13, 0.92)

@onready var background: Sprite2D = $Background
@onready var plane: Sprite2D = $Plane

var frame_index := 0
var base_background_scale := Vector2.ONE

func _ready() -> void:
	var texture_size := background.texture.get_size()
	var cover_scale := maxf(WIDTH / float(texture_size.x), HEIGHT / float(texture_size.y))
	base_background_scale = Vector2(cover_scale, cover_scale)
	background.scale = base_background_scale
	background.position = Vector2(WIDTH * 0.5, HEIGHT * 0.5)
	background.z_index = -10
	plane.scale = Vector2(0.205, 0.205)
	plane.z_index = 5
	queue_redraw()

func _process(_delta: float) -> void:
	frame_index += 1
	var t := minf(float(frame_index) / FPS, DURATION)
	var progress := clampf((t - 0.75) / 5.5, 0.0, 1.0)
	var angle := -PI * 0.5 + progress * TAU
	var offset := Vector2(cos(angle) * ORBIT_RADIUS_X, sin(angle) * ORBIT_RADIUS_Y)
	plane.position = ORBIT_CENTER + offset
	var tangent := Vector2(-sin(angle) * ORBIT_RADIUS_X, cos(angle) * ORBIT_RADIUS_Y)
	plane.rotation = tangent.angle()
	var size_pulse := 1.0 + 0.045 * (0.5 + 0.5 * sin(angle + 0.6))
	plane.scale = Vector2(0.205 * size_pulse, 0.205 * size_pulse)

	var push_in := 1.0 + 0.025 * clampf(t / DURATION, 0.0, 1.0)
	background.scale = base_background_scale * push_in
	background.position = Vector2(WIDTH * 0.5 + sin(t * 0.18) * 5.0, HEIGHT * 0.5 + cos(t * 0.15) * 4.0)
	queue_redraw()

func _draw() -> void:
	var t := minf(float(frame_index) / FPS, DURATION)
	_draw_smoke_trail(t)
	_draw_motion_lines(t)
	_draw_bottom_shade()
	_draw_title_and_captions(t)

func _draw_smoke_trail(t: float) -> void:
	var progress := clampf((t - 0.75) / 5.5, 0.0, 1.0)
	if progress <= 0.01:
		return
	var points := PackedVector2Array()
	var samples := 150
	for i in range(samples + 1):
		var fraction := float(i) / float(samples)
		if fraction > progress:
			break
		var angle := -PI * 0.5 + TAU * fraction
		points.append(ORBIT_CENTER + Vector2(cos(angle) * ORBIT_RADIUS_X, sin(angle) * ORBIT_RADIUS_Y))
	if points.size() > 1:
		draw_polyline(points, Color(0.05, 0.09, 0.13, 0.45), 15.0, true)
		draw_polyline(points, Color(0.95, 0.98, 1.0, 0.90), 9.0, true)
		draw_polyline(points, Color(1.0, 1.0, 1.0, 0.56), 3.0, true)

func _draw_motion_lines(t: float) -> void:
	if t < 1.0 or t > 6.5:
		return
	var progress := clampf((t - 0.75) / 5.5, 0.0, 1.0)
	var angle := -PI * 0.5 + progress * TAU
	var tangent := Vector2(-sin(angle) * ORBIT_RADIUS_X, cos(angle) * ORBIT_RADIUS_Y).normalized()
	var plane_pos := plane.position
	for i in range(3):
		var start := plane_pos - tangent * (74.0 + float(i) * 13.0) + Vector2(0.0, float(i - 1) * 12.0)
		var finish := start - tangent * (28.0 + float(i) * 5.0)
		draw_line(start, finish, Color(0.96, 0.99, 1.0, 0.38 - float(i) * 0.07), 3.0, true)

func _draw_bottom_shade() -> void:
	var bands := 48
	for i in range(bands):
		var f := float(i) / float(bands - 1)
		var alpha := 0.55 * f * f
		var y := 995.0 + float(i) * (285.0 / float(bands))
		draw_rect(Rect2(0.0, y, WIDTH, 285.0 / float(bands) + 1.0), Color(0.025, 0.045, 0.075, alpha))

func _draw_title_and_captions(t: float) -> void:
	var font := ThemeDB.fallback_font
	if font == null:
		return
	_draw_outlined_text("SAN FRANCISCO  •  1942", Vector2(45.0, 92.0), 22, HORIZONTAL_ALIGNMENT_LEFT, 430.0)
	var caption := "THE GOLDEN GATE"
	if t >= 1.4 and t < 6.7:
		caption = "LOOPING THE GOLDEN GATE"
	elif t >= 6.7:
		caption = "ONE DARING LOOP"
	_draw_outlined_text(caption, Vector2(20.0, 1146.0), 42, HORIZONTAL_ALIGNMENT_CENTER, 680.0)

func _draw_outlined_text(text: String, position: Vector2, size: int, alignment: HorizontalAlignment, max_width: float) -> void:
	var font := ThemeDB.fallback_font
	var offsets := [Vector2(-3.0, -2.0), Vector2(3.0, -2.0), Vector2(-3.0, 2.0), Vector2(3.0, 2.0), Vector2(0.0, 3.0)]
	for offset in offsets:
		draw_string(font, position + offset, text, alignment, max_width, size, INK)
	draw_string(font, position, text, alignment, max_width, size, Color(1.0, 1.0, 1.0, 1.0))
