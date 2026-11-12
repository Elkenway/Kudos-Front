export type Role =
  | 'ADMINISTRATOR'
  | 'RECTOR'
  | 'ACADEMIC_COORDINATOR'
  | 'FACULTY_COORDINATOR'
  | 'PROGRAM_COORDINATOR'
  | 'TEACHER'
  | 'STUDENT';

export type AccountStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type ModerationStatus = 'CREATED' | 'VISIBLE' | 'REPORTED' | 'UNDER_REVIEW' | 'VETOED';
export type ContentType = 'KUDO' | 'REPLY';
export type ReportReason =
  | 'OFFENSIVE_LANGUAGE'
  | 'HARASSMENT'
  | 'DISCRIMINATION'
  | 'SPAM'
  | 'FALSE_INFORMATION'
  | 'OTHER';
export type ReportStatus = 'PENDING' | 'IN_REVIEW' | 'ACCEPTED' | 'REJECTED';
export type ModerationOutcome = 'VETOED' | 'RELEASED';
export type MembershipType = 'STUDENT' | 'TEACHER';

export interface PersonSummary {
  id: string;
  fullName: string;
  role: Role;
  status: AccountStatus;
}

export interface AuthenticatedSession {
  accessToken: string;
  expiresAt: string;
  account: PersonSummary;
}

export interface RegistrationReceipt {
  accountId: string;
  registrationRequestId: string;
}

export interface VerificationStatus {
  emailVerified: boolean;
  phoneVerified: boolean;
  approved: boolean;
  status: AccountStatus;
}

export interface PageSlice<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
}

export interface RatingInfo {
  averageStars: number;
  ratingCount: number;
  myStars: number | null;
}

export interface KudoCard {
  id: string;
  author: PersonSummary;
  recipient: PersonSummary;
  categoryId: string;
  categoryName: string;
  body: string | null;
  createdAt: string;
  status: ModerationStatus;
  rating: RatingInfo;
  replyCount: number;
}

export interface ConversationItem {
  id: string;
  parentReplyId: string | null;
  depth: number;
  author: PersonSummary;
  body: string | null;
  createdAt: string;
  status: ModerationStatus;
  rating: RatingInfo;
}

export interface KudoDetail {
  kudo: KudoCard;
  conversation: ConversationItem[];
}

export interface ContentReference {
  type: ContentType;
  id: string;
}

export interface RatingSummary {
  ratedContent: ContentReference;
  averageStars: number;
  ratingCount: number;
}

export interface RatingView {
  rater: PersonSummary;
  stars: number;
  ratedAt: string;
}

export interface CategoryView {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export interface ProfileView {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: AccountStatus;
  approved: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  programs: string[];
  faculty: string | null;
  registeredAt: string;
}

export interface AuditEntry {
  id: string;
  eventType: string;
  aggregateId: string;
  actorId: string | null;
  occurredOn: string;
  evidence: string;
}

export interface PendingRegistration {
  requestId: string;
  applicant: PersonSummary;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  requestedRole: Role;
  requestedPrograms: string[];
  requestedFaculty: string | null;
  submittedAt: string;
}

export interface ManagedAccount {
  person: PersonSummary;
  email: string;
  phone: string;
  affiliation: string;
}

export interface Tenure {
  holder: PersonSummary | null;
  startedAt: string;
  endedAt: string | null;
}

export interface FacultySummary {
  id: string;
  name: string;
  coordinator: PersonSummary | null;
  programCount: number;
}

export interface ProgramSummary {
  id: string;
  name: string;
  facultyId: string;
  coordinator: PersonSummary | null;
}

export interface FacultyDetail {
  id: string;
  name: string;
  createdAt: string;
  coordinator: PersonSummary | null;
  coordinatorHistory: Tenure[];
  programs: ProgramSummary[];
}

export interface Membership {
  member: PersonSummary;
  type: MembershipType;
  linkedAt: string;
  unlinkedAt: string | null;
}

export interface ProgramDetail {
  id: string;
  name: string;
  facultyId: string;
  facultyName: string;
  createdAt: string;
  coordinator: PersonSummary | null;
  coordinatorHistory: Tenure[];
  members: Membership[];
}

export interface UniversityAuthority {
  position: Role;
  currentHolder: PersonSummary | null;
  history: Tenure[];
}

export interface PersonAffiliation {
  person: PersonSummary;
  programs: ProgramSummary[];
  faculty: string | null;
}

export interface ReportView {
  id: string;
  reporter: PersonSummary;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  reportedAt: string;
}

export interface ReportedContent {
  content: ContentReference;
  kudoId: string;
  contentStatus: ModerationStatus;
  author: PersonSummary;
  body: string;
  reports: ReportView[];
}

export interface DecisionView {
  id: string;
  content: ContentReference;
  moderator: PersonSummary;
  outcome: ModerationOutcome;
  rationale: string;
  resolvedReports: number;
  decidedAt: string;
}

export interface NotificationRecord {
  id: string;
  recipientId: string;
  message: string;
  relatedContent: ContentReference | null;
  createdAt: string;
  readAt: string | null;
}

export interface CreatedResource {
  id: string;
}
