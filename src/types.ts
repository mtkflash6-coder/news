export type NewsCategory = 'Khulna' | 'Jashore' | 'Kushtia' | 'Satkhira' | 'Bagerhat' | 'Chuadanga' | 'Jhenaidah' | 'Magura' | 'Meherpur' | 'Narail' | 'Regional' | 'Agriculture' | 'Education' | 'Economy' | 'Sports' | 'Events' | 'Weather' | 'Traffic';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content?: string;
  category: NewsCategory;
  author: string;
  date: string;
  imageUrl: string;
  isFeatured?: boolean;
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

export interface TrafficUpdate {
  road: string;
  status: 'Heavy' | 'Moderate' | 'Light';
  details: string;
  lastUpdated: string;
}

export interface LocalEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  type: string;
}
