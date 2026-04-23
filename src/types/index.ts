export interface Course {
  id: number;
  /** Opaque id for public URLs when column exists in DB */
  public_id?: string | null;
  /** Set on create; links course to authoring user in Supabase */
  instructor_id?: string;
  title: string;
  subtitle: string;
  instructor: string;
  instructorTitle: string;
  instructorBio: string;
  instructorAvatar: string;
  category: string;
  level: string;
  rating: number;
  reviewCount: number;
  students: number;
  duration: string;
  price: number;
  originalPrice?: number;
  image: string;
  bestseller: boolean;
  badge: string;
  language: string;
  lastUpdated: string;
  whatYoullLearn: string[];
  curriculum: { module: string; lessons: number; duration: string; items: any[] }[];
  reviews: { name: string; rating: number; comment: string; date: string }[];
}

export interface Program {
  id: number;
  public_id?: string | null;
  title: string;
  description: string;
  category: string;
  duration: string;
  startDate: string;
  enrolled: number;
  capacity: number;
  price: number;
  image: string;
  highlights: string[];
  tagline?: string;
  courses?: string[];
  courseCount?: number;
  students?: number;
  deadline?: string;
  originalPrice?: number;
  level?: string;
  tag?: string;
}
