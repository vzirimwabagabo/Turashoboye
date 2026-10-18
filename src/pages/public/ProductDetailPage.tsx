import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, ShieldCheck, Check, Clock, MapPin, Truck, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getOptimizedImageUrl } from '../../lib/cloudinary';

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

const SAMPLE_DETAILS: Record<string, DetailProduct> = {
  'broiler-starter-mash': {
    id: 'sample-p1',
    name: 'Turashoboye Broiler Starter Mash',
    slug: 'broiler-starter-mash',
    description: 'A finely ground, highly digestible starter feed specifically formulated for fast-growing broiler chicks during their critical first 21 days. Contains quality soya meal, maize, essential vitamins, and phosphorus to build strong skeletal frames and early immune vigor.',
    target_animal: 'Broiler Chicks (0 to 3 Weeks)',
    category: 'Poultry Feed',
    feed_type: 'Complete Starter Mash',
    nutritional_focus: 'Min 21% Crude Protein, Balanced Lysine & Methionine',
    variants: [
      { id: 'v1-1', sku: 'BSM-50KG', package_size: '50kg Bag', price_rwf: 38000, availability: 'In Stock' },
      { id: 'v1-2', sku: 'BSM-25KG', package_size: '25kg Bag', price_rwf: 19500, availability: 'In Stock' },
      { id: 'v1-3', sku: 'BSM-10KG', package_size: '10kg Bag', price_rwf: 8200, availability: 'In Stock' },
    ],
  },
  'layer-complete-mash': {
    id: 'sample-p2',
    name: 'Turashoboye Layer Complete Mash',
    slug: 'layer-complete-mash',
    description: 'Complete layer ration engineered to optimize peak laying percentage, yolk pigmentation, and eggshell rigidity in commercial and dual-purpose laying hens. Includes bioavailable calcium carbonate and trace minerals.',
    target_animal: 'Laying Hens (From 18 Weeks Onward)',
    category: 'Poultry Feed',
    feed_type: 'Complete Layer Mash',
    nutritional_focus: 'High Calcium (3.8-4.2%), 16.5% Crude Protein',
    variants: [
      { id: 'v2-1', sku: 'LCM-50KG', package_size: '50kg Bag', price_rwf: 35000, availability: 'In Stock' },
      { id: 'v2-2', sku: 'LCM-25KG', package_size: '25kg Bag', price_rwf: 18000, availability: 'In Stock' },
    ],
  },
  'pig-grower-feed': {
    id: 'sample-p3',
    name: 'Turashoboye Pig Grower Feed',
    slug: 'pig-grower-feed',
    description: 'Balanced protein and carbohydrate feed ration for growing pigs from 20kg to finishing weight. High palatability and optimal fiber levels promote gut health and rapid feed conversion ratio (FCR).',
    target_animal: 'Growing Pigs (Weaners & Fatteners)',
    category: 'Pig Feed',
    feed_type: 'Grower Mash',
    nutritional_focus: '16% Crude Protein, Digestible Energy 3,100 kcal/kg',
    variants: [
      { id: 'v3-1', sku: 'PGF-50KG', package_size: '50kg Bag', price_rwf: 32000, availability: 'In Stock' },
      { id: 'v3-2', sku: 'PGF-25KG', package_size: '25kg Bag', price_rwf: 16500, availability: 'In Stock' },
    ],
  },
  'dairy-cattle-meal': {
    id: 'sample-p4',
    name: 'Turashoboye Dairy Cattle Meal',
    slug: 'dairy-cattle-meal',
    description: 'Dairy cattle concentrate formulated with energy grains, bypass protein, and essential rumen-buffering minerals to support dairy cows during lactation and maintain body condition scores.',
    target_animal: 'Lactating Dairy Cows & Beef Cattle',
    category: 'Cattle & Dairy Feed',
    feed_type: 'Supplementary Dairy Concentrate',
    nutritional_focus: '17% Crude Protein, Balanced Starch & Rumen Minerals',
    variants: [
      { id: 'v4-1', sku: 'DCM-50KG', package_size: '50kg Bag', price_rwf: 28000, availability: 'In Stock' },
    ],
  },
  'milled-soya-meal': {
    id: 'sample-p5',
    name: 'Milled Soya Bean Meal (Feed Grade)',
    slug: 'milled-soya-meal',
    description: 'Clean, toasted, and ground feed-grade soya bean meal. Excellent vegetable protein source for on-farm mixing of poultry, swine, and dairy feed rations.',
    target_animal: 'Multi-Species Protein Supplement',
    category: 'Raw Ingredients',
    feed_type: 'Raw Milled Ingredient',
    nutritional_focus: 'Min 44% Crude Protein',
    variants: [
      { id: 'v5-1', sku: 'SOYA-50KG', package_size: '50kg Bag', price_rwf: 42000, availability: 'In Stock' },
      { id: 'v5-2', sku: 'SOYA-25KG', package_size: '25kg Bag', price_rwf: 21500, availability: 'In Stock' },
    ],
  },
};

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<DetailProduct>(
    (slug && SAMPLE_DETAILS[slug]) || SAMPLE_DETAILS['broiler-starter-mash']
  );
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      try {
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
        console.warn('Using baseline feed details', err);
      }
    };

    fetchProduct();
  }, [slug]);

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
                onClick={handlePhoneOrder}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#2E7D32] text-white font-bold text-sm shadow-sm hover:bg-[#256b29] transition-colors"
              >
                <Phone size={18} />
                Order via WhatsApp / Call
              </button>
              <p className="text-xs text-center text-gray-500">
                Contact staff at +250 780 000 000 to confirm order and collection.
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
    </div>
  );
}
