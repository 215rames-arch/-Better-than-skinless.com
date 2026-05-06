import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  ShoppingBag, 
  Menu, 
  Sparkles, 
  ChevronRight, 
  ArrowRight,
  X,
  Star,
  Camera,
  RefreshCw,
  Share2,
  Facebook,
  Twitter,
  Instagram,
  Heart,
  Link,
  ArrowLeft,
  MoreVertical,
  Clock,
  CheckCircle2
} from "lucide-react";
import { getSkinAdvice } from "./services/geminiService.ts";

interface Order {
  id: string;
  productName: string;
  price: string;
  date: string;
  status: "Shipped" | "Processing" | "Delivered";
  image: string;
}

const COLLECTIONS = [
  { id: "all", name: "The Collection" },
  { id: "vibe", name: "Vibe (Gen-Z)" },
  { id: "aura", name: "Aura (Premium)" },
  { id: "botanica", name: "Botanica (Natural)" }
];

const PRODUCTS = [
  // Vibe Collection (GlowUp Girls)
  {
    id: 1,
    name: "Vitamin C Face Cream",
    collection: "vibe",
    category: "GlowUp Essential",
    price: "₹499",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop",
    rating: 5
  },
  {
    id: 2,
    name: "Hydrating Face Serum",
    collection: "vibe",
    category: "Dewy Glow",
    price: "₹799",
    image: "https://images.unsplash.com/photo-1590439474866-4c9f13904944?q=80&w=800&auto=format&fit=crop",
    rating: 4
  },
  {
    id: 3,
    name: "SkinVibe Jelly Mask",
    collection: "vibe",
    category: "Skin Recovery",
    price: "₹599",
    image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=800&auto=format&fit=crop",
    rating: 5
  },
  // Aura Collection
  {
    id: 4,
    name: "Velvet Aura Cream",
    collection: "aura",
    category: "Luxury Night Repair",
    price: "₹8,900",
    image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=800&auto=format&fit=crop",
    rating: 5
  },
  {
    id: 5,
    name: "SilkSkinly Oil",
    collection: "aura",
    category: "Body Lustre",
    price: "₹6,500",
    image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=800&auto=format&fit=crop",
    rating: 5
  },
  {
    id: 6,
    name: "Lumina Luxe Elixir",
    collection: "aura",
    category: "Precision Serum",
    price: "₹12,400",
    image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=800&auto=format&fit=crop",
    rating: 5
  },
  // Botanica Collection
  {
    id: 7,
    name: "Botanica Bliss Balm",
    collection: "botanica",
    category: "Herbal Soothe",
    price: "₹1,200",
    image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=800&auto=format&fit=crop",
    rating: 4
  },
  {
    id: 8,
    name: "BareBloom Cleanser",
    collection: "botanica",
    category: "Floral Wash",
    price: "₹850",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop",
    rating: 5
  },
  {
    id: 9,
    name: "FloraFresh Toner",
    collection: "botanica",
    category: "Plant Essence",
    price: "₹750",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop",
    rating: 5
  }
];

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [isConsultantOpen, setConsultantOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<{product: typeof PRODUCTS[0], quantity: number}[]>([]);
  const [consultationText, setConsultationText] = useState("");
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [activeCollection, setActiveCollection] = useState("all");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<typeof PRODUCTS[0] | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"summary" | "shipping" | "success">("summary");
  const [shippingData, setShippingData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    phone: ""
  });
  
  // Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [scannerStream, setScannerStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const filteredProducts = PRODUCTS.filter(p => {
    const matchesCollection = activeCollection === "all" || p.collection === activeCollection;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCollection && matchesSearch;
  });

  const addToCart = (product: typeof PRODUCTS[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => {
    const price = parseInt(item.product.price.replace(/[^\d]/g, ""));
    return sum + (price * item.quantity);
  }, 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stopScanner = () => {
    if (scannerStream) {
      scannerStream.getTracks().forEach(track => track.stop());
      setScannerStream(null);
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setScannerStream(stream);
      setIsScanning(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Artificial scan delay
      setTimeout(async () => {
        setLoadingAdvice(true);
        const result = await getSkinAdvice(consultationText || "I've just scanned my skin, detect if it's oily, dry, or sensitive and suggest a specific ingredient.");
        setAdvice(result);
        setLoadingAdvice(false);
        stopScanner();
      }, 4000);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Please allow camera access for the AI Skin Scan.");
    }
  };

  const handleShare = async (e: React.MouseEvent, product: typeof PRODUCTS[0]) => {
    e.stopPropagation();
    const shareData = {
      title: product.name,
      text: `Discover the ${product.name} from Better than Skinless.com! ${product.category}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Shared cancelled:", err);
      }
    } else {
      // Fallback: Copy to clipboard or show social links
      const dummy = document.createElement("input");
      document.body.appendChild(dummy);
      dummy.value = window.location.href;
      dummy.select();
      document.execCommand("copy");
      document.body.removeChild(dummy);
      alert("Link copied to clipboard! You can now share it on Instagram or Facebook.");
    }
  };

  const toggleWishlist = (e: React.MouseEvent, productId: number) => {
    e.stopPropagation();
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const handlePayment = (product: typeof PRODUCTS[0]) => {
    setCheckoutProduct(product);
    setCheckoutStep("summary");
  };

  const closeModal = () => {
    stopScanner();
    setConsultantOpen(false);
    setCheckoutProduct(null);
    setAdvice(null);
    setConsultationText("");
  };

  const handleConsult = async () => {
    if (!consultationText.trim()) return;
    setLoadingAdvice(true);
    const result = await getSkinAdvice(consultationText);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  const cancelOrder = (orderId: string) => {
    if (window.confirm("Are you sure you want to withdraw from this skin ritual?")) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  return (
    <div className="min-h-screen selection:bg-glow-accent selection:text-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 px-6 py-4 md:px-12 ${scrolled ? "bg-white/80 backdrop-blur-lg border-b border-glow-header/10 py-3" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="md:hidden">
            <Menu className="w-6 h-6" />
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] font-medium">
            <a href="#" className="glow-underline">Home</a>
            <a href="#" className="glow-underline">Skin Care</a>
            <a href="#" className="glow-underline">Best Sellers</a>
          </div>

          <h1 className="text-2xl md:text-3xl font-serif tracking-tighter leading-none italic font-semibold">
            Better than <span className="text-glow-accent not-italic">Skinless.com</span>
          </h1>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsWishlistOpen(true)}
              className="relative hover:text-glow-accent transition-colors hidden sm:block"
            >
              <Heart className={`w-5 h-5 ${wishlist.length > 0 ? "fill-glow-accent text-glow-accent" : ""}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-luxury-ink text-white text-[8px] flex items-center justify-center rounded-full font-bold">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => alert("Registration system coming soon for radiant members!")}
              className="hidden lg:block text-[9px] uppercase tracking-[0.2em] font-bold border border-luxury-ink/10 px-4 py-2 rounded-full hover:bg-luxury-ink hover:text-white transition-all"
            >
              Registered Member
            </button>
            <button 
              onClick={() => alert("Join our ritual! Sign up logic will be active shortly.")}
              className="hidden lg:block text-[9px] uppercase tracking-[0.2em] font-bold bg-glow-accent text-white px-4 py-2 rounded-full hover:bg-glow-header shadow-lg shadow-glow-accent/20 transition-all"
            >
              Sign Up
            </button>
            {/* Search Bar */}
            <AnimatePresence>
              {isSearchVisible && (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Search rituals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-glow-hero/50 border border-glow-accent/20 px-3 py-1.5 rounded-full text-[10px] w-full focus:outline-none focus:ring-1 focus:ring-glow-accent italic"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className={`hidden md:block transition-colors ${isSearchVisible ? "text-glow-accent" : "hover:text-glow-header"}`}
            >
              {isSearchVisible ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative hover:text-glow-header transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-glow-header text-white text-[8px] flex items-center justify-center rounded-full font-bold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* More Menu */}
            <div className="relative">
              <button 
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="hover:text-glow-accent transition-colors p-2 -mr-2 flex items-center justify-center rounded-full hover:bg-black/5"
                aria-label="More Options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {isMoreMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-0" onClick={() => setIsMoreMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-56 bg-white shadow-2xl shadow-luxury-ink/10 rounded-2xl overflow-hidden border border-glow-header/10 z-10"
                    >
                      <button 
                        onClick={() => { setIsMoreMenuOpen(false); setIsOrderHistoryOpen(true); }}
                        className="w-full text-left px-6 py-4 text-[10px] uppercase tracking-[0.15em] font-bold hover:bg-glow-hero/30 transition-all flex items-center gap-3 border-b border-glow-header/5"
                      >
                        <Clock className="w-4 h-4 text-glow-accent" />
                        Order History
                      </button>
                      <button 
                        onClick={() => { setIsMoreMenuOpen(false); setIsWishlistOpen(true); }}
                        className="w-full text-left px-6 py-4 text-[10px] uppercase tracking-[0.15em] font-bold hover:bg-glow-hero/30 transition-all flex items-center gap-3 md:hidden"
                      >
                        <Heart className="w-4 h-4 text-glow-accent" />
                        Wishlist
                      </button>
                      <div className="px-6 py-4 bg-glow-hero/10">
                        <p className="text-[8px] uppercase tracking-widest font-bold text-luxury-ink/40 mb-2">Member Perks</p>
                        <button className="text-[9px] font-bold text-glow-accent hover:underline mb-1 block">Skin Ritual Guide</button>
                        <button className="text-[9px] font-bold text-glow-accent hover:underline block">Exclusive Aura Access</button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden bg-glow-hero">
        <div className="absolute inset-0 z-0 text-luxury-ink/5 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=2000&auto=format&fit=crop" 
            alt="Hero Background"
            className="w-full h-full object-cover opacity-70 mix-blend-multiply transition-transform duration-[3s] hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-glow-hero/90 via-glow-hero/30 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-white to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <span className="text-[11px] uppercase tracking-[0.4em] font-semibold text-glow-accent mb-6 block">
              Better than Skinless.com
            </span>
            <h2 className="text-5xl md:text-8xl font-serif italic mb-8 leading-[1.1]">
              Confidence in <br />
              <span className="text-glow-accent not-italic font-bold">Every Layer</span>
            </h2>
            <p className="text-lg text-luxury-ink/70 font-light max-w-md mb-10 leading-relaxed">
              Sabse behtareen aur chune hue beauty products ek hi jagah par. Discover your positive change with our curated collections.
            </p>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => handlePayment(PRODUCTS[0])}
                className="px-8 py-4 bg-glow-accent text-white rounded-full flex items-center gap-2 hover:bg-glow-header transition-all duration-300 transform hover:scale-105 group shadow-lg shadow-glow-accent/20"
              >
                Buy Now
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => setConsultantOpen(true)}
                className="group flex items-center gap-2 text-sm font-medium tracking-wide uppercase"
              >
                AI Skin Guide
                <span className="w-10 h-px bg-luxury-ink/20 group-hover:w-16 group-hover:bg-glow-accent transition-all"></span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-12">
          <div>
            <h3 className="text-4xl md:text-5xl mb-6 italic">Signature Rituals</h3>
            <div className="flex flex-wrap gap-4 md:gap-8">
              {COLLECTIONS.map(col => (
                <button
                  key={col.id}
                  onClick={() => setActiveCollection(col.id)}
                  className={`text-[10px] uppercase tracking-[0.2em] font-bold transition-all relative pb-2 ${activeCollection === col.id ? "text-glow-accent" : "text-luxury-ink/40 hover:text-luxury-ink"}`}
                >
                  {col.name}
                  {activeCollection === col.id && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-px bg-glow-accent" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <a href="#" className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-glow-accent hover:gap-4 transition-all">
            Explore All <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-x-16 md:gap-y-24"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="group cursor-pointer glow-card"
              >
                <div className="aspect-[3/4] overflow-hidden mb-6 bg-white relative">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-luxury-ink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Share Menu */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500">
                    <button 
                      onClick={(e) => toggleWishlist(e, product.id)}
                      className={`p-3 backdrop-blur-sm rounded-full shadow-lg transition-all group/wishlist ${wishlist.includes(product.id) ? "bg-glow-accent text-white" : "bg-white/90 hover:bg-glow-accent hover:text-white"}`}
                    >
                      <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? "fill-current" : ""}`} />
                      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-luxury-ink text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover/wishlist:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">
                        {wishlist.includes(product.id) ? "Saved" : "Save"}
                      </span>
                    </button>
                    <button 
                      onClick={(e) => handleShare(e, product)}
                      className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-glow-accent hover:text-white transition-all group/share"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-luxury-ink text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover/share:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">Share</span>
                    </button>
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-[#1877F2] hover:text-white transition-all"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                    <a 
                      href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(product.image)}&description=${encodeURIComponent(`Check out the ${product.name} at Better than Skinless.com!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-[#E60023] hover:text-white transition-all group/pin"
                    >
                      <Link className="w-4 h-4" />
                      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-luxury-ink text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">Pin</span>
                    </a>
                    <button 
                      onClick={(e) => handleShare(e, product)}
                      className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-[#E4405F] hover:text-white transition-all"
                    >
                      <Instagram className="w-4 h-4" />
                    </button>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    className="absolute bottom-6 left-6 right-6 bg-white py-4 text-[9px] uppercase tracking-[0.2em] font-black opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500 shadow-xl"
                  >
                    Add to Ritual
                  </button>
                </div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-glow-accent font-bold">{product.category}</span>
                  <div className="flex gap-0.5">
                    {[...Array(product.rating)].map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-glow-accent text-glow-accent" />
                    ))}
                  </div>
                </div>
                <h4 className="text-2xl font-serif mb-2 group-hover:italic transition-all duration-300">{product.name}</h4>
                <p className="font-serif italic text-glow-accent">{product.price}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Editorial Journal Section */}
      <section className="bg-white py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16 flex justify-between items-end">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-glow-accent font-bold mb-4 block">The Journal</span>
            <h3 className="text-5xl font-serif italic">Radiance Stories</h3>
          </div>
        </div>
        
        <div className="flex gap-8 px-6 md:px-12 overflow-x-auto pb-12 no-scrollbar scroll-smooth">
          {[
            { title: "The Midnight Ritual", desc: "How to maximize cell turnover while you dream.", tag: "Routine" },
            { title: "Botanical Purity", desc: "The science behind our cold-pressed flora extracts.", tag: "Science" },
            { title: "Dewy Mornings", desc: "Gen-Z trends: Why the 'Glazed' look is here to stay.", tag: "Trends" },
            { title: "Golden Hour Glow", desc: "Capturing light with our Lumina Luxe highlights.", tag: "Artistry" }
          ].map((item, i) => (
            <div key={i} className="flex-shrink-0 w-[300px] md:w-[400px]">
              <div className="aspect-[16/10] bg-luxury-cream mb-6 overflow-hidden">
                <img 
                  src={`https://images.unsplash.com/photo-${1556228578 + i}-0d85b1a4d571?q=80&w=800&auto=format&fit=crop`}
                  className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0"
                  alt={item.title}
                />
              </div>
              <span className="text-[9px] uppercase tracking-widest text-glow-accent font-bold">{item.tag}</span>
              <h4 className="text-xl font-serif italic mt-2 mb-3">{item.title}</h4>
              <p className="text-sm text-luxury-ink/60 font-light pr-8">{item.desc}</p>
              <button className="mt-4 text-[10px] uppercase tracking-widest font-bold border-b border-glow-accent pb-1 hover:text-glow-accent transition-colors">Read More</button>
            </div>
          ))}
        </div>
      </section>

      {/* AI Consultant Modal */}
      <AnimatePresence>
        {isConsultantOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConsultantOpen(false)}
              className="absolute inset-0 bg-luxury-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-luxury-cream w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 md:p-12">
                <button 
                  onClick={closeModal}
                  className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-colors z-[70]"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-luxury-ink rounded-full flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif italic">GlowUp AI Scan</h3>
                    <p className="text-[10px] uppercase tracking-widest text-glow-accent">Personalized Consultation</p>
                  </div>
                </div>

                {!advice ? (
                  <div className="space-y-6">
                    {/* Scanner Container */}
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-inner group">
                      {isScanning ? (
                        <>
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="scanner-video h-full w-full object-cover"
                          />
                          <div className="scan-line"></div>
                          <div className="absolute top-4 left-4 flex gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-[8px] text-white uppercase tracking-widest font-bold bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">Scanning Skin Features...</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-4">
                          <Camera className="w-12 h-12 stroke-[1px]" />
                          <p className="text-[10px] uppercase tracking-[0.2em]">Camera Feed Inactive</p>
                        </div>
                      )}
                    </div>

                    {!isScanning ? (
                      <div className="space-y-4">
                        <textarea 
                          value={consultationText}
                          onChange={(e) => setConsultationText(e.target.value)}
                          placeholder="Tell us about your skin concerns (optional if scanning)..."
                          className="w-full h-24 p-4 bg-white border border-glow-accent/20 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-glow-accent/50 transition-all font-light text-sm"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={startScanner}
                            className="py-4 bg-luxury-ink text-white rounded-xl font-semibold tracking-wide flex items-center justify-center gap-2 hover:bg-glow-accent transition-all group"
                          >
                            <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            AI Scan
                          </button>
                          <button 
                            onClick={handleConsult}
                            disabled={loadingAdvice || !consultationText.trim()}
                            className="py-4 bg-glow-accent text-white rounded-xl font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-glow-header transition-all group"
                          >
                            {loadingAdvice ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                            Get Ritual
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-6 text-center">
                        <p className="text-sm italic text-luxury-ink/60 mb-2">Keep your face within the frame...</p>
                        <div className="flex gap-2">
                          {[0, 1, 2].map((i) => (
                            <motion.div 
                              key={i}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                              className="w-1.5 h-1.5 bg-glow-accent rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="bg-white p-6 rounded-2xl border border-glow-accent/30 mb-8 italic text-luxury-ink/80 leading-relaxed relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles className="w-12 h-12 text-glow-accent" />
                      </div>
                      <b className="text-glow-accent not-italic block mb-2 uppercase tracking-widest text-[10px]">Diagnosis Result:</b>
                      "{advice}"
                    </div>
                    <button 
                      onClick={() => {
                        setAdvice(null);
                        setConsultationText("");
                      }}
                      className="text-xs uppercase tracking-widest font-bold text-glow-accent hover:text-luxury-ink transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-3 h-3" />
                      New Consultation
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-luxury-ink text-white py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-3xl font-serif italic mb-6">Better than Skinless.com</h2>
            <p className="text-white/50 max-w-sm mb-8 leading-relaxed">
              The original skin sanctuary. Curating the world's most effective rituals for those who demand excellence.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs uppercase tracking-[0.3em] hover:text-glow-accent transition-colors">Instagram</a>
              <a href="#" className="text-xs uppercase tracking-[0.3em] hover:text-glow-accent transition-colors">Journal</a>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-glow-accent mb-8">Concierge</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Skin Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Store Locator</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-glow-accent mb-8">Newsletter</h4>
            <p className="text-xs text-white/50 mb-4">Join our inner circle for exclusive rituals.</p>
            <div className="flex border-b border-white/20 py-2">
              <input type="email" placeholder="Email Address" className="bg-transparent text-xs w-full focus:outline-none" />
              <button className="text-xs uppercase tracking-widest font-bold">Join</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 text-[10px] text-white/30 uppercase tracking-widest text-center">
          &copy; {new Date().getFullYear()} Better than Skinless.com | The Original Sanctuary
        </div>
      </footer>

      {/* Checkout / Payment Modal */}
      <AnimatePresence>
        {checkoutProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCheckoutProduct(null)}
              className="absolute inset-0 bg-luxury-ink/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
              <div className="w-full md:w-5/12 bg-glow-hero p-8 flex flex-col justify-between border-r border-glow-header/10">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-glow-accent font-bold mb-4 block">Order Summary</span>
                  <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg mb-4">
                    <img src={checkoutProduct.image} className="w-full h-full object-cover" alt={checkoutProduct.name} />
                  </div>
                  <h3 className="text-xl font-serif mb-1">{checkoutProduct.name}</h3>
                  <p className="text-sm text-luxury-ink/60 mb-2">{checkoutProduct.category}</p>
                </div>
                <div>
                  <div className="flex justify-between items-center py-4 border-t border-glow-header/20">
                    <span className="text-xs uppercase tracking-widest font-bold">Total</span>
                    <span className="text-xl font-serif text-glow-accent">{checkoutProduct.price}</span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-7/12 p-8 md:p-10 relative">
                <button 
                  onClick={() => setCheckoutProduct(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <h3 className="text-2xl font-serif italic mb-6">
                  {checkoutStep === "summary" && "Selection Review"}
                  {checkoutStep === "shipping" && "The Destination"}
                  {checkoutStep === "success" && "Ritual Confirmed"}
                </h3>
                
                {checkoutStep === "summary" && (
                  <div className="space-y-6">
                    <p className="text-sm text-luxury-ink/60 leading-relaxed">
                      You are about to start your skin ritual with the {checkoutProduct.name}. This essential is curated specifically for {checkoutProduct.category}.
                    </p>
                    <div className="flex flex-col gap-4">
                      <button 
                        onClick={() => setCheckoutStep("shipping")}
                        className="w-full py-4 bg-glow-accent text-white rounded-xl font-semibold tracking-wide hover:bg-glow-header transition-all flex items-center justify-center gap-2"
                      >
                        Enter Shipping Details
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setCheckoutProduct(null)}
                        className="text-xs uppercase tracking-widest font-bold text-luxury-ink/40 hover:text-luxury-ink transition-colors"
                      >
                        Continue Browsing
                      </button>
                    </div>
                  </div>
                )}

                {checkoutStep === "shipping" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-luxury-ink/60">Full Name</label>
                        <input 
                          type="text" 
                          placeholder="Recipient's Name"
                          className="w-full p-2.5 bg-glow-hero/30 border border-glow-header/10 rounded-xl focus:ring-1 focus:ring-glow-accent outline-none text-sm"
                          value={shippingData.name}
                          onChange={(e) => setShippingData({...shippingData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-luxury-ink/60">Street Address</label>
                        <input 
                          type="text" 
                          placeholder="House No, Street, Area"
                          className="w-full p-2.5 bg-glow-hero/30 border border-glow-header/10 rounded-xl focus:ring-1 focus:ring-glow-accent outline-none text-sm"
                          value={shippingData.street}
                          onChange={(e) => setShippingData({...shippingData, street: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest font-bold text-luxury-ink/60">City</label>
                          <input 
                            type="text" 
                            placeholder="City"
                            className="w-full p-2.5 bg-glow-hero/30 border border-glow-header/10 rounded-xl focus:ring-1 focus:ring-glow-accent outline-none text-sm"
                            value={shippingData.city}
                            onChange={(e) => setShippingData({...shippingData, city: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest font-bold text-luxury-ink/60">State</label>
                          <input 
                            type="text" 
                            placeholder="State/Province"
                            className="w-full p-2.5 bg-glow-hero/30 border border-glow-header/10 rounded-xl focus:ring-1 focus:ring-glow-accent outline-none text-sm"
                            value={shippingData.state}
                            onChange={(e) => setShippingData({...shippingData, state: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest font-bold text-luxury-ink/60">Pin Code</label>
                          <input 
                            type="text" 
                            placeholder="6-digit code"
                            className="w-full p-2.5 bg-glow-hero/30 border border-glow-header/10 rounded-xl focus:ring-1 focus:ring-glow-accent outline-none text-sm"
                            value={shippingData.pincode}
                            onChange={(e) => setShippingData({...shippingData, pincode: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest font-bold text-luxury-ink/60">Phone</label>
                          <input 
                            type="text" 
                            placeholder="Mobile Number"
                            className="w-full p-2.5 bg-glow-hero/30 border border-glow-header/10 rounded-xl focus:ring-1 focus:ring-glow-accent outline-none text-sm"
                            value={shippingData.phone}
                            onChange={(e) => setShippingData({...shippingData, phone: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button 
                        onClick={() => setCheckoutStep("summary")}
                        className="flex-1 py-3 border border-luxury-ink/10 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-black/5 transition-all"
                      >
                        Back
                      </button>
                      <div className="flex-1 flex flex-col gap-2">
                        <button 
                          disabled={!shippingData.name || !shippingData.street || !shippingData.city || !shippingData.state || !shippingData.pincode || !shippingData.phone}
                          onClick={() => {
                            if (checkoutProduct) {
                              const newOrder: Order = {
                                id: `GLOW-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                                productName: checkoutProduct.name,
                                price: checkoutProduct.price,
                                date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                                status: "Processing",
                                image: checkoutProduct.image
                              };
                              setOrders([newOrder, ...orders]);
                            }
                            setCheckoutStep("success");
                          }}
                          className="w-full py-3 bg-glow-accent text-white rounded-xl font-semibold tracking-wide hover:bg-glow-header transition-all shadow-lg shadow-glow-accent/20 disabled:opacity-50"
                        >
                          Complete Order
                        </button>
                        <span className="text-[8px] text-center uppercase tracking-widest text-luxury-ink/40 font-bold">
                          Cash on Delivery Only
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === "success" && (
                  <div className="space-y-6 py-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-glow-accent/10 rounded-full flex items-center justify-center text-glow-accent mb-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", damping: 12 }}
                        >
                           <Sparkles className="w-8 h-8" />
                        </motion.div>
                      </div>
                      <h4 className="text-2xl font-serif italic mb-2">Order Confirmed!</h4>
                      <p className="text-sm text-luxury-ink/60 leading-relaxed max-w-[320px]">
                        Your skin ritual with the <span className="text-luxury-ink font-semibold">{checkoutProduct?.name}</span> has been scheduled.
                      </p>
                    </div>

                    <div className="bg-glow-hero/30 rounded-2xl p-6 border border-glow-header/10 space-y-4">
                      <div className="flex justify-between items-start border-b border-glow-header/10 pb-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-luxury-ink/40 mb-1">Delivering To</p>
                          <p className="text-xs font-semibold">{shippingData.name}</p>
                          <p className="text-[11px] text-luxury-ink/60 leading-tight">
                            {shippingData.street}, {shippingData.city}<br />
                            {shippingData.state} - {shippingData.pincode}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest font-bold text-luxury-ink/40 mb-1">Estimated Arrival</p>
                          <p className="text-xs font-bold text-glow-accent">3-5 Business Days</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-luxury-ink/60 italic font-serif">Total Amount (COD)</span>
                        <span className="font-bold text-glow-accent text-lg">{checkoutProduct?.price}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] text-center text-luxury-ink/40 uppercase tracking-[0.2em] font-bold">
                        A confirmation SMS has been sent to {shippingData.phone}
                      </p>
                      <button 
                        onClick={() => setCheckoutProduct(null)}
                        className="w-full py-4 bg-luxury-ink text-white rounded-xl font-semibold tracking-wide hover:bg-glow-accent transition-all shadow-xl shadow-luxury-ink/10"
                      >
                        Step Back into the Store
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[70] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-luxury-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-glow-header/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-glow-accent" />
                  <h2 className="text-2xl font-serif italic">Your Bag</h2>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-glow-hero rounded-full flex items-center justify-center text-luxury-ink/20">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-lg font-serif italic mb-1">Your bag is empty...</p>
                      <p className="text-sm text-luxury-ink/40 uppercase tracking-widest font-bold">Start your skin journey today</p>
                    </div>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="text-xs text-glow-accent font-bold uppercase tracking-widest border-b border-glow-accent pb-1"
                    >
                      Browse Featured Rituals
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map(item => (
                      <motion.div 
                        layout
                        key={item.product.id}
                        className="flex gap-4 group"
                      >
                        <div className="w-24 h-24 bg-glow-hero rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                          <img src={item.product.image} className="w-full h-full object-cover" alt={item.product.name} />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-sm font-serif">{item.product.name}</h3>
                            <button onClick={() => removeFromCart(item.product.id)}>
                              <X className="w-3 h-3 text-luxury-ink/30 hover:text-red-500" />
                            </button>
                          </div>
                          <p className="text-[10px] text-luxury-ink/40 uppercase tracking-widest font-bold mb-3">{item.product.category}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 border border-glow-header/10 rounded-lg px-2 py-1">
                              <button onClick={() => updateQuantity(item.product.id, -1)} className="text-xs hover:text-glow-accent">-</button>
                              <span className="text-[10px] font-bold w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, 1)} className="text-xs hover:text-glow-accent">+</button>
                            </div>
                            <span className="text-sm font-bold text-glow-accent">₹{(parseInt(item.product.price.replace(/[^\d]/g, "")) * item.quantity).toLocaleString()}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              
              {cart.length > 0 && (
                <div className="p-8 bg-glow-hero/30 border-t border-glow-header/10 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs uppercase tracking-widest font-bold text-luxury-ink/40">
                      <span>Subtotal</span>
                      <span>₹{cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs uppercase tracking-widest font-bold text-luxury-ink/40">
                      <span>Shipping</span>
                      <span className="text-green-600">Complimentary</span>
                    </div>
                    <div className="flex justify-between text-lg font-serif italic pt-2 border-t border-glow-header/10">
                      <span>Total Offering</span>
                      <span className="text-glow-accent not-italic font-bold">₹{cartTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      // Currently we checkout the first product for simplicity, 
                      // but in a real app we'd process the whole cart.
                      setIsCartOpen(false);
                      handlePayment(cart[0].product);
                    }}
                    className="w-full py-4 bg-glow-accent text-white rounded-xl font-semibold tracking-wide hover:bg-glow-header transition-all shadow-lg shadow-glow-accent/20"
                  >
                    Proceed to Sanctuary
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isWishlistOpen && (
          <div className="fixed inset-0 z-[70] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWishlistOpen(false)}
              className="absolute inset-0 bg-luxury-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-glow-header/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-glow-accent fill-glow-accent" />
                  <h2 className="text-2xl font-serif italic">Your Rituals</h2>
                </div>
                <button 
                  onClick={() => setIsWishlistOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {wishlist.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-glow-hero rounded-full flex items-center justify-center text-luxury-ink/20">
                      <Heart className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-lg font-serif italic mb-1">Mirror, mirror...</p>
                      <p className="text-sm text-luxury-ink/40 uppercase tracking-widest font-bold">Your wishlist is empty</p>
                    </div>
                    <button 
                      onClick={() => setIsWishlistOpen(false)}
                      className="text-xs text-glow-accent font-bold uppercase tracking-widest border-b border-glow-accent pb-1"
                    >
                      Explore Collections
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {PRODUCTS.filter(p => wishlist.includes(p.id)).map(product => (
                      <motion.div 
                        layout
                        key={product.id}
                        className="flex gap-4 group"
                      >
                        <div className="w-24 h-24 bg-glow-hero rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                          <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <h3 className="text-sm font-serif mb-0.5">{product.name}</h3>
                          <p className="text-[10px] text-luxury-ink/40 uppercase tracking-widest font-bold mb-2">{product.category}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-glow-accent">{product.price}</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setIsWishlistOpen(false);
                                  addToCart(product);
                                }}
                                className="text-[9px] uppercase tracking-widest font-bold bg-luxury-ink text-white px-3 py-1.5 rounded-lg hover:bg-glow-accent transition-colors"
                              >
                                Ritual
                              </button>
                              <button 
                                onClick={(e) => toggleWishlist(e, product.id)}
                                className="text-[9px] uppercase tracking-widest font-bold text-luxury-ink/40 hover:text-red-500"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              
              {wishlist.length > 0 && (
                <div className="p-8 bg-glow-hero/30 border-t border-glow-header/10">
                  <button 
                    onClick={() => {
                      // Logic for bulk checkout or just closing
                      setIsWishlistOpen(false);
                    }}
                    className="w-full py-4 bg-glow-accent text-white rounded-xl font-semibold tracking-wide hover:bg-glow-header transition-all shadow-lg shadow-glow-accent/20"
                  >
                    View Full Sanctuary
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order History Sidebar */}
      <AnimatePresence>
        {isOrderHistoryOpen && (
          <div className="fixed inset-0 z-[70] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrderHistoryOpen(false)}
              className="absolute inset-0 bg-luxury-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-glow-header/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-glow-accent" />
                  <h2 className="text-2xl font-serif italic">Ritual Journey</h2>
                </div>
                <button 
                  onClick={() => setIsOrderHistoryOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {orders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-glow-hero rounded-full flex items-center justify-center text-luxury-ink/20">
                      <Clock className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-lg font-serif italic mb-1">A story yet to be written...</p>
                      <p className="text-sm text-luxury-ink/40 uppercase tracking-widest font-bold">No past rituals found</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {orders.map(order => (
                      <div key={order.id} className="relative group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-luxury-ink/40 mb-1">Order ID: {order.id}</p>
                            <p className="text-xs font-semibold text-luxury-ink/60">{order.date}</p>
                          </div>
                          <span className={`text-[9px] uppercase tracking-[0.2em] font-bold px-3 py-1 rounded-full ${
                            order.status === "Processing" ? "bg-amber-100 text-amber-700" : 
                            order.status === "Shipped" ? "bg-blue-100 text-blue-700" : 
                            "bg-green-100 text-green-700"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex gap-4 p-4 bg-glow-hero/30 rounded-2xl border border-glow-header/5">
                          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                            <img src={order.image} className="w-full h-full object-cover" alt={order.productName} />
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                            <h3 className="text-sm font-serif mb-1">{order.productName}</h3>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-glow-accent">{order.price}</span>
                              <div className="flex items-center gap-1 text-[9px] text-green-600 font-bold uppercase tracking-widest">
                                <CheckCircle2 className="w-3 h-3" />
                                Payment: COD
                              </div>
                            </div>
                          </div>
                        </div>
                        {order.status === "Processing" && (
                          <button 
                            onClick={() => cancelOrder(order.id)}
                            className="mt-3 w-full py-2.5 border border-red-100 text-red-400 text-[9px] uppercase tracking-widest font-bold rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                          >
                            Cancel Ritual Request
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-8 bg-glow-hero/30 border-t border-glow-header/10">
                <button 
                  onClick={() => setIsOrderHistoryOpen(false)}
                  className="w-full py-4 bg-luxury-ink text-white rounded-xl font-semibold tracking-wide hover:bg-glow-accent transition-all"
                >
                  Continue Journey
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
