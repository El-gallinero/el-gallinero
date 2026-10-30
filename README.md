# EL GALLINERO

> Parodia. Personajes y situaciones ficticios; cualquier parecido es una caricatura satírica.

Juego 2D pixel-art satírico para móvil (vertical 9:16). Phaser 3 + TypeScript + Vite. Todo el arte y el sonido se generan por código: no hay assets externos.

## Arrancar
```
npm install
npm run dev            # desarrollo (http://localhost:5173)
npm run build          # dist/ para publicar en cualquier hosting estático
npm run build:single   # dist/index.html autocontenido (abre con doble clic)
```
Parámetros de prueba: `?debug` (hook `window.__gallinero`), `?npc=6` (la gallina aparece a los 6 s en vez de 45).

## Dónde cambiar cosas
- Nombres, frases, posiciones, reacción del zorro (`A` risa, `B` come papeleta, `C` come papeleta y político): `src/config/politicians.ts`
- Textos de la interfaz: `src/config/dialogs.ts`
- Velocidades, radios, tiempos (incluido el de la gallina, 45 s): `src/config/game.ts`
- Mapa (caminos, vallas, decorado, puerta): `src/config/world.ts`
- Aspecto de cada político: `src/art/looks.ts` y `src/art/politicians.ts`
- Para sustituir sprites por PNG propios: registra la textura con la misma clave (`pol_{id}_{walk|idle|talk|stand|knock|cheer|scared}_{dir}_{n}`, `gal_*`, `fox_*`) en `src/art/index.ts`.

## Estado de pruebas (honesto)
Probado en Chromium headless con emulación móvil (Playwright): arranque, joystick táctil, diálogo de cada interacción, NO sin reaparición inmediata, SÍ con entrega de papeleta, cinemática por los caminos hasta la puerta, llamadas, luz roja, zorro con reacciones A y C (B revisada en capturas), JUGAR OTRA VEZ, gallina NPC única con la frase exacta, build de producción.
NO probado: móviles reales (rendimiento, tacto, audio en iOS), TERMINAR/pantalla final en ejecución completa, partidas largas encadenadas, todas las colisiones con vallas.

## Pendiente / provisional ⚠️
- Los avatares son procedurales y aún están por debajo de la hoja de referencia ; se pulen en iteraciones.
- Ficción satírica: aviso incluido en pantalla de título.
