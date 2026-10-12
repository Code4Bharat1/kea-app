import { User, EventItem, JobItem, BlogItem, ForumThread, ResourceItem, NotificationItem, DashboardStats, ResumeItem, JobApplication } from '../types';

export const MOCK_USER: User = {
  _id: 'user_primary_001',
  name: 'KEA Member',
  email: 'member@kokaniengineers.org',
  role: 'user',
  membershipStatus: 'approved',
  profile: {
    headline: 'Engineering Professional',
    bio: 'Member of the Kokani Engineers Association (KEA) platform & mobile application ecosystem.',
    phone: '+91 9876543210',
    location: 'Mumbai, Maharashtra',
    category: 'Software & IT',
    company: 'Kokani Engineers Association (KEA)',
    position: 'Chief Technology Architect',
    yearsOfExperience: '10',
    skills: ['Node.js', 'React Native', 'MongoDB', 'TypeScript', 'Database Architecture', 'System Security'],
    education: [
      {
        institution: 'Mumbai University',
        degree: 'B.E. in Computer Engineering',
        from: '2012',
        to: '2016',
      },
    ],
    experience: [
      {
        company: 'Kokani Engineers Association (KEA)',
        position: 'Chief Technology Architect & Lead Developer',
        from: '2019',
        to: 'Present',
        description: 'Architecting and managing scalable mobile and cloud infrastructure for engineering professionals.',
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  eventsCount: 3,
  savedJobsCount: 2,
  applicationsCount: 1,
  unreadNotificationsCount: 2,
};

export const MOCK_EVENTS: EventItem[] = [
  {
    _id: 'evt_1',
    title: 'Annual KEA Engineering Conference 2026',
    description: 'Join leading engineers, innovators, and industry pioneers for our flagship annual conference focusing on sustainable infrastructure development in Kokan.',
    date: new Date(Date.now() + 86400000 * 5).toISOString(),
    time: '10:00 AM - 05:00 PM',
    location: 'KEA Convention Center, Ratnagiri',
    speaker: 'Er. Suresh Patil (Ex-Chief Engineer, PWD)',
    category: 'Conference',
    capacity: 250,
    isRegistered: true,
    status: 'upcoming',
  },
  {
    _id: 'evt_2',
    title: 'Workshop: Modern Structural Analysis & BIM Tools',
    description: 'Hands-on technical workshop covering Revit, STAAD Pro, and contemporary BIM practices for civil and structural engineers.',
    date: new Date(Date.now() + 86400000 * 12).toISOString(),
    time: '02:00 PM - 06:00 PM',
    location: 'Online Webinar (Zoom)',
    speaker: 'Dr. Ananya Desai',
    category: 'Workshop',
    capacity: 100,
    isRegistered: false,
    status: 'upcoming',
  },
  {
    _id: 'evt_3',
    title: 'KEA Youth Engineers Networking Meet',
    description: 'Interactive networking session for recent engineering graduates and junior professionals with senior mentors.',
    date: new Date(Date.now() + 86400000 * 20).toISOString(),
    time: '04:00 PM - 07:00 PM',
    location: 'Hotel Kohinoor, Chiplun',
    speaker: 'KEA Executive Committee',
    category: 'Networking',
    capacity: 80,
    isRegistered: false,
    status: 'upcoming',
  },
];

export const MOCK_JOBS: JobItem[] = [
  {
    _id: 'job_1',
    title: 'Senior Civil Project Manager',
    company: 'Kokan Infra Tech',
    location: 'Ratnagiri, MH',
    type: 'Full-time',
    salary: '₹8,00,000 - ₹12,00,000 P.A.',
    description: 'We are seeking an experienced Civil Engineer to oversee bridge and coastal road construction projects.',
    requirements: ['5+ years civil engineering experience', 'Strong team management skills', 'Proficiency in AutoCAD & MS Project'],
    discipline: 'Civil Engineering',
    category: 'Civil Engineering',
    experienceLevel: 'Senior',
    isSaved: true,
    hasApplied: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'job_2',
    title: 'Electrical System Design Lead',
    company: 'Konkan Power Solutions',
    location: 'Navi Mumbai',
    type: 'Full-time',
    salary: '₹6,50,000 - ₹9,50,000 P.A.',
    description: 'Design electrical distribution layouts and substation planning for industrial plants.',
    requirements: ['B.E/B.Tech Electrical', '3+ years experience', 'Knowledge of ETAP & AutoCAD Electrical'],
    discipline: 'Electrical Engineering',
    category: 'Electrical Engineering',
    experienceLevel: 'Mid-Level',
    isSaved: true,
    hasApplied: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'job_3',
    title: 'Full Stack React Native / Node Developer',
    company: 'KEA Tech Innovations',
    location: 'Remote',
    type: 'Remote',
    salary: '₹10,00,000 - ₹15,00,000 P.A.',
    description: 'Develop and maintain mobile applications and RESTful APIs for regional engineering portals.',
    requirements: ['React Native', 'Node.js/Express', 'MongoDB/PostgreSQL'],
    discipline: 'Software Engineering',
    category: 'Software Engineering',
    experienceLevel: 'Mid-Senior',
    isSaved: false,
    hasApplied: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'job_4',
    title: 'HVAC & Thermal Plant Engineer',
    company: 'Coastal Precision Engineering',
    location: 'Chiplun, MH',
    type: 'Full-time',
    salary: '₹6,00,000 - ₹8,50,000 P.A.',
    description: 'Lead thermal analysis and HVAC equipment design for manufacturing plants and commercial complexes.',
    requirements: ['B.E. Mechanical Engineering', 'SolidWorks / AutoCAD', 'HVAC Design Certification'],
    discipline: 'Mechanical Engineering',
    category: 'Mechanical Engineering',
    experienceLevel: 'Mid-Level',
    isSaved: false,
    hasApplied: false,
    createdAt: new Date().toISOString(),
  },
];

export const MOCK_BLOGS: BlogItem[] = [
  {
    _id: 'blog_1',
    title: 'Sustainable Infrastructure Development in Coastal Kokan',
    content: 'Coastal infrastructure requires unique material considerations due to salinity and humidity. In this post, we explore modern anti-corrosive concrete additives and marine construction techniques suited for the Kokan belt.',
    summary: 'Exploring anti-corrosive construction techniques for coastal development.',
    author: {
      _id: 'auth_1',
      name: 'Er. Rajesh Sawant',
    },
    category: 'Civil Engineering',
    readTime: '5 min read',
    likesCount: 24,
    commentsCount: 6,
    isLiked: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'blog_2',
    title: 'Renewable Energy Opportunities in West Coast India',
    content: 'Solar and micro-hydro potential in the Western Ghats can revolutionize rural electrification. This article outlines current government schemes and private engineering opportunities.',
    summary: 'Analyzing solar and micro-hydro potential across Maharashtra.',
    author: {
      _id: 'auth_2',
      name: 'Er. Priya Kadam',
    },
    category: 'Electrical & Energy',
    readTime: '7 min read',
    likesCount: 18,
    commentsCount: 3,
    isLiked: true,
    createdAt: new Date().toISOString(),
  },
];

export const MOCK_FORUMS: ForumThread[] = [
  {
    _id: 'forum_1',
    title: 'Best Practices for Rainwater Harvesting in Heavy Rainfall Zones',
    content: 'With Kokan receiving over 3000mm rainfall annually, what are the most cost-effective storage and filtration setups for residential complexes?',
    author: {
      _id: 'user_1',
      name: 'Er. Nitin Parab',
    },
    category: 'Environmental Engineering',
    likesCount: 12,
    commentsCount: 4,
    isLiked: false,
    comments: [
      {
        _id: 'c_1',
        user: { _id: 'u_2', name: 'Er. Vinay Joshi' },
        content: 'Ferrocement tanks combined with dual gravel-sand filters work best in Ratnagiri clay soils.',
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

export const MOCK_RESOURCES: ResourceItem[] = [
  {
    _id: 'res_1',
    title: 'KEA Structural Design Standard Guidelines 2026',
    description: 'Comprehensive guidelines for earthquake and cyclone resistant structural design.',
    category: 'Codes & Standards',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileType: 'PDF Document',
    fileSize: '2.4 MB',
    downloadCount: 142,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'res_2',
    title: 'Kokan Industrial Zoning & Environmental Regulations',
    description: 'Government norms and clearance procedures for industrial setup in Maharashtra.',
    category: 'Regulatory',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileType: 'PDF Document',
    fileSize: '1.8 MB',
    downloadCount: 98,
    createdAt: new Date().toISOString(),
  },
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    _id: 'notif_1',
    user: 'user_primary_001',
    title: 'Registration Confirmed',
    message: 'Your registration for "Annual KEA Engineering Conference 2026" is confirmed.',
    type: 'event',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'notif_2',
    user: 'user_primary_001',
    title: 'New Job Matching Profile',
    message: 'Kokan Infra Tech posted a new job: Senior Civil Project Manager.',
    type: 'job',
    read: false,
    createdAt: new Date().toISOString(),
  },
];

export const MOCK_RESUMES: ResumeItem[] = [
  {
    _id: 'res_item_1',
    user: 'user_primary_001',
    fileName: 'Er_Kokan_Member_Resume.pdf',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: 1048576,
    uploadedAt: new Date().toISOString(),
  },
];

export const MOCK_APPLICATIONS: JobApplication[] = [
  {
    _id: 'app_1',
    job: MOCK_JOBS[1],
    user: 'user_primary_001',
    coverLetter: 'Interested in leading electrical system design for regional projects.',
    status: 'under_review',
    appliedAt: new Date().toISOString(),
  },
];
