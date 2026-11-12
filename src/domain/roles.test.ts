import type { Role } from '../api/types';
import {
  affiliationRequiredFor,
  canConsultAudit,
  canManageCategories,
  canManageStructure,
  canModerate,
  managesSomeone,
  rolesManagedBy,
  selfRegistrableRoles,
} from './roles';

describe('jerarquía de gestión', () => {
  it.each<[Role, Role[]]>([
    ['ADMINISTRATOR', ['ADMINISTRATOR', 'RECTOR']],
    ['RECTOR', ['ACADEMIC_COORDINATOR']],
    ['ACADEMIC_COORDINATOR', ['FACULTY_COORDINATOR']],
    ['FACULTY_COORDINATOR', ['PROGRAM_COORDINATOR']],
    ['PROGRAM_COORDINATOR', ['TEACHER', 'STUDENT']],
  ])('%s gestiona %j', (role, managed) => {
    expect(rolesManagedBy(role)).toEqual(managed);
    expect(managesSomeone(role)).toBe(true);
  });

  it('docentes y estudiantes no gestionan a nadie', () => {
    expect(managesSomeone('TEACHER')).toBe(false);
    expect(managesSomeone('STUDENT')).toBe(false);
  });

  it('rector y administrador no pueden autorregistrarse', () => {
    expect(selfRegistrableRoles).not.toContain('RECTOR');
    expect(selfRegistrableRoles).not.toContain('ADMINISTRATOR');
  });
});

describe('capacidades por rol', () => {
  it('solo rector y coordinación académica moderan', () => {
    expect(canModerate('RECTOR')).toBe(true);
    expect(canModerate('ACADEMIC_COORDINATOR')).toBe(true);
    expect(canModerate('ADMINISTRATOR')).toBe(false);
    expect(canModerate('PROGRAM_COORDINATOR')).toBe(false);
  });

  it('la estructura la gestionan administración y coordinación académica', () => {
    expect(canManageStructure('ADMINISTRATOR')).toBe(true);
    expect(canManageStructure('ACADEMIC_COORDINATOR')).toBe(true);
    expect(canManageStructure('RECTOR')).toBe(false);
  });

  it('categorías y auditoría quedan en manos de la dirección institucional', () => {
    expect(canManageCategories('RECTOR')).toBe(true);
    expect(canManageCategories('TEACHER')).toBe(false);
    expect(canConsultAudit('ADMINISTRATOR')).toBe(true);
    expect(canConsultAudit('STUDENT')).toBe(false);
  });
});

describe('vinculación requerida al registrarse', () => {
  it.each<[Role, string]>([
    ['STUDENT', 'programs'],
    ['TEACHER', 'programs'],
    ['PROGRAM_COORDINATOR', 'singleProgram'],
    ['FACULTY_COORDINATOR', 'faculty'],
    ['ACADEMIC_COORDINATOR', 'none'],
  ])('%s requiere %s', (role, requirement) => {
    expect(affiliationRequiredFor(role)).toBe(requirement);
  });
});
