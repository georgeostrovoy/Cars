extends Node
class_name GameManager

var points: int = 0
var current_level: int = 1
var unlocked_levels: int = 1
var upgrades := {
	"engine_power": 1,
	"wheel_grip": 1,
	"suspension_strength": 1,
	"stability": 1,
}

func add_points(amount: int) -> void:
	points += amount

func complete_level(level_index: int) -> void:
	if level_index >= unlocked_levels:
		unlocked_levels = level_index + 1
	add_points(100 * level_index)

func get_upgrade_multiplier(upgrade_id: String) -> float:
	return 1.0 + (upgrades.get(upgrade_id, 1) - 1) * 0.12
