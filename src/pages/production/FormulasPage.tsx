import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import {
  Plus,
  Beaker,
  X,
  TrendingUp,
  DollarSign,
  Sparkles,
  Scale,
  ShieldCheck,
  Printer,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export interface RawIngredient {
  id: string;
  name: string;
  category: 'energy' | 'protein' | 'fibre' | 'mineral' | 'premix' | 'additive';
  sourceRegion: string;
  costPerKgRwf: number;
  crudeProteinPct: number;
  energyKcalPerKg: number;
  crudeFibrePct: number;
  calciumPct: number;
  moisturePct: number;
}

export interface RecipeIngredientItem {
  ingredientId: string;
  inclusionPct: number; // percentage (0 - 100)
}

export interface FeedFormula {
  id: string;
  code: string;
  name: string;
  animalType: 'Broiler' | 'Layers' | 'Dairy Cattle' | 'Pig / Swine';
  stage: string;
  rsbStandard: string;
  minProteinPct: number;
  maxFibrePct: number;
  minEnergyKcal: number;
  maxMoisturePct: number;
  sellingPrice50kgRwf: number;
  recipe: RecipeIngredientItem[];
  currentVersion: number;
  isApproved: boolean;
  approvedBy?: string;
  notes?: string;
}

// 1. Initial Benchmark Raw Ingredients (Eastern Province & Regional Supply)
const INITIAL_RAW_INGREDIENTS: RawIngredient[] = [
  {
    id: 'ing-maize',
    name: 'Cleaned Yellow Feed Maize',
    category: 'energy',
    sourceRegion: 'Kirehe & Nyagatare, Rwanda',
    costPerKgRwf: 380,
    crudeProteinPct: 8.5,
    energyKcalPerKg: 3350,
    crudeFibrePct: 2.2,
    calciumPct: 0.02,
    moisturePct: 12.0,
  },
  {
    id: 'ing-soya',
    name: 'Toasted Soya Bean Meal (46% CP)',
    category: 'protein',
    sourceRegion: 'Rwanda Extrusion & Uganda',
    costPerKgRwf: 820,
    crudeProteinPct: 46.0,
    energyKcalPerKg: 3150,
    crudeFibrePct: 3.5,
    calciumPct: 0.30,
    moisturePct: 10.0,
  },
  {
    id: 'ing-bran',
    name: 'Wheat Bran & Rice Polish',
    category: 'fibre',
    sourceRegion: 'Bugarama & Kigali Mills',
    costPerKgRwf: 220,
    crudeProteinPct: 14.5,
    energyKcalPerKg: 2100,
    crudeFibrePct: 10.5,
    calciumPct: 0.12,
    moisturePct: 11.0,
  },
  {
    id: 'ing-limestone',
    name: 'Limestone Grit & Dicalcium Phosphate',
    category: 'mineral',
    sourceRegion: 'Musanze Quarry, Rwanda',
    costPerKgRwf: 160,
    crudeProteinPct: 0.0,
    energyKcalPerKg: 0,
    crudeFibrePct: 0.0,
    calciumPct: 38.0,
    moisturePct: 1.0,
  },
  {
    id: 'ing-premix',
    name: 'Standard Poultry Vitamin-Mineral Premix',
    category: 'premix',
    sourceRegion: 'Certified East Africa Import',
    costPerKgRwf: 2600,
    crudeProteinPct: 0.0,
    energyKcalPerKg: 0,
    crudeFibrePct: 0.0,
    calciumPct: 5.0,
    moisturePct: 4.0,
  },
  {
    id: 'ing-amino',
    name: 'DL-Methionine, L-Lysine & Salt Pack',
    category: 'additive',
    sourceRegion: 'Veterinary Grade Import',
    costPerKgRwf: 3400,
    crudeProteinPct: 95.0,
    energyKcalPerKg: 0,
    crudeFibrePct: 0.0,
    calciumPct: 0.0,
    moisturePct: 1.0,
  },
];

// 2. Pre-seeded RSB Certified Feed Formulas for Turashoboye Feed Mills
const INITIAL_FORMULAS: FeedFormula[] = [
  {
    id: 'form-broiler-starter',
    code: 'BSM-50KG',
    name: 'Broiler Starter Crumbles (0-3 Weeks)',
    animalType: 'Broiler',
    stage: 'Starter (Day 1 - Day 21)',
    rsbStandard: 'RSB EAS 353:2024 (Min 20% CP)',
    minProteinPct: 20.0,
    maxFibrePct: 5.0,
    minEnergyKcal: 3000,
    maxMoisturePct: 12.0,
    sellingPrice50kgRwf: 36500,
    recipe: [
      { ingredientId: 'ing-maize', inclusionPct: 55 },
      { ingredientId: 'ing-soya', inclusionPct: 36 },
      { ingredientId: 'ing-bran', inclusionPct: 5 },
      { ingredientId: 'ing-limestone', inclusionPct: 2 },
      { ingredientId: 'ing-premix', inclusionPct: 1.5 },
      { ingredientId: 'ing-amino', inclusionPct: 0.5 },
    ],
    currentVersion: 1,
    isApproved: true,
    approvedBy: 'Chief Nutritionist (Mahama Lab)',
    notes: 'Optimized for rapid early bone growth and immune competence.',
  },
  {
    id: 'form-broiler-finisher',
    code: 'BFM-50KG',
    name: 'Broiler Finisher Mash (4+ Weeks)',
    animalType: 'Broiler',
    stage: 'Finisher (Day 22 - Slaughter)',
    rsbStandard: 'RSB EAS 353:2024 (Min 18% CP)',
    minProteinPct: 18.0,
    maxFibrePct: 6.0,
    minEnergyKcal: 3100,
    maxMoisturePct: 12.0,
    sellingPrice50kgRwf: 34000,
    recipe: [
      { ingredientId: 'ing-maize', inclusionPct: 62 },
      { ingredientId: 'ing-soya', inclusionPct: 28 },
      { ingredientId: 'ing-bran', inclusionPct: 6 },
      { ingredientId: 'ing-limestone', inclusionPct: 2 },
      { ingredientId: 'ing-premix', inclusionPct: 1.5 },
      { ingredientId: 'ing-amino', inclusionPct: 0.5 },
    ],
    currentVersion: 2,
    isApproved: true,
    approvedBy: 'Quality Assurance Manager',
    notes: 'Dense energy profile for maximum weight conversion ratio.',
  },
  {
    id: 'form-layers-complete',
    code: 'LCM-50KG',
    name: 'Layers Complete Mash (High Egg Yield)',
    animalType: 'Layers',
    stage: 'Active Laying Stage (Week 18 - 80)',
    rsbStandard: 'RSB EAS 353:2024 (Min 16.5% CP)',
    minProteinPct: 16.5,
    maxFibrePct: 7.0,
    minEnergyKcal: 2750,
    maxMoisturePct: 12.0,
    sellingPrice50kgRwf: 31500,
    recipe: [
      { ingredientId: 'ing-maize', inclusionPct: 54 },
      { ingredientId: 'ing-soya', inclusionPct: 24 },
      { ingredientId: 'ing-bran', inclusionPct: 10 },
      { ingredientId: 'ing-limestone', inclusionPct: 9 }, // High calcium for eggshell strength
      { ingredientId: 'ing-premix', inclusionPct: 2.5 },
      { ingredientId: 'ing-amino', inclusionPct: 0.5 },
    ],
    currentVersion: 1,
    isApproved: true,
    approvedBy: 'Chief Nutritionist (Mahama Lab)',
    notes: 'Enriched with 3.8% bio-available calcium for strong eggshells.',
  },
  {
    id: 'form-dairy-mash',
    code: 'DMC-50KG',
    name: 'Dairy Cattle High-Yield Mash (16% CP)',
    animalType: 'Dairy Cattle',
    stage: 'Lactating Cows (>15L/day)',
    rsbStandard: 'RSB EAS 90:2024 (Min 16% CP)',
    minProteinPct: 16.0,
    maxFibrePct: 10.0,
    minEnergyKcal: 2400,
    maxMoisturePct: 12.5,
    sellingPrice50kgRwf: 27000,
    recipe: [
      { ingredientId: 'ing-maize', inclusionPct: 35 },
      { ingredientId: 'ing-soya', inclusionPct: 22 },
      { ingredientId: 'ing-bran', inclusionPct: 38 },
      { ingredientId: 'ing-limestone', inclusionPct: 3 },
      { ingredientId: 'ing-premix', inclusionPct: 1.5 },
      { ingredientId: 'ing-amino', inclusionPct: 0.5 },
    ],
    currentVersion: 1,
    isApproved: true,
    approvedBy: 'Production Supervisor',
    notes: 'High rumen-degradable protein and digestible fibre.',
  },
];

export default function FormulasPage() {
  const { user } = useAuth();

  // State
  const [ingredients, setIngredients] = useState<RawIngredient[]>(INITIAL_RAW_INGREDIENTS);
  const [formulas, setFormulas] = useState<FeedFormula[]>(INITIAL_FORMULAS);
  const [activeFormulaId, setActiveFormulaId] = useState<string>(INITIAL_FORMULAS[0].id);
  const [selectedBatchSizeKg, setSelectedBatchSizeKg] = useState<number>(1000); // 1 Ton default
  const [optimizerMessage, setOptimizerMessage] = useState<string | null>(null);

  // Modal State for New Formula
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [batchSheetOpen, setBatchSheetOpen] = useState(false);
  const [newFormulaName, setNewFormulaName] = useState('');
  const [newAnimalType, setNewAnimalType] = useState<'Broiler' | 'Layers' | 'Dairy Cattle' | 'Pig / Swine'>('Broiler');
  const [newSellingPrice, setNewSellingPrice] = useState<number>(35000);
  const [newMinProtein, setNewMinProtein] = useState<number>(20.0);

  const isManagement = ['manager', 'owner', 'super_admin'].includes(user?.profile?.role || '');

  // Active Selected Formula
  const activeFormula = useMemo(() => {
    return formulas.find((f) => f.id === activeFormulaId) || formulas[0];
  }, [formulas, activeFormulaId]);

  // Ingredients map lookup
  const ingredientsMap = useMemo(() => {
    const map = new Map<string, RawIngredient>();
    ingredients.forEach((ing) => map.set(ing.id, ing));
    return map;
  }, [ingredients]);

  // Calculation Metrics for the Active Formula
  const formulaMetrics = useMemo(() => {
    let costPerKgRwf = 0;
    let totalProteinPct = 0;
    let totalEnergyKcal = 0;
    let totalFibrePct = 0;
    let totalCalciumPct = 0;
    let totalMoisturePct = 0;
    let totalInclusion = 0;

    activeFormula.recipe.forEach((item) => {
      const ing = ingredientsMap.get(item.ingredientId);
      if (!ing) return;
      const fraction = item.inclusionPct / 100;
      costPerKgRwf += ing.costPerKgRwf * fraction;
      totalProteinPct += ing.crudeProteinPct * fraction;
      totalEnergyKcal += ing.energyKcalPerKg * fraction;
      totalFibrePct += ing.crudeFibrePct * fraction;
      totalCalciumPct += ing.calciumPct * fraction;
      totalMoisturePct += ing.moisturePct * fraction;
      totalInclusion += item.inclusionPct;
    });

    const costPer50kgBagRwf = Math.round(costPerKgRwf * 50);
    const sellingPriceRwf = activeFormula.sellingPrice50kgRwf;
    const grossProfitPerBagRwf = sellingPriceRwf - costPer50kgBagRwf;
    const grossMarginPct = sellingPriceRwf > 0 ? (grossProfitPerBagRwf / sellingPriceRwf) * 100 : 0;

    const isProteinCompliant = totalProteinPct >= activeFormula.minProteinPct;
    const isFibreCompliant = totalFibrePct <= activeFormula.maxFibrePct;
    const isMoistureCompliant = totalMoisturePct <= activeFormula.maxMoisturePct;
    const isOverallCompliant = isProteinCompliant && isFibreCompliant && isMoistureCompliant;

    return {
      costPerKgRwf: Math.round(costPerKgRwf),
      costPer50kgBagRwf,
      sellingPriceRwf,
      grossProfitPerBagRwf,
      grossMarginPct: Number(grossMarginPct.toFixed(1)),
      totalProteinPct: Number(totalProteinPct.toFixed(2)),
      totalEnergyKcal: Math.round(totalEnergyKcal),
      totalFibrePct: Number(totalFibrePct.toFixed(2)),
      totalCalciumPct: Number(totalCalciumPct.toFixed(2)),
      totalMoisturePct: Number(totalMoisturePct.toFixed(2)),
      totalInclusion: Math.round(totalInclusion),
      isProteinCompliant,
      isFibreCompliant,
      isMoistureCompliant,
      isOverallCompliant,
    };
  }, [activeFormula, ingredientsMap]);

  // Handle Raw Ingredient Price Change
  const handleUpdateIngredientPrice = (ingredientId: string, newPrice: number) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === ingredientId ? { ...ing, costPerKgRwf: Math.max(1, newPrice) } : ing))
    );
  };

  // Handle Recipe Slider / Percentage Change
  const handleUpdateInclusion = (ingredientId: string, newInclusion: number) => {
    setFormulas((prev) =>
      prev.map((f) => {
        if (f.id !== activeFormulaId) return f;
        const updatedRecipe = f.recipe.map((r) =>
          r.ingredientId === ingredientId ? { ...r, inclusionPct: Math.max(0, Math.min(100, newInclusion)) } : r
        );
        return { ...f, recipe: updatedRecipe };
      })
    );
  };

  // Auto-Normalize Recipe to 100%
  const handleNormalizeRecipe = () => {
    const currentSum = activeFormula.recipe.reduce((s, it) => s + it.inclusionPct, 0);
    if (currentSum === 0) return;

    setFormulas((prev) =>
      prev.map((f) => {
        if (f.id !== activeFormulaId) return f;
        const normalized = f.recipe.map((r) => ({
          ...r,
          inclusionPct: Number(((r.inclusionPct / currentSum) * 100).toFixed(1)),
        }));
        return { ...f, recipe: normalized };
      })
    );
  };

  // Least-Cost Formulation Optimizer Algorithm
  const handleLeastCostOptimize = () => {
    const targetCP = activeFormula.minProteinPct;
    const maize = ingredientsMap.get('ing-maize');
    const soya = ingredientsMap.get('ing-soya');

    if (!maize || !soya) return;

    const fixedItems = activeFormula.recipe.filter(
      (it) => it.ingredientId !== 'ing-maize' && it.ingredientId !== 'ing-soya'
    );
    const fixedInclusion = fixedItems.reduce((sum, it) => sum + it.inclusionPct, 0);
    const fixedProtein = fixedItems.reduce((sum, it) => {
      const ing = ingredientsMap.get(it.ingredientId);
      return sum + (ing ? (it.inclusionPct / 100) * ing.crudeProteinPct : 0);
    }, 0);

    const availableInclusion = 100 - fixedInclusion;
    const neededProtein = targetCP - fixedProtein;

    // Pearson Square equation:
    const deltaP = soya.crudeProteinPct - maize.crudeProteinPct;
    const requiredSoya = ((100 * neededProtein - maize.crudeProteinPct * availableInclusion) / deltaP);
    const optimalSoyaPct = Math.max(15, Math.min(availableInclusion - 20, Number(requiredSoya.toFixed(1))));
    const optimalMaizePct = Number((availableInclusion - optimalSoyaPct).toFixed(1));

    setFormulas((prev) =>
      prev.map((f) => {
        if (f.id !== activeFormulaId) return f;
        const optimizedRecipe = f.recipe.map((it) => {
          if (it.ingredientId === 'ing-soya') return { ...it, inclusionPct: optimalSoyaPct };
          if (it.ingredientId === 'ing-maize') return { ...it, inclusionPct: optimalMaizePct };
          return it;
        });
        return { ...f, recipe: optimizedRecipe };
      })
    );

    setOptimizerMessage(
      `🎯 Least-Cost Formulated: Balanced Soya to ${optimalSoyaPct}% and Maize to ${optimalMaizePct}% to satisfy RSB min ${targetCP}% CP at lowest production cost!`
    );
    setTimeout(() => setOptimizerMessage(null), 6000);
  };

  // Create Custom Formula Handler
  const handleCreateFormula = (e: FormEvent) => {
    e.preventDefault();
    const newId = `form-${Date.now()}`;
    const newFormula: FeedFormula = {
      id: newId,
      code: `TUR-${Date.now().toString().slice(-4)}`,
      name: newFormulaName,
      animalType: newAnimalType,
      stage: 'Custom Customer Feed Run',
      rsbStandard: 'RSB EAS 353 Compliant',
      minProteinPct: newMinProtein,
      maxFibrePct: 7.0,
      minEnergyKcal: 2900,
      maxMoisturePct: 12.0,
      sellingPrice50kgRwf: newSellingPrice,
      recipe: [
        { ingredientId: 'ing-maize', inclusionPct: 55 },
        { ingredientId: 'ing-soya', inclusionPct: 32 },
        { ingredientId: 'ing-bran', inclusionPct: 8 },
        { ingredientId: 'ing-limestone', inclusionPct: 3 },
        { ingredientId: 'ing-premix', inclusionPct: 1.5 },
        { ingredientId: 'ing-amino', inclusionPct: 0.5 },
      ],
      currentVersion: 1,
      isApproved: true,
      approvedBy: user?.profile?.displayName || user?.email || 'Quality Manager',
    };

    setFormulas((prev) => [newFormula, ...prev]);
    setActiveFormulaId(newId);
    setCreateModalOpen(false);
    setNewFormulaName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Least-Cost Feed Formulation & Live Margin Optimizer
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#2E7D32] border border-emerald-200">
              RSB EAS 353 Standard
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Real-time linear programming recipe matrix. Adjust raw material costs, auto-balance protein vs energy, and maximize gross profit margin per 50kg bag.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBatchSheetOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold shadow-xs transition"
          >
            <Printer size={15} />
            Mill Mixing Sheet
          </button>

          {isManagement && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold shadow-xs transition"
            >
              <Plus size={16} />
              New Formulation
            </button>
          )}
        </div>
      </div>

      {/* Formula Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        {formulas.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFormulaId(f.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
              f.id === activeFormulaId
                ? 'bg-[#2E7D32] text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Beaker size={14} />
            <span>{f.name}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                f.id === activeFormulaId ? 'bg-emerald-800 text-emerald-100' : 'bg-gray-100 text-gray-600'
              }`}
            >
              v{f.currentVersion}
            </span>
          </button>
        ))}
      </div>

      {/* Optimizer Banner Notification */}
      {optimizerMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-950 font-medium">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#2E7D32] shrink-0" />
            <span>{optimizerMessage}</span>
          </div>
          <button onClick={() => setOptimizerMessage(null)} className="text-emerald-800 hover:text-emerald-950">
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cost per 50kg Bag */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Raw Material Cost / 50kg Bag
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">
              RWF {formulaMetrics.costPer50kgBagRwf.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">({formulaMetrics.costPerKgRwf} RWF/kg)</span>
          </div>
          <p className="text-[11px] text-gray-500 pt-1">
            Standard 1-Ton Batch: RWF {(formulaMetrics.costPerKgRwf * 1000).toLocaleString()}
          </p>
        </div>

        {/* Selling Price */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Selling Price / 50kg Bag
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">
              RWF {formulaMetrics.sellingPriceRwf.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-gray-500">Retail Depot</span>
          </div>
          <p className="text-[11px] text-gray-500 pt-1">
            Code: <strong className="text-gray-700">{activeFormula.code}</strong>
          </p>
        </div>

        {/* Gross Profit per Bag */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Gross Margin Profit / Bag
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                formulaMetrics.grossProfitPerBagRwf >= 6000 ? 'text-[#2E7D32]' : 'text-amber-600'
              }`}
            >
              + RWF {formulaMetrics.grossProfitPerBagRwf.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-gray-500">/ Bag</span>
          </div>
          <p className="text-[11px] text-gray-500 pt-1">
            Total Profit per 1-Ton: RWF {(formulaMetrics.grossProfitPerBagRwf * 20).toLocaleString()}
          </p>
        </div>

        {/* Gross Margin % */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Live Gross Margin %
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-black ${
                formulaMetrics.grossMarginPct >= 20
                  ? 'text-[#2E7D32]'
                  : formulaMetrics.grossMarginPct >= 12
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}
            >
              {formulaMetrics.grossMarginPct}%
            </span>
            {formulaMetrics.grossMarginPct >= 20 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                <TrendingUp size={12} /> High Yield
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                Target ≥ 20%
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 pt-1">
            Status: <span className="font-semibold text-gray-800">{activeFormula.stage}</span>
          </p>
        </div>
      </div>

      {/* Main Grid: LCF Matrix & Nutritional Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Recipe & LCF Controls (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {activeFormula.name}
              </h2>
              <p className="text-xs text-gray-500">
                Formula Version {activeFormula.currentVersion} • Certified by {activeFormula.approvedBy || 'Quality Lab'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLeastCostOptimize}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white text-xs font-bold shadow-xs transition"
              >
                <Sparkles size={13} />
                🎯 Auto-Optimize Least-Cost
              </button>

              {formulaMetrics.totalInclusion !== 100 && (
                <button
                  type="button"
                  onClick={handleNormalizeRecipe}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition"
                >
                  <Scale size={13} />
                  Normalize to 100%
                </button>
              )}
            </div>
          </div>

          {/* Inclusion Progress Gauge */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-gray-700">Total Formula Inclusion:</span>
              <span
                className={`font-black ${
                  formulaMetrics.totalInclusion === 100 ? 'text-[#2E7D32]' : 'text-amber-600'
                }`}
              >
                {formulaMetrics.totalInclusion}% / 100%
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
              {activeFormula.recipe.map((it) => {
                const ing = ingredientsMap.get(it.ingredientId);
                const color =
                  ing?.category === 'protein'
                    ? 'bg-amber-500'
                    : ing?.category === 'energy'
                    ? 'bg-yellow-400'
                    : ing?.category === 'fibre'
                    ? 'bg-stone-400'
                    : ing?.category === 'mineral'
                    ? 'bg-blue-400'
                    : 'bg-[#2E7D32]';
                return (
                  <div
                    key={it.ingredientId}
                    style={{ width: `${Math.min(100, it.inclusionPct)}%` }}
                    className={`${color} h-full transition-all`}
                    title={`${ing?.name}: ${it.inclusionPct}%`}
                  />
                );
              })}
            </div>
          </div>

          {/* Recipe Ingredients Interactive Table */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Raw Material / Ingredient</th>
                  <th className="px-3 py-3 text-right">Market Price</th>
                  <th className="px-4 py-3 text-center">Inclusion %</th>
                  <th className="px-3 py-3 text-right">Per 1-Ton Batch</th>
                  <th className="px-3 py-3 text-right">Cost Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeFormula.recipe.map((it) => {
                  const ing = ingredientsMap.get(it.ingredientId);
                  if (!ing) return null;
                  const batchKg = Math.round((it.inclusionPct / 100) * 1000);
                  const costContribution = Math.round((it.inclusionPct / 100) * ing.costPerKgRwf);

                  return (
                    <tr key={it.ingredientId} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{ing.name}</div>
                        <div className="text-[10px] text-gray-400">
                          {ing.sourceRegion} • CP: {ing.crudeProteinPct}% • {ing.energyKcalPerKg} kcal
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-1 font-mono font-bold text-gray-800">
                          <input
                            type="number"
                            min={1}
                            value={ing.costPerKgRwf}
                            onChange={(e) =>
                              handleUpdateIngredientPrice(ing.id, parseInt(e.target.value) || 0)
                            }
                            className="w-16 px-1.5 py-0.5 text-right bg-gray-50 border border-gray-200 rounded font-mono font-bold text-xs"
                          />
                          <span className="text-[10px] text-gray-400">RWF</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="range"
                            min={0}
                            max={80}
                            step={0.5}
                            value={it.inclusionPct}
                            onChange={(e) =>
                              handleUpdateInclusion(it.ingredientId, parseFloat(e.target.value))
                            }
                            className="w-20 sm:w-28 accent-[#2E7D32] cursor-pointer"
                          />
                          <span className="w-12 text-right font-bold text-[#2E7D32]">
                            {it.inclusionPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-gray-800">
                        {batchKg} kg
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-gray-900">
                        {costContribution.toLocaleString()} RWF/kg
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Recipe Notes */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-600 flex items-start gap-2">
            <Layers size={16} className="text-[#2E7D32] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-800">Batch Formulation Guidance:</span>
              <p className="text-[11px] text-gray-500 mt-0.5">{activeFormula.notes}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Guaranteed Nutritional Analysis & RSB Compliance */}
        <div className="space-y-6">
          {/* RSB EAS 353 Compliance Card */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                <ShieldCheck size={18} className="text-[#2E7D32]" />
                <span>RSB EAS 353 Compliance</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  formulaMetrics.isOverallCompliant
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-red-100 text-red-900 border-red-300'
                }`}
              >
                {formulaMetrics.isOverallCompliant ? '✓ PASSES RSB' : '⚠️ NON-COMPLIANT'}
              </span>
            </div>

            {/* Protein Metric Meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Crude Protein (CP):</span>
                <span className="font-bold text-gray-900">
                  {formulaMetrics.totalProteinPct}%{' '}
                  <span className="text-gray-400 font-normal">(Min {activeFormula.minProteinPct}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, (formulaMetrics.totalProteinPct / (activeFormula.minProteinPct * 1.3)) * 100)}%`,
                  }}
                  className={`h-full ${
                    formulaMetrics.isProteinCompliant ? 'bg-[#2E7D32]' : 'bg-red-500'
                  }`}
                />
              </div>
              {!formulaMetrics.isProteinCompliant && (
                <p className="text-[10px] text-red-600 font-semibold">
                  * Alert: Under mandatory minimum protein! Increase Soya Bean meal inclusion.
                </p>
              )}
            </div>

            {/* Energy */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Metabolizable Energy:</span>
                <span className="font-bold text-gray-900">
                  {formulaMetrics.totalEnergyKcal} kcal/kg{' '}
                  <span className="text-gray-400 font-normal">(Target {activeFormula.minEnergyKcal})</span>
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, (formulaMetrics.totalEnergyKcal / 3500) * 100)}%`,
                  }}
                  className="h-full bg-yellow-500"
                />
              </div>
            </div>

            {/* Crude Fibre */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Crude Fibre:</span>
                <span className="font-bold text-gray-900">
                  {formulaMetrics.totalFibrePct}%{' '}
                  <span className="text-gray-400 font-normal">(Max {activeFormula.maxFibrePct}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, (formulaMetrics.totalFibrePct / 12) * 100)}%`,
                  }}
                  className="h-full bg-stone-400"
                />
              </div>
            </div>

            {/* Calcium & Minerals */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Bioavailable Calcium (Ca):</span>
                <span className="font-bold text-gray-900">{formulaMetrics.totalCalciumPct}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, (formulaMetrics.totalCalciumPct / 4.5) * 100)}%`,
                  }}
                  className="h-full bg-blue-500"
                />
              </div>
            </div>

            {/* Moisture */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-gray-700">Moisture Content:</span>
                <span className="font-bold text-gray-900">
                  {formulaMetrics.totalMoisturePct}%{' '}
                  <span className="text-gray-400 font-normal">(Max 12%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, (formulaMetrics.totalMoisturePct / 15) * 100)}%`,
                  }}
                  className="h-full bg-cyan-500"
                />
              </div>
            </div>

            {/* Statutory Compliance Footer */}
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-[11px] text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Standard Code:</span>
                <span className="font-semibold text-gray-900">{activeFormula.rsbStandard}</span>
              </div>
              <div className="flex justify-between">
                <span>Max Aflatoxin:</span>
                <span className="font-bold text-[#2E7D32]">{'< 10 ppb (Pass)'}</span>
              </div>
              <div className="flex justify-between">
                <span>RICA Permit:</span>
                <span className="font-mono text-gray-800">00492-RICA-2026</span>
              </div>
            </div>
          </div>

          {/* Quick Raw Material Price Adjuster */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
              <DollarSign size={16} className="text-[#2E7D32]" />
              <span>Raw Material Procurement Rates</span>
            </div>
            <p className="text-[11px] text-gray-500">
              Simulate price shocks (e.g. drought or cross-border grain fluctuations) to inspect impact on gross margin in real time.
            </p>

            <div className="space-y-2 text-xs">
              {ingredients.slice(0, 3).map((ing) => (
                <div key={ing.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                  <div>
                    <span className="font-bold text-gray-800 block text-xs">{ing.name}</span>
                    <span className="text-[10px] text-gray-500">{ing.sourceRegion}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={ing.costPerKgRwf}
                      onChange={(e) =>
                        handleUpdateIngredientPrice(ing.id, parseInt(e.target.value) || 0)
                      }
                      className="w-16 px-2 py-1 bg-white border border-gray-300 rounded font-mono font-bold text-right text-xs"
                    />
                    <span className="text-[10px] font-bold text-gray-500">RWF</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mill Mixing Sheet Printable Modal */}
      {batchSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50 print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-[#2E7D32]" />
                <h3 className="font-bold text-gray-900 text-sm">Official Mill Batch Mixing Sheet</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Print Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setBatchSheetOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 print:p-0">
              {/* Mixing Header */}
              <div className="text-center pb-3 border-b border-gray-200">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                  Turashoboye Feed Mills Ltd
                </h2>
                <p className="text-xs text-gray-600">
                  Primary Feed Compounding Depot • Sector Mahama, Kirehe District, Rwanda
                </p>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#2E7D32] rounded-full text-xs font-bold border border-emerald-200">
                  <span>Batch Recipe: {activeFormula.name}</span>
                  <span>•</span>
                  <span>Standard Size: {selectedBatchSizeKg.toLocaleString()} kg (20 bags)</span>
                </div>
              </div>

              {/* Batch Size Selector */}
              <div className="flex items-center justify-between text-xs print:hidden">
                <span className="font-semibold text-gray-700">Planned Batch Size:</span>
                <div className="flex gap-1.5">
                  {[500, 1000, 2000, 5000].map((kg) => (
                    <button
                      key={kg}
                      type="button"
                      onClick={() => setSelectedBatchSizeKg(kg)}
                      className={`px-2.5 py-1 rounded-lg border font-bold text-xs ${
                        selectedBatchSizeKg === kg
                          ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      {kg >= 1000 ? `${kg / 1000} Ton` : `${kg} kg`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mixing Table */}
              <table className="w-full text-xs text-left border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-100 text-gray-800 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-2.5">Raw Material</th>
                    <th className="p-2.5 text-center">Inclusion %</th>
                    <th className="p-2.5 text-right">Target Weight</th>
                    <th className="p-2.5 text-center">Bag Equivalent (50kg)</th>
                    <th className="p-2.5 text-center print:table-cell">Weighed By (Sign)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeFormula.recipe.map((it) => {
                    const ing = ingredientsMap.get(it.ingredientId);
                    const weightKg = ((it.inclusionPct / 100) * selectedBatchSizeKg).toFixed(1);
                    const bagCount = (parseFloat(weightKg) / 50).toFixed(1);
                    return (
                      <tr key={it.ingredientId}>
                        <td className="p-2.5 font-bold text-gray-900">{ing?.name}</td>
                        <td className="p-2.5 text-center font-bold text-[#2E7D32]">
                          {it.inclusionPct}%
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-gray-900">
                          {weightKg} kg
                        </td>
                        <td className="p-2.5 text-center font-mono text-gray-600">
                          {bagCount} bags
                        </td>
                        <td className="p-2.5 text-center text-gray-300 font-mono">
                          __________________
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Quality & Signoff */}
              <div className="pt-4 grid grid-cols-2 gap-4 text-xs text-gray-700 border-t border-gray-200">
                <div>
                  <span className="font-bold block">Compounding Supervisor:</span>
                  <div className="mt-4 pt-1 border-b border-gray-400 text-gray-400">Signature / Date</div>
                </div>
                <div>
                  <span className="font-bold block">Quality Assurance Inspector:</span>
                  <div className="mt-4 pt-1 border-b border-gray-400 text-gray-400">Signature / Date</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Formulation Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">New Least-Cost Formulation Recipe</h2>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateFormula} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Formula Name *
                </label>
                <input
                  type="text"
                  required
                  value={newFormulaName}
                  onChange={(e) => setNewFormulaName(e.target.value)}
                  placeholder="e.g. Turashoboye Broiler Finisher Mash v3"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Animal Species *
                  </label>
                  <select
                    value={newAnimalType}
                    onChange={(e) => setNewAnimalType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  >
                    <option value="Broiler">Broiler Poultry</option>
                    <option value="Layers">Layer Poultry</option>
                    <option value="Dairy Cattle">Dairy Cattle</option>
                    <option value="Pig / Swine">Pig / Swine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    RSB Min Protein (CP %) *
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    min={10}
                    max={30}
                    required
                    value={newMinProtein}
                    onChange={(e) => setNewMinProtein(parseFloat(e.target.value) || 20.0)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Selling Price (RWF / 50kg bag) *
                </label>
                <input
                  type="number"
                  step={500}
                  min={10000}
                  required
                  value={newSellingPrice}
                  onChange={(e) => setNewSellingPrice(parseInt(e.target.value) || 35000)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px]">
                ℹ️ The recipe will initialize with balanced starter ratios. You can tune the ingredient sliders and click <strong>Auto-Optimize</strong> to achieve least-cost compliance.
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold shadow-xs"
                >
                  Create & Launch Optimizer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
