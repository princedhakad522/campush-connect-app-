export type Role = "student" | "teacher" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  branch: string | null;
  semester: number | null;
  roll_number: string | null;
  faculty_id: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
  created_at: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  branch: string;
  semester: number;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  description: string;
  subject: string;
  branch: string;
  semester: number;
  file_url: string;
  file_name: string;
  file_type: string;
  uploader_id: string | null;
  created_at: string;
  uploader?: Pick<Profile, "full_name"> | null;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  created_by: string | null;
  created_at: string;
  author?: Pick<Profile, "full_name"> | null;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url: string;
  category: string;
  branch: string;
  organizer: string;
  start_time: string;
  end_time: string;
  registration_info: string;
  created_by: string | null;
  created_at: string;
  registered?: boolean;
  registrations?: number;
}

export interface CanteenItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  emoji: string;
  created_at: string;
}

export interface CanteenMeta {
  open_time: string;
  close_time: string;
  announcement: string;
}

export interface Faculty {
  id: string;
  name: string;
  designation: string;
  department: string;
  role: "HOD" | "Faculty";
  email: string;
  phone: string;
  photo_url: string;
  bio: string;
  created_at: string;
}

export interface TimetableEntry {
  id: string;
  branch: string;
  semester: number;
  section: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  room: string;
  teacher_id: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  subject: string;
  date: string;
  status: "present" | "absent";
  marked_by: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  branch: string;
  semester: number;
  due_date: string | null;
  file_url: string;
  file_name: string;
  created_by: string | null;
  created_at: string;
  submitted?: boolean;
  submissions_count?: number;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  file_name: string;
  submitted_at: string;
  student?: Pick<Profile, "full_name" | "roll_number" | "branch" | "semester"> | null;
}

export interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  kind: "lost" | "found";
  item: string;
  location: string;
  occurred_at: string | null;
  image_url: string;
  user_id: string | null;
  status: "open" | "resolved";
  created_at: string;
  reporter?: Pick<Profile, "full_name" | "email"> | null;
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  user_id: string | null;
  created_at: string;
  author?: Pick<Profile, "full_name" | "avatar_url"> | null;
  replies?: number;
}

export interface DiscussionReply {
  id: string;
  discussion_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  author?: Pick<Profile, "full_name" | "avatar_url"> | null;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  link: string;
  read: boolean;
  created_by: string | null;
  created_at: string;
}

export const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const BRANCHES = [
  "CSE",
  "IT",
  "ECE",
  "ME",
  "CE",
  "AIML",
  "BCA",
  "BBA",
];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export const YEARS = [1, 2, 3, 4] as const;

export const TIMETABLE_SECTIONS = ["A", "B", "C"] as const;

export function semestersForYear(year: number): number[] {
  return SEMESTERS.filter((s) => Math.ceil(s / 2) === year);
}

export const EVENT_BRANCHES = ["CSE", "Electrical", "Mechanical", "Cyber Security"] as const;

export const EVENT_CATEGORIES = [
  "Hackathon",
  "Sports",
  "Cultural",
  "Coding",
  "Workshop",
  "Seminar",
  "Other",
];

export const NOTICE_CATEGORIES = [
  "General",
  "Exam",
  "Holiday",
  "Event",
  "Admission",
  "Result",
  "Hostel",
];

export const NOTIFICATION_TYPES = {
  notice: "notice",
  assignment: "assignment",
  event: "event",
  notes: "notes",
  system: "system",
} as const;

export interface RoleRequest {
  id: string;
  user_id: string;
  requested_role: "teacher" | "admin";
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user?: Pick<Profile, "full_name" | "email"> | null;
}

export const CANTEEN_CATEGORIES = ["Breakfast", "Lunch", "Snacks", "Beverages", "Dinner", "Other"] as const;

export const DEPARTMENT_LIST = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electrical Engineering",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Mathematics",
  "Physics",
  "Chemistry",
] as const;