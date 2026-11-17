
const STORAGE_KEY = 'icomp_plan_v1';

let aprobadas = new Set();
let regulares = new Set();
let nombresSelectivas = {};

// ── Persistencia ────────────────────────────────────────────────────────────

export function cargarEstado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const datos = raw ? JSON.parse(raw) : {};
    aprobadas = new Set(datos.aprobadas || []);
    // Una materia no puede estar a la vez regular y aprobada
    regulares = new Set((datos.regulares || []).filter(id => !aprobadas.has(id)));
    nombresSelectivas = datos.selectivas || {};
  } catch {
    aprobadas = new Set();
    regulares = new Set();
    nombresSelectivas = {};
  }
}

function guardarEstado() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      aprobadas: [...aprobadas],
      regulares: [...regulares],
      selectivas: nombresSelectivas,
    }));
  } catch {
    
  }
}



export function aprobar(id) {
  regulares.delete(id);
  aprobadas.add(id);
  guardarEstado();
}

export function regularizar(id) {
  aprobadas.delete(id);
  regulares.add(id);
  guardarEstado();
}

// Vuelve la materia a "pendiente" (ni regular ni aprobada)
export function desaprobar(id) {
  aprobadas.delete(id);
  regulares.delete(id);
  guardarEstado();
}

export function estaRegular(id) {
  return regulares.has(id);
}

// Aprobada o regular: alcanza para cursar sus correlativas
function cumpleParaCursar(id) {
  return aprobadas.has(id) || regulares.has(id);
}

export function estaAprobada(id) {
  return aprobadas.has(id);
}

export function cantAprobadas() {
  return aprobadas.size;
}



export function estaDisponible(materia) {
  const requisitosOk = materia.requisitos.every(cumpleParaCursar);
  const cantidadOk   = !materia.requisitoCantidad || aprobadas.size >= materia.requisitoCantidad;
  return requisitosOk && cantidadOk;
}

export function obtenerEstado(materia) {
  if (aprobadas.has(materia.id)) return 'approved';
  if (regulares.has(materia.id)) return 'regular';
  if (estaDisponible(materia))   return 'available';
  return 'locked';
}

// ── Correlativas faltantes ──────────────────────────────────────────────────

export function correlativasFaltantes(materia) {
  const ids = materia.requisitos.filter(id => !cumpleParaCursar(id));

  let cantidadFaltante = 0;
  if (materia.requisitoCantidad && aprobadas.size < materia.requisitoCantidad) {
    cantidadFaltante = materia.requisitoCantidad - aprobadas.size;
  }

  return { ids, cantidadFaltante };
}



export function getNombreSelectiva(id) {
  return nombresSelectivas[id] || '';
}

export function setNombreSelectiva(id, valor) {
  nombresSelectivas[id] = valor;
  guardarEstado();
}


export function resetearProgreso() {
  aprobadas = new Set();
  regulares = new Set();
  nombresSelectivas = {};
  guardarEstado();
}
