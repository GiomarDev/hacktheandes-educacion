// Código de departamento del ubigeo (INEI). Lima Metropolitana y Lima Provincias son DRE distintas en ESCALE.
export const REGIONS: { code: string; name: string }[] = [
  { code: '01', name: 'Amazonas' },
  { code: '02', name: 'Áncash' },
  { code: '03', name: 'Apurímac' },
  { code: '04', name: 'Arequipa' },
  { code: '05', name: 'Ayacucho' },
  { code: '06', name: 'Cajamarca' },
  { code: '07', name: 'Callao' },
  { code: '08', name: 'Cusco' },
  { code: '09', name: 'Huancavelica' },
  { code: '10', name: 'Huánuco' },
  { code: '11', name: 'Ica' },
  { code: '12', name: 'Junín' },
  { code: '13', name: 'La Libertad' },
  { code: '14', name: 'Lambayeque' },
  { code: '15', name: 'Lima' },
  { code: '15LM', name: 'Lima Metropolitana' },
  { code: '15LP', name: 'Lima Provincias' },
  { code: '16', name: 'Loreto' },
  { code: '17', name: 'Madre de Dios' },
  { code: '18', name: 'Moquegua' },
  { code: '19', name: 'Pasco' },
  { code: '20', name: 'Piura' },
  { code: '21', name: 'Puno' },
  { code: '22', name: 'San Martín' },
  { code: '23', name: 'Tacna' },
  { code: '24', name: 'Tumbes' },
  { code: '25', name: 'Ucayali' },
];

export const NATIONAL = { code: '00', name: 'Perú' };

// Los CSV de ESCALE llegan con las letras acentuadas eliminadas ("Apurmac"): se compara
// el nombre sin tildes y también sin ningún carácter no ASCII.
function keys(name: string): string[] {
  const lower = name.trim().toLowerCase();
  return [
    lower.normalize('NFD').replace(/[̀-ͯ]/g, ''),
    lower.replace(/[^\x20-\x7e]/g, ''),
  ];
}

export function sameName(a: string, b: string): boolean {
  const kb = keys(b);
  return keys(a).some((k) => kb.includes(k));
}

export function findRegion(name: string) {
  return REGIONS.find((r) => sameName(r.name, name));
}
