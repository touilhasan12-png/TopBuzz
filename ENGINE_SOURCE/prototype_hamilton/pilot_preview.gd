extends Node2D

# Five-second cut-out proof: the pilot is a 12-image walk cycle played at 12 fps,
# not one still image sliding across the plate. The feet define the path anchor;
# the camera follows that target smoothly, and the pose changes to a stop at 3s.
const VW: float = 720.0
const VH: float = 1280.0
const FPS: float = 30.0
const WALK_FPS: float = 12.0
const DURATION: float = 5.0
const WALK_CONTENT_WIDTH: float = 347.0
const WALK_CONTENT_HEIGHT: float = 715.0
const WALK_CANVAS_WIDTH: float = 411.0
const STAND_CONTENT_HEIGHT: float = 692.0
const PAPER := Color(0.96, 0.93, 0.84, 0.92)
const INK := Color(0.14, 0.16, 0.17, 1.0)
const RUST := Color(0.50, 0.20, 0.14, 1.0)

var frame_index: int = 0
var plate: Texture2D
var plane: Texture2D
var walk_frames: Array[Texture2D] = []
var stand_pose: Texture2D
var clouds: Texture2D
var sans: Font
var serif: Font

func _ready() -> void:
	plate = load("res://assets/hamilton_empty_plate.png") as Texture2D
	plane = load("res://assets/p38_parked.png") as Texture2D
	for i in range(12):
		var frame_path: String = "res://assets/walk_cycle/pilot_walk_%02d.png" % i
		walk_frames.append(load(frame_path) as Texture2D)
	stand_pose = load("res://assets/bong_standing.png") as Texture2D
	clouds = load("res://assets/clouds.png") as Texture2D
	sans = load("res://assets/fonts/DejaVuSans.ttf") as Font
	serif = load("res://assets/fonts/DejaVuSerif.ttf") as Font

func _process(_delta: float) -> void:
	frame_index += 1
	queue_redraw()

func _draw() -> void:
	if walk_frames.is_empty() or plate == null or plane == null:
		return
	var t: float = minf(float(frame_index) / FPS, DURATION)
	var u: float = clampf(t / DURATION, 0.0, 1.0)
	var walk_progress: float = _smooth(clampf(u / 0.60, 0.0, 1.0))
	var pilot_x: float = lerpf(116.0, 305.0, walk_progress)
	var foot_y: float = 1015.0
	var follow_target := Vector2(pilot_x, foot_y - 145.0)
	var home := Vector2(350.0, 870.0)
	var camera := Vector2((follow_target.x - home.x) * 0.18, (follow_target.y - home.y) * 0.10)

	_draw_plate(camera, 1.035 + 0.012 * u)
	_draw_cloud_layer(u, camera)

	# The parked P-38 is its own transparent prop, anchored at its landing gear.
	var plane_center := Vector2(510.0, 914.0) - camera * 0.72
	_ellipse(Vector2(512.0, 982.0) - camera * 0.72, 178.0, 12.0, Color(0.12, 0.11, 0.09, 0.16))
	_sprite(plane, plane_center, 398.0, -0.012, Color.WHITE)

	# Twelve distinct transparent drawings cycle quickly; only this sprite is posed, not the background.
	var walk_frame_index: int = int(floor(t * WALK_FPS)) % walk_frames.size()
	var walk_pose: Texture2D = walk_frames[walk_frame_index]
	var stride: float = sin(TAU * t * 1.25)
	var pose_width: float = 146.0
	var walk_scale: float = pose_width / WALK_CONTENT_WIDTH
	var walk_canvas_width: float = float(walk_pose.get_width()) * walk_scale
	var walk_visible_height: float = WALK_CONTENT_HEIGHT * walk_scale
	var bob: float = absf(stride) * 2.4 * (1.0 - _smooth(clampf((t - 3.0) / 0.35, 0.0, 1.0)))
	var walk_amount: float = 1.0 - _smooth(clampf((t - 3.05) / 0.42, 0.0, 1.0))
	var walk_center := Vector2(pilot_x, foot_y - walk_visible_height * 0.5 + bob) - camera
	var stand_scale: float = walk_visible_height / STAND_CONTENT_HEIGHT
	var stand_canvas_width: float = float(stand_pose.get_width()) * stand_scale
	var stand_center := Vector2(pilot_x + 2.0, foot_y - walk_visible_height * 0.5) - camera
	_ellipse(Vector2(pilot_x, foot_y) - camera, 54.0, 8.0, Color(0.12, 0.11, 0.09, 0.17))
	_sprite(walk_pose, walk_center, walk_canvas_width, 0.012 * stride * walk_amount, Color(1.0, 1.0, 1.0, walk_amount))
	_sprite(stand_pose, stand_center, stand_canvas_width, 0.0, Color(1.0, 1.0, 1.0, 1.0 - walk_amount))

	_draw_editorial_text(t)

func _draw_plate(camera: Vector2, zoom: float) -> void:
	var size := Vector2(VW, VH) * zoom
	var top_left := (Vector2(VW, VH) - size) * 0.5 - camera * 0.16
	draw_texture_rect(plate, Rect2(top_left, size), false)

func _draw_cloud_layer(u: float, camera: Vector2) -> void:
	var width: float = 870.0
	var scale: float = width / float(clouds.get_width())
	var pos := Vector2(445.0 - 44.0 * u, 280.0) - camera * 0.34
	draw_set_transform(pos, 0.0, Vector2(scale, scale))
	draw_texture(clouds, -clouds.get_size() * 0.5, Color(1.0, 1.0, 1.0, 0.40))
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _sprite(tex: Texture2D, center: Vector2, width: float, rotation: float, tint: Color) -> void:
	if tex == null or width <= 0.0:
		return
	var scale: float = width / float(tex.get_width())
	draw_set_transform(center, rotation, Vector2(scale, scale))
	draw_texture(tex, -tex.get_size() * 0.5, tint)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _ellipse(center: Vector2, radius_x: float, radius_y: float, color: Color) -> void:
	draw_set_transform(center, 0.0, Vector2(radius_x, radius_y))
	draw_circle(Vector2.ZERO, 1.0, color)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _draw_editorial_text(t: float) -> void:
	var fade: float = _smooth(clampf(t / 0.35, 0.0, 1.0))
	draw_line(Vector2(34.0, 90.0), Vector2(80.0, 90.0), Color(RUST.r, RUST.g, RUST.b, fade), 3.0, true)
	_label("HAMILTON FIELD  /  1942", 94.0, 97.0, 18, Color(INK.r, INK.g, INK.b, 0.95 * fade), HORIZONTAL_ALIGNMENT_LEFT, 560.0, false)
	var caption_alpha: float = _smooth(clampf(t / 0.30, 0.0, 1.0))
	draw_rect(Rect2(30.0, 1087.0, 660.0, 82.0), Color(PAPER.r, PAPER.g, PAPER.b, 0.82 * caption_alpha))
	draw_line(Vector2(52.0, 1102.0), Vector2(99.0, 1102.0), Color(RUST.r, RUST.g, RUST.b, caption_alpha), 3.0, true)
	_label("A NEW PILOT. A NEW P-38.", 52.0, 1140.0, 24, Color(INK.r, INK.g, INK.b, caption_alpha), HORIZONTAL_ALIGNMENT_LEFT, 615.0, true)
	draw_rect(Rect2(18.0, 18.0, VW - 36.0, VH - 36.0), Color(0.19, 0.17, 0.14, 0.10), false, 1.5)

func _label(text: String, x: float, y: float, size: int, color: Color, align: HorizontalAlignment, width: float, use_serif: bool) -> void:
	var font: Font = serif if use_serif else sans
	var draw_x := x
	if align == HORIZONTAL_ALIGNMENT_CENTER:
		draw_x -= width * 0.5
	elif align == HORIZONTAL_ALIGNMENT_RIGHT:
		draw_x -= width
	draw_string(font, Vector2(draw_x + 1.2, y + 1.5), text, align, width, size, Color(0.10, 0.10, 0.10, 0.28 * color.a))
	draw_string(font, Vector2(draw_x, y), text, align, width, size, color)

func _smooth(x: float) -> float:
	var v: float = clampf(x, 0.0, 1.0)
	return v * v * (3.0 - 2.0 * v)
