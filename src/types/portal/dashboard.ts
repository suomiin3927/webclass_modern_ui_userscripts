export interface UserProfile {
  username: string;
  unreadMessagesCount: number;
}

export interface CourseSchedule {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'unknown';
  period: string; // "p1", "p2" などの時限コード、または "unknown"
}

export interface ScheduledCourse {
  id: string;
  title: string;
  term: string;
  url: string;
  schedule: CourseSchedule;
  unreadMessages: number;
  hasUrgentTask: boolean;
}

export interface CourseItem {
  id: string;
  title: string;
  url: string;
  unreadMessages: number;
  hasUrgentTask: boolean;
}

export interface CourseCategory {
  categoryName: string;
  courses: CourseItem[];
}

export interface OtherCourseGroup {
  categoryName: string; // レベル1のカテゴリ名
  children: CourseCategory[]; // レベル2のカテゴリとコース一覧
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  url: string;
  isNew: boolean;
}

export interface SideMenuLink {
  title: string;
  url: string;
}

export interface SideMenuBlock {
  title: string;
  links: SideMenuLink[];
}

export interface PortalContents {
  systemAnnouncements: SystemAnnouncement[];
  requiredSurveysCount: number;
  sideMenus: SideMenuBlock[];
}

export interface WebClassDashboardInfo {
  userProfile: UserProfile;
  scheduledCourses: ScheduledCourse[];
  otherCourses: OtherCourseGroup[];
  portalContents: PortalContents;
}