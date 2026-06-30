// src/types/webclass.ts

export enum DayOfWeek {
  Monday = 'mon',
  Tuesday = 'tue',
  Wednesday = 'wed',
  Thursday = 'thu',
  Friday = 'fri',
  Saturday = 'sat',
  Unknown = 'unknown'
}

export enum ClassPeriod {
  Period1 = 'p1', // 1・2限
  Period2 = 'p2', // 3・4限
  Period3 = 'p3', // 5・6限
  Period4 = 'p4', // 7・8限
  Period5 = 'p5', // 9・10限
  Period6 = 'p6', // 11・12限
  Unknown = 'unknown'
}

export interface UserProfile {
  username: string;
  unreadMessagesCount: number;
}

export interface ScheduleInfo {
  day: DayOfWeek;
  period: ClassPeriod;
}

export interface ScheduledCourse {
  id: string;         // 例: "6C070" (年度が削られた純粋なコード)
  title: string;      // 例: "基礎化学（情報Ｐ）"
  term: string;       // 例: "2026年度前期"
  url: string;
  schedule: ScheduleInfo;
  unreadMessages: number;
  hasUrgentTask: boolean;
}

export interface OtherCourseNode {
  categoryName: string;
  children?: OtherCourseNode[];
  courses?: {
    id: string;
    title: string;
    url: string;
    unreadMessages: number;
    hasUrgentTask: boolean;
  }[];
}

export interface Announcement {
  id: string;
  title: string;
  url: string;
  isNew: boolean;
}

export interface Survey {
  id: string;
  title: string;
  url: string;
  isNew: boolean;
}

export interface ExternalLink {
  title: string;
  url: string;
}

export interface PortalContents {
  systemAnnouncements: Announcement[];
  surveys: Survey[];
  globalTools: {
    taskStatusListUrl: string;       // 課題実施状況一覧
    learningRecordViewerUrl: string; // 学習記録ビューア
  };
  externalLinks: ExternalLink[];
}

export interface DashboardInfo {
  userProfile: UserProfile;
  scheduledCourses: ScheduledCourse[];
  otherCourses: OtherCourseNode[];
  portalContents: PortalContents;
}