import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule as AuthModule } from '../../ms-auth/src/app.module.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma.service.js';
import { cleanEscaleTables, loginAs, start } from './helpers.js';
import type { Started } from './helpers.js';

const regionCsv = readFileSync(
  'docs/desercion_por_region_siagie_2023_2024.csv',
  'utf8',
);
const escaleCsv = readFileSync(
  'docs/tasa_desercion_secundaria_escale.csv',
  'utf8',
);

// Totales calculados del propio archivo: verificación de F4.
function fileTotals(level: 'secundaria' | 'primaria') {
  const [header, ...rows] = regionCsv
    .trim()
    .split('\n')
    .map((l) => l.split(','));
  const sum = (col: string) =>
    rows.reduce((n, r) => n + Number(r[header.indexOf(col)]), 0);
  return {
    numerator: sum(`desertores_${level}`),
    denominator: sum(`estudiantes_${level}`),
  };
}

describe('F4: importación de datos abiertos e indicadores', () => {
  let auth: Started, escale: Started, prisma: PrismaService;
  let tokens: Record<string, string>;
  const ugelA = randomUUID(),
    ugelB = randomUUID(),
    dreA = randomUUID();
  const oldEnv = process.env.AUTH_JWKS_URL;
  const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });
  const importFile = (dataset: string, content: string, who = 'admin') =>
    request(escale.url)
      .post('/imports')
      .set(as(who))
      .send({ dataset, fileName: `${dataset.toLowerCase()}.csv`, content });

  beforeAll(async () => {
    auth = await start(AuthModule);
    process.env.AUTH_JWKS_URL = `${auth.url}/.well-known/jwks.json`;
    escale = await start(AppModule);
    prisma = escale.app.get(PrismaService);
    tokens = await loginAs(auth, {
      admin: { id: randomUUID(), claim: { role: 'MINEDU_ADMIN' } },
      director: {
        id: randomUUID(),
        claim: { role: 'DIRECTOR', schoolId: randomUUID() },
      },
      ugel: {
        id: randomUUID(),
        claim: { role: 'UGEL_SPECIALIST', ugelId: ugelA },
      },
      dre: { id: randomUUID(), claim: { role: 'DRE_SPECIALIST', dreId: dreA } },
    });
  }, 120000);
  beforeEach(() => cleanEscaleTables(prisma));
  afterAll(async () => {
    await escale?.app.close();
    await auth?.app.close();
    if (oldEnv === undefined) delete process.env.AUTH_JWKS_URL;
    else process.env.AUTH_JWKS_URL = oldEnv;
  });

  it('los totales nacionales importados cuadran con el CSV de SIAGIE', async () => {
    const { body } = await importFile(
      'DROPOUT_BY_REGION_SIAGIE',
      regionCsv,
    ).expect(201);
    expect(body).toMatchObject({ rowCount: 25, values: 52 });
    for (const [code, level, expected] of [
      [
        'DROPOUT_RATE_SEC_SIAGIE',
        'secundaria',
        { numerator: 72282, denominator: 2842831 },
      ],
      [
        'DROPOUT_RATE_PRI_SIAGIE',
        'primaria',
        { numerator: 64463, denominator: 3721852 },
      ],
    ] as const) {
      const { body: rows } = await request(escale.url)
        .get('/indicators')
        .query({ code, geo_level: 'NATIONAL', period: '2023-2024' })
        .set(as('director'))
        .expect(200);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        ...expected,
        ...fileTotals(level),
        source: 'OFFICIAL',
        unit: '%',
      });
      expect(typeof rows[0].value).toBe('number');
    }
    const { body: regions } = await request(escale.url)
      .get('/indicators')
      .query({ code: 'DROPOUT_RATE_SEC_SIAGIE', geo_level: 'DRE' })
      .set(as('admin'))
      .expect(200);
    expect(
      regions.reduce(
        (n: number, r: { numerator: number }) => n + r.numerator,
        0,
      ),
    ).toBe(72282);
  });

  it('no importa dos veces el mismo archivo y solo lo permite a MINEDU', async () => {
    await importFile('DROPOUT_BY_REGION_SIAGIE', regionCsv, 'director').expect(
      403,
    );
    await importFile('DROPOUT_BY_REGION_SIAGIE', regionCsv).expect(201);
    await importFile('DROPOUT_BY_REGION_SIAGIE', regionCsv).expect(409);
    const { body } = await request(escale.url)
      .get('/imports')
      .set(as('admin'))
      .expect(200);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      dataset: 'DROPOUT_BY_REGION_SIAGIE',
      rowCount: 25,
    });
    expect(body[0].checksum).toMatch(/^[0-9a-f]{64}$/);
    await request(escale.url).get('/imports').set(as('ugel')).expect(403);
  });

  it('rechaza un CSV inconsistente sin dejar registros', async () => {
    const { body } = await importFile(
      'DROPOUT_BY_REGION_SIAGIE',
      regionCsv.replace(
        '1,Ucayali,66211,3385,5.11',
        '1,Ucayali,66211,3385,6.11',
      ),
    ).expect(400);
    expect(body.message).toContain('Ucayali');
    expect(await prisma.datasetImport.count()).toBe(0);
    expect(await prisma.indicatorValue.count()).toBe(0);
    await importFile('OTRO', regionCsv).expect(400);
  });

  it('la serie de ESCALE se consulta por dimensión', async () => {
    await importFile('DROPOUT_RATE_SECONDARY_ESCALE', escaleCsv).expect(201);
    const { body } = await request(escale.url)
      .get('/indicators')
      .query({
        code: 'DROPOUT_RATE_SEC_ESCALE',
        geo_level: 'NATIONAL',
        period: '2023-2024',
        dimension: 'sex',
      })
      .set(as('ugel'))
      .expect(200);
    expect(
      body.map((r: { dimensionValue: string }) => r.dimensionValue).sort(),
    ).toEqual(['F', 'M']);
    const { body: totals } = await request(escale.url)
      .get('/indicators')
      .query({
        code: 'DROPOUT_RATE_SEC_ESCALE',
        geo_level: 'NATIONAL',
        period: '2023-2024',
        dimension: 'none',
      })
      .set(as('ugel'))
      .expect(200);
    expect(totals).toEqual([
      expect.objectContaining({ value: 2.5, dimension: null, numerator: null }),
    ]);
  });

  it('una importación corregida reemplaza los valores de sus periodos', async () => {
    await importFile('DROPOUT_RATE_SECONDARY_ESCALE', escaleCsv).expect(201);
    const fixed = escaleCsv.replace(/^PER,5\.3,/m, 'PER,5.4,');
    await importFile('DROPOUT_RATE_SECONDARY_ESCALE', fixed).expect(201);
    const { body } = await request(escale.url)
      .get('/indicators')
      .query({
        code: 'DROPOUT_RATE_SEC_ESCALE',
        geo_code: '00',
        period: '2013-2014',
        dimension: 'none',
      })
      .set(as('admin'))
      .expect(200);
    expect(body).toEqual([expect.objectContaining({ value: 5.4 })]);
  });

  it('los indicadores calculados se filtran por el ámbito del especialista', async () => {
    const def = await prisma.indicatorDefinition.findUniqueOrThrow({
      where: { code: 'ATTENDANCE_RATE' },
    });
    await prisma.indicatorValue.createMany({
      data: [
        { ugelId: ugelA, dreId: dreA, geoCode: 'UGEL-A', value: 90 },
        { ugelId: ugelB, dreId: randomUUID(), geoCode: 'UGEL-B', value: 80 },
      ].map((v) => ({
        ...v,
        indicatorId: def.id,
        geoLevel: 'UGEL' as const,
        geoName: v.geoCode,
        periodLabel: '2026-03',
      })),
    });
    const codes = async (who: string) =>
      (
        await request(escale.url)
          .get('/indicators')
          .query({ code: 'ATTENDANCE_RATE' })
          .set(as(who))
          .expect(200)
      ).body.map((r: { geoCode: string }) => r.geoCode);
    expect(await codes('ugel')).toEqual(['UGEL-A']);
    expect(await codes('dre')).toEqual(['UGEL-A']);
    expect(await codes('director')).toEqual([]);
    expect((await codes('admin')).sort()).toEqual(['UGEL-A', 'UGEL-B']);
    const { body: defs } = await request(escale.url)
      .get('/indicator-definitions')
      .set(as('director'))
      .expect(200);
    expect(defs.map((d: { code: string }) => d.code)).toContain(
      'SILENT_SECTIONS_RATE',
    );
    await request(escale.url)
      .get('/indicators')
      .query({ geo_level: 'PLANETA' })
      .set(as('admin'))
      .expect(400);
    await request(escale.url).get('/indicators').expect(401);
  });
});
