import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Download, X, Search, Sparkles } from 'lucide-react';

type StoreFilter = {
  id: string;
  name: string;
  author: string;
  thumbnailUrl?: string; // Optional for Jeeliz
  glbUrl?: string; // Optional for Jeeliz
  offsetY?: number;
  offsetZ?: number;
  scale?: number;
  isBuiltIn?: boolean; // Tag to differentiate built-in Jeeliz
};

// Generate a random stable image based on the filter name using picsum
const generateThumbnail = (name: string) => `https://picsum.photos/seed/${encodeURIComponent(name)}/400/400`;

type Props = {
  onClose: () => void;
};

export default function FilterStoreModal({ onClose }: Props) {
  const [filters, setFilters] = useState<StoreFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const updateSettings = useStore((state) => state.updateSettings);

  useEffect(() => {

    const builtInFilters: StoreFilter[] = [
      { id: 'angel_halo', name: 'Angel Halo', author: 'Meemo', isBuiltIn: true, thumbnailUrl: generateThumbnail('angel') },
      { id: 'devil_horns', name: 'Devil Horns', author: 'Meemo', isBuiltIn: true, thumbnailUrl: generateThumbnail('devil') },
      { id: 'anonymous_mask', name: 'Anonymous', author: 'Meemo', isBuiltIn: true, thumbnailUrl: generateThumbnail('mask') },
      { id: 'clown_nose', name: 'Clown Nose', author: 'Meemo', isBuiltIn: true, thumbnailUrl: generateThumbnail('clown') },
      { id: 'harry_potter', name: 'Wizard Glasses', author: 'Meemo', isBuiltIn: true, thumbnailUrl: generateThumbnail('magic') },
      { id: 'bunny_ears', name: 'Bunny Ears', author: 'Meemo', isBuiltIn: true, thumbnailUrl: generateThumbnail('bunny') },
      { id: 'heart_eyes', name: 'Heart Eyes', author: 'Meemo', isBuiltIn: true, thumbnailUrl: generateThumbnail('heart') },
      { id: 'pirate_patch', name: 'Pirate Patch', author: 'Meemo', isBuiltIn: true, thumbnailUrl: generateThumbnail('pirate') },
      { id: 'mustache', name: 'Gentleman Mustache', author: 'Meemo', isBuiltIn: true, thumbnailUrl: generateThumbnail('mustache') },
      { id: 'blush', name: 'Anime Blush', author: 'Meemo', isBuiltIn: true, thumbnailUrl: generateThumbnail('blush') },
      { id: 'nerd_glasses', name: 'Nerd Glasses', author: 'Meemo', isBuiltIn: true, thumbnailUrl: generateThumbnail('nerd') },
      { id: 'cat_whiskers', name: 'Cat Whiskers', author: 'Meemo', isBuiltIn: true, thumbnailUrl: generateThumbnail('whiskers') },
      { id: 'star_halo', name: 'Star Halo', author: 'Meemo', isBuiltIn: true, thumbnailUrl: generateThumbnail('star') },
    ];

    // Fetch the JSON database for dynamic community filters
    fetch('/database/filters.json')
      .then(res => res.json())
      .then(data => {
        setFilters([...builtInFilters, ...data]);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load filter store database:', err);
        // Even if fetch fails, show built-in filters!
        setFilters(builtInFilters);
        setLoading(false);
      });
  }, []);

  const handleUseFilter = (filter: StoreFilter) => {
    if (filter.isBuiltIn) {
      // Use standard Jeeliz filter
      updateSettings({ 
        selectedARFilter: filter.id
      });
    } else {
      // Load the dynamic filter in the CameraView
      updateSettings({ 
        selectedARFilter: 'jeeliz_dynamic_gltf',
        customGltfUrl: filter.glbUrl || ''
      });
    }
    onClose();
  };

  const filteredFilters = filters.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white border border-gray-100 rounded-[2rem] flex flex-col overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff9a9e] to-[#fecfef] flex items-center justify-center shadow-sm">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">AR Filter Store</h2>
              <p className="text-sm text-slate-500 font-medium">Download community 3D models</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search filters or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 pl-12 pr-4 py-3.5 rounded-full outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-4">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-slate-400 font-medium animate-pulse">Connecting to database...</p>
            </div>
          ) : filteredFilters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-slate-500 text-lg mb-2 font-semibold">No filters found.</p>
              <p className="text-slate-400 text-sm">Try a different search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFilters.map((filter) => (
                <div key={filter.id} className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-blue-300 transition-all hover:-translate-y-1 shadow-sm hover:shadow-lg">
                  {/* Thumbnail */}
                  <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {filter.thumbnailUrl ? (
                      <img 
                        src={filter.thumbnailUrl} 
                        alt={filter.name}
                        className="w-full h-full object-cover transition-opacity duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.classList.add('fallback-bg');
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
                        <Sparkles className="w-12 h-12 text-yellow-400 mb-2 opacity-50" />
                        <h4 className="text-xl font-black text-slate-600 leading-tight">{filter.name}</h4>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80 z-10 pointer-events-none" />
                    
                    {/* Badge */}
                    <div className="absolute top-4 right-4 z-20">
                      {filter.isBuiltIn ? (
                        <span className="px-3 py-1.5 bg-white/90 text-slate-800 text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm">Built-In</span>
                      ) : (
                        <span className="px-3 py-1.5 bg-blue-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm">Community</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-5 relative">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{filter.name}</h3>
                    <p className="text-sm text-slate-500 mb-5 flex items-center gap-1.5">
                      By <span className="text-slate-700 font-semibold">{filter.author}</span>
                    </p>
                    
                    <button 
                      onClick={() => handleUseFilter(filter)}
                      className="w-full py-3 px-4 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      Download & Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
