import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttendanceSheet } from '@/features/attendance/components/AttendanceSheet';
import type { Enrollment } from '@/features/schools/types';

const student = (id: string, firstName: string): Enrollment => ({
  id,
  studentId: `s-${id}`,
  sectionId: 'sec',
  year: 2026,
  status: 'ENROLLED',
  student: {
    id: `s-${id}`,
    studentCode: id,
    documentNumber: '70000000',
    firstName,
    paternalLastName: 'Quispe',
    maternalLastName: 'Mamani',
    birthDate: '2011-01-01',
    sex: 'F',
    hasSpecialNeeds: false,
  },
});
const roster = [student('e1', 'Ana'), student('e2', 'Luis')];

describe('AttendanceSheet', () => {
  it('no envía mientras falten estudiantes por marcar', async () => {
    const onSubmit = vi.fn();
    render(
      <AttendanceSheet roster={roster} initial={{}} onSubmit={onSubmit} />,
    );
    await userEvent.click(
      screen.getByRole('radio', { name: 'Ana Quispe Mamani: Presente' }),
    );
    const save = screen.getByRole('button', { name: /guardar/i });
    expect(save).toBeDisabled();
    expect(screen.getByText('Falta marcar a 1 estudiante')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('"Todos presentes" completa la lista y envía cada estado', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <AttendanceSheet roster={roster} initial={{}} onSubmit={onSubmit} />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Todos presentes' }),
    );
    await userEvent.click(
      screen.getByRole('radio', { name: 'Luis Quispe Mamani: Falta' }),
    );
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onSubmit).toHaveBeenCalledWith([
      { enrollmentId: 'e1', status: 'PRESENT' },
      { enrollmentId: 'e2', status: 'ABSENT' },
    ]);
  });

  it('si el envío falla, muestra el error y conserva lo marcado', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new Error('No tiene a cargo esta sección'));
    render(
      <AttendanceSheet
        roster={roster}
        initial={{ e1: 'LATE' }}
        onSubmit={onSubmit}
      />,
    );
    await userEvent.click(
      screen.getByRole('radio', { name: 'Luis Quispe Mamani: Justificada' }),
    );
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tiene a cargo esta sección',
    );
    expect(
      screen.getByRole('radio', { name: 'Ana Quispe Mamani: Tardanza' }),
    ).toBeChecked();
    expect(
      screen.getByRole('radio', { name: 'Luis Quispe Mamani: Justificada' }),
    ).toBeChecked();
  });
});
