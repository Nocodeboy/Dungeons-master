class_name HelpText
extends Object
## Guía rápida de reglas y controles (texto en BBCode).

const SECTIONS := [
	["Tu héroe y tu compañía", [
		"Creas a tu héroe paso a paso: clase, especie, trasfondo, características, habilidades, conjuros, equipo y aspecto. Cada paso trae una elección recomendada; puedes avanzar con [b]Siguiente[/b] o afinarlo todo.",
		"Te acompañan tres de los cuatro compañeros de Valdrecht. El que cubre tu mismo papel se queda fuera por defecto, pero puedes cambiarlo.",
		"Al superar los grandes combates de la historia el grupo [b]sube de nivel[/b]. Tú eliges tus mejoras (subclase a nivel 3, conjuros nuevos, metamagia, invocaciones…); los compañeros suben solos.",
		"[b]Habilidad especial[/b] de clase (Furia, Forma salvaje, Inspiración bárdica…): búscala en el botón [b]Acciones[/b].",
	]],
	["Explorar", [
		"[b]Toca el suelo[/b] para que el grupo vaya allí en formación. El que va en cabeza es el del retrato resaltado; toca otro retrato para cambiarlo.",
		"[b]Toca a una persona, un cofre, un cartel o una puerta[/b] para ir hasta allí y usarlo. Mantén pulsado un retrato para abrir su equipo.",
		"[b]Lo escondido[/b] (escondites, trampas) aparece solo si la Percepción pasiva del grupo es lo bastante alta. El botón [b]Buscar[/b] hace una tirada con calma en los alrededores.",
		"[b]Trampas[/b]: una vez vistas, el grupo las rodea; tócalas para intentar desactivarlas con herramientas de ladrón. Si nadie las ve, alguien acabará pisándolas.",
		"[b]Cerraduras[/b]: llave, herramientas de ladrón (Destreza) o fuerza bruta (Atletismo; con palanca, con ventaja).",
		"[b]Sigilo[/b]: el grupo avanza despacio y cada uno tira Sigilo contra la Percepción pasiva de los enemigos. Si nadie os ve, podéis atacar por sorpresa: ellos tiran iniciativa con desventaja y vosotros empezáis ocultos.",
		"[b]Del paseo al combate sin cortes[/b]: cuando un enemigo os ve, aparece la rejilla sobre el mismo escenario y se juega por turnos. Al acabar, se recoge el botín y se sigue explorando.",
		"Los [b]puntos de golpe, espacios de conjuro y pociones[/b] se conservan entre combates. [b]Descanso corto[/b] (1 hora, dos entre descansos largos): dados de golpe y algunos recursos. [b]Descanso largo[/b]: en la posada o junto a una hoguera segura; lo recupera todo.",
		"[b]Objetos mágicos[/b]: llegan sin identificar; un descanso corto o la hermana Aldis (20 po) los identifican. Algunos requieren [b]sintonía[/b] (máximo tres a la vez).",
		"El [b]oro[/b] es del grupo. La herrera, la herbolaria y el buhonero compran y venden; lo que les vendas puedes recomprarlo.",
		"Se guarda solo al cambiar de zona y tras cada combate; además tienes seis ranuras en el menú de pausa.",
	]],
	["Controles", [
		"[b]Tocar una casilla azul[/b]: moverte. Las amarillas exigen [i]Correr[/i] (gasta tu acción).",
		"[b]Tocar un enemigo[/b]: ver probabilidad de impacto y daño esperado. Confirma para atacar; si está lejos, el personaje se acerca solo.",
		"[b]Mantener pulsado[/b] sobre cualquier criatura: su ficha completa.",
		"[b]Arrastrar[/b] desplaza la cámara, [b]pellizcar[/b] acerca o aleja, [b]girar con dos dedos[/b] rota la vista (también con los botones de giro).",
		"[b]Deshacer[/b] revierte el último movimiento mientras no hayas hecho nada más.",
		"El botón [b]Auto[/b] de la ficha deja que el juego controle a ese compañero.",
	]],
	["Tu turno", [
		"Cada turno tienes [b]movimiento[/b] (normalmente 9 m, 6 casillas), [b]una acción[/b] y, si algo te la concede, [b]una acción adicional[/b]. Puedes repartir el movimiento antes y después de actuar.",
		"Fuera de tu turno tienes [b]una reacción[/b]: por ejemplo, un ataque de oportunidad cuando un enemigo sale de tu alcance.",
		"[b]Correr[/b] duplica tu movimiento; [b]Destrabarse[/b] evita ataques de oportunidad; [b]Esquivar[/b] da desventaja a quien te ataque.",
	]],
	["Atacar", [
		"Se tira 1d20 + modificador. Si iguala o supera la [b]CA[/b] del objetivo, impacta. Un 20 natural es [b]crítico[/b]: dados de daño dobles.",
		"[b]Ventaja[/b]: tiras dos d20 y te quedas el mayor. [b]Desventaja[/b]: el menor. Atacar a alguien derribado cuerpo a cuerpo da ventaja; desde lejos, desventaja.",
		"[b]Cobertura[/b]: media (+2 CA), tres cuartos (+5 CA) o total (no se puede apuntar). Cercas, árboles y criaturas la proporcionan.",
		"Cada arma tiene una [b]maestría[/b] que tu personaje sabe aprovechar: Debilitar, Derribar, Ralentizar, Hendir, Hostigar…",
	]],
	["Conjuros", [
		"Los [b]trucos[/b] no gastan nada. Los demás gastan un [b]espacio de conjuro[/b] de su nivel o superior (y lanzarlos a más nivel suele potenciarlos).",
		"Solo puedes mantener un conjuro de [b]concentración[/b] a la vez. Si recibes daño, haces una salvación de Constitución para no perderlo.",
		"En un mismo turno no puedes lanzar dos conjuros que gasten espacio.",
	]],
	["Caer y morir", [
		"A 0 puntos de golpe un compañero cae [b]inconsciente[/b] y hace [b]salvaciones contra la muerte[/b]: tres éxitos lo estabilizan, tres fallos lo matan.",
		"Cualquier curación lo levanta al momento. También puedes [b]estabilizarlo[/b] (Medicina) o darle una [b]poción[/b].",
		"Los enemigos sin importancia mueren directamente al llegar a 0.",
	]],
]

static func bbcode() -> String:
	var out := ""
	for s in SECTIONS:
		out += "[font_size=%d][color=#dbb366]%s[/color][/font_size]\n" % [UI.fs(24), s[0]]
		for line in s[1]:
			out += "• " + line + "\n"
		out += "\n"
	return out.strip_edges()
