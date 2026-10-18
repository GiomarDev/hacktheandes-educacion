// pg no entiende el parámetro `schema` de Prisma: lo separamos para pasarlo al adapter.
export function pgConnectionFromUrl(url: string): { connectionString: string; schema: string } {
  const parsed = new URL(url);
  const schema = parsed.searchParams.get('schema') ?? 'public';
  parsed.searchParams.delete('schema');
  return { connectionString: parsed.toString(), schema };
}
