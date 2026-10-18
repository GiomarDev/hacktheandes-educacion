import { createContext, useContext } from 'react';
import type { ComponentType } from 'react';

// Ilustración de los estados vacíos. shared/ no conoce a la mascota: la capa app/ la inyecta.
export type Illustration = ComponentType<{ className?: string }>;
export const EmptyIllustrationContext = createContext<Illustration | null>(
  null,
);
export const useEmptyIllustration = () => useContext(EmptyIllustrationContext);
