import { homeFor, navFor, roleLabel } from './roles';

describe('roles', () => {
  it('cada rol aterriza en su pantalla', () => {
    expect(homeFor({ role: 'TEACHER', schoolId: 's' })).toBe('/docente');
    expect(homeFor({ role: 'AUXILIAR', schoolId: 's' })).toBe('/docente');
    expect(homeFor({ role: 'DIRECTOR', schoolId: 's' })).toBe('/escuelas/s');
    expect(homeFor({ role: 'UGEL_SPECIALIST', ugelId: 'u' })).toBe('/panorama');
    expect(homeFor({ role: 'MINEDU_ADMIN' })).toBe('/panorama');
  });

  it('la navegación solo muestra lo que el rol puede usar', () => {
    const paths = (claim: Parameters<typeof navFor>[0]) =>
      navFor(claim).map((i) => i.to);
    expect(paths({ role: 'TEACHER', schoolId: 's' })).toEqual([
      '/docente',
      '/docente/aula',
      '/notas',
      '/alertas',
      '/planes',
      '/visitas',
    ]);
    expect(paths({ role: 'AUXILIAR', schoolId: 's' })).toEqual([
      '/docente',
      '/docente/aula',
      '/alertas',
    ]);
    expect(paths({ role: 'SECRETARY', schoolId: 's' })).toEqual([
      '/escuelas/s',
      '/docente/aula',
      '/notas',
      '/reportes',
      '/planes',
    ]);
    expect(paths({ role: 'DIRECTOR', schoolId: 's' })).toEqual([
      '/escuelas/s',
      '/docente/aula',
      '/notas',
      '/alertas',
      '/reportes',
      '/planes',
      '/visitas',
      '/admin',
    ]);
    expect(paths({ role: 'UGEL_SPECIALIST', ugelId: 'u' })).toEqual([
      '/panorama',
      '/alertas',
      '/escuelas',
      '/reportes',
      '/visitas',
      '/admin',
    ]);
    expect(paths({ role: 'MINEDU_ADMIN' })).toContain('/fuentes');
    expect(paths({ role: 'PSYCHOLOGIST', schoolId: 's' })).toEqual([
      '/escuelas/s',
      '/alertas',
      '/planes',
    ]);
  });

  it('etiqueta el rol en español', () => {
    expect(roleLabel('UGEL_SPECIALIST')).toBe('Especialista UGEL');
    expect(roleLabel('PSYCHOLOGIST')).toBe('Psicología');
  });
});
