export const qs = (
  params: Record<string, string | number | undefined | null>,
) => {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  return entries.length
    ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}`
    : '';
};
