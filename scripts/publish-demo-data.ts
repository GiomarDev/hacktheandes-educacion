// Carga los datos de la demo publicada usando solo la API pública (no toca la base directamente).
// Requisitos: migraciones aplicadas y seeds de usuarios ejecutados en los schemas reales.
// Uso: SEED_PASSWORD=... npm run demo:publish   (DEMO_URL por defecto https://amauti.keoit.com)
// - Importa los CSV oficiales de docs/ en ESCALE (datos reales de deserción).
// - Registra pases de lista sintéticos de los últimos 10 días hábiles como lo haría el auxiliar,
//   para que Alerta Escuela detecte casos con el flujo normal (outbox → reglas).
// - Calcula los agregados diarios e indicadores por UGEL de esos días.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.env.DEMO_URL ?? 'https://amauti.keoit.com').replace(
  /\/$/,
  '',
);
const password = process.env.SEED_PASSWORD;
if (!password) throw new Error('Falta SEED_PASSWORD; no se imprime su valor');

const ADMIN = '70000100';
const AUXILIAR = '70000108';

async function api<T>(
  path: string,
  token?: string,
  body?: unknown,
): Promise<{ status: number; data: T }> {
  const response = await fetch(`${BASE}/api${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return {
    status: response.status,
    data: (text ? JSON.parse(text) : undefined) as T,
  };
}

async function login(documentNumber: string): Promise<string> {
  const { status, data } = await api<{ accessToken: string }>(
    '/auth/auth/login',
    undefined,
    {
      documentNumber,
      password,
    },
  );
  if (status !== 200)
    throw new Error(
      `Login ${documentNumber}: HTTP ${status}. ¿Se ejecutaron los seeds y la migración de auth?`,
    );
  return data.accessToken;
}

// Últimos 10 días hábiles antes de hoy (Lima).
function pastSchoolDays(count: number): string[] {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
  }).format(new Date());
  const days: string[] = [];
  let t = new Date(`${today}T12:00:00Z`).getTime();
  while (days.length < count) {
    t -= 86400000;
    const d = new Date(t);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6)
      days.unshift(d.toISOString().slice(0, 10));
  }
  return days;
}

// Igual que la demo local: la mayoría asiste; algunos acumulan faltas o tardanzas.
function statusFor(n: number, i: number, total: number) {
  if (n === 3 || n === 34) return i >= total - 4 ? 'ABSENT' : 'PRESENT';
  if (n === 7 || n === 41) return i % 3 === 0 ? 'ABSENT' : 'PRESENT';
  if (n === 12) return i >= total - 3 ? 'LATE' : 'PRESENT';
  if (n === 20 && i === total - 2) return 'JUSTIFIED';
  return 'PRESENT';
}

const admin = await login(ADMIN);
for (const [dataset, fileName] of [
  ['DROPOUT_BY_REGION_SIAGIE', 'desercion_por_region_siagie_2023_2024.csv'],
  ['DROPOUT_RATE_SECONDARY_ESCALE', 'tasa_desercion_secundaria_escale.csv'],
]) {
  const { status } = await api('/escale/imports', admin, {
    dataset,
    fileName,
    content: readFileSync(`docs/${fileName}`, 'utf8'),
  });
  console.log(
    `Datos oficiales ${fileName}: ${status === 409 ? 'ya importados' : `HTTP ${status}`}`,
  );
}

const days = pastSchoolDays(10);
const auxiliar = await login(AUXILIAR);
const year = Number(days.at(-1)!.slice(0, 4));
const sections = (
  await api<{ id: string; grade: number; name: string }[]>(
    `/siagie/sections?year=${year}`,
    auxiliar,
  )
).data;
let n = 0;
for (const section of sections) {
  const roster = (
    await api<{ id: string }[]>(
      `/siagie/sections/${section.id}/students`,
      auxiliar,
    )
  ).data;
  const offset = n;
  n += roster.length;
  for (const [i, date] of days.entries()) {
    const { status } = await api('/siagie/attendance/bulk', auxiliar, {
      sectionId: section.id,
      date,
      records: roster.map((e, k) => ({
        enrollmentId: e.id,
        status: statusFor(offset + k + 1, i, days.length),
      })),
    });
    if (status !== 200)
      throw new Error(
        `Pase de lista ${section.grade}.° ${section.name} ${date}: HTTP ${status}`,
      );
  }
  console.log(
    `Pase de lista ${section.grade}.° ${section.name}: ${roster.length} estudiantes × ${days.length} días`,
  );
}

// Da tiempo a que Alerta procese los eventos de asistencia antes de calcular los agregados.
await sleep(5000);
for (const date of days) await api('/escale/stats/compute', admin, { date });
console.log(
  `Indicadores por UGEL calculados (${days[0]} → ${days.at(-1)}). Listo: ${BASE}`,
);
