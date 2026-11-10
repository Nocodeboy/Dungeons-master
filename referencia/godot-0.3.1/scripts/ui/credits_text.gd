class_name CreditsText
extends Object
## Créditos y atribuciones de licencia.

const SRD_ATTRIBUTION := "This work includes material from the System Reference Document 5.2.1 (\"SRD 5.2.1\") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode."

static func bbcode() -> String:
	var h := "[font_size=%d][color=#dbb366]%s[/color][/font_size]\n"
	var big := UI.fs(23)
	var out := ""
	out += h % [big, "Marca de Granito"]
	out += "Un juego de rol táctico por turnos para móviles, inspirado en los clásicos de rol de los años noventa. Diseño, código y textos: Germán (@nocodeboy) con Claude.\n"
	out += "Compatible con la quinta edición (5E compatible).\n\n"
	out += h % [big, "Reglas"]
	out += "Las reglas del juego proceden del SRD 5.2.1, adaptadas y traducidas al español.\n"
	out += "[color=#bfb3a0][i]%s[/i][/color]\n\n" % SRD_ATTRIBUTION
	out += h % [big, "Modelos 3D"]
	out += "• [b]KayKit[/b] por Kay Lousberg (kaylousberg.com): Character Pack Adventures, Character Pack Skeletons, Dungeon Remastered, Halloween Bits y Medieval Hexagon Pack. Licencia CC0.\n"
	out += "• [b]Quaternius[/b] (quaternius.com): Ultimate Animated Animals, Ultimate Monsters, Stylized Nature MegaKit, Fantasy Props MegaKit, Medieval Village MegaKit, LowPoly Animated Farm Animals y Nature Crops Pack. Licencia CC0.\n"
	out += "• La hierba y el trigo, el suelo continuo, el agua, el humo y las luciérnagas se generan por código para este juego; las texturas del empedrado y del ruido del terreno son del Medieval Village MegaKit de Quaternius (CC0).\n\n"
	out += h % [big, "Iconos"]
	out += "game-icons.net, por [b]Lorc[/b], [b]Delapouite[/b], [b]Skoll[/b], [b]Sbed[/b], [b]Zeromancer[/b], [b]Felbrigg[/b] y [b]Guard13007[/b]. Licencia CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/). Recoloreados para el juego.\n\n"
	out += h % [big, "Música"]
	out += "[b]RandomMind[/b] (opengameart.org/users/randommind), licencia CC0: «Medieval: Exploration» (menú), «Medieval: The Bard's Tale» (relatos), «Medieval: Battle» (combate), «Fantasy: Lament for a Warrior's Soul» (túmulo), «Medieval: Rejoicing» (victoria), «Medieval: Defeat Theme» (derrota), «Medieval: Harvest Season» y «Medieval: Market Day» (Merrowick), «Medieval: The Old Tower Inn» (posada) y «Fantasy: Rising Moon» (bosque de Elderhal).\n\n"
	out += h % [big, "Efectos de sonido"]
	out += "[b]Kenney[/b] (kenney.nl): RPG Audio, Impact Sounds, Interface Sounds y UI Audio. Licencia CC0. Efectos mágicos sintetizados para el juego.\n\n"
	out += h % [big, "Tipografías"]
	out += "• [b]Cinzel[/b] y [b]Cinzel Decorative[/b], por Natanael Gama. SIL Open Font License 1.1.\n"
	out += "• [b]Alegreya[/b] y [b]Alegreya SC[/b], por Juan Pablo del Peral (Huerta Tipográfica). SIL Open Font License 1.1.\n"
	out += "• Piedra y bronce de la interfaz y pergamino del mapa: texturas generadas por código para este juego.\n\n"
	out += h % [big, "Motor"]
	out += "Hecho con [b]Godot Engine[/b] (godotengine.org), licencia MIT. Copyright (c) 2014-present Godot Engine contributors; (c) 2007-2014 Juan Linietsky, Ariel Manzur.\n"
	return out

## Licencia de Godot y avisos de los componentes de terceros que incluye el motor.
static func godot_license() -> String:
	var out := Engine.get_license_text().strip_edges() + "\n\n"
	out += "COMPONENTES DE TERCEROS\n\n"
	for comp in Engine.get_copyright_info():
		out += "%s\n" % comp.get("name", "")
		for part in comp.get("parts", []):
			for line in part.get("copyright", []):
				out += "  © %s\n" % line
			out += "  Licencia: %s\n" % part.get("license", "")
		out += "\n"
	var infos: Dictionary = Engine.get_license_info()
	for k in infos.keys():
		out += "— %s —\n%s\n\n" % [k, str(infos[k]).strip_edges()]
	return out
