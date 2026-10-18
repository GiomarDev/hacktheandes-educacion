import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoAccessCard } from '@/features/landing/components/DemoAccessCard';
import { BlindSpot } from '@/features/landing/components/BlindSpot';
import {
  DROPOUTS_PER_DAY,
  DROPOUTS_PRIMARY,
  DROPOUTS_SECONDARY,
  ESCALE_NATIONAL_SECONDARY,
  REGION_DROPOUT_SECONDARY,
} from '@/features/landing/data';

describe('landing: datos oficiales', () => {
  it('los 375 alumnos por día salen de SIAGIE 2023–2024', () => {
    expect(DROPOUTS_SECONDARY).toBe(72282);
    expect(DROPOUTS_PRIMARY).toBe(64463);
    expect(DROPOUTS_PER_DAY).toBe(375);
  });
  it('trae las 25 regiones y la serie ESCALE 2013–2025', () => {
    expect(REGION_DROPOUT_SECONDARY).toHaveLength(25);
    expect(
      REGION_DROPOUT_SECONDARY.find((r) => r.geoCode === '25'),
    ).toMatchObject({ geoName: 'Ucayali', value: 5.11 });
    expect(ESCALE_NATIONAL_SECONDARY[0].period).toBe('2013-2014');
    expect(ESCALE_NATIONAL_SECONDARY).toHaveLength(12);
  });
});

describe('DemoAccessCard', () => {
  it('cada rol precarga su DNI de demostración y entra al login con él', async () => {
    const onEnter = vi.fn();
    render(<DemoAccessCard onEnter={onEnter} />);
    expect(screen.getByLabelText('Número de documento (DNI)')).toHaveValue(
      '70000104',
    );
    await userEvent.click(
      screen.getByRole('radio', { name: 'UGEL · Territorial' }),
    );
    expect(screen.getByLabelText('Número de documento (DNI)')).toHaveValue(
      '70000101',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /ingresar al entorno en vivo/i }),
    );
    expect(onEnter).toHaveBeenCalledWith('/ingresar?dni=70000101');
  });
});

describe('BlindSpot', () => {
  it('las pestañas de conflictos se recorren con las flechas', async () => {
    render(<BlindSpot />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    tabs[0].focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(tabs[4]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      'De un punto ciego de 60 días',
    );
  });
});
