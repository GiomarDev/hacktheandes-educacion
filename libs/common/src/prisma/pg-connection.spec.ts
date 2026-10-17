import { pgConnectionFromUrl } from './pg-connection.js';

describe('pgConnectionFromUrl', () => {
  it('separa el parámetro schema de la cadena de conexión', () => {
    const result = pgConnectionFromUrl(
      'postgresql://u:p%24w@host:5432/school?schema=auth&sslmode=disable',
    );
    expect(result.schema).toBe('auth');
    expect(result.connectionString).toBe('postgresql://u:p%24w@host:5432/school?sslmode=disable');
  });

  it('usa public si no hay schema', () => {
    expect(pgConnectionFromUrl('postgresql://u:p@host/db').schema).toBe('public');
  });
});
