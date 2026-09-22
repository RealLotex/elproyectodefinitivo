# Dirección de arte

## Fuente visual canónica

Los protagonistas deben usar **los sprites dibujados y aprobados para el proyecto**, no reconstrucciones procedurales.

Assets oficiales de runtime:

- `assets/sprites/nico_poses.png`
- `assets/sprites/vera_poses.png`

Cada archivo es un spritesheet de **4 × 4** con **16 poses**. Los assets de runtime son **512 × 512 px**, por lo que cada pose ocupa una celda de **128 × 128 px**.

Los sprites enviados por el autor son la referencia visual de mayor autoridad. Si el código, una descripción textual o un asset futuro entra en conflicto con ellos, prevalece el sprite aprobado.

## Resolución y composición

- Resolución interna objetivo: **854 × 480 px**.
- El viewport del juego no lleva marco, borde ni sombra decorativa exterior.
- El canvas se presenta con `image-rendering: pixelated` / `crisp-edges`.
- `ctx.imageSmoothingEnabled = false` para sprites y rendering 2D.
- Los protagonistas se dibujan normalmente a **128 px de alto**, usando la celda 128 × 128 a escala 1:1.
- Evitar personajes diminutos rodeados de demasiado espacio vacío.
- La composición debe recordar a juegos 2D de GBA: sprites grandes y legibles, fondos densos y la acción ocupando una porción importante del cuadro.

La referencia compositiva no implica copiar interfaces concretas de otros juegos; importa la relación entre tamaño de sprite, escenario y viewport.

## Stack gráfico

- Canvas 2D.
- Sprites PNG con transparencia.
- Personajes mediante `drawImage`, recortando la celda correspondiente del spritesheet.
- Sin suavizado ni antialiasing añadido por el runtime.
- Escalado entero siempre que sea posible.
- Prohibido reconstruir el cuerpo del protagonista usando `fillRect`, polígonos, vectores o un renderer procedural.
- Las animaciones se construyen cambiando entre dibujos/poses reales.

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

Si algo se ve demasiado limpio, vectorial, simétrico, suavizado o incompatible con el trazo de los protagonistas, está fuera de estilo.