export type JugadorImportado = { nombre: string; apellido: string; dorsal: number | null };

function capitalizar(palabra: string) {
  return palabra.charAt(0).toLocaleUpperCase("es") + palabra.slice(1).toLocaleLowerCase("es");
}

/**
 * Convierte una lista pegada (una persona por línea) en jugadores.
 *   "ALEX A"        → Alex / A
 *   "7 JUAN MARI Z" → dorsal 7, Juan Mari / Z
 *   "- ARGI"        → Argi / (sin apellido)
 * La última palabra es el apellido; el resto, el nombre.
 */
export function parseListaJugadores(texto: string): JugadorImportado[] {
  return texto
    .split(/\r?\n/)
    .map((linea) => linea.replace(/^\s*(?:[-*•·]|\d+[.)])\s+/, "").trim())
    .filter(Boolean)
    .map((linea) => {
      const palabras = linea.split(/\s+/).map(capitalizar);
      let dorsal: number | null = null;
      if (palabras.length > 1 && /^\d{1,3}$/.test(palabras[0])) {
        dorsal = Number(palabras.shift());
      }
      const apellido = palabras.length > 1 ? palabras.pop()! : "";
      return { nombre: palabras.join(" "), apellido, dorsal };
    });
}
