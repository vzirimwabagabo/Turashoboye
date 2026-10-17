import { useState } from 'react';
import {
  BarChart2,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SalesMetric {
  period: string;
  totalSalesRwf: number;
  cashCollectedRwf: number;
  momoCollectedRwf: number;
  receivablesRwf: number;
  orderCount: number;
}

interface BatchYieldMetric {
  batchNumber: string;
  productName: string;
  plannedKg: number;
  actualKg: number;
  lossKg: number;
  lossPercentage: number;
  completedDate: string;
  status: 'passed' | 'warning';
}

const SAMPLE_SALES_REPORT: SalesMetric[] = [
  {
    period: 'October 2026 (Month to Date)',
    totalSalesRwf: 1682000,
    cashCollectedRwf: 1100000,
    momoCollectedRwf: 414000,
    receivablesRwf: 168000,
    orderCount: 38,
  },
  {
    period: 'September 2026',
    totalSalesRwf: 2450000,
    cashCollectedRwf: 1820000,
    momoCollectedRwf: 630000,
    receivablesRwf: 0,
    orderCount: 52,
  },
];

const SAMPLE_BATCH_YIELDS: BatchYieldMetric[] = [
  {
    batchNumber: 'B-20261017-001',
    productName: 'Turashoboye Broiler Starter Mash (50kg)',
    plannedKg: 1000,
    actualKg: 978,
    lossKg: 22,
    lossPercentage: 2.2,
    completedDate: '2026-10-17',
    status: 'passed',
  },
  {
    batchNumber: 'B-20261016-004',
    productName: 'Turashoboye Broiler Starter Mash (50kg)',
    plannedKg: 1000,
    actualKg: 970,
    lossKg: 30,
    lossPercentage: 3.0,
    completedDate: '2026-10-16',
    status: 'passed',
  },
  {
    batchNumber: 'B-20261015-002',
    productName: 'Turashoboye Layer Complete Mash (50kg)',
    plannedKg: 1200,
    actualKg: 1135,
    lossKg: 65,
    lossPercentage: 5.4,
    completedDate: '2026-10-15',
    status: 'warning', // Triggered >5% threshold
  },
  {
    batchNumber: 'B-20261014-001',
    productName: 'Turashoboye Pig Grower Feed (50kg)',
    plannedKg: 800,
    actualKg: 785,
    lossKg: 15,
    lossPercentage: 1.88,
    completedDate: '2026-10-14',
    status: 'passed',
  },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'production' | 'inventory'>('sales');
  const [timeRange, setTimeRange] = useState<'30days' | '90days' | 'all'>('30days');

  const canViewReports = ['manager', 'owner'].includes(user?.profile?.role || '');

  // Helper to trigger CSV download
  const handleExportCSV = (reportType: string) => {
    let csvContent = '';
    let filename = '';

    if (reportType === 'sales') {
      filename = `turashoboye_sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'Period,Total Sales (RWF),Cash (RWF),MoMo (RWF),Receivables (RWF),Orders\n';
      SAMPLE_SALES_REPORT.forEach((row) => {
        csvContent += `"${row.period}",${row.totalSalesRwf},${row.cashCollectedRwf},${row.momoCollectedRwf},${row.receivablesRwf},${row.orderCount}\n`;
      });
    } else if (reportType === 'production') {
      filename = `turashoboye_production_yields_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'Batch Number,Product Name,Planned (kg),Actual Output (kg),Milling Loss (kg),Loss (%),Date,Status\n';
      SAMPLE_BATCH_YIELDS.forEach((row) => {
        csvContent += `"${row.batchNumber}","${row.productName}",${row.plannedKg},${row.actualKg},${row.lossKg},${row.lossPercentage}%,"${row.completedDate}","${row.status}"\n`;
      });
    } else {
      filename = `turashoboye_stock_movements_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'Date,Movement Type,SKU,Quantity,Location,Reason\n';
      csvContent += '"2026-10-17 09:15:00","sale","BSM-50KG",-2,"DEPOT-01","Sale order ORD-20261017-001"\n';
      csvContent += '"2026-10-17 08:30:00","production_output","BSM-50KG",20,"DEPOT-01","Yield from batch B-20261017-001"\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!canViewReports) {
    return (
      <div className="p-8 text-center text-gray-500">
        You do not have administrative permissions to view business financial reports.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-[#2E7D32]" />
            Business Reports & Operational Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sales revenue, milling batch yields, stock audit trail, and statutory reporting for Mahama Depot
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '30days' | '90days' | 'all')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-[#2E7D32] focus:outline-none shadow-xs"
          >
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last Quarter</option>
            <option value="all">Full Year 2026</option>
          </select>

          <button
            onClick={() => handleExportCSV(activeTab)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('sales')}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'sales'
                ? 'border-[#2E7D32] text-[#2E7D32]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Sales & Revenue
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'production'
                ? 'border-[#2E7D32] text-[#2E7D32]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Production & Yield Losses
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'inventory'
                ? 'border-[#2E7D32] text-[#2E7D32]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Stock Ledger & Movements
          </button>
        </nav>
      </div>

      {/* Tab 1: Sales & Revenue */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Total Revenue
              </span>
              <span className="text-2xl font-black text-[#2E7D32] mt-1 block">
                RWF 4,132,000
              </span>
              <span className="text-xs text-gray-500 mt-0.5 block">90 transactions</span>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Cash at Counter
              </span>
              <span className="text-2xl font-bold text-gray-900 mt-1 block">
                RWF 2,920,000
              </span>
              <span className="text-xs text-gray-500 mt-0.5 block">70.6% of turnover</span>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Mobile Money (MoMo)
              </span>
              <span className="text-2xl font-bold text-blue-700 mt-1 block">
                RWF 1,044,000
              </span>
              <span className="text-xs text-gray-500 mt-0.5 block">MTN & Airtel payments</span>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Open Receivables
              </span>
              <span className="text-2xl font-bold text-amber-700 mt-1 block">
                RWF 168,000
              </span>
              <span className="text-xs text-gray-500 mt-0.5 block">Cooperative accounts</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
            <div className="p-4 border-b border-gray-200 font-semibold text-gray-900 text-sm flex items-center justify-between">
              <span>Monthly Revenue Breakdown (Whole RWF)</span>
              <span className="text-xs font-normal text-gray-500">
                Statutory baseline compliant
              </span>
            </div>
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/75 text-xs uppercase text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-semibold">Accounting Period</th>
                  <th className="px-6 py-3 font-semibold text-right">Orders</th>
                  <th className="px-6 py-3 font-semibold text-right">Cash Received</th>
                  <th className="px-6 py-3 font-semibold text-right">MoMo Received</th>
                  <th className="px-6 py-3 font-semibold text-right">Outstanding</th>
                  <th className="px-6 py-3 font-semibold text-right">Total (RWF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {SAMPLE_SALES_REPORT.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/80">
                    <td className="px-6 py-4 font-medium text-gray-900">{row.period}</td>
                    <td className="px-6 py-4 text-right">{row.orderCount}</td>
                    <td className="px-6 py-4 text-right">RWF {row.cashCollectedRwf.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">RWF {row.momoCollectedRwf.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-amber-700">
                      RWF {row.receivablesRwf.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">
                      RWF {row.totalSalesRwf.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Production Yields */}
      {activeTab === 'production' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Milling & Production Variance Summary
                </h3>
                <p className="text-xs text-gray-500">
                  Configurable 5.0% operational variance threshold. Batches exceeding 5% are flagged for supervisor review.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 uppercase tracking-wider block font-semibold">
                  Average Loss
                </span>
                <span className="text-xl font-bold text-green-700">3.12%</span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/75 text-xs uppercase text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-semibold">Batch Code</th>
                  <th className="px-6 py-3 font-semibold">Product Description</th>
                  <th className="px-6 py-3 font-semibold text-right">Planned (kg)</th>
                  <th className="px-6 py-3 font-semibold text-right">Actual Output</th>
                  <th className="px-6 py-3 font-semibold text-right">Loss (kg)</th>
                  <th className="px-6 py-3 font-semibold text-right">Loss (%)</th>
                  <th className="px-6 py-3 font-semibold text-center">Variance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {SAMPLE_BATCH_YIELDS.map((row) => (
                  <tr key={row.batchNumber} className="hover:bg-gray-50/80">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900 text-xs">
                      {row.batchNumber}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{row.productName}</td>
                    <td className="px-6 py-4 text-right">{row.plannedKg} kg</td>
                    <td className="px-6 py-4 text-right font-semibold">{row.actualKg} kg</td>
                    <td className="px-6 py-4 text-right text-gray-500">{row.lossKg} kg</td>
                    <td className="px-6 py-4 text-right font-bold">
                      {row.lossPercentage.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.status === 'passed' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          <CheckCircle2 className="h-3 w-3" /> Within 5%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                          &gt; 5.0% Warning
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Inventory Audit Ledger */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900">
              Immutable Stock Movement Ledger
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Append-only transaction log. Every movement record contains quantity, SKU, user profile ID, and mandatory business reason.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/75 text-xs uppercase text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-semibold">Timestamp</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Product SKU</th>
                  <th className="px-6 py-3 font-semibold text-right">Quantity Change</th>
                  <th className="px-6 py-3 font-semibold">Depot Location</th>
                  <th className="px-6 py-3 font-semibold">Mandatory Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3 text-gray-500 font-mono">2026-10-17 09:15</td>
                  <td className="px-6 py-3">
                    <span className="rounded bg-blue-50 px-2 py-0.5 font-bold text-blue-700 uppercase text-[10px]">
                      SALE
                    </span>
                  </td>
                  <td className="px-6 py-3 font-semibold text-gray-900">BSM-50KG</td>
                  <td className="px-6 py-3 text-right font-bold text-red-600">-2 bags</td>
                  <td className="px-6 py-3 text-gray-600">DEPOT-01</td>
                  <td className="px-6 py-3 text-gray-700">Sale order ORD-20261017-001</td>
                </tr>
                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3 text-gray-500 font-mono">2026-10-17 08:30</td>
                  <td className="px-6 py-3">
                    <span className="rounded bg-green-50 px-2 py-0.5 font-bold text-green-700 uppercase text-[10px]">
                      PRODUCTION
                    </span>
                  </td>
                  <td className="px-6 py-3 font-semibold text-gray-900">BSM-50KG</td>
                  <td className="px-6 py-3 text-right font-bold text-green-700">+20 bags</td>
                  <td className="px-6 py-3 text-gray-600">DEPOT-01</td>
                  <td className="px-6 py-3 text-gray-700">Yield from batch B-20261017-001 (Loss: 2.2%)</td>
                </tr>
                <tr className="hover:bg-gray-50/80">
                  <td className="px-6 py-3 text-gray-500 font-mono">2026-10-16 14:00</td>
                  <td className="px-6 py-3">
                    <span className="rounded bg-purple-50 px-2 py-0.5 font-bold text-purple-700 uppercase text-[10px]">
                      RECEIPT
                    </span>
                  </td>
                  <td className="px-6 py-3 font-semibold text-gray-900">SOYA-50KG</td>
                  <td className="px-6 py-3 text-right font-bold text-purple-700">+100 bags</td>
                  <td className="px-6 py-3 text-gray-600">DEPOT-01</td>
                  <td className="px-6 py-3 text-gray-700">Goods Receipt for PO-20261016-001 from Rwanda Grains</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
