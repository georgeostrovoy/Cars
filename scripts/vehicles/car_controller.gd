extends RigidBody2D

@export var wheel_left_path: NodePath
@export var wheel_right_path: NodePath
@export var left_joint_path: NodePath
@export var right_joint_path: NodePath

@export var engine_force := 130.0
@export var max_wheel_speed := 36.0
@export var jump_impulse := 255.0
@export var air_flip_torque := 2500.0

var _wheel_left: RigidBody2D
var _wheel_right: RigidBody2D
var _left_joint: DampedSpringJoint2D
var _right_joint: DampedSpringJoint2D
var _current_terrain: TerrainMaterial

func _ready() -> void:
	_wheel_left = get_node(wheel_left_path)
	_wheel_right = get_node(wheel_right_path)
	_left_joint = get_node(left_joint_path)
	_right_joint = get_node(right_joint_path)
	_tune_suspension(18.0, 2.3)

func _physics_process(_delta: float) -> void:
	var axis := Input.get_axis("move_left", "move_right")
	_drive(axis)
	_handle_air_control(axis)
	if Input.is_action_just_pressed("jump"):
		_try_jump()
	if Input.is_action_just_pressed("reset_car"):
		_reset_pose()

func _drive(axis: float) -> void:
	var traction := _get_traction_multiplier()
	_apply_wheel_torque(_wheel_left, axis * engine_force * traction)
	_apply_wheel_torque(_wheel_right, axis * engine_force * traction)

func _apply_wheel_torque(wheel: RigidBody2D, torque_force: float) -> void:
	if abs(wheel.angular_velocity) < max_wheel_speed:
		wheel.apply_torque(torque_force)

func _handle_air_control(axis: float) -> void:
	if not _is_grounded() and abs(axis) > 0.01:
		apply_torque(axis * air_flip_torque)

func _try_jump() -> void:
	if _is_grounded():
		apply_central_impulse(Vector2.UP * jump_impulse)

func _is_grounded() -> bool:
	return _wheel_left.get_contact_count() > 0 or _wheel_right.get_contact_count() > 0

func _tune_suspension(stiffness: float, damping: float) -> void:
	_left_joint.stiffness = stiffness
	_right_joint.stiffness = stiffness
	_left_joint.damping = damping
	_right_joint.damping = damping

func set_terrain(material: TerrainMaterial) -> void:
	_current_terrain = material

func _get_traction_multiplier() -> float:
	if _current_terrain == null:
		return 1.0
	return _current_terrain.traction

func _reset_pose() -> void:
	linear_velocity = Vector2.ZERO
	angular_velocity = 0.0
	global_position += Vector2.UP * 120.0
	global_rotation = 0.0
