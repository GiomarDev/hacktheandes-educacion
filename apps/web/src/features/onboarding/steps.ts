import type { NavIcon, NavItem, RoleClaim } from '@/features/auth/roles';
import {
  CLASSROOM,
  navFor,
  roleLabel,
  TERRITORIAL,
} from '@/features/auth/roles';
import type { State } from '@/features/mascot/amauti-animations';

export interface TourStep {
  id: string;
  // Valor de data-tour del elemento a resaltar; sin él, la tarjeta va al centro.
  target?: string;
  title: string;
  body: string;
  pose: State;
}

const school = (claim: RoleClaim) =>
  TERRITORIAL.includes(claim.role)
    ? 'Las IEs de tu ámbito, con su asistencia y sus alertas.'
    : 'Tu IE: secciones, asistencia del día y factores de riesgo.';

const COPY: Record<NavIcon, (claim: RoleClaim, item: NavItem) => string> = {
  today: () =>
    'Tu tablero del día: estudiantes que necesitan atención y lo que tienes pendiente.',
  classroom: (claim) =>
    CLASSROOM.includes(claim.role)
      ? 'Pasa lista cada día. Las faltas alimentan las alertas tempranas.'
      : 'El pase de lista de todas las secciones de la IE.',
  grades: (claim) =>
    claim.role === 'TEACHER' || claim.role === 'TUTOR'
      ? 'Registra AD, A, B o C por competencia en las áreas que dictas. SIAGIE calcula la nota del periodo.'
      : 'Consulta las calificaciones de cada sección, área y bimestre.',
  documents: (claim) =>
    claim.role === 'DIRECTOR'
      ? 'El papeleo que Amauti preparó para tus docentes desde WhatsApp y si ya lo aprobaron.'
      : 'Papeleo que Amauti preparó con tus mensajes de WhatsApp: apruébalo o súbelo corregido.',
  alerts: () =>
    'Casos que detectan las reglas de asistencia y notas. Nada se envía a una familia sin que un responsable lo decida.',
  panorama: () =>
    'Deserción oficial por región, la tendencia de ESCALE y los indicadores de tu UGEL.',
  schools: (claim) => school(claim),
  reports: (claim) =>
    TERRITORIAL.includes(claim.role)
      ? 'Revisa los reportes SIMON que envían las IEs: das conformidad u observas.'
      : 'Reportes SIMON hechos con los datos ya registrados: dirección los envía a la UGEL.',
  plans: () =>
    'Acompañamiento individual por bimestre. El diagnóstico se guarda cifrado y solo lo leen tutoría, psicología y dirección.',
  visits: (claim) =>
    claim.role === 'TEACHER' || claim.role === 'TUTOR'
      ? 'Tus visitas de monitoreo: lo observado en tu clase y la devolución.'
      : 'Agenda la observación de aula y deja la devolución con un compromiso de mejora.',
  sources: () => 'Importa los CSV oficiales de deserción de SIAGIE y ESCALE.',
  admin: () =>
    'Cuentas y roles del personal, y los umbrales de las reglas de alerta.',
};

const POSES: State[] = ['talking', 'idea', 'winking'];

export function stepsFor(claim: RoleClaim, name: string): TourStep[] {
  const firstName = name.split(/\s+/)[0] ?? '';
  const items = navFor(claim);
  return [
    {
      id: 'welcome',
      title: `¡Hola${firstName ? `, ${firstName}` : ''}! Soy Amauti`,
      body: `Esta plataforma lleva mi nombre y te acompaño en ella. Te muestro en un momento lo que puedes hacer con el rol ${roleLabel(claim.role)}.`,
      pose: 'greeting',
    },
    ...items.map((item, i) => ({
      id: item.icon,
      target: `nav-${item.icon}`,
      title: item.label,
      body: COPY[item.icon](claim, item),
      pose: POSES[i % POSES.length],
    })),
    {
      id: 'amauti',
      target: 'amauti',
      title: 'Aquí me escondo',
      body: 'Puedes mostrarme u ocultarme cuando quieras, y volver a ver este recorrido con el botón de al lado.',
      pose: 'idea',
    },
    {
      id: 'done',
      title: '¡Listo para empezar!',
      body: 'Cuando guardes la asistencia, generes un reporte o apruebes un plan, te avisaré.',
      pose: 'celebrating',
    },
  ];
}
