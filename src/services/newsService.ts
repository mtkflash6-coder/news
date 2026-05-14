import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ai, GEN_MODEL } from '../lib/gemini';
import { NewsItem, NewsCategory, WeatherData, TrafficUpdate } from '../types';

export async function fetchNewsByCategory(category: NewsCategory): Promise<NewsItem[]> {
  const newsPath = 'news';
  try {
    const q = query(
      collection(db, newsPath),
      where('category', '==', category),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firebase Timestamp to string date
        date: data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
          : 'অজানা তারিখ',
      } as NewsItem;
    });

    if (results.length > 0) return results;

    // If no news, fall back to AI generation for the demo if it's not a restricted category
    return getMockNews(category);
  } catch (error) {
    // If the index doesn't exist yet, it'll fail. Handle gracefully.
    console.warn("Firestore fetch failed, might need index:", error);
    return getMockNews(category);
  }
}

export async function createNewsArticle(article: Omit<NewsItem, 'id' | 'date'>) {
  const newsPath = 'news';
  try {
    const docRef = await addDoc(collection(db, newsPath), {
      ...article,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, newsPath);
  }
}

export async function fetchWeatherData(city: string = "Khulna"): Promise<WeatherData> {
  // Normally we'd use a weather API, but we'll use Gemini to "simulate" or "report" realistic weather for the region
  if (!ai) return { city, temp: 32, condition: "Sunny", humidity: 65, windSpeed: 12 };

  try {
    const response = await ai.models.generateContent({
      model: GEN_MODEL,
      contents: `Provide a realistic current weather report for ${city}, Bangladesh. Output JSON: {city: string, temp: number, condition: string, humidity: number, windSpeed: number}.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { city, temp: 32, condition: "Sunny", humidity: 65, windSpeed: 12 };
  }
}

export async function fetchTrafficUpdates(): Promise<TrafficUpdate[]> {
  const roads = ["Khan A Sabur Road", "Mujgunni Main Road", "Jessore-Khulna Highway", "Phulbari Gate"];
  if (!ai) return roads.map(road => ({ road, status: 'Moderate', details: 'Normal flow', lastUpdated: '10 mins ago' }));

  try {
    const response = await ai.models.generateContent({
      model: GEN_MODEL,
      contents: `Generate realistic traffic status for major roads in Khulna city: ${roads.join(', ')}. Output JSON: Array<{road: string, status: 'Heavy'|'Moderate'|'Light', details: string, lastUpdated: string}>.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return roads.map(road => ({ road, status: 'Moderate', details: 'Normal flow', lastUpdated: '10 mins ago' }));
  }
}

// Fallback mock data
function getMockNews(category: NewsCategory): NewsItem[] {
  return [
    {
      id: '1',
      title: 'খুলনায় নতুন টেক পার্ক উদ্বোধন',
      summary: 'খুলনা সিটি কর্পোরেশনের উদ্যোগে শহরে একটি আধুনিক টেক পার্ক নির্মাণের ঘোষণা দিয়েছেন মেয়র।',
      category,
      author: 'নিজস্ব প্রতিবেদক',
      date: '১৪ মে ২০২৬',
      imageUrl: 'https://picsum.photos/seed/khulna1/800/450',
      isFeatured: true
    },
    {
       id: '2',
       title: 'যশোরে আম চাষীদের সুখবর',
       summary: 'চলতি মৌসুমে যশোরে আমের ফলন ভালো হওয়ায় চাষীরা আনন্দিত। সরকারি সহায়তা বাড়লে রপ্তানিও সম্ভব হবে।',
       category,
       author: 'জেলা সংবাদদাতা',
       date: '১৪ মে ২০২৬',
       imageUrl: 'https://picsum.photos/seed/jashore1/800/450'
    }
  ];
}
