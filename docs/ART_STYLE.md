# Dirección de arte

## Fuente visual canónica

Los protagonistas deben usar **los sprites dibujados y aprobados para el proyecto**, no reconstrucciones procedurales.

Assets oficiales de runtime:

- `assets/sprites/nico_poses.png`
- `assets/sprites/vera_poses.png`

Cada archivo es un spritesheet de **4 × 4** con **16 poses**. Los assets de runtime son **256 × 256 px**, por lo que cada pose ocupa una celda de **64 × 64 px**.

Los sprites enviados por el autor son la referencia visual de mayor autoridad.

## Resolución y composición

- Resolución/viewport objetivo: **854 × 480 px**.
- Sprites grandes y legibles; fondos densos; poca sensación de espacio vacío.
- La composición debe recordar a un RPG 2D de la era GBA.
- **No** aplicar `image-rendering: pixelated` / `crisp-edges` al canvas completo.
- El aspecto GBA debe venir de la composición, cámara, paleta y escala, no de hacer visibles píxeles artificiales.

## Stack gráfico

- Canvas 2D.
- PNG transparentes.
- Personajes mediante `drawImage` y recorte de la celda correspondiente.
- Los frames de 64 × 64 se muestran aproximadamente a **92 px**.
- `ctx.imageSmoothingEnabled = true` e `imageSmoothingQuality = 'high'` al escalar.
- Prohibido reconstruir el cuerpo del protagonista con primitivas (`fillRect`, polígonos, etc.).
- Las animaciones cambian entre poses reales del sheet.

“Sin antialiasing” describe el **trazo de la ilustración fuente**, no una obligación de aplicar nearest-neighbour al canvas. El navegador no debe introducir un mosaico que no existe en el dibujo original.

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

## Estilo base

- dibujo 2D deliberadamente hecho a mano;
- estética MS Paint;
- bordes negros puros (`#000000`), gruesos e irregulares;
- pocos colores planos y saturados;
- proporciones caricaturescas y siluetas imperfectas;
- asimetrías deliberadas;
- evitar gradientes, iluminación 3D y acabado vectorial limpio;
- rasgos simples y expresivos;
- ropa urbana cotidiana y poco heroica.

## Protagonistas

### Nico

Buzo rojo, pantalón azul, zapatillas blancas con rojo, anteojos rectangulares grandes.

### Vera

Moño rosa, buzo rosa, pantalón violeta, zapatillas claras, anteojos rectangulares grandes. Sus poses no deben sentirse como un recolor de Nico.

## Mochila y teclado

Deben incorporarse como sprites dibujados en el mismo lenguaje visual o frames específicos del protagonista; no como primitivas limpias superpuestas.

## Principio de consistencia

Todo NPC, prop y escenario nuevo debe convivir visualmente con Nico y Vera sin parecer proveniente de otro juego.