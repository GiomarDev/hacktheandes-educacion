// Textos de la landing (pitch de Amauti) y cuentas de demostración.
import { DROPOUTS_PER_DAY } from '@/features/landing/data';

export const NAV = [
  { href: '#espejo', label: 'El punto ciego' },
  { href: '#tesis', label: 'Por qué Amauti' },
  { href: '#piezas', label: 'De la señal al rescate' },
  { href: '#prueba', label: 'Impacto real' },
  { href: '#preguntas', label: 'Preguntas' },
];

// Cuentas sintéticas del README: el selector solo precarga el DNI en el login.
export const DEMO_ROLES = [
  {
    id: 'minedu',
    label: 'MINEDU · Nacional',
    dni: '70000100',
    role: 'Administración MINEDU',
  },
  {
    id: 'ugel',
    label: 'UGEL · Territorial',
    dni: '70000101',
    role: 'Especialista UGEL Coronel Portillo',
  },
  {
    id: 'direccion',
    label: 'Dirección · Escuela',
    dni: '70000102',
    role: 'Directora de la IE de demostración',
  },
  {
    id: 'tutoria',
    label: 'Tutoría · Aula',
    dni: '70000104',
    role: 'Tutor de 1.° A',
  },
] as const;

export const ECOSYSTEM = [
  'WhatsApp (Audio 10s en Aula)',
  'SIAGIE (Asistencia y Notas)',
  'ESCALE (Serie Histórica)',
  'Alerta Escuela (Reglas de Riesgo)',
  'SIMON (Monitoreo)',
  'CNEB (Competencias)',
];

export const CONFLICTS = [
  '«Falló en matemáticas, empezó a faltar y se apagó al fondo del salón… pero para el sistema oficial todo seguía ‘normal’»',
  '«Los pocos sistemas del Estado hacen autopsias, no rescates: avisan tras 60 días de punto ciego»',
  '«Ahogan a nuestro principal agente de cambio —el profesor— en trámites institucionales y sin tiempo para intervenir»',
  '«En el aula el docente está solo y sin computadora… salvo por la tecnología que ya tiene en su bolsillo: WhatsApp»',
  '«El director, la UGEL y el Ministerio operan desconectados pidiendo Excels cuando el alumno ya abandonó»',
];

export const FAQ = [
  {
    q: '¿Cómo un audio de 10 segundos en WhatsApp agiliza los trámites y bitacoriza las observaciones del docente?',
    a: 'El docente envía por WhatsApp lo que observó en clase. Amauti registra la observación en la bitácora del estudiante y prepara el papeleo correspondiente (sesiones, actas, registros), que el docente solo revisa y aprueba o corrige en el módulo Documentos.',
  },
  {
    q: '¿Cómo elimina Amauti el punto ciego de 60 días cuando un alumno falla en cursos clave o empieza a faltar?',
    a: 'Cada pase de lista y cada nota alimentan reglas de Alerta Escuela que se evalúan a diario (por ejemplo, 3 faltas en 10 días hábiles o nota alta sin asistencia). Al cumplirse, se abre un caso con responsable y un plazo de 2 días hábiles para contactar a la familia, en lugar de esperar al cierre del bimestre.',
  },
  {
    q: '¿Cómo se sincronizan en tiempo real el director, la UGEL y el Ministerio sin pedirle Excels al profesor?',
    a: 'Los cinco microservicios comparten los mismos registros: lo que el docente marca en el aula actualiza las alertas, los casos, los reportes SIMON y los indicadores por UGEL. Cada rol ve solo su ámbito (su IE, su UGEL o el país) con permisos verificados en cada consulta.',
  },
  {
    q: '¿Cómo se protege la confidencialidad de la bitácora y los diagnósticos psicopedagógicos?',
    a: 'Los diagnósticos de los planes de apoyo se cifran con AES-256-GCM y solo los leen tutoría asignada, psicología y dirección, con auditoría de cada lectura. El acceso usa JWT firmados (RS256 con JWKS) y roles con ámbito; el personal de aula solo ve las secciones a su cargo.',
  },
  {
    q: `¿De dónde provienen la métrica de ${DROPOUTS_PER_DAY} alumnos cada 24 horas y las series oficiales de SIAGIE/ESCALE?`,
    a: 'Del archivo SIAGIE 2023–2024 por región: 72 282 desertores en secundaria y 64 463 en primaria (136 745 en el año, ≈ 375 por día). La serie interanual 2013–2025 es la tasa oficial de ESCALE (MINEDU). Ambos archivos están en el repositorio y se importan con control de integridad.',
  },
];
