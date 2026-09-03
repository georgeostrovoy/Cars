extends Area2D

@export var terrain_material: TerrainMaterial

func _on_body_entered(body: Node) -> void:
	if body.has_method("set_terrain"):
		body.set_terrain(terrain_material)

func _on_body_exited(body: Node) -> void:
	if body.has_method("set_terrain"):
		body.set_terrain(null)
