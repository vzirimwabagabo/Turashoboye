import { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  CreditCard,
  Plus,
  Search,
  Printer,
  Building2,
  FileText,
  X,
  Send,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PAYMENT_CONFIG } from '../../config/paymentConfig';

// =============================================================================
// Interfaces
// =============================================================================

export interface CooperativeAccount {
  id: string;
  name: string;
  rcaRegistrationNumber: string; // Rwanda Cooperative Agency (RCA) Code
  representativeName: string;
  phone: string;
  sector: string; // e.g. "Mahama", "Nyakarambi", "Gatore"
  district: string; // "Kirehe", "Ngoma", "Nyagatare"
  creditLimitRwf: number;
  creditUtilizedRwf: number;
  tier: 'Tier A (Low Risk)' | 'Tier B (Moderate Risk)' | 'Tier C (Credit Hold)';
  daysPastDue: number;
  totalFlocksCompleted: number;
  status: 'active' | 'suspended' | 'under_review';
}

export interface LayawayMilestone {
  stage: 1 | 2 | 3;
  name: string;
  dueWeek: number; // Week 0, Week 3, Week 6
  percentage: number; // 30%, 35%, 35%
  amountRwf: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  paymentReference?: string;
}

export interface FlockContract {
  id: string;
  contractNumber: string; // e.g. "LAY-2026-004"
  cooperativeId: string;
  cooperativeName: string;
  animalType: 'Broiler' | 'Layers' | 'Dairy Cattle';
  flockSize: number; // e.g. 1000 birds
  chickPlacementDate: string; // Day 1
  projectedHarvestDate: string; // Week 6
  totalFeedBags: number; // e.g. 25 Starter + 55 Finisher = 80 bags
  starterBags: number;
  finisherBags: number;
  totalContractRwf: number;
  paidAmountRwf: number;
  balanceDueRwf: number;
  milestones: LayawayMilestone[];
  status: 'active' | 'completed' | 'overdue' | 'defaulted';
  notes?: string;
}

// =============================================================================
// Initial Benchmark Data (Kirehe & Eastern Province Cooperatives)
// =============================================================================

const INITIAL_COOPERATIVES: CooperativeAccount[] = [
  {
    id: 'coop-1',
    name: "Koperative Y'Aborozi ba Mahama (KOABAMA)",
    rcaRegistrationNumber: 'RCA/0491/2021',
    representativeName: 'Jean Damascene Nzeyimana',
    phone: '0788123456',
    sector: 'Mahama',
    district: 'Kirehe',
    creditLimitRwf: 6000000,
    creditUtilizedRwf: 3200000,
    tier: 'Tier A (Low Risk)',
    daysPastDue: 0,
    totalFlocksCompleted: 14,
    status: 'active',
  },
  {
    id: 'coop-2',
    name: 'Tuzamurane Kirehe Commercial Poultry Co-op',
    rcaRegistrationNumber: 'RCA/0712/2023',
    representativeName: 'Chantal Mukamana',
    phone: '0789654321',
    sector: 'Nyakarambi',
    district: 'Kirehe',
    creditLimitRwf: 4500000,
    creditUtilizedRwf: 2750000,
    tier: 'Tier B (Moderate Risk)',
    daysPastDue: 4,
    totalFlocksCompleted: 8,
    status: 'active',
  },
  {
    id: 'coop-3',
    name: 'Duterimbere Mahama Refugee Youth Farmers',
    rcaRegistrationNumber: 'RCA/1089/2024',
    representativeName: 'Eric Hakizimana',
    phone: '0722334455',
    sector: 'Mahama Camp',
    district: 'Kirehe',
    creditLimitRwf: 2500000,
    creditUtilizedRwf: 2500000,
    tier: 'Tier C (Credit Hold)',
    daysPastDue: 18,
    totalFlocksCompleted: 3,
    status: 'suspended',
  },
];

const INITIAL_CONTRACTS: FlockContract[] = [
  {
    id: 'cnt-1',
    contractNumber: 'LAY-2026-001',
    cooperativeId: 'coop-1',
    cooperativeName: "Koperative Y'Aborozi ba Mahama (KOABAMA)",
    animalType: 'Broiler',
    flockSize: 1200,
    chickPlacementDate: '2026-10-15',
    projectedHarvestDate: '2026-11-28',
    totalFeedBags: 96,
    starterBags: 30,
    finisherBags: 66,
    totalContractRwf: 3280000,
    paidAmountRwf: 2132000,
    balanceDueRwf: 1148000,
    milestones: [
      {
        stage: 1,
        name: 'Day 1 Placement Deposit (30%)',
        dueWeek: 0,
        percentage: 30,
        amountRwf: 984000,
        dueDate: '2026-10-15',
        status: 'paid',
        paidDate: '2026-10-15',
        paymentReference: 'MoMo MP261015.001',
      },
      {
        stage: 2,
        name: 'Week 3 Finisher Transition (35%)',
        dueWeek: 3,
        percentage: 35,
        amountRwf: 1148000,
        dueDate: '2026-11-05',
        status: 'paid',
        paidDate: '2026-11-05',
        paymentReference: 'BK Slip BK-DEP-261105',
      },
      {
        stage: 3,
        name: 'Week 6 Slaughter & Market Clearance (35%)',
        dueWeek: 6,
        percentage: 35,
        amountRwf: 1148000,
        dueDate: '2026-11-28',
        status: 'pending',
      },
    ],
    status: 'active',
    notes: 'Chick batch from National Hatchery. Off-taker agreement with Kigali Wholesale Abattoir.',
  },
  {
    id: 'cnt-2',
    contractNumber: 'LAY-2026-002',
    cooperativeId: 'coop-2',
    cooperativeName: 'Tuzamurane Kirehe Commercial Poultry Co-op',
    animalType: 'Broiler',
    flockSize: 1000,
    chickPlacementDate: '2026-10-20',
    projectedHarvestDate: '2026-12-02',
    totalFeedBags: 80,
    starterBags: 25,
    finisherBags: 55,
    totalContractRwf: 2750000,
    paidAmountRwf: 825000,
    balanceDueRwf: 1925000,
    milestones: [
      {
        stage: 1,
        name: 'Day 1 Placement Deposit (30%)',
        dueWeek: 0,
        percentage: 30,
        amountRwf: 825000,
        dueDate: '2026-10-20',
        status: 'paid',
        paidDate: '2026-10-20',
        paymentReference: 'MoMo MP261020.891',
      },
      {
        stage: 2,
        name: 'Week 3 Finisher Transition (35%)',
        dueWeek: 3,
        percentage: 35,
        amountRwf: 962500,
        dueDate: '2026-11-10',
        status: 'overdue',
      },
      {
        stage: 3,
        name: 'Week 6 Slaughter & Market Clearance (35%)',
        dueWeek: 6,
        percentage: 35,
        amountRwf: 962500,
        dueDate: '2026-12-02',
        status: 'pending',
      },
    ],
    status: 'overdue',
    notes: 'Finisher stage bags held at Mahama depot until Stage 2 payment is cleared.',
  },
];

const LOCAL_STORAGE_KEY_COOPS = 'turashoboye_coop_accounts_store';
const LOCAL_STORAGE_KEY_CONTRACTS = 'turashoboye_flock_contracts_store';

export default function CreditLedgerPage() {
  const { user } = useAuth();

  // State
  const [cooperatives, setCooperatives] = useState<CooperativeAccount[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_COOPS);
      return saved ? JSON.parse(saved) : INITIAL_COOPERATIVES;
    } catch {
      return INITIAL_COOPERATIVES;
    }
  });

  const [contracts, setContracts] = useState<FlockContract[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CONTRACTS);
      return saved ? JSON.parse(saved) : INITIAL_CONTRACTS;
    } catch {
      return INITIAL_CONTRACTS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'contracts' | 'cooperatives'>('contracts');

  // Modals
  const [newContractOpen, setNewContractOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedContractForPayment, setSelectedContractForPayment] = useState<FlockContract | null>(null);
  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const [selectedContractForAgreement, setSelectedContractForAgreement] = useState<FlockContract | null>(null);

  // New Contract Wizard State
  const [wizardCoopId, setWizardCoopId] = useState(INITIAL_COOPERATIVES[0].id);
  const [wizardFlockSize, setWizardFlockSize] = useState<number>(1000);
  const [wizardAnimalType, setWizardAnimalType] = useState<'Broiler' | 'Layers' | 'Dairy Cattle'>('Broiler');
  const [wizardPlacementDate, setWizardPlacementDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [wizardNotes, setWizardNotes] = useState('');

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'momo' | 'bank_transfer' | 'cash'>('momo');
  const [payPhone, setPayPhone] = useState('0788123456');
  const [payRef, setPayRef] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  const isManagement = ['manager', 'owner', 'super_admin'].includes(user?.profile?.role || '');

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_COOPS, JSON.stringify(cooperatives));
    } catch (e) {
      console.warn('Could not save coops to localStorage', e);
    }
  }, [cooperatives]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CONTRACTS, JSON.stringify(contracts));
    } catch (e) {
      console.warn('Could not save contracts to localStorage', e);
    }
  }, [contracts]);

  // Aggregate Portfolio Financials
  const portfolioSummary = useMemo(() => {
    const totalCreditLimit = cooperatives.reduce((sum, c) => sum + c.creditLimitRwf, 0);
    const totalDrawn = cooperatives.reduce((sum, c) => sum + c.creditUtilizedRwf, 0);
    const totalAvailable = Math.max(0, totalCreditLimit - totalDrawn);
    const activeContractsCount = contracts.filter((c) => c.status === 'active').length;
    const overdueContractsCount = contracts.filter((c) => c.status === 'overdue').length;
    const totalOverdueAmount = contracts
      .filter((c) => c.status === 'overdue')
      .reduce((sum, c) => sum + c.balanceDueRwf, 0);

    return {
      totalCreditLimit,
      totalDrawn,
      totalAvailable,
      activeContractsCount,
      overdueContractsCount,
      totalOverdueAmount,
    };
  }, [cooperatives, contracts]);

  // Filtered Contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.contractNumber.toLowerCase().includes(q) ||
        c.cooperativeName.toLowerCase().includes(q) ||
        c.animalType.toLowerCase().includes(q)
      );
    });
  }, [contracts, searchQuery]);

  // Handle Create Contract
  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    const coop = cooperatives.find((c) => c.id === wizardCoopId) || cooperatives[0];

    // Broiler feed calculation: ~25 bags Starter + ~55 bags Finisher per 1,000 birds
    const ratio = wizardFlockSize / 1000;
    const starterBags = Math.round(25 * ratio);
    const finisherBags = Math.round(55 * ratio);
    const totalBags = starterBags + finisherBags;

    // Pricing (36,500 RWF for Starter, 34,000 RWF for Finisher)
    const totalContractRwf = starterBags * 36500 + finisherBags * 34000;

    const startDate = new Date(wizardPlacementDate);
    const week3Date = new Date(startDate);
    week3Date.setDate(week3Date.getDate() + 21);
    const week6Date = new Date(startDate);
    week6Date.setDate(week6Date.getDate() + 42);

    const depositRwf = Math.round(totalContractRwf * 0.30);
    const milestone2Rwf = Math.round(totalContractRwf * 0.35);
    const milestone3Rwf = totalContractRwf - depositRwf - milestone2Rwf;

    const newContract: FlockContract = {
      id: `cnt-${Date.now()}`,
      contractNumber: `LAY-2026-${Math.floor(100 + Math.random() * 900)}`,
      cooperativeId: coop.id,
      cooperativeName: coop.name,
      animalType: wizardAnimalType,
      flockSize: wizardFlockSize,
      chickPlacementDate: wizardPlacementDate,
      projectedHarvestDate: week6Date.toISOString().split('T')[0],
      totalFeedBags: totalBags,
      starterBags,
      finisherBags,
      totalContractRwf,
      paidAmountRwf: 0,
      balanceDueRwf: totalContractRwf,
      milestones: [
        {
          stage: 1,
          name: 'Day 1 Placement Deposit (30%)',
          dueWeek: 0,
          percentage: 30,
          amountRwf: depositRwf,
          dueDate: wizardPlacementDate,
          status: 'pending',
        },
        {
          stage: 2,
          name: 'Week 3 Finisher Transition (35%)',
          dueWeek: 3,
          percentage: 35,
          amountRwf: milestone2Rwf,
          dueDate: week3Date.toISOString().split('T')[0],
          status: 'pending',
        },
        {
          stage: 3,
          name: 'Week 6 Slaughter & Market Clearance (35%)',
          dueWeek: 6,
          percentage: 35,
          amountRwf: milestone3Rwf,
          dueDate: week6Date.toISOString().split('T')[0],
          status: 'pending',
        },
      ],
      status: 'active',
      notes: wizardNotes || 'Flock contract approved under cooperative harvest lien guarantee.',
    };

    // Update coop credit utilized
    setCooperatives((prev) =>
      prev.map((c) =>
        c.id === coop.id
          ? { ...c, creditUtilizedRwf: c.creditUtilizedRwf + totalContractRwf }
          : c
      )
    );

    setContracts((prev) => [newContract, ...prev]);
    setNewContractOpen(false);
  };

  // Open Payment Modal for Contract
  const handleOpenPayment = (contract: FlockContract) => {
    setSelectedContractForPayment(contract);
    // Suggest the next pending milestone amount
    const nextPending = contract.milestones.find((m) => m.status !== 'paid');
    setPayAmount(nextPending ? nextPending.amountRwf : contract.balanceDueRwf);
    const coop = cooperatives.find((c) => c.id === contract.cooperativeId);
    if (coop) setPayPhone(coop.phone);
    setPaymentModalOpen(true);
  };

  // Submit Payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractForPayment) return;

    setIsSubmittingPay(true);
    const contractId = selectedContractForPayment.id;
    const nowStr = new Date().toISOString().split('T')[0];
    const generatedRef = payRef || `PAY-${Date.now().toString().slice(-6)}`;

    setContracts((prev) =>
      prev.map((cnt) => {
        if (cnt.id !== contractId) return cnt;

        const newPaid = cnt.paidAmountRwf + payAmount;
        const newBalance = Math.max(0, cnt.totalContractRwf - newPaid);

        // Update milestones
        let remainingToCredit = payAmount;
        const updatedMilestones = cnt.milestones.map((m) => {
          if (m.status === 'paid') return m;
          if (remainingToCredit >= m.amountRwf) {
            remainingToCredit -= m.amountRwf;
            return {
              ...m,
              status: 'paid' as const,
              paidDate: nowStr,
              paymentReference: `${payMethod.toUpperCase()} Ref: ${generatedRef}`,
            };
          }
          return m;
        });

        const isFullyPaid = newBalance === 0;
        const hasOverdueMilestones = updatedMilestones.some((m) => m.status === 'overdue');

        return {
          ...cnt,
          paidAmountRwf: newPaid,
          balanceDueRwf: newBalance,
          milestones: updatedMilestones,
          status: isFullyPaid ? 'completed' : hasOverdueMilestones ? 'overdue' : 'active',
        };
      })
    );

    // Decrease utilized credit on cooperative
    setCooperatives((prev) =>
      prev.map((c) => {
        if (c.id !== selectedContractForPayment.cooperativeId) return c;
        return {
          ...c,
          creditUtilizedRwf: Math.max(0, c.creditUtilizedRwf - payAmount),
        };
      })
    );

    setIsSubmittingPay(false);
    setPaymentModalOpen(false);
    setSelectedContractForPayment(null);
  };

  // Open Legal Agreement Modal
  const handleOpenAgreement = (contract: FlockContract) => {
    setSelectedContractForAgreement(contract);
    setAgreementModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Cooperative Credit & Flock-Cycle Layaway Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
              RCA Rwanda Compliant
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            6-Week broiler harvest layaway contracts (30% deposit, 35% finisher transition, 35% slaughter settlement) and cooperative credit limits.
          </p>
        </div>

        {isManagement && (
          <button
            onClick={() => setNewContractOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold shadow-xs transition"
          >
            <Plus size={16} />
            New Flock Layaway Contract
          </button>
        )}
      </div>

      {/* Financial Portfolio KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Approved Co-op Credit Facility
          </span>
          <div className="text-2xl font-black text-gray-900">
            RWF {portfolioSummary.totalCreditLimit.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500">
            Across {cooperatives.length} registered farmer co-ops
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Drawn Feed Credit
          </span>
          <div className="text-2xl font-black text-amber-600">
            RWF {portfolioSummary.totalDrawn.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
            <span>Available Headroom:</span>
            <span className="font-bold text-[#2E7D32]">
              RWF {portfolioSummary.totalAvailable.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Active 6-Week Flock Runs
          </span>
          <div className="text-2xl font-black text-[#2E7D32]">
            {portfolioSummary.activeContractsCount} Flocks
          </div>
          <p className="text-[11px] text-gray-500">
            {contracts.reduce((sum, c) => sum + c.flockSize, 0).toLocaleString()} birds in production
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Overdue Harvest Layaways
          </span>
          <div className="text-2xl font-black text-red-600">
            {portfolioSummary.overdueContractsCount} Overdue
          </div>
          <p className="text-[11px] text-red-700 font-semibold">
            RWF {portfolioSummary.totalOverdueAmount.toLocaleString()} past milestone due date
          </p>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('contracts')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
              tab === 'contracts'
                ? 'bg-[#2E7D32] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calendar size={14} />
            Flock Layaway Contracts ({contracts.length})
          </button>
          <button
            onClick={() => setTab('cooperatives')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
              tab === 'cooperatives'
                ? 'bg-[#2E7D32] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Building2 size={14} />
            Cooperative Credit Accounts ({cooperatives.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search co-op, contract #…"
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          />
        </div>
      </div>

      {/* TAB 1: FLOCK LAYAWAY CONTRACTS */}
      {tab === 'contracts' && (
        <div className="space-y-4">
          {filteredContracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-5"
            >
              {/* Contract Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-gray-900">
                      {contract.contractNumber}
                    </span>
                    <span className="font-bold text-gray-800 text-sm">
                      • {contract.cooperativeName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        contract.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : contract.status === 'overdue'
                          ? 'bg-red-100 text-red-900 border-red-300'
                          : 'bg-blue-100 text-blue-900 border-blue-300'
                      }`}
                    >
                      {contract.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {contract.flockSize.toLocaleString()} {contract.animalType}s • Placed: {contract.chickPlacementDate} • Projected Harvest: {contract.projectedHarvestDate}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAgreement(contract)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition"
                  >
                    <FileText size={13} />
                    RCA Agreement
                  </button>

                  {contract.balanceDueRwf > 0 && (
                    <button
                      onClick={() => handleOpenPayment(contract)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold shadow-xs transition"
                    >
                      <CreditCard size={13} />
                      Record Layaway Payment
                    </button>
                  )}
                </div>
              </div>

              {/* Feed Allocation & Financial Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl text-xs">
                <div>
                  <span className="text-gray-500 text-[10px] uppercase font-bold block">Total Feed Contract</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">
                    {contract.totalFeedBags} Bags (50kg)
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    {contract.starterBags} Starter + {contract.finisherBags} Finisher
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 text-[10px] uppercase font-bold block">Total Value</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">
                    RWF {contract.totalContractRwf.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 text-[10px] uppercase font-bold block">Settled Amount</span>
                  <span className="font-mono font-bold text-[#2E7D32] text-sm">
                    RWF {contract.paidAmountRwf.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 text-[10px] uppercase font-bold block">Balance Outstanding</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      contract.balanceDueRwf > 0 ? 'text-red-600' : 'text-gray-500'
                    }`}
                  >
                    RWF {contract.balanceDueRwf.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 3-Stage Milestone Visual Timeline */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  3-Stage Flock-Cycle Repayment Schedule:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {contract.milestones.map((m) => (
                    <div
                      key={m.stage}
                      className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition ${
                        m.status === 'paid'
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : m.status === 'overdue'
                          ? 'bg-red-50/70 border-red-200 text-red-950'
                          : 'bg-gray-50 border-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs">Stage {m.stage}: {m.percentage}%</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            m.status === 'paid'
                              ? 'bg-emerald-200/80 text-emerald-900'
                              : m.status === 'overdue'
                              ? 'bg-red-200/80 text-red-900'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <p className="font-semibold text-[11px]">{m.name}</p>
                      <div className="flex items-baseline justify-between pt-1 border-t border-gray-200/50">
                        <span className="text-[10px] text-gray-500">Target Due: {m.dueDate}</span>
                        <span className="font-mono font-bold text-xs">
                          RWF {m.amountRwf.toLocaleString()}
                        </span>
                      </div>
                      {m.paymentReference && (
                        <p className="text-[10px] text-emerald-800 font-mono truncate">
                          ✓ Paid on {m.paidDate} ({m.paymentReference})
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: COOPERATIVE CREDIT ACCOUNTS */}
      {tab === 'cooperatives' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cooperatives.map((coop) => {
            const available = Math.max(0, coop.creditLimitRwf - coop.creditUtilizedRwf);
            const utilizationPct = Math.round((coop.creditUtilizedRwf / coop.creditLimitRwf) * 100);

            return (
              <div
                key={coop.id}
                className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        coop.tier.includes('Low Risk')
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : coop.tier.includes('Moderate')
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-red-100 text-red-900 border-red-300'
                      }`}
                    >
                      {coop.tier}
                    </span>
                    <span className="font-mono text-[10px] text-gray-500">
                      {coop.rcaRegistrationNumber}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug">
                      {coop.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {coop.sector} Sector, {coop.district} District
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Representative:</span>
                      <span className="font-bold text-gray-900">{coop.representativeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Contact Phone:</span>
                      <span className="font-mono font-bold text-gray-900">{coop.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Completed Harvests:</span>
                      <span className="font-bold text-[#2E7D32]">
                        {coop.totalFlocksCompleted} Flock Cycles
                      </span>
                    </div>
                  </div>

                  {/* Credit Utilization Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-600">Credit Utilization:</span>
                      <span className="font-bold text-gray-900">{utilizationPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, utilizationPct)}%` }}
                        className={`h-full ${
                          utilizationPct > 85
                            ? 'bg-red-500'
                            : utilizationPct > 60
                            ? 'bg-amber-500'
                            : 'bg-[#2E7D32]'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 pt-0.5 font-mono">
                      <span>Drawn: RWF {coop.creditUtilizedRwf.toLocaleString()}</span>
                      <span>Cap: RWF {coop.creditLimitRwf.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gray-500 font-semibold">
                    Headroom: <strong>RWF {available.toLocaleString()}</strong>
                  </span>
                  <a
                    href={`https://wa.me/25${coop.phone.replace(/^0/, '')}?text=Muraho%20${encodeURIComponent(coop.name)}%2C%20Turashoboye%20Feed%20Mills%20here.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2E7D32] hover:underline"
                  >
                    <Send size={12} /> Contact Co-op
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: NEW FLOCK LAYAWAY CONTRACT WIZARD */}
      {newContractOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[#2E7D32]" />
                <h3 className="font-bold text-gray-900 text-sm">New 6-Week Flock Layaway Contract</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewContractOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Contracting Cooperative / Farm *
                </label>
                <select
                  value={wizardCoopId}
                  onChange={(e) => setWizardCoopId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                >
                  {cooperatives.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.sector} Sector • {c.tier})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Animal Type *
                  </label>
                  <select
                    value={wizardAnimalType}
                    onChange={(e) => setWizardAnimalType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  >
                    <option value="Broiler">Broiler Meat Poultry (6 wks)</option>
                    <option value="Layers">Layer Poultry (Egg cycle)</option>
                    <option value="Dairy Cattle">Dairy Herd Mash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Flock Size (Birds) *
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    required
                    value={wizardFlockSize}
                    onChange={(e) => setWizardFlockSize(parseInt(e.target.value) || 500)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Day 1 Chick Placement Date *
                </label>
                <input
                  type="date"
                  required
                  value={wizardPlacementDate}
                  onChange={(e) => setWizardPlacementDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              {/* Auto Feed Estimate Calculation Box */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1.5 text-emerald-950">
                <span className="font-extrabold block text-xs">
                  Projected 6-Week Feed Allocation for {wizardFlockSize.toLocaleString()} birds:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span>Starter (0-3 wks):</span>{' '}
                    <strong className="font-mono">{Math.round(25 * (wizardFlockSize / 1000))} Bags</strong>
                  </div>
                  <div>
                    <span>Finisher (4-6 wks):</span>{' '}
                    <strong className="font-mono">{Math.round(55 * (wizardFlockSize / 1000))} Bags</strong>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-emerald-200 flex justify-between font-bold text-xs">
                  <span>Total Layaway Contract Value:</span>
                  <span className="text-[#2E7D32]">
                    RWF {(
                      Math.round(25 * (wizardFlockSize / 1000)) * 36500 +
                      Math.round(55 * (wizardFlockSize / 1000)) * 34000
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Special Notes / Abattoir Off-Taker:
                </label>
                <textarea
                  rows={2}
                  value={wizardNotes}
                  onChange={(e) => setWizardNotes(e.target.value)}
                  placeholder="e.g. Contract signed with Kigali poultry off-taker, Day-old chicks sourced from certified hatchery…"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setNewContractOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold shadow-xs"
                >
                  Create & Issue Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD LAYAWAY INSTALLMENT PAYMENT */}
      {paymentModalOpen && selectedContractForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#2E7D32]" />
                <h3 className="font-bold text-gray-900 text-sm">Record Layaway Installment</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Contract #:</span>
                  <span className="font-mono font-bold text-gray-900">{selectedContractForPayment.contractNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cooperative:</span>
                  <span className="font-bold text-gray-900">{selectedContractForPayment.cooperativeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Outstanding Balance:</span>
                  <span className="font-mono font-bold text-red-600">
                    RWF {selectedContractForPayment.balanceDueRwf.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Payment Method *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('momo')}
                    className={`p-2 rounded-xl border text-center font-bold text-xs ${
                      payMethod === 'momo'
                        ? 'bg-emerald-50 border-[#2E7D32] text-[#2E7D32]'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    📱 MoMo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('bank_transfer')}
                    className={`p-2 rounded-xl border text-center font-bold text-xs ${
                      payMethod === 'bank_transfer'
                        ? 'bg-emerald-50 border-[#2E7D32] text-[#2E7D32]'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    🏦 Bank Slip
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`p-2 rounded-xl border text-center font-bold text-xs ${
                      payMethod === 'cash'
                        ? 'bg-emerald-50 border-[#2E7D32] text-[#2E7D32]'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    💵 Depot Cash
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Amount Received (RWF) *
                </label>
                <input
                  type="number"
                  min={1000}
                  max={selectedContractForPayment.balanceDueRwf}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              {payMethod === 'momo' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Customer MoMo Phone:
                  </label>
                  <input
                    type="tel"
                    value={payPhone}
                    onChange={(e) => setPayPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Transaction / Deposit Slip Reference:
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. MP261112.001 or BK-DEP-991"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  Confirm Installment Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINTABLE LEGAL RCA CO-OP AGREEMENT */}
      {agreementModalOpen && selectedContractForAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50 print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-[#2E7D32]" />
                <h3 className="font-bold text-gray-900 text-sm">Official RCA Cooperative Feed Agreement</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Print Legal Dossier
                </button>
                <button
                  type="button"
                  onClick={() => setAgreementModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-5 text-xs text-gray-800 leading-relaxed print:p-0">
              {/* Official Heading */}
              <div className="text-center pb-4 border-b border-gray-300">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                  Turashoboye Feed Mills Ltd
                </h2>
                <p className="text-xs text-gray-600">
                  Primary Feed Compounding Depot • Sector Mahama, Kirehe District, Rwanda
                </p>
                <p className="text-[11px] font-mono text-gray-500 mt-1">
                  RRA TIN: {PAYMENT_CONFIG.rraTinNumber} • RICA License: {PAYMENT_CONFIG.ricaPermitNumber}
                </p>
                <h3 className="text-sm font-extrabold text-[#2E7D32] uppercase tracking-wide mt-3">
                  Tripartite Cooperative Flock-Cycle Feed Supply & Layaway Lien
                </h3>
                <span className="font-mono text-xs font-bold text-gray-600">
                  Contract Number: {selectedContractForAgreement.contractNumber}
                </span>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
                <div>
                  <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] block">The Supplier:</span>
                  <strong className="block text-gray-900 font-bold">Turashoboye Feed Mills Ltd</strong>
                  <span className="text-gray-600">Sector Mahama, Kirehe District</span>
                </div>
                <div>
                  <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] block">The Cooperative (Debtor):</span>
                  <strong className="block text-gray-900 font-bold">{selectedContractForAgreement.cooperativeName}</strong>
                  <span className="text-gray-600">RCA Registered Entity</span>
                </div>
              </div>

              {/* Clauses */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 uppercase text-xs">1. Scope of Supply</h4>
                <p className="text-gray-700">
                  The Supplier agrees to manufacture and reserve <strong>{selectedContractForAgreement.totalFeedBags} standard 50kg bags</strong> of RSB EAS 353 certified feed ({selectedContractForAgreement.starterBags} bags Starter, {selectedContractForAgreement.finisherBags} bags Finisher) for <strong>{selectedContractForAgreement.flockSize.toLocaleString()} {selectedContractForAgreement.animalType}s</strong> commencing on {selectedContractForAgreement.chickPlacementDate}.
                </p>

                <h4 className="font-bold text-gray-900 uppercase text-xs">2. 3-Stage Milestone Layaway Schedule</h4>
                <table className="w-full text-xs border border-gray-300 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 text-gray-800 font-bold">
                    <tr>
                      <th className="p-2">Stage</th>
                      <th className="p-2">Milestone Description</th>
                      <th className="p-2 text-right">Amount (RWF)</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-mono">
                    {selectedContractForAgreement.milestones.map((m) => (
                      <tr key={m.stage}>
                        <td className="p-2 font-bold">Stage {m.stage}</td>
                        <td className="p-2 font-sans">{m.name} (Due: {m.dueDate})</td>
                        <td className="p-2 text-right font-bold">RWF {m.amountRwf.toLocaleString()}</td>
                        <td className="p-2 text-center uppercase font-sans font-bold text-[10px]">
                          {m.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h4 className="font-bold text-gray-900 uppercase text-xs">3. Harvest Lien & Off-Taker Assignment</h4>
                <p className="text-gray-700">
                  The Cooperative assigns an irrevocable primary harvest lien over the flock output to Turashoboye Feed Mills. Any sale proceeds from abattoir off-takers shall first settle any outstanding feed balances prior to cooperative dividend disbursement.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 border-t border-gray-300">
                <div>
                  <span className="font-bold block text-gray-900">For Turashoboye Feed Mills Ltd:</span>
                  <div className="h-12 border-b border-gray-400 mt-2" />
                  <span className="text-[10px] text-gray-500">Authorized Managing Director / Seal</span>
                </div>
                <div>
                  <span className="font-bold block text-gray-900">For the Cooperative:</span>
                  <div className="h-12 border-b border-gray-400 mt-2" />
                  <span className="text-[10px] text-gray-500">Cooperative President / RCA Representative</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
