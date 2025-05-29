export const SECTIONS = [
  "Ambientes Virtuales",
  "Ayudantía",
  "Capacitación",
  "Oficina de Partes",
  "Oficina de Profesores",
  "Perfeccionamiento",
  "Unidad de compras",
  "Otra Sección",
] as const;

export type Section = (typeof SECTIONS)[number];
