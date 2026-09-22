# Dirección de arte

## Fuente visual canónica

Los protagonistas deben usar **los sprites dibujados y aprobados para el proyecto**, no reconstrucciones procedurales.

Assets oficiales de runtime:

- `assets/sprites/nico_poses.png`
- `assets/sprites/vera_poses.png`

Cada archivo es un spritesheet de **4 × 4** con **16 poses**. Para runtime se conserva una celda de **32 × 32 px** por pose y se muestra normalmente a **2× (64 × 64 px)** mediante nearest-neighbor.

Los sprites originales enviados por el autor son la referencia visual de mayor autoridad. Si el código, una descripción textual o un asset futuro entra en conflicto con ellos, prevalece el sprite aprobado.

## Stack gráfico

- Canvas 2D.
- Sprites PNG con transparencia.
- `ctx.imageSmoothingEnabled = false`.
- Escalado entero siempre que sea posible.
- CSS: `image-rendering: pixelated` / `crisp-edges`.
- Personajes mediante `drawImage`, recortando la celda correspondiente del spritesheet.
- Prohibido reconstruir el cuerpo del protagonista usando `fillRect`, polígonos, vectores o un renderer procedural.
- Las animaciones se construyen cambiando entre dibujos/poses reales, no deformando geométricamente el cuerpo.

El objetivo técnico es que el juego se perciba como un RPG 2D de baja resolución de la era GBA, aunque el dibujo conserve deliberadamente su personalidad de MS Paint.

## Mapa de poses

Índices row-major de izquierda a derecha y de arriba hacia abajo:

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

Este mapa puede especializarse más adelante, pero el índice del dibujo nunca debe reinterpretarse silenciosamente sin actualizar este documento.

## Estilo base

Reglas obligatorias para personajes y sprites:

- dibujo 2D deliberadamente hecho a mano;
- estética MS Paint / sprite crudo de PC de fines de los 90 y 2000;
- bordes negros puros (`#000000`), gruesos e irregulares;
- **sin antialiasing**;
- píxeles y escalones visibles en diagonales y curvas;
- pocos colores planos, saturados y claramente separados;
- proporciones caricaturescas y siluetas imperfectas;
- asimetrías deliberadas;
- evitar sombreado suave, gradientes, iluminación 3D o acabado vectorial limpio;
- evitar pixel-art excesivamente prolijo: debe conservar sensación de dibujo manual;
- ojos y rasgos faciales simples, expresivos y ligeramente torcidos;
- ropa urbana cotidiana, amplia y poco heroica.

## Protagonistas

### Nico

- buzo rojo intenso;
- pantalón azul fuerte;
- zapatillas blancas con detalles rojos;
- anteojos rectangulares grandes;
- postura caricaturesca y reconocible.

### Vera

- moño/acento rosa;
- buzo rosa;
- pantalón violeta;
- zapatillas blancas con detalles rojos/rosas;
- anteojos rectangulares grandes;
- poses propias: no debe sentirse como un simple recolor de Nico.

## Mochila y teclado

Los sheets actuales fijan el cuerpo y la expresividad de los protagonistas. Cuando incorporemos mochila reglamentaria, teclado y cable al gameplay definitivo, deben implementarse como **sprites dibujados en el mismo lenguaje visual** o como frames específicos del personaje.

No volver a dibujarlos con primitivas limpias encima del personaje salvo como placeholder temporal explícito.

## Principio de consistencia

Todo NPC, prop y escenario nuevo debe poder convivir visualmente con Nico y Vera sin parecer proveniente de otro juego.

Si algo se ve demasiado limpio, vectorial, simétrico, suavizado o profesionalmente pulido, está fuera de estilo.