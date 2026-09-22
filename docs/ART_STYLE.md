# Dirección de arte

## Fuente visual canónica

Los assets originales aprobados son la fuente de verdad del juego.

### Protagonistas

- `boy.png` — spritesheet masculino oficial.
- `fem.png` — spritesheet femenino oficial.
- `boyportrait.png` — retrato masculino oficial.
- `fenportrait.png` — retrato femenino oficial.

Los antiguos `assets/sprites/nico_poses.png` y `assets/sprites/vera_poses.png` quedan obsoletos para runtime y no deben volver a utilizarse como fuente del personaje.

Los sheets de protagonista se interpretan como una grilla **4 × 4 / 16 poses**. El renderer obtiene el tamaño de celda directamente de la resolución original y dibuja desde el archivo completo, sin generar sprites reducidos intermedios.

## Resolución y render

El juego **no tiene una resolución raster fija baja**.

`854 × 480` se conserva únicamente como **sistema de coordenadas de diseño** para no reescribir la lógica existente. No representa la resolución visual final.

La resolución real del canvas debe ser:

`ancho CSS × devicePixelRatio` por `alto CSS × devicePixelRatio`.

Reglas obligatorias:

- usar toda la resolución física disponible del dispositivo;
- `ctx.imageSmoothingEnabled = true`;
- `ctx.imageSmoothingQuality = 'high'`;
- `image-rendering: auto`;
- prohibido `pixelated`, `crisp-edges` y nearest-neighbour global;
- prohibido reducir los sprites a 64/96/128 px para luego volver a ampliarlos;
- usar siempre los PNG originales de mayor calidad disponibles;
- los sprites pueden escalarse por composición/cámara, pero nunca pasar por un asset runtime degradado.

## Composición

La pantalla útil debe llenar todo el espacio disponible.

### Desktop

El viewport del juego ocupa toda la ventana. Los controles secundarios de navegador/juego pueden superponerse discretamente, pero no reservar bandas negras o marcos exteriores.

### Mobile

La pantalla se divide verticalmente en dos zonas:

1. **viewport jugable flexible**, que ocupa todo el espacio restante;
2. **mando táctil fijo abajo**, con cruceta, A/B, L/R y START.

No debe existir espacio vacío entre ambos ni letterboxing impuesto por una resolución fija.

## Lenguaje visual

Se mantiene el dibujo 2D expresivo y hecho a mano de los protagonistas:

- bordes negros irregulares;
- formas caricaturescas;
- colores planos y saturados;
- siluetas simples y memorables;
- estética deliberadamente dibujada, no vectorial;
- nada de filtros que simulen baja resolución.

La estética retro debe venir del **diseño**, no de degradar la imagen.

## Mapa de poses

| Índice | Uso |
|---:|---|
| 0 | idle / neutral |
| 1 | caminar |
| 2 | correr |
| 3 | salto / celebración |
| 4 | saludar |
| 5 | señalar |
| 6 | manos en cintura |
| 7 | sorpresa |
| 8 | enojo |
| 9 | sentado |
| 10 | agachado |
| 11 | mirar arriba |
| 12 | pensar |
| 13 | celebrar |
| 14 | postura casual / inclinada |
| 15 | relajado |

## Consistencia

Todo asset nuevo —NPC, prop, escenario, UI o efecto— debe producirse en suficiente resolución para verse limpio en pantallas modernas y debe poder convivir con `boy.png` y `fem.png` sin parecer un asset reescalado o degradado.