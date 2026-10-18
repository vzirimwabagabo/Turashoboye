import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Box, Eye, EyeOff, Tag, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import ProductModal from '../../components/products/ProductModal';
import { getOptimizedImageUrl } from '../../lib/cloudinary';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  category_name?: string;
  type: string;
  target_animal?: string;
  published: boolean;
  variants_count: number;
  image_url?: string;
  variants: {
    id: string;
    sku: string;
    package_size: string;
    price_rwf: number;
    cost_rwf?: number;
  }[];
}

const SAMPLE_OPS_PRODUCTS: ProductItem[] = [
  {
    id: 'p1',
    name: 'Turashoboye Broiler Starter Mash',
    slug: 'broiler-starter-mash',
    category_name: 'Poultry Feed',
    type: 'finished_feed',
    target_animal: 'Broilers',
    published: true,
    variants_count: 3,
    variants: [
      { id: 'v1', sku: 'BSM-50KG', package_size: '50kg Bag', price_rwf: 38000, cost_rwf: 31500 },
      { id: 'v2', sku: 'BSM-25KG', package_size: '25kg Bag', price_rwf: 19500, cost_rwf: 15900 },
      { id: 'v3', sku: 'BSM-10KG', package_size: '10kg Bag', price_rwf: 8200, cost_rwf: 6500 },
    ],
  },
  {
    id: 'p2',
    name: 'Turashoboye Layer Complete Mash',
    slug: 'layer-complete-mash',
    category_name: 'Poultry Feed',
    type: 'finished_feed',
    target_animal: 'Layers',
    published: true,
    variants_count: 2,
    variants: [
      { id: 'v4', sku: 'LCM-50KG', package_size: '50kg Bag', price_rwf: 35000, cost_rwf: 28500 },
      { id: 'v5', sku: 'LCM-25KG', package_size: '25kg Bag', price_rwf: 18000, cost_rwf: 14500 },
    ],
  },
  {
    id: 'p3',
    name: 'Turashoboye Pig Grower Feed',
    slug: 'pig-grower-feed',
    category_name: 'Pig Feed',
    type: 'finished_feed',
    target_animal: 'Pigs',
    published: true,
    variants_count: 2,
    variants: [
      { id: 'v6', sku: 'PGF-50KG', package_size: '50kg Bag', price_rwf: 32000, cost_rwf: 26000 },
      { id: 'v7', sku: 'PGF-25KG', package_size: '25kg Bag', price_rwf: 16500, cost_rwf: 13200 },
    ],
  },
  {
    id: 'p4',
    name: 'Feed-Grade Soya Bean Meal',
    slug: 'feed-grade-soya-meal',
    category_name: 'Raw Ingredients',
    type: 'raw_ingredient',
    target_animal: 'Multi-Species',
    published: true,
    variants_count: 2,
    variants: [
      { id: 'v8', sku: 'SOYA-50KG', package_size: '50kg Bag', price_rwf: 42000, cost_rwf: 36000 },
      { id: 'v9', sku: 'SOYA-25KG', package_size: '25kg Bag', price_rwf: 21500, cost_rwf: 18200 },
    ],
  },
];

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>(SAMPLE_OPS_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isManagement = user?.profile?.role === 'manager' || user?.profile?.role === 'owner';

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            slug,
            type,
            target_animal,
            published,
            categories(name),
            product_variants(id, sku, package_size, price_rwf, cost_rwf),
            product_images(image_url, is_primary)
          `);

        if (!error && data && data.length > 0) {
          const formatted: ProductItem[] = data.map((p: any) => {
            const primaryImg = p.product_images?.find((img: any) => img.is_primary) || p.product_images?.[0];
            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              type: p.type,
              target_animal: p.target_animal,
              published: p.published,
              category_name: p.categories?.name,
              image_url: primaryImg?.image_url,
              variants_count: p.product_variants ? p.product_variants.length : 0,
              variants: p.product_variants || [],
            };
          });
          setProducts(formatted);
        }
      } catch (err) {
        console.warn('Using baseline operational products', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleProductSaved = (newProduct: ProductItem) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.target_animal && prod.target_animal.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || prod.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Products & Variants
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage finished animal feed rations, raw ingredient bags, package sizes, and SKU pricing.
          </p>
        </div>

        {isManagement && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus size={18} />
            Add New Product
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by feed name or animal..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-gray-400 flex-shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          >
            <option value="all">All Product Types</option>
            <option value="finished_feed">Finished Feed</option>
            <option value="raw_ingredient">Raw Ingredient</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Product Name</th>
                <th className="px-5 py-3.5">Category & Type</th>
                <th className="px-5 py-3.5">Target Animal</th>
                <th className="px-5 py-3.5">Package Sizes & Pricing</th>
                <th className="px-5 py-3.5">Public Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Box className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    No products matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                          {p.image_url ? (
                            <img
                              src={getOptimizedImageUrl(p.image_url, { width: 80, height: 80, crop: 'fill' })}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={18} />
                          )}
                        </div>
                        <div>
                          <span>{p.name}</span>
                          <span className="block text-xs font-normal text-gray-400">
                            Slug: {p.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-800 block">
                        {p.category_name || 'General Feed'}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {p.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {p.target_animal || 'Multi-Animal'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-sm">
                        {p.variants.map((v) => (
                          <span
                            key={v.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-xs"
                          >
                            <Tag size={12} className="text-gray-400" />
                            <span className="font-medium text-gray-700">{v.package_size}:</span>
                            <span className="font-bold text-emerald-800">
                              {v.price_rwf.toLocaleString()} RWF
                            </span>
                            {isManagement && v.cost_rwf !== undefined && (
                              <span className="text-gray-400 text-[10px]" title="Cost price (restricted to management)">
                                (Cost: {v.cost_rwf.toLocaleString()})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {p.published ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          <Eye size={13} /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                          <EyeOff size={13} /> Draft
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Creation Modal */}
      {modalOpen && (
        <ProductModal
          onClose={() => setModalOpen(false)}
          onSaved={handleProductSaved}
        />
      )}
    </div>
  );
}
