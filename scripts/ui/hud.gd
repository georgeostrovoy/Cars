extends CanvasLayer

@onready var phase_label: Label = %PhaseLabel
@onready var tip_label: Label = %TipLabel

func set_phase(phase_name: String, tip: String) -> void:
	phase_label.text = phase_name
	tip_label.text = tip
