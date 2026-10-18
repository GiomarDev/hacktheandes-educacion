import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GradeSheet } from './GradeSheet';
import type { GradeSheet as Sheet } from '../api/types';

const sheet: Sheet = {
  area: { id: 'area', code: 'MAT', name: 'Matemática' },
  period: { id: 'p1', type: 'BIMESTER', number: 1, year: 2026 },
  competencies: [
    { id: 'c1', code: 'MAT1', name: 'Resuelve problemas de cantidad' },
    { id: 'c2', code: 'MAT2', name: 'Resuelve problemas de forma' },
  ],
  rows: [
    {
      enrollmentId: 'e1',
      student: {
        id: 's1',
        firstName: 'Ana',
        paternalLastName: 'Quispe',
        maternalLastName: 'Mamani',
      },
      entries: [
        {
          competencyId: 'c1',
          columnNumber: 1,
          value: 'A',
          isCompensatory: false,
        },
        {
          competencyId: 'c1',
          columnNumber: 4,
          value: 'B',
          isCompensatory: false,
        },
        {
          competencyId: 'c2',
          columnNumber: 1,
          value: 'C',
          isCompensatory: false,
        },
      ],
      periodGrades: [
        {
          competencyId: 'c1',
          value: 'A',
          calculationMethod: 'MODE_RECENT_TIEBREAK',
          attendanceRate: 92.5,
        },
      ],
    },
  ],
};

describe('GradeSheet', () => {
  it('muestra las columnas usadas, la nota del periodo y la asistencia', () => {
    render(<GradeSheet sheet={sheet} editable={false} onSave={vi.fn()} />);
    // Se usa hasta la columna 4: se muestran 4 aunque el mínimo sea 3.
    expect(
      screen.getAllByRole('columnheader').map((h) => h.textContent),
    ).toEqual(['Estudiante', '1', '2', '3', '4', 'Periodo', 'Asistencia']);
    expect(screen.getByText('93 %')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('cambia de competencia con las pestañas', async () => {
    render(<GradeSheet sheet={sheet} editable={false} onSave={vi.fn()} />);
    await userEvent.click(screen.getByRole('tab', { name: 'MAT2' }));
    expect(screen.getByText('Resuelve problemas de forma')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('guarda cada nota al elegirla y permite borrarla', async () => {
    const onSave = vi.fn().mockResolvedValue({});
    render(<GradeSheet sheet={sheet} editable onSave={onSave} />);
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Ana Quispe Mamani: columna 2' }),
      'AD',
    );
    expect(onSave).toHaveBeenCalledWith({
      enrollmentId: 'e1',
      competencyId: 'c1',
      columnNumber: 2,
      value: 'AD',
    });
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Ana Quispe Mamani: columna 1' }),
      '—',
    );
    expect(onSave).toHaveBeenLastCalledWith(
      expect.objectContaining({ columnNumber: 1, value: null }),
    );
  });

  it('agrega columnas y muestra el error si el guardado falla', async () => {
    const onSave = vi
      .fn()
      .mockRejectedValue(new Error('No dicta esta área en la sección'));
    render(<GradeSheet sheet={sheet} editable onSave={onSave} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Agregar columna' }),
    );
    const fifth = screen.getByRole('combobox', {
      name: 'Ana Quispe Mamani: columna 5',
    });
    await userEvent.selectOptions(fifth, 'B');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No dicta esta área en la sección',
    );
  });
});
