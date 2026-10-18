import { riskBuckets } from '@/features/indicators/components/RegionMap';

describe('riskBuckets', () => {
  it('asigna el quinto más alto a crítico y el más bajo a estable', () => {
    const values = Array.from({ length: 25 }, (_, i) => i + 1);
    const bucket = riskBuckets(values);
    expect(bucket(25)).toBe(0);
    expect(bucket(21)).toBe(0);
    expect(bucket(20)).toBe(1);
    expect(bucket(1)).toBe(4);
  });
});
