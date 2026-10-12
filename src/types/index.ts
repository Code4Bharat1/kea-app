export type UserRole = 'user' | 'admin' | 'superadmin' | 'moderator';
export type MembershipStatus = 'pending' | 'approved' | 'rejected';

export interface Education {
  institution: string;
  degree: string;
  from: string;
  to: string;
}

export interface Experience {
  company: string;
  position: string;
  from: string;
  to: string;
  description?: string;
}

export interface Reference {
  name: string;
  contact: string;
  relation: string;
}

export interface UserProfile {
  headline?: string;
  bio?: string;
  phone?: string;
  countryCode?: string;
  country?: string;
  nativeAddition?: string;
  location?: string;
  category?: string;
  otherCategory?: string;
  company?: string;
  position?: string;
  yearsOfExperience?: string;
  branch?: string;
  skills?: string[];
  education?: Education[];
  experience?: Experience[];
  references?: Reference[];
  avatar?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
}


export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  membershipStatus: MembershipStatus;
  profile: UserProfile;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResumeItem {
  _id: string;
  user?: string;
  title?: string;
  originalName?: string;
  fileName?: string;
  fileUrl?: string;
  mimeType?: string;
  size?: number;
  fileSize?: number;
  uploadedAt?: string;
  createdAt?: string;
}

export interface EventItem {
  _id: string;
  title: string;
  description: string;
  date: string;
  startDate?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  location: string;
  venue?: string;
  speaker?: string;
  category?: string;
  eventType?: string;
  bannerImage?: string;
  capacity?: number;
  maxAttendees?: number;
  registeredCount?: number;
  registeredUsers?: any[];
  pendingAttendees?: any[];
  isRegistered?: boolean;
  isPending?: boolean;
  isOnline?: boolean;
  meetingLink?: string;
  registrationLink?: string;
  organizer?: any;
  organizerName?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  notes?: string;
  tags?: string[];
  status?: 'upcoming' | 'ongoing' | 'completed';
  createdAt?: string;
}

export interface JobItem {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Internship';
  salary?: string;
  description: string;
  requirements?: string[];
  discipline?: string;
  category?: string;
  experienceLevel?: string;
  experience?: string;
  tags?: string[];
  postedBy?: string;
  applyUrl?: string;
  deadline?: string;
  isSaved?: boolean;
  hasApplied?: boolean;
  createdAt?: string;
}

export interface JobApplication {
  _id: string;
  job: JobItem | string;
  user: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'rejected';
  appliedAt: string;
}

export interface BlogItem {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  } | string;
  category?: string;
  readTime?: string;
  coverImage?: string;
  likes?: string[];
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  createdAt?: string;
}

export interface BlogComment {
  _id: string;
  blog: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
}

export interface ForumComment {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
}

export interface ForumThread {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  category?: string;
  tags?: string[];
  likes?: string[];
  likesCount?: number;
  comments?: ForumComment[];
  commentsCount?: number;
  replies?: ForumComment[];
  views?: number;
  isPinned?: boolean;
  isLocked?: boolean;
  isLiked?: boolean;
  lastActivity?: string;
  createdAt?: string;
}

export interface ResourceCategory {
  _id: string;
  name: string;
  subcategories: string[];
}

export interface ResourceCategoryStat {
  name: string;
  count: number;
}

export interface ResourceItem {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  subcategory?: string;
  format?: string;
  externalLink?: string;
  wasabiKey?: string;
  tags?: string[];
  author?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
  downloadCount?: number;
  createdAt?: string;
}

export interface NotificationItem {
  _id: string;
  user: string;
  title: string;
  message: string;
  type?: 'event' | 'job' | 'system' | 'forum';
  read: boolean;
  createdAt: string;
}

export interface RecentActivityItem {
  _id: string;
  type: 'job_application' | 'event_registration' | 'document_download' | 'connection' | string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface DashboardStats {
  eventsCount: number;
  savedJobsCount: number;
  applicationsCount: number;
  unreadNotificationsCount: number;
  eventsChange?: number;
  savedJobsChange?: number;
  applicationsChange?: number;
  connectionsCount?: number;
  connectionsChange?: number;
}

export interface ToolCategoryStat {
  name: string;
  count: number;
}

export interface ToolItem {
  _id: string;
  name: string;
  category?: string;
  subcategory?: string;
  description?: string;
  version?: string;
  platform?: string;
  license?: string;
  downloadLink?: string;
  documentationLink?: string;
  features?: string[];
  requirements?: string[];
  fileSize?: string;
  rating?: number;
  downloadCount?: number;
  createdAt?: string;
}

export interface GroupItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  type: 'public' | 'private' | 'secret' | string;
  discipline?: string;
  region?: string;
  memberCount?: number;
  creator?: { _id: string; name: string };
  approvalStatus?: 'pending' | 'approved' | 'rejected' | string;
  isMember?: boolean;
  createdAt?: string;
}

export interface MentorItem {
  _id: string;
  name: string;
  title: string;
  organization?: string;
  bio: string;
  expertise: string[];
  skills: string[];
  focusAreas?: string[];
  experience: { years?: number | string; description?: string };
  location?: string;
  contact?: { email?: string; linkedin?: string };
  education?: Array<{ degree: string; institution: string; year?: string }>;
  achievements?: string[];
  languages?: string[];
  stats?: { rating: number; reviews: number; totalSessions: number };
  availability?: Array<{ date: string; isBooked: boolean; slotId?: string }>;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | string;
  rejectionReason?: string;
  createdAt?: string;
}

export interface GalleryCategoryStat {
  name: string;
  count: number;
}

export interface GalleryItem {
  _id: string;
  title: string;
  description?: string;
  category: 'Event Category' | 'Project Showcase' | 'Member Activities' | 'Good Wishes' | 'Testimonials' | string;
  imageUrl?: string;
  uploadedBy?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  tags?: string[];
  likes?: string[];
  comments?: Array<{
    _id?: string;
    user?: {
      _id: string;
      name: string;
      avatar?: string;
    };
    content: string;
    createdAt: string;
  }>;
  isApproved?: boolean;
  eventDate?: string;
  location?: string;
  createdAt?: string;
}



