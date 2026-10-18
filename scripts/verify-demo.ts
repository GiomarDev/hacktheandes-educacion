// Comprueba la demo en ejecución sin vaciar tablas ni restablecer cuentas.
// Contrasta los CSV oficiales ya importados; no carga datos ni ejecuta seeds.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { SEED_IDS } from '@app/fixtures';
import { todayInLima } from '@app/common';
import { pointToTestDatabases } from '../test/test-databases.js';
import { parseDataset } from '../apps/ms-escale/src/datasets/parsers.js';
import type {
  DatasetCode,
  ParsedValue,
} from '../apps/ms-escale/src/datasets/parsers.js';

pointToTestDatabases();
const password = process.env.SEED_PASSWORD;
if (!password) throw new Error('Falta SEED_PASSWORD; no se imprime su valor');
const api = async <T>(
  port: number,
  path: string,
  token?: string,
  body?: unknown,
): Promise<T> => {
  const response = await fetch(`http://localhost:${port}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${port}${path}: HTTP ${response.status}`);
  const content = await response.text();
  return (content ? JSON.parse(content) : null) as T;
};

interface Session {
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
}
interface DemoUser {
  roles: { role: string; schoolId?: string; ugelId?: string }[];
}
interface ImportRef {
  id: string;
  checksum: string;
  fileName: string;
  rowCount: number;
}
interface Indicator extends ParsedValue {
  source: string;
}
const accounts = [
  ['admin', ['MINEDU_ADMIN']],
  ['ugelSpecialist', ['UGEL_SPECIALIST']],
  ['director', ['DIRECTOR']],
  ['secretary', ['SECRETARY']],
  ['tutorA', ['TUTOR', 'TEACHER']],
  ['tutorB', ['TUTOR', 'TEACHER']],
  ['teacherMat', ['TEACHER']],
  ['teacherCom', ['TEACHER']],
  ['auxiliar', ['AUXILIAR']],
  ['psychologist', ['PSYCHOLOGIST']],
] as const;
const sessions: Session[] = [];
try {
  for (const [index, name] of [
    'auth',
    'siagie',
    'alerta',
    'simon',
    'escale',
  ].entries()) {
    const health = await api<{ status: string; service: string }>(
      3000 + index,
      '/health',
    );
    assert.deepEqual(health, { status: 'ok', service: `ms-${name}` });
  }
  console.log('Los cinco servicios responden /health.');
  const credentials = [];
  let adminToken = '';
  for (const [key, expected] of accounts) {
    const documentNumber = SEED_IDS.documents[key];
    const session = await api<Session>(3000, '/auth/login', undefined, {
      documentNumber,
      password,
    });
    sessions.push(session);
    const user = await api<DemoUser>(3000, '/auth/me', session.accessToken);
    assert.deepEqual(
      user.roles.map((r) => r.role).sort(),
      [...expected].sort(),
      `Roles de ${documentNumber}`,
    );
    for (const role of user.roles) {
      if (role.schoolId) assert.equal(role.schoolId, SEED_IDS.school);
      if (role.ugelId) assert.equal(role.ugelId, SEED_IDS.ugelCoronelPortillo);
    }
    credentials.push({
      documentNumber,
      roles: [...expected],
      loginVerified: true,
      mustChangePassword: session.mustChangePassword,
    });
    if (key === 'admin') adminToken = session.accessToken;
    console.log(
      `${documentNumber}: acceso verificado (${expected.join(', ')}).`,
    );
  }
  const datasets = [];
  for (const [dataset, fileName, period] of [
    [
      'DROPOUT_BY_REGION_SIAGIE',
      'desercion_por_region_siagie_2023_2024.csv',
      '2023-2024',
    ],
    [
      'DROPOUT_RATE_SECONDARY_ESCALE',
      'tasa_desercion_secundaria_escale.csv',
      undefined,
    ],
  ] as const) {
    const content = await readFile(`docs/${fileName}`, 'utf8');
    const checksum = createHash('sha256').update(content).digest('hex');
    const expected = parseDataset(dataset as DatasetCode, content, { period });
    const imports = await api<ImportRef[]>(3004, '/imports', adminToken);
    const wasPresent = imports.some((i) => i.checksum === checksum);
    assert.ok(
      wasPresent,
      `Falta ${fileName}; importar el CSV desde Fuentes antes de verificar.`,
    );
    const imported = imports.find((i) => i.checksum === checksum);
    assert.ok(imported, `Checksum de ${fileName}`);
    const codes = [...new Set(expected.map((v) => v.code))];
    const actual = (
      await Promise.all(
        codes.map((code) =>
          api<Indicator[]>(3004, `/indicators?code=${code}`, adminToken),
        ),
      )
    ).flat();
    const key = (v: ParsedValue) =>
      JSON.stringify([
        v.code,
        v.geoLevel,
        v.geoCode,
        v.periodLabel,
        v.dimension,
        v.dimensionValue,
      ]);
    assert.equal(
      actual.length,
      expected.length,
      `Cantidad de valores de ${fileName}`,
    );
    const actualByKey = new Map(actual.map((v) => [key(v), v]));
    for (const v of expected) {
      const a = actualByKey.get(key(v));
      assert.ok(a, `Falta ${key(v)}`);
      assert.equal(a.source, 'OFFICIAL');
      for (const field of ['value', 'numerator', 'denominator'] as const) {
        if (v[field] === null) assert.equal(a[field], null);
        else
          assert.ok(
            a[field] !== null && Math.abs(a[field]! - v[field]!) < 0.0001,
            `${key(v)}: ${field}`,
          );
      }
    }
    const totals = expected.filter(
      (v) => v.geoLevel === 'NATIONAL' && v.dimension === null,
    );
    datasets.push({
      fileName,
      dataset,
      checksum,
      importedRows: imported.rowCount,
      verifiedValues: actual.length,
      alreadyPresent: wasPresent,
      totals,
    });
    console.log(
      `${fileName}: ${actual.length} valores oficiales contrastados con el CSV ya cargado.`,
    );
  }
  const report = {
    verifiedAt: new Date().toISOString(),
    environment: 'demo_test',
    passwordSource: 'SEED_PASSWORD (no se registra el valor)',
    services: 5,
    accounts: credentials,
    datasets,
    browserResponsiveValidation:
      'No incluida en este comando; requiere inspección de navegador aparte.',
  };
  const path = `docs/testing/${todayInLima()}-demo-data.json`;
  await writeFile(path, JSON.stringify(report, null, 2) + '\n');
  console.log(`Resultado sin contraseñas ni tokens: ${path}`);
} finally {
  for (const session of sessions) {
    try {
      await api(3000, '/auth/logout', undefined, {
        refreshToken: session.refreshToken,
      });
    } catch {
      console.warn('No se pudo cerrar una sesión temporal de verificación.');
    }
  }
}
