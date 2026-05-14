import { useState, useEffect, useCallback } from 'react';
import { Menu, Search, User, Cloud, MapPin, TrafficCone, Calendar, Bell, Plus, X, LogOut, Image, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { fetchNewsByCategory, fetchWeatherData, fetchTrafficUpdates, createNewsArticle } from './services/newsService';
import { auth } from './lib/firebase';
import { NewsItem, WeatherData, TrafficUpdate, NewsCategory } from './types';

const CATEGORIES: NewsCategory[] = [
  'Regional', 'Khulna', 'Jashore', 'Kushtia', 'Satkhira', 'Bagerhat', 'Chuadanga', 'Jhenaidah', 'Magura', 'Meherpur', 'Narail', 'Sports', 'Agriculture', 'Economy', 'Education', 'Traffic'
];

const BN_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const BN_DAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];

function getBengaliDate() {
  const now = new Date();
  const dayName = BN_DAYS[now.getDay()];
  const day = now.getDate();
  const month = BN_MONTHS[now.getMonth()];
  const year = now.getFullYear();
  
  const toBengaliNumber = (num: number) => {
    const numbers: any = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
    return num.toString().split('').map(d => numbers[d] || d).join('');
  };

  return `${dayName}, ${toBengaliNumber(day)} ${month} ${toBengaliNumber(year)}`;
}

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('Regional');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [traffic, setTraffic] = useState<TrafficUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  // Auth setup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Hardcoded admin check for the user or email
      if (u?.email === 'mtkflash6@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        setIsAdminMode(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    const [newsData, weatherData, trafficData] = await Promise.all([
      fetchNewsByCategory(selectedCategory),
      fetchWeatherData('Khulna'),
      fetchTrafficUpdates()
    ]);
    setNews(newsData);
    setWeather(weatherData);
    setTraffic(trafficData);
    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const featuredNews = news.find(n => n.isFeatured) || news[0];
  const sideNews = news.filter(n => n.id !== featuredNews?.id);

  return (
    <div className="min-h-screen bg-navy-50 font-sans text-navy-900">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-navy-900/40 z-40 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 shadow-2xl p-6"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-red-600">XRG News</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-navy-50 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-navy-400 font-bold mb-4">বিভাগসমূহ</h3>
                  <div className="grid grid-cols-1 gap-1">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsMenuOpen(false);
                        }}
                        className={`text-left px-4 py-3 rounded-xl font-bold transition-all ${
                          selectedCategory === cat ? 'bg-navy-900 text-white' : 'hover:bg-navy-50 text-navy-700'
                        }`}
                      >
                        {getCategoryName(cat)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top Bar - Modern Navy Gradient */}
      <header className="relative z-30">
        <div className="navy-gradient text-white">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                id="menu-toggle"
              >
                <Menu size={22} />
              </button>
              <span className="hidden sm:inline-block text-[11px] font-bold tracking-widest opacity-70 uppercase">
                {getBengaliDate()}
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter" id="logo">
                XRG<span className="text-red-500">NEWS</span>
              </h1>
              <p className="text-[9px] uppercase tracking-[0.2em] opacity-60 font-black">
                Only For Khulna Division
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden lg:flex items-center space-x-2 text-xs bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                <Cloud size={14} className="text-blue-300" />
                <span className="font-bold">{weather?.temp}°C</span>
              </div>
              
              {user ? (
                <div className="flex items-center space-x-2">
                  <div className="relative group">
                    <img 
                      src={user.photoURL || ''} 
                      className="w-8 h-8 rounded-full border-2 border-white/20 cursor-pointer hover:border-white transition-all" 
                      alt="User" 
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                      <p className="px-4 py-2 text-[10px] text-navy-400 border-b border-gray-50">{user.email}</p>
                      {isAdmin && (
                        <button 
                          onClick={() => setIsAdminMode(!isAdminMode)}
                          className="w-full text-left px-4 py-2 text-sm font-bold text-navy-700 hover:bg-navy-50"
                        >
                          {isAdminMode ? 'View as Reader' : 'Admin Panel'}
                        </button>
                      )}
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                        <LogOut size={14} className="mr-2" /> Log Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="bg-white text-navy-900 px-4 py-2 rounded-full text-xs font-bold hover:bg-red-600 hover:text-white transition-all shadow-lg"
                >
                  SIGN IN
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Floating Glass Navigation */}
        <div className="sticky top-0 bg-white/60 backdrop-blur-xl border-b border-navy-100 z-20">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center justify-center space-x-1 py-1 overflow-x-auto no-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-4 py-3 text-sm font-bold transition-all relative ${
                    selectedCategory === cat 
                    ? 'text-red-600' 
                    : 'text-navy-600 hover:text-navy-900'
                  }`}
                >
                  {getCategoryName(cat)}
                  {selectedCategory === cat && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dynamic Dark Ticker */}
        <div className="bg-navy-900 text-white/90 py-1.5 px-4 flex items-center overflow-hidden">
          <div className="bg-red-600 px-2 py-0.5 rounded text-[9px] font-black mr-4 uppercase tracking-widest">
            Latest
          </div>
          <div className="flex-1 overflow-hidden">
            <motion.div 
              animate={{ x: [1200, -2400] }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
              className="whitespace-nowrap flex space-x-12 text-sm font-medium"
            >
              {news.map((item, i) => (
                <span key={i} className="hover:text-red-400 cursor-pointer flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2" />
                  {item.title}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        {isAdmin && isAdminMode && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowPostModal(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-navy-900 text-white rounded-2xl shadow-2xl flex items-center justify-center z-50 border-4 border-white"
          >
            <Plus size={32} />
          </motion.button>
        )}

        {/* Post Modal */}
        <AnimatePresence>
          {showPostModal && (
            <PostModal 
              onClose={() => setShowPostModal(false)} 
              onSuccess={() => {
                setShowPostModal(false);
                loadInitialData();
              }}
              author={{ id: user?.uid || '', name: user?.displayName || 'Editor' }}
            />
          )}
        </AnimatePresence>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Hero Section */}
          <div className="lg:col-span-8 space-y-10">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="w-full aspect-[21/9] bg-navy-100 animate-pulse rounded-3xl" />
                  <div className="h-10 bg-navy-100 animate-pulse w-3/4 rounded-lg" />
                  <div className="h-4 bg-navy-100 animate-pulse w-full rounded-lg" />
                </motion.div>
              ) : (
                <motion.section 
                  key={selectedCategory}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-10"
                >
                  {featuredNews && (
                    <article className="group cursor-pointer">
                      <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl news-card-shadow">
                        <img 
                          src={featuredNews.imageUrl} 
                          alt={featuredNews.title}
                          className="w-full aspect-[21/9] object-cover transform group-hover:scale-105 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                          <span className="bg-red-600 text-white px-3 py-1 text-[10px] uppercase font-black rounded-full mb-4 inline-block tracking-widest">
                            {getCategoryName(featuredNews.category)}
                          </span>
                          <h2 className="text-3xl md:text-5xl font-bold leading-tight text-white mb-4">
                            {featuredNews.title}
                          </h2>
                          <div className="flex items-center text-sm text-blue-100/60 font-medium space-x-4">
                            <span className="text-blue-300 font-bold">{featuredNews.authorName || featuredNews.author}</span>
                            <span>•</span>
                            <span>{featuredNews.date}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  )}

                  {/* Secondary News Row */}
                  <div className="grid md:grid-cols-2 gap-8">
                    {sideNews.map((item) => (
                      <article key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-navy-100 hover-lift group cursor-pointer">
                        <div className="relative overflow-hidden rounded-2xl mb-4">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title}
                            className="w-full aspect-video object-cover transform group-hover:scale-110 transition-transform duration-700"
                          />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-xl font-bold leading-snug text-navy-900 group-hover:text-red-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-navy-500 text-sm line-clamp-2">
                            {item.summary}
                          </p>
                          <div className="pt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-navy-300">
                             <span>{getCategoryName(item.category)}</span>
                             <span>{item.date}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 mt-12 lg:mt-0 space-y-8">
            {/* Weather Widget */}
            <div className="navy-gradient text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="flex items-center font-bold text-blue-100">
                    <Cloud size={20} className="mr-2" />
                    {weather?.city}
                  </h4>
                  <div className="bg-white/10 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full backdrop-blur-md">
                    LIVE
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-6xl font-black">{weather?.temp}°</span>
                    <p className="text-blue-100/60 font-medium uppercase tracking-widest text-xs mt-1">{weather?.condition}</p>
                  </div>
                  <div className="text-right text-[10px] text-white/40 space-y-1 font-bold uppercase">
                    <p>H: {weather?.humidity}%</p>
                    <p>W: {weather?.windSpeed} KPK</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
            </div>

            {/* Traffic Widget */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-navy-100">
              <h4 className="flex items-center font-black text-navy-900 mb-8 uppercase tracking-widest text-xs">
                <TrafficCone size={18} className="mr-2 text-red-500" />
                Live Traffic
              </h4>
              <div className="space-y-6">
                {traffic.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-navy-800">{t.road}</p>
                      <p className="text-[10px] text-navy-400 font-medium">{t.details}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ml-4 ${
                      t.status === 'Heavy' ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                      t.status === 'Moderate' ? 'bg-orange-400' :
                      'bg-green-400'
                    }`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Premium CTA / Events */}
            <div className="bg-navy-900 border border-navy-700 p-8 rounded-[2.5rem] shadow-2xl relative group overflow-hidden">
               <div className="relative z-10">
                 <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6">Upcoming local Events</h4>
                 <div className="space-y-4">
                   <div className="border-l-2 border-red-600 pl-4 py-1">
                     <p className="text-xs font-bold text-navy-400">১৮ মে, ২০২৬</p>
                     <p className="font-bold text-white text-sm">খুলনা মেলা - ২০২৬</p>
                   </div>
                   <div className="border-l-2 border-navy-700 pl-4 py-1">
                     <p className="text-xs font-bold text-navy-400">২২ মে, ২০২৬</p>
                     <p className="font-bold text-white text-sm">আইটি উদ্যোক্তা সম্মেলন</p>
                   </div>
                 </div>
               </div>
               <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-125 transition-transform duration-700">
                 <Calendar size={100} />
               </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-navy-900 text-white mt-32 py-20 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-16">
          <div className="col-span-2">
            <h2 className="text-4xl font-black mb-6">XRG<span className="text-red-600">NEWS</span></h2>
            <p className="text-navy-300 max-w-sm mb-8 font-medium">
              The premier news destination for the Khulna Division. Accuracy, integrity, and speed — focused on your community.
            </p>
            <div className="flex space-x-6">
              {['Facebook', 'Twitter', 'YouTube'].map(social => (
                <a key={social} href="#" className="w-12 h-12 border border-navy-700 rounded-2xl flex items-center justify-center hover:bg-white hover:text-navy-900 transition-all font-black text-[10px]">
                  {social[0]}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h5 className="font-black text-xs uppercase tracking-widest text-navy-400 mb-8">Districts</h5>
            <ul className="space-y-4 text-navy-100 font-bold text-sm">
              <li><a href="#" className="hover:text-red-500 transition-colors">খুলনা</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">যশোর</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">কুষ্টিয়া</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">সাতক্ষীরা</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-black text-xs uppercase tracking-widest text-navy-400 mb-8">Quick Links</h5>
            <ul className="space-y-4 text-navy-100 font-bold text-sm">
              <li><a href="#" className="hover:text-red-500 transition-colors">কৃষি ও চাষাবাদ</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">আঞ্চলিক শিক্ষা</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-20 pt-10 border-t border-navy-800 flex flex-col md:flex-row justify-between items-center text-navy-500 text-[10px] font-black uppercase tracking-widest">
          <p>© 2026 XRG NEWS. ALL RIGHTS RESERVED.</p>
          <p className="mt-4 md:mt-0">MADE FOR KHULNA DIVISION</p>
        </div>
      </footer>
    </div>
  );
}

function PostModal({ onClose, onSuccess, author }: { onClose: () => void, onSuccess: () => void, author: { id: string, name: string } }) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NewsCategory>('Regional');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createNewsArticle({
        title,
        summary,
        content,
        category,
        imageUrl,
        isFeatured,
        authorId: author.id,
        authorName: author.name
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to post news:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-navy-900/80 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        className="bg-white rounded-[2.5rem] w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-white/20"
      >
        <div className="p-8 border-b border-navy-50 flex justify-between items-center bg-navy-50/30">
          <h2 className="text-2xl font-black text-navy-900">Publish News</h2>
          <button onClick={onClose} className="p-2 hover:bg-navy-100 rounded-full transition-colors text-navy-400">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto no-scrollbar">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Headline</label>
              <input 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="নিউজ হেডলাইন এখানে দিন..."
                className="w-full px-6 py-4 bg-navy-50 border-none rounded-2xl focus:ring-2 focus:ring-navy-900 outline-none text-navy-900 font-bold transition-all placeholder:text-navy-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NewsCategory)}
                  className="w-full px-6 py-4 bg-navy-50 border-none rounded-2xl focus:ring-2 focus:ring-navy-900 outline-none font-bold text-navy-700 appearance-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{getCategoryName(cat)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Visual Heritage</label>
                <div className="relative">
                  <Image className="absolute left-6 top-5 text-navy-300" size={18} />
                  <input 
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Image URL..."
                    className="w-full pl-14 pr-6 py-4 bg-navy-50 border-none rounded-2xl focus:ring-2 focus:ring-navy-900 outline-none font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Synopsis</label>
              <textarea 
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                placeholder="সংক্ষিপ্ত বিবরণ..."
                className="w-full px-6 py-4 bg-navy-50 border-none rounded-2xl focus:ring-2 focus:ring-navy-900 outline-none font-medium resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-navy-400 uppercase tracking-widest mb-2">Full Story</label>
              <textarea 
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="বিস্তারিত সংবাদ..."
                className="w-full px-6 py-4 bg-navy-50 border-none rounded-2xl focus:ring-2 focus:ring-navy-900 outline-none font-medium"
              />
            </div>

            <div className="flex items-center group cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  id="isFeatured" 
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="peer h-6 w-6 opacity-0 absolute cursor-pointer"
                />
                <div className="h-6 w-6 bg-navy-100 rounded-md peer-checked:bg-red-600 transition-colors flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full scale-0 peer-checked:scale-100 transition-transform" />
                </div>
              </div>
              <label htmlFor="isFeatured" className="ml-4 text-xs font-black text-navy-600 uppercase tracking-widest cursor-pointer">Features on Homepage</label>
            </div>
          </div>

          <div className="pt-8 border-t border-navy-50 flex space-x-6">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-5 border-2 border-navy-100 rounded-2xl font-black text-xs uppercase tracking-widest text-navy-400 hover:bg-navy-50 transition-all"
            >
              Discard
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-5 bg-navy-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Live Publish'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function getCategoryName(cat: NewsCategory): string {
  const names: Record<string, string> = {
    'Regional': 'আঞ্চলিক',
    'Khulna': 'খুলনা',
    'Jashore': 'যশোর',
    'Kushtia': 'কুষ্টিয়া',
    'Satkhira': 'সাতক্ষীরা',
    'Bagerhat': 'বাগেরহাট',
    'Chuadanga': 'চুয়াডাঙ্গা',
    'Jhenaidah': 'ঝিনাইদহ',
    'Magura': 'মাগুরা',
    'Meherpur': 'মেহেরপুর',
    'Narail': 'নড়াইল',
    'Agriculture': 'কৃষি',
    'Economy': 'অর্থনীতি',
    'Education': 'শিক্ষা',
    'Sports': 'খেলাধুলা',
    'Events': 'ইভেন্ট',
    'Traffic': 'ট্রাফিক',
    'Weather': 'আবহাওয়া'
  };
  return names[cat] || cat;
}
