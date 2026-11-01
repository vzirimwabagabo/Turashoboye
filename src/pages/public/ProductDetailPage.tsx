import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, ShieldCheck, Check, Clock, MapPin, Truck, Package, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getOptimizedImageUrl } from '../../lib/cloudinary';
import OrderPlacementModal from '../../components/sales/OrderPlacementModal';

interface DetailProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  target_animal: string;
  category: string;
  feed_type: string;
  nutritional_focus: string;
  image_url?: string;
  variants: {
    id: string;
    sku: string;
    package_size: string;
    price_rwf: number;
    availability: string;
  }[];
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<DetailProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            slug,
            description,
            target_animal,
            type,
            categories(name),
            product_variants(id, sku, package_size, price_rwf, is_active),
            product_images(image_url, is_primary)
          `)
          .eq('slug', slug)
          .maybeSingle();

        if (!error && data) {
          const primaryImg = data.product_images?.find((img: any) => img.is_primary) || data.product_images?.[0];
          const activeVariants = (data.product_variants || [])
            .filter((v: any) => v.is_active)
            .map((v: any) => ({
              id: v.id,
              sku: v.sku,
              package_size: v.package_size,
              price_rwf: v.price_rwf,
              availability: 'In Stock',
            }));

          const categoryName = Array.isArray(data.categories)
            ? (data.categories[0] as { name?: string } | undefined)?.name
            : (data.categories as { name?: string } | null)?.name;

          setProduct({
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description || '',
            target_animal: data.target_animal || 'Livestock',
            category: categoryName || 'Animal Feed',
            feed_type: data.type === 'raw_ingredient' ? 'Raw Milled Ingredient' : 'Finished Feed',
            nutritional_focus: 'Quality Verified Feed Formulation',
            image_url: primaryImg?.image_url,
            variants: activeVariants.length > 0 ? activeVariants : [
              { id: 'def', sku: 'DEF-50KG', package_size: '50kg Bag', price_rwf: 30000, availability: 'In Stock' },
            ],
          });
        }
      } catch (err) {
        console.warn('Error fetching feed product detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-500">
        Loading product information...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-500">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-gray-800">Product Not Found</h2>
        <p className="text-xs text-gray-400 mt-1">The requested animal feed product could not be found.</p>
        <Link to="/catalogue" className="mt-4 inline-block text-xs font-semibold text-[#2E7D32]">
          Back to Catalogue &rarr;
        </Link>
      </div>
    );
  }

  const currentVariant = product.variants[selectedVariantIndex] || product.variants[0];

  const handlePhoneOrder = () => {
    const text = encodeURIComponent(
      `Hello Turashoboye Feeds, I would like to order: ${product.name} (${currentVariant.package_size} - ${currentVariant.price_rwf.toLocaleString()} RWF). Please confirm availability and collection time at Mahama Depot.`
    );
    window.open(`https://wa.me/250780000000?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb / Back Link */}
      <Link
        to="/catalogue"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#2E7D32] transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Feed Catalogue
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Visual & Description */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
            {/* Product Image Header */}
            {product.image_url ? (
              <div className="w-full h-72 sm:h-80 bg-gray-100 overflow-hidden border-b border-gray-100">
                <img
                  src={getOptimizedImageUrl(product.image_url, { width: 900, height: 500, crop: 'fill' })}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-44 bg-emerald-50/60 flex items-center justify-center border-b border-gray-100 text-emerald-800/40">
                <div className="flex flex-col items-center gap-1">
                  <Package className="w-12 h-12 stroke-[1.5]" />
                  <span className="text-xs font-bold tracking-wider uppercase">Turashoboye Feed Depot</span>
                </div>
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-md bg-emerald-50 text-[#2E7D32] text-xs font-bold border border-emerald-100">
                  {product.category}
                </span>
                <span className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                  Target: {product.target_animal}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {product.name}
              </h1>

              <p className="text-gray-700 text-base leading-relaxed">
                {product.description}
              </p>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 bg-gray-50 rounded-xl">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Feed Type</span>
                <span className="font-bold text-gray-900">{product.feed_type}</span>
              </div>
              <div className="p-3.5 bg-gray-50 rounded-xl">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Nutritional Focus</span>
                <span className="font-bold text-gray-900">{product.nutritional_focus}</span>
              </div>
            </div>
          </div>
        </div>

          {/* Quality & Traceability Guarantee */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#2E7D32] font-bold text-sm">
              <ShieldCheck size={20} />
              Verifiable Quality & Batch Assurance
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              Produced at our Mahama facility adhering to RSB animal-feed quality guidelines. Every bag features a unique batch stamp verifying the date of milling and raw ingredient inspection.
            </p>
          </div>
        </div>

        {/* Right Column: Pricing & Staff Order Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border-2 border-emerald-600/30 rounded-3xl p-6 sm:p-7 shadow-md space-y-6">
            <div>
              <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wide">
                Retail Price in Whole RWF
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#2E7D32]">
                  {currentVariant.price_rwf.toLocaleString()} RWF
                </span>
                <span className="text-xs text-gray-500">
                  / {currentVariant.package_size}
                </span>
              </div>
              <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                <Check size={12} /> {currentVariant.availability} at Mahama Depot
              </span>
            </div>

            {/* Package Size Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wide block">
                Select Package Size:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {product.variants.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantIndex(idx)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left text-sm transition-all ${
                      selectedVariantIndex === idx
                        ? 'border-[#2E7D32] bg-emerald-50/50 ring-2 ring-[#2E7D32]/20 font-semibold text-[#2E7D32]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span>{v.package_size} ({v.sku})</span>
                    <span className="font-bold">{v.price_rwf.toLocaleString()} RWF</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Order Actions */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => setOrderModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#2E7D32] text-white font-bold text-sm shadow-md hover:bg-[#256b29] transition-colors cursor-pointer"
              >
                <ShoppingBag size={18} />
                Order Feed Online
              </button>

              <button
                onClick={handlePhoneOrder}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#2E7D32] text-[#2E7D32] hover:bg-emerald-50 font-semibold text-xs transition-colors"
              >
                <Phone size={15} />
                Order via WhatsApp / Call Desk
              </button>
              <p className="text-[11px] text-center text-gray-400">
                Online orders require a registered customer account for batch traceability.
              </p>
            </div>

            {/* Depot Details */}
            <div className="p-4 bg-gray-50 rounded-2xl space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                <MapPin size={14} className="text-[#2E7D32]" />
                <span>Collection Location</span>
              </div>
              <p>Turashoboye Primary Feed Depot, Sector Mahama, Kirehe District.</p>
              <div className="flex items-center gap-2 pt-1 text-gray-500">
                <Clock size={13} />
                <span>Open Monday to Saturday, 7:00 AM – 5:30 PM</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Truck size={13} />
                <span>Local transport assistance available on bulk orders.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Online Order Modal */}
      <OrderPlacementModal
        feed={{
          id: product.id,
          name: product.name,
          sku: currentVariant.sku,
          package_size: currentVariant.package_size,
          price_rwf: currentVariant.price_rwf,
          category: product.category,
          variants: product.variants,
        }}
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
      />
    </div>
  );
}
