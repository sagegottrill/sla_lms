export interface Course {
  id: number;
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

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  skills: string[];
  posted: string;
  logo: string;
  description: string;
}
