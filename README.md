# OUR STORY — The Immersive Edition

Una experiencia de aniversario interactiva creada con Vite, JavaScript, CSS 3D, Canvas y GSAP.

## Requisitos

- Windows 10/11.
- Node.js 22.12+ (recomendado: Node.js 24 LTS).
- Visual Studio Code.
- Conexión a Internet durante la instalación de dependencias.

## Ejecutar el proyecto

1. Descomprime la carpeta `Our-Story`.
2. Ábrela en Visual Studio Code.
3. Abre **Terminal → New Terminal**.
4. Instala las dependencias:

   ```bash
   npm install
   ```

5. Inicia el servidor local:

   ```bash
   npm run dev
   ```

6. Abre la dirección local que muestra Vite (normalmente `http://localhost:5173`).

Para comprobar la versión de producción:

```bash
npm run build
npm run preview
```

El resultado de producción se genera en `dist/`.

## Qué incluye

- Portal inicial con estrellas interactivas que se reúnen para formar un corazón.
- Sobre de invitación y comienzo de la historia.
- 30 fotografías principales en orden cronológico.
- Efectos de revelado, destellos, tulipán, raspadita y corazones 3D.
- Dos recuerdos con tarjeta giratoria 3D (fotografías 12 y 22); el reverso muestra el mensaje de ese recuerdo.
- Modo cine con fotografía y texto juntos, controles de pausa/reanudación y saltos de 10 segundos.
- Escena de la linterna de los deseos antes del final.
- Cielo estrellado y declaración final.
- Jardín secreto opcional con cinco fotografías adicionales. Al visitar un corazón, cambia a rojo rubí y el estado se guarda en el almacenamiento local del navegador.

## Personalización

### 30 recuerdos principales

Edita `src/data/memories.js`.

Cada objeto contiene `id`, `image`, `title`, `kicker`, `message`, `english` y, opcionalmente, `duration` o `flip`.

- Cambia los textos en `title`, `message` y `english`.
- Cambia una foto reemplazando el archivo correspondiente dentro de `public/images/` y conservando la ruta o actualizando `image`.
- `duration: 7.5` asigna un segundo adicional a ese recuerdo; los demás usan 6.5 segundos antes de cualquier ajuste automático por la duración real de la pista.
- `flip: true` activa el efecto de tarjeta giratoria.

### Jardín secreto

Edita `src/data/gardenMemories.js` para cambiar los cinco títulos y mensajes.

Las cinco fotografías optimizadas se encuentran en `public/garden/`:

- `garden-01.webp` — The Beginning
- `garden-02.webp` — Little Adventures
- `garden-03.webp` — My Favorite Memory
- `garden-04.webp` — My Happiness
- `garden-05.webp` — Forever Us

Puedes reemplazar esas imágenes manteniendo los mismos nombres.

Los corazones visitados se recuerdan en el navegador con la clave local `our-story-garden-visited`. No se crea una cuenta ni una base de datos. Para volver a probar el jardín desde cero, borra esa clave en las herramientas de desarrollador del navegador (Application/Storage → Local Storage).

### Colores y animaciones

La mayoría de los estilos están en `src/style.css`. Las secuencias de GSAP y la lógica de interacciones están en `src/main.js`.

### Música

El audio actual está en `public/audio/music.mp3` y el reproductor está preparado para esa ruta. Puedes reemplazar el archivo por otra pista autorizada manteniendo el mismo nombre.

**Importante:** el MP3 que se recibió para este proyecto se conserva como pista provisional. Antes de publicar el sitio en Internet, verifica que cuentas con los derechos o una licencia que permita alojar esa grabación públicamente.

## Publicar en Vercel

- Sube el proyecto a un repositorio de GitHub.
- Importa el repositorio desde Vercel.
- Framework preset: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.

No subas `node_modules/` al repositorio.

## Dependencias

- Vite: servidor de desarrollo y build.
- GSAP: secuencias de animación.

No se utiliza React, Next.js, base de datos ni XAMPP.
