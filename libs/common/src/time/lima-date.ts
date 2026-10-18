// Las fechas escolares (asistencia, matrícula) son días calendario de Perú, sin hora.
export function todayInLima(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
}

export function dateOnly(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}
