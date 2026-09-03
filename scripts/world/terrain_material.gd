extends Resource
class_name TerrainMaterial

@export var surface_name := "dirt"
@export_range(0.05, 2.0, 0.01) var traction := 1.0
@export_range(0.05, 2.0, 0.01) var lateral_grip := 1.0
@export_range(0.1, 3.0, 0.01) var bounce_damping := 1.0
