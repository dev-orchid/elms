// ============================================================
// ENUMS
// ============================================================

export enum UserRole {
  Learner = 'learner',
  Instructor = 'instructor',
  Admin = 'admin',
  SuperAdmin = 'super_admin',
}

export enum CourseStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}

export enum Difficulty {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

export enum QuestionType {
  MCQ = 'mcq',
  TrueFalse = 'true_false',
  FillBlank = 'fill_blank',
  ShortAnswer = 'short_answer',
  Essay = 'essay',
}

export enum AssessmentType {
  Quiz = 'quiz',
  MidTerm = 'mid_term',
  Final = 'final',
  Assignment = 'assignment',
}

export enum EnrollmentStatus {
  Active = 'active',
  Completed = 'completed',
  Dropped = 'dropped',
}

export enum SubmissionStatus {
  InProgress = 'in_progress',
  Submitted = 'submitted',
  Graded = 'graded',
}

export enum InstructorRole {
  Lead = 'lead',
  Assistant = 'assistant',
  Grader = 'grader',
}

export enum ContentType {
  Video = 'video',
  PDF = 'pdf',
  Text = 'text',
  Embed = 'embed',
  Slides = 'slides',
}

export enum NotificationType {
  Enrollment = 'enrollment',
  Assessment = 'assessment',
  Grade = 'grade',
  Certificate = 'certificate',
  Badge = 'badge',
  Announcement = 'announcement',
  Forum = 'forum',
  Message = 'message',
  System = 'system',
}

export enum Level {
  Novice = 'Novice',
  Explorer = 'Explorer',
  Scholar = 'Scholar',
  Expert = 'Expert',
  Master = 'Master',
}

// ============================================================
// TABLE INTERFACES
// ============================================================

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  two_factor_enabled: boolean;
  points: number;
  level: Level;
  streak_days: number;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  status: CourseStatus;
  difficulty: Difficulty;
  estimated_hours: number | null;
  is_certification_enabled: boolean;
  passing_score: number;
  max_enrollments: number | null;
  created_by: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseInstructor {
  course_id: string;
  instructor_id: string;
  role: InstructorRole;
  created_at: string;
}

export interface CourseBundle {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_sequential: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BundleCourse {
  bundle_id: string;
  course_id: string;
  sort_order: number;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  content_url: string | null;
  content_body: string | null;
  duration_minutes: number | null;
  sort_order: number;
  is_published: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  progress: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
  time_spent_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionBankItem {
  id: string;
  course_id: string;
  category: string | null;
  question_type: QuestionType;
  question_text: string;
  options: Record<string, unknown> | null;
  correct_answer: string;
  points: number;
  difficulty: Difficulty;
  explanation: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  type: AssessmentType;
  description: string | null;
  time_limit_minutes: number | null;
  max_attempts: number;
  shuffle_questions: boolean;
  passing_score: number;
  is_published: boolean;
  available_from: string | null;
  available_until: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentQuestion {
  assessment_id: string;
  question_id: string;
  sort_order: number;
}

export interface Submission {
  id: string;
  assessment_id: string;
  user_id: string;
  attempt_number: number;
  status: SubmissionStatus;
  score: number | null;
  total_points: number | null;
  started_at: string;
  submitted_at: string | null;
  graded_at: string | null;
  graded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  answer_text: string | null;
  selected_options: Record<string, unknown> | null;
  is_correct: boolean | null;
  points_awarded: number | null;
  feedback: string | null;
  created_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  verification_code: string;
  certificate_url: string | null;
  issued_at: string;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  criteria: Record<string, unknown>;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface PointsLedger {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  reference_id: string | null;
  created_at: string;
}

export interface ForumThread {
  id: string;
  course_id: string;
  title: string;
  created_by: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: string;
  thread_id: string;
  parent_id: string | null;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  reference_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  course_id: string | null;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface IntegrationConfig {
  id: string;
  provider: string;
  config: Record<string, unknown>;
  is_enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// API REQUEST TYPES
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  user: Profile;
  token: string;
  refresh_token?: string;
}

export interface CreateCourseRequest {
  title: string;
  description?: string;
  difficulty: Difficulty;
  estimated_hours?: number;
  is_certification_enabled?: boolean;
  passing_score?: number;
  max_enrollments?: number;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  thumbnail_url?: string;
  difficulty?: Difficulty;
  estimated_hours?: number;
  is_certification_enabled?: boolean;
  passing_score?: number;
  max_enrollments?: number;
}

export interface CreateQuestionRequest {
  course_id: string;
  category?: string;
  question_type: QuestionType;
  question_text: string;
  options?: Record<string, unknown>;
  correct_answer: string;
  points: number;
  difficulty: Difficulty;
  explanation?: string;
}

export interface CreateAssessmentRequest {
  course_id: string;
  module_id?: string;
  title: string;
  type: AssessmentType;
  description?: string;
  time_limit_minutes?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  passing_score?: number;
}

export interface SubmitAnswerRequest {
  question_id: string;
  answer_text?: string;
  selected_options?: Record<string, unknown>;
}

export interface GradeSubmissionRequest {
  answers: {
    question_id: string;
    points_awarded: number;
    feedback?: string;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================
// DASHBOARD TYPES
// ============================================================

export interface AdminDashboardStats {
  total_users: number;
  total_courses: number;
  total_enrollments: number;
  active_users: number;
  users_by_role: Record<string, number>;
  enrollments_trend: { date: string; count: number }[];
  popular_courses: { course_id: string; title: string; enrollments: number }[];
}

export interface InstructorDashboardStats {
  total_courses: number;
  total_students: number;
  pending_grading: number;
  average_score: number;
  enrollment_trend: { date: string; count: number }[];
  course_stats: { course_id: string; title: string; students: number; avg_progress: number }[];
}

export interface LearnerDashboardStats {
  enrolled_courses: number;
  completed_courses: number;
  total_points: number;
  current_level: Level;
  streak_days: number;
  recent_activity: { date: string; action: string; resource: string }[];
  in_progress: { course_id: string; title: string; progress: number }[];
}

// ============================================================
// GAMIFICATION TYPES
// ============================================================

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  avatar_url: string | null;
  points: number;
  level: Level;
}

export interface PointsEvent {
  id: string;
  points: number;
  reason: string;
  created_at: string;
}
