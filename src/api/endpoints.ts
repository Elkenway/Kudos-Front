import { request } from './client';
import type {
  AuditEntry,
  AuthenticatedSession,
  CategoryView,
  ContentType,
  CreatedResource,
  DecisionView,
  FacultyDetail,
  FacultySummary,
  KudoCard,
  KudoDetail,
  ManagedAccount,
  ModerationOutcome,
  NotificationRecord,
  PageSlice,
  PendingRegistration,
  PersonAffiliation,
  PersonSummary,
  ProfileView,
  ProgramDetail,
  ProgramSummary,
  RatingSummary,
  RatingView,
  RegistrationReceipt,
  ReportReason,
  ReportStatus,
  ReportedContent,
  Role,
  UniversityAuthority,
  VerificationStatus,
} from './types';

const PAGE_SIZE = 10;

export interface RegistrationForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  programIds: string[];
  facultyId: string | null;
}

export interface PrivilegedAccountForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}

export interface AuditFilters {
  actorId?: string;
  aggregateId?: string;
  eventType?: string;
}

function queryString(parameters: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(parameters).forEach(([name, value]) => {
    if (value !== undefined && value !== '') {
      query.set(name, String(value));
    }
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}

export const authApi = {
  signIn: (email: string, password: string) =>
    request<AuthenticatedSession>('POST', '/api/auth/sign-in', { email, password }),
  register: (form: RegistrationForm) => request<RegistrationReceipt>('POST', '/api/auth/registrations', form),
  verifyEmail: (email: string, code: string) =>
    request<VerificationStatus>('POST', '/api/auth/email-verification', { email, code }),
  verifyPhone: (email: string, code: string) =>
    request<VerificationStatus>('POST', '/api/auth/phone-verification', { email, code }),
  reissueCodes: (email: string) => request<undefined>('POST', '/api/auth/verification-codes', { email }),
};

export const profileApi = {
  mine: () => request<ProfileView>('GET', '/api/profile'),
  update: (fullName: string, email: string, phone: string) =>
    request<ProfileView>('PUT', '/api/profile', { fullName, email, phone }),
  activity: (page: number) => request<PageSlice<AuditEntry>>('GET', `/api/profile/activity${queryString({ page, size: PAGE_SIZE })}`),
};

export const kudoApi = {
  feed: (page: number) => request<PageSlice<KudoCard>>('GET', `/api/kudos${queryString({ page, size: PAGE_SIZE })}`),
  publish: (recipientId: string, categoryId: string, body: string) =>
    request<CreatedResource>('POST', '/api/kudos', { recipientId, categoryId, body }),
  detail: (kudoId: string) => request<KudoDetail>('GET', `/api/kudos/${kudoId}`),
  replyToKudo: (kudoId: string, body: string) =>
    request<CreatedResource>('POST', `/api/kudos/${kudoId}/replies`, { body }),
  replyToReply: (replyId: string, body: string) =>
    request<CreatedResource>('POST', `/api/replies/${replyId}/replies`, { body }),
  receivedBy: (personId: string, page: number) =>
    request<PageSlice<KudoCard>>('GET', `/api/people/${personId}/received-kudos${queryString({ page, size: PAGE_SIZE })}`),
  authoredBy: (personId: string, page: number) =>
    request<PageSlice<KudoCard>>('GET', `/api/people/${personId}/authored-kudos${queryString({ page, size: PAGE_SIZE })}`),
};

export const contentApi = {
  rate: (type: ContentType, id: string, stars: number) =>
    request<RatingSummary>('PUT', `/api/contents/${type}/${id}/rating`, { stars }),
  ratings: (type: ContentType, id: string) => request<RatingView[]>('GET', `/api/contents/${type}/${id}/ratings`),
  report: (type: ContentType, id: string, reason: ReportReason, detail: string) =>
    request<CreatedResource>('POST', `/api/contents/${type}/${id}/reports`, { reason, detail: detail || null }),
};

export const peopleApi = {
  search: (query: string) => request<PersonSummary[]>('GET', `/api/people${queryString({ query })}`),
  person: (personId: string) => request<PersonSummary>('GET', `/api/people/${personId}`),
  affiliation: (personId: string) => request<PersonAffiliation>('GET', `/api/people/${personId}/affiliation`),
};

export const categoryApi = {
  catalog: () => request<CategoryView[]>('GET', '/api/categories'),
  create: (name: string, description: string) =>
    request<CategoryView>('POST', '/api/categories', { name, description }),
  modify: (categoryId: string, name: string, description: string) =>
    request<CategoryView>('PUT', `/api/categories/${categoryId}`, { name, description }),
  activate: (categoryId: string) => request<CategoryView>('POST', `/api/categories/${categoryId}/activation`),
  deactivate: (categoryId: string) => request<CategoryView>('POST', `/api/categories/${categoryId}/deactivation`),
};

export const organizationApi = {
  faculties: () => request<FacultySummary[]>('GET', '/api/faculties'),
  faculty: (facultyId: string) => request<FacultyDetail>('GET', `/api/faculties/${facultyId}`),
  createFaculty: (name: string) => request<CreatedResource>('POST', '/api/faculties', { name }),
  renameFaculty: (facultyId: string, name: string) => request<undefined>('PUT', `/api/faculties/${facultyId}`, { name }),
  programs: () => request<ProgramSummary[]>('GET', '/api/programs'),
  program: (programId: string) => request<ProgramDetail>('GET', `/api/programs/${programId}`),
  createProgram: (facultyId: string, name: string) =>
    request<CreatedResource>('POST', '/api/programs', { facultyId, name }),
  renameProgram: (programId: string, name: string) => request<undefined>('PUT', `/api/programs/${programId}`, { name }),
  linkMember: (programId: string, memberId: string) =>
    request<undefined>('PUT', `/api/programs/${programId}/members/${memberId}`),
  unlinkMember: (programId: string, memberId: string) =>
    request<undefined>('DELETE', `/api/programs/${programId}/members/${memberId}`),
  universityAuthorities: () => request<UniversityAuthority[]>('GET', '/api/university-authorities'),
};

export const approvalApi = {
  pending: () => request<PendingRegistration[]>('GET', '/api/registration-requests'),
  approve: (requestId: string) => request<undefined>('POST', `/api/registration-requests/${requestId}/approval`),
  reject: (requestId: string, reason: string) =>
    request<undefined>('POST', `/api/registration-requests/${requestId}/rejection`, { reason }),
};

export const managementApi = {
  manageable: () => request<ManagedAccount[]>('GET', '/api/managed-accounts'),
  registerPrivileged: (form: PrivilegedAccountForm) => request<CreatedResource>('POST', '/api/managed-accounts', form),
  suspend: (accountId: string, reason: string) =>
    request<undefined>('POST', `/api/managed-accounts/${accountId}/suspension`, { reason }),
  reactivate: (accountId: string) => request<undefined>('POST', `/api/managed-accounts/${accountId}/reactivation`),
  deactivate: (accountId: string, reason: string) =>
    request<undefined>('POST', `/api/managed-accounts/${accountId}/deactivation`, { reason }),
};

export const moderationApi = {
  reportedContents: (status?: ReportStatus) =>
    request<ReportedContent[]>('GET', `/api/moderation/reported-contents${queryString({ status })}`),
  startReview: (type: ContentType, id: string) =>
    request<undefined>('POST', `/api/moderation/contents/${type}/${id}/review`),
  closeReview: (type: ContentType, id: string, outcome: ModerationOutcome, rationale: string) =>
    request<undefined>('POST', `/api/moderation/contents/${type}/${id}/decision`, { outcome, rationale }),
  veto: (type: ContentType, id: string, rationale: string) =>
    request<undefined>('POST', `/api/moderation/contents/${type}/${id}/veto`, { rationale }),
  decisions: () => request<DecisionView[]>('GET', '/api/moderation/decisions'),
};

export const auditApi = {
  search: (filters: AuditFilters, page: number) =>
    request<PageSlice<AuditEntry>>('GET', `/api/audit${queryString({ ...filters, page, size: PAGE_SIZE })}`),
};

export const notificationApi = {
  latest: () => request<NotificationRecord[]>('GET', '/api/notifications'),
  markAsRead: (notificationId: string) => request<undefined>('POST', `/api/notifications/${notificationId}/read`),
};
