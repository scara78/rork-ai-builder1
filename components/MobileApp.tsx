import React from 'react';
import { 
  Search, 
  MapPin, 
  Star, 
  Utensils, 
  Beer, 
  Clapperboard, 
  Plane, 
  Users, 
  MessageCircle, 
  User, 
  Plus,
  Home,
  Bell
} from 'lucide-react';

const MobileApp: React.FC = () => {
  return (
    <div className="bg-white h-full w-full overflow-y-auto no-scrollbar pb-24 font-sans text-gray-800 antialiased selection:bg-rose-100">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#e11d48] to-[#f43f5e] text-white p-6 pt-16 rounded-b-[2.5rem] shadow-lg shadow-rose-500/20 relative z-10">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none">Best Friends</h1>
            <p className="text-rose-100 text-[11px] font-medium flex items-center gap-1 mt-1 opacity-90">
              <MapPin size={10} fill="currentColor" /> Tìm bạn đồng hành
            </p>
          </div>
          <div className="bg-white/20 p-1.5 px-3 rounded-full backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase">HCM</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]"></div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl flex items-center px-4 py-3 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] transform translate-y-2">
          <Search className="text-gray-400 mr-3" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm lời mời..." 
            className="bg-transparent outline-none text-[13px] text-gray-800 w-full placeholder-gray-400 font-medium"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 pt-10 pb-6">
        <div className="flex justify-between gap-3 overflow-x-auto no-scrollbar pb-4 -mx-5 px-5 snap-x">
          <CategoryItem icon={<Star size={16} fill="currentColor" />} label="Tất cả" active />
          <CategoryItem icon={<Utensils size={16} />} label="Đi ăn" />
          <CategoryItem icon={<Beer size={16} />} label="Đi nhậu" />
          <CategoryItem icon={<Clapperboard size={16} />} label="Xem phim" />
          <CategoryItem icon={<Plane size={16} />} label="Du lịch" />
        </div>
      </div>

      {/* Best Friends Section */}
      <div className="px-5 mb-8">
        <div className="flex justify-between items-end mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-amber-400 shadow-lg shadow-amber-400/30 text-white p-1 rounded-md">
              <Users size={12} fill="currentColor"/>
            </div>
            <h2 className="font-bold text-[16px] text-gray-900 leading-none">Best Friends</h2>
            <span className="bg-[#f43f5e] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">HOT</span>
          </div>
          <span className="text-[#f43f5e] text-[11px] font-bold cursor-pointer hover:underline">Xem tất cả &gt;</span>
        </div>
        
        <div className="bg-gray-50/50 rounded-2xl p-6 text-center border border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 py-8">
          <p className="text-gray-400 text-[12px] font-medium leading-relaxed max-w-[240px]">
              Chưa có Best Friend nào. Hãy đánh giá các CTV để họ xuất hiện ở đây!
          </p>
        </div>
      </div>

      {/* Suggested Locations */}
      <div className="pl-5 mb-8">
        <div className="flex justify-between items-end mb-4 pr-5">
          <div className="flex items-center gap-2">
            <span className="text-[#f43f5e]">
              <MapPin size={16} fill="currentColor" />
            </span>
            <h2 className="font-bold text-[16px] text-gray-900 leading-none">Gợi Ý Địa Điểm</h2>
          </div>
          <span className="text-[#f43f5e] text-[11px] font-bold cursor-pointer hover:underline">Xem tất cả &gt;</span>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-5">
          <MovieCard 
            title="Avatar: The Way of Water" 
            rating={4.8} 
            image="https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg"
            tag="Phim"
          />
          <MovieCard 
            title="Oppenheimer" 
            rating={4.9} 
            image="https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"
            tag="Phim"
          />
           <MovieCard 
            title="Dune: Part Two" 
            rating={4.7} 
            image="https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"
            tag="Phim"
          />
        </div>
      </div>

      {/* Newest Invites */}
      <div className="px-5 mb-28">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-[16px] text-gray-900">Lời mời mới nhất</h2>
          <span className="text-gray-400 text-[10px] font-bold bg-gray-100 px-2 py-1 rounded-full text-gray-500">4 lời mời</span>
        </div>

        <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.08)] border border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <span className="bg-rose-50 text-rose-500 text-[10px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1">
              <Utensils size={10} /> Đi ăn, uống cafe
            </span>
            <span className="bg-[#ecfdf5] text-[#059669] text-[11px] font-black px-3 py-1.5 rounded-full shadow-sm">500K</span>
          </div>
          <h3 className="font-bold text-gray-900 mb-2 text-[15px]">Thưởng thức BBQ Hàn Quốc</h3>
          <p className="text-gray-500 text-[13px] leading-relaxed mb-4 line-clamp-2">Mình muốn thử nhà hàng BBQ mới ở Quận 1, ai cùng đi không?</p>
          <div className="flex items-center gap-3 pt-3 border-t border-gray-50/50">
            <div className="relative">
                 <img src="https://i.pravatar.cc/150?img=32" className="w-9 h-9 rounded-full border border-white shadow-sm object-cover" alt="User" />
                 <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex flex-col">
                <span className="text-[12px] font-bold text-gray-900">Minh Anh</span>
                <span className="text-[10px] text-gray-400 font-medium">Vừa xong</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[88%] max-w-[340px] bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] flex justify-between items-center px-7 py-4 border border-white/50 z-50">
        <NavItem icon={<Home size={22} />} active />
        <NavItem icon={<Users size={22} />} />
        
        {/* FAB */}
        <div className="-mt-14 bg-gradient-to-br from-[#e11d48] to-[#f43f5e] text-white p-4 rounded-full shadow-[0_10px_25px_rgba(244,63,94,0.4)] border-[5px] border-gray-50 cursor-pointer hover:scale-105 transition-transform group">
          <Plus size={26} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300"/>
        </div>

        <NavItem icon={<MessageCircle size={22} />} />
        <NavItem icon={<User size={22} />} />
      </div>
    </div>
  );
};

const CategoryItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <div className="flex flex-col items-center gap-2 min-w-[68px] cursor-pointer snap-start group">
    <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shadow-sm transition-all duration-300 group-hover:-translate-y-1 ${active ? 'bg-gradient-to-br from-[#e11d48] to-[#f43f5e] text-white shadow-rose-500/30' : 'bg-white text-gray-400 border border-gray-50'}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-[#e11d48]' : 'text-gray-400 group-hover:text-gray-600'}`}>{label}</span>
  </div>
);

const MovieCard = ({ title, rating, image, tag }: { title: string, rating: number, image: string, tag: string }) => (
  <div className="min-w-[140px] h-[210px] relative rounded-2xl overflow-hidden shadow-md group cursor-pointer bg-gray-100">
    <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out opacity-90 group-hover:opacity-100" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3.5">
      <div className="flex items-center gap-1 text-amber-400 text-[10px] font-black mb-1.5 bg-black/40 backdrop-blur-md self-start px-2 py-0.5 rounded-md border border-white/10">
        <Star size={10} fill="currentColor" /> {rating}
      </div>
      <h3 className="text-white font-bold text-[13px] leading-snug mb-0.5 line-clamp-2">{title}</h3>
      <span className="text-gray-300/80 text-[10px] font-medium">{tag}</span>
    </div>
  </div>
);

const NavItem = ({ icon, active = false }: { icon: React.ReactNode, active?: boolean }) => (
  <button className={`${active ? 'text-[#e11d48]' : 'text-gray-300 hover:text-gray-400'} transition-colors relative p-1`}>
    {icon}
    {active && <span className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#e11d48] rounded-full"></span>}
  </button>
);

export default MobileApp;