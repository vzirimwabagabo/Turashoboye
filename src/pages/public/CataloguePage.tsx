import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Package, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getOptimizedImageUrl } from '../../lib/cloudinary';

interface PublicVariant {
  id: string;
  sku: string;
  package_size: string;
  price_rwf: number;
}

interface PublicProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  target_animal: string;
  category_name?: string;
  category_slug?: string;
  image_url?: string;
  variants: PublicVariant[];
}

// Representative sample products for immediate demonstration and development
const FALLBACK_PRODUCTS: PublicProduct[] = [
  {
    id: 'sample-p1',
    name: 'Turashoboye Broiler Starter Mash',
    slug: 'broiler-starter-mash',
    description: 'High-protein starter mash (21-22% crude protein) formulated with soya meal and essential minerals for broiler chicks aged 0 to 3 weeks.',
    target_animal: 'Poultry (Broilers)',
    category_slug: 'poultry-feed',
    category_name: 'Poultry Feed',
    variants: [
      { id: 'v1-1', sku: 'BSM-50KG', package_size: '50kg Bag', price_rwf: 38000 },
      { id: 'v1-2', sku: 'BSM-25KG', package_size: '25kg Bag', price_rwf: 19500 },
      { id: 'v1-3', sku: 'BSM-10KG', package_size: '10kg Bag', price_rwf: 8200 },
    ],
  },
  {
    id: 'sample-p2',
    name: 'Turashoboye Layer Complete Mash',
    slug: 'layer-complete-mash',
    description: 'Fortified with calcium, phosphorus, and vitamin premix to sustain strong eggshell quality and high peak lay percentages in laying hens.',
    target_animal: 'Poultry (Layers)',
    category_slug: 'poultry-feed',
    category_name: 'Poultry Feed',
    variants: [
      { id: 'v2-1', sku: 'LCM-50KG', package_size: '50kg Bag', price_rwf: 35000 },
      { id: 'v2-2', sku: 'LCM-25KG', package_size: '25kg Bag', price_rwf: 18000 },
    ],
  },
  {
    id: 'sample-p3',
    name: 'Turashoboye Pig Grower Feed',
    slug: 'pig-grower-feed',
    description: 'Balanced energy and amino-acid ration for growing weaners and fatteners between 20kg to 60kg live body weight.',
    target_animal: 'Swine (Pigs)',
    category_slug: 'pig-feed',
    category_name: 'Pig Feed',
    variants: [
      { id: 'v3-1', sku: 'PGF-50KG', package_size: '50kg Bag', price_rwf: 32000 },
      { id: 'v3-2', sku: 'PGF-25KG', package_size: '25kg Bag', price_rwf: 16500 },
    ],
  },
  {
    id: 'sample-p4',
    name: 'Turashoboye Dairy Cattle Meal',
    slug: 'dairy-cattle-meal',
    description: 'High-fiber and bypass protein dairy concentrate formulated to stimulate rumination and maximize daily milk yields.',
    target_animal: 'Dairy Cattle',
    category_slug: 'cattle-feed',
    category_name: 'Cattle & Dairy Feed',
    variants: [
      { id: 'v4-1', sku: 'DCM-50KG', package_size: '50kg Bag', price_rwf: 28000 },
    ],
  },
  {
    id: 'sample-p5',
    name: 'Milled Soya Bean Meal (Feed Grade)',
    slug: 'milled-soya-meal',
    description: 'Roasted and milled high-protein soya meal (min 44% crude protein) for on-farm mixing and custom rations.',
    target_animal: 'Multi-Species',
    category_slug: 'raw-ingredients',
    category_name: 'Raw Ingredients',
    variants: [
      { id: 'v5-1', sku: 'SOYA-50KG', package_size: '50kg Bag', price_rwf: 42000 },
      { id: 'v5-2', sku: 'SOYA-25KG', package_size: '25kg Bag', price_rwf: 21500 },
    ],
  },
];

export default function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<PublicProduct[]>(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedAnimal, setSelectedAnimal] = useState('all');

  useEffect(() => {
    const fetchCatalogue = async () => {
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
            categories(name, slug),
            product_variants(id, sku, package_size, price_rwf, is_active),
            product_images(image_url, is_primary)
          `)
          .eq('published', true);

        if (!error && data && data.length > 0) {
          const formatted: PublicProduct[] = data.map((item: any) => {
            const primaryImg = item.product_images?.find((img: any) => img.is_primary) || item.product_images?.[0];
            return {
              id: item.id,
              name: item.name,
              slug: item.slug,
              description: item.description,
              target_animal: item.target_animal,
              category_name: item.categories?.name,
              category_slug: item.categories?.slug,
              image_url: primaryImg?.image_url,
              variants: (item.product_variants || [])
                .filter((v: any) => v.is_active)
                .map((v: any) => ({
                  id: v.id,
                  sku: v.sku,
                  package_size: v.package_size,
                  price_rwf: v.price_rwf,
                })),
            };
          });
          setProducts(formatted);
        }
      } catch (err) {
        console.warn('Falling back to default verified sample feed data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogue();
  }, []);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category });
    }
  };

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || prod.category_slug === selectedCategory;

    const matchesAnimal =
      selectedAnimal === 'all' ||
      (prod.target_animal && prod.target_animal.toLowerCase().includes(selectedAnimal.toLowerCase()));

    return matchesSearch && matchesCategory && matchesAnimal;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Animal Feed Catalogue
        </h1>
        <p className="mt-2 text-sm text-gray-600 max-w-2xl">
          Browse verified animal feed formulations and raw ingredients produced at the Turashoboye depot in Mahama. Prices are listed in whole Rwandan Francs (RWF).
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search feed name or ingredient..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:bg-white transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:bg-white appearance-none"
            >
              <option value="all">All Feed Categories</option>
              <option value="poultry-feed">Poultry Feed</option>
              <option value="pig-feed">Pig Feed</option>
              <option value="cattle-feed">Cattle & Dairy Feed</option>
              <option value="raw-ingredients">Raw Ingredients & Meals</option>
            </select>
          </div>

          {/* Target Animal Dropdown */}
          <div>
            <select
              value={selectedAnimal}
              onChange={(e) => setSelectedAnimal(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:bg-white"
            >
              <option value="all">All Livestock Species</option>
              <option value="poultry">Poultry (Broilers & Layers)</option>
              <option value="pig">Pigs & Swine</option>
              <option value="cattle">Dairy & Beef Cattle</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
          <span className="text-gray-500 font-medium">Quick Category:</span>
          {['all', 'poultry-feed', 'pig-feed', 'cattle-feed', 'raw-ingredients'].map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#2E7D32] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all'
                ? 'All'
                : cat.replace('-feed', '').replace('-ingredients', ' ingredients').replace('-', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-16 text-center text-gray-500">
          <Package className="w-10 h-10 mx-auto text-gray-400 animate-pulse mb-2" />
          <p className="text-sm">Loading feed catalogue...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <h3 className="text-base font-bold text-gray-900">No matching feeds found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search query or reset the category filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedAnimal('all');
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-gray-100 text-gray-800 text-xs font-semibold hover:bg-gray-200"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const minPrice =
              product.variants.length > 0
                ? Math.min(...product.variants.map((v) => v.price_rwf))
                : null;

            return (
              <div
                key={product.id}
                className="group rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-[#2E7D32] transition-all flex flex-col justify-between"
              >
                {/* Product Image Header */}
                <div className="relative h-44 w-full bg-emerald-50/50 overflow-hidden flex items-center justify-center border-b border-gray-100">
                  {product.image_url ? (
                    <img
                      src={getOptimizedImageUrl(product.image_url, { width: 600, height: 350, crop: 'fill' })}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-emerald-800/40 p-4">
                      <Package className="w-12 h-12 stroke-[1.5] mb-1" />
                      <span className="text-[10px] font-bold tracking-wider uppercase">Mahama Depots</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-white/95 text-[#2E7D32] border border-emerald-100 shadow-xs backdrop-blur-xs">
                    {product.target_animal || 'General Feed'}
                  </span>
                  {product.category_name && (
                    <span className="absolute top-3 right-3 text-[11px] text-gray-700 font-medium px-2 py-0.5 rounded-md bg-white/95 shadow-xs border border-gray-200">
                      {product.category_name}
                    </span>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-[#2E7D32] transition-colors">
                      {product.name}
                    </h2>

                    <p className="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Packaging Sizes */}
                    <div className="mt-4 space-y-1.5">
                      <p className="text-xs font-semibold text-gray-700">Available Packaging:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {product.variants.map((variant) => (
                          <span
                            key={variant.id}
                            className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-medium"
                          >
                            {variant.package_size} —{' '}
                            <span className="font-bold text-emerald-900">
                              {variant.price_rwf.toLocaleString()} RWF
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500 block">Starting from</span>
                      <span className="text-lg font-extrabold text-[#2E7D32]">
                        {minPrice ? `${minPrice.toLocaleString()} RWF` : 'Inquire'}
                      </span>
                    </div>

                    <Link
                      to={`/catalogue/${product.slug}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2E7D32] text-white text-xs font-medium hover:bg-[#256b29] transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
