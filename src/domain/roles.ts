import type { Role } from '../api/types';

/*
 * Copia de la matriz de roles del Back-End usada solo para decidir qué mostrar en pantalla.
 * La autorización real la hace el servidor; si esta copia se desactualiza, el usuario ve un botón
 * que el servidor rechaza con 403, nunca obtiene un permiso que no tiene.
 */

export const roleLabels: Record<Role, string> = {
  ADMINISTRATOR: 'Administrador',
  RECTOR: 'Rector',
  ACADEMIC_COORDINATOR: 'Coordinador Académico',
  FACULTY_COORDINATOR: 'Coordinador de Facultad',
  PROGRAM_COORDINATOR: 'Coordinador de Programa',
  TEACHER: 'Docente',
  STUDENT: 'Estudiante',
};

export const selfRegistrableRoles: Role[] = [
  'ACADEMIC_COORDINATOR',
  'FACULTY_COORDINATOR',
  'PROGRAM_COORDINATOR',
  'TEACHER',
  'STUDENT',
];

const managedRoles: Record<Role, Role[]> = {
  ADMINISTRATOR: ['ADMINISTRATOR', 'RECTOR'],
  RECTOR: ['ACADEMIC_COORDINATOR'],
  ACADEMIC_COORDINATOR: ['FACULTY_COORDINATOR'],
  FACULTY_COORDINATOR: ['PROGRAM_COORDINATOR'],
  PROGRAM_COORDINATOR: ['TEACHER', 'STUDENT'],
  TEACHER: [],
  STUDENT: [],
};

const moderators: Role[] = ['RECTOR', 'ACADEMIC_COORDINATOR'];
const categoryManagers: Role[] = ['ADMINISTRATOR', 'RECTOR', 'ACADEMIC_COORDINATOR'];
const structureManagers: Role[] = ['ADMINISTRATOR', 'ACADEMIC_COORDINATOR'];
const auditors: Role[] = ['ADMINISTRATOR', 'RECTOR', 'ACADEMIC_COORDINATOR'];

export const rolesManagedBy = (role: Role): Role[] => managedRoles[role];
export const managesSomeone = (role: Role): boolean => managedRoles[role].length > 0;
export const canModerate = (role: Role): boolean => moderators.includes(role);
export const canManageCategories = (role: Role): boolean => categoryManagers.includes(role);
export const canManageStructure = (role: Role): boolean => structureManagers.includes(role);
export const canConsultAudit = (role: Role): boolean => auditors.includes(role);

export type AffiliationRequirement = 'none' | 'singleProgram' | 'programs' | 'faculty';

export function affiliationRequiredFor(role: Role): AffiliationRequirement {
  switch (role) {
    case 'STUDENT':
    case 'TEACHER':
      return 'programs';
    case 'PROGRAM_COORDINATOR':
      return 'singleProgram';
    case 'FACULTY_COORDINATOR':
      return 'faculty';
    default:
      return 'none';
  }
}
