'use client';

import { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from "react";
import { BarChart3, Calendar, Building2, LineChart, Package, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useKioskReports } from "@/hooks/useKioskReports";
import { useKioskVenue } from "@/contexts/KioskVenueContext";
import { SalesSummary, TopProduct, DashboardStats, LowStockAlert, ProfitabilityReport, ExpensesReport } from "@/types/kiosk";
import { useTranslations } from '@/contexts/TranslationContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DatePicker, formatDateForInput } from '@/components/ui/date-picker';
import { DashboardKPIs } from "@/components/Kiosk/Reports/DashboardKPIs";
import { StockAlertsCard } from "@/components/Kiosk/Reports/StockAlertsCard";
import { TopProductsCard } from "@/components/Kiosk/Reports/TopProductsCard";
import { PaymentMethodsPieChart } from "@/components/Kiosk/Reports/PaymentMethodsPieChart";
import { CategoryBarChart } from "@/components/Kiosk/Reports/CategoryBarChart";
import { VenueComparisonChart } from "@/components/Kiosk/Reports/VenueComparisonChart";
import { MonthlySalesChart } from "@/components/Kiosk/Reports/MonthlySalesChart";
import { ProfitabilityCard } from "@/components/Kiosk/Reports/ProfitabilityCard";
import { ExpensesCard } from "@/components/Kiosk/Reports/ExpensesCard";

// Lazy load del componente de gráficas para mejor rendimiento
const SalesTrendChart = lazy(() => import("@/components/Kiosk/Reports/SalesTrendChart").then(module => ({ default: module.SalesTrendChart })));

export default function KioskReportsPage() {
  const t = useTranslations('kiosk');
  const { getSalesSummary, getTopProducts, getDashboardStats, getLowStockAlerts, getSalesTrend, getCategoryReport, getVenueComparisonReport, getMonthlyReport, getProfitabilityReport, getExpensesReport, isLoading } = useKioskReports();
  const { selectedVenueId, selectedVenue, setSelectedVenueId, venues, loading: loadingVenues } = useKioskVenue();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activePeriodTab, setActivePeriodTab] = useState('summary');
  
  // Estados para las fechas como Date objects (para DatePicker)
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(1);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(() => new Date());
  
  // Filtros inmediatos (para mostrar en la UI)
  const [filters, setFilters] = useState({
    venue_id: selectedVenueId || '',
    start_date: format(startDate, 'yyyy-MM-dd'),
    end_date: format(endDate, 'yyyy-MM-dd')
  });

  // Filtros con debounce (para cargar reportes)
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Actualizar filtros cuando cambia el venue seleccionado (sin debounce, inmediato)
  useEffect(() => {
    setFilters(prev => ({ ...prev, venue_id: selectedVenueId || '' }));
    setDebouncedFilters(prev => ({ ...prev, venue_id: selectedVenueId || '' }));
  }, [selectedVenueId]);
  
  // Sincronizar fechas con filtros cuando cambian (con debounce de 500ms)
  useEffect(() => {
    const newFilters = {
      venue_id: filters.venue_id, // Mantener venue_id actual
      start_date: formatDateForInput(startDate),
      end_date: formatDateForInput(endDate)
    };
    
    // Actualizar inmediatamente para mostrar en la UI
    setFilters(newFilters);
    
    // Debounce para cargar reportes (500ms)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilters(newFilters);
    }, 500);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [startDate, endDate, filters.venue_id]);
  
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [stockAlerts, setStockAlerts] = useState<{
    summary: {
      total_alerts: number;
      out_of_stock_count: number;
      low_stock_count: number;
      value_at_risk: number;
    };
    out_of_stock: LowStockAlert[];
    low_stock: LowStockAlert[];
  } | null>(null);
  const [trendData, setTrendData] = useState<{
    period: {
      days: number;
      start_date: string;
      end_date: string;
    };
    summary: {
      total_revenue: number;
      total_sales: number;
      average_per_day: number;
      average_per_active_day: number;
      active_days: number;
    };
    data: Array<{
      date: string;
      day_name: string;
      sales_count: number;
      total: number;
      moving_avg: number | null;
    }>;
  } | null>(null);
  const [trendDays, setTrendDays] = useState(30);
  const [categoryReport, setCategoryReport] = useState<{
    period: { start_date: string; end_date: string };
    total_revenue: number;
    total_items: number;
    categories: Array<{
      category_id: string | null;
      category_name: string;
      icon: string;
      color: string;
      items_sold: number;
      total_revenue: number;
      percentage: number;
      top_products: Array<{ name: string; quantity: number; total: number }>;
    }>;
  } | null>(null);
  const [venueComparison, setVenueComparison] = useState<{
    period: { start_date: string; end_date: string };
    global: {
      total_venues: number;
      total_sales: number;
      total_revenue: number;
      average_ticket: number;
    };
    venues: Array<{
      venue_id: string | null;
      venue_name: string;
      sales_count: number;
      total_revenue: number;
      average_ticket: number;
      percentage_of_total: number;
      by_payment_method: Record<string, { count: number; total: number }>;
      by_context: Record<string, { count: number; total: number }>;
    }>;
  } | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<{
    period: {
      year: number;
      month: number;
      month_name: string;
      start_date: string;
      end_date: string;
    };
    summary: {
      total_sales: number;
      total_revenue: number;
      average_daily: number;
      average_ticket: number;
      comparison: {
        previous_month_total: number;
        variation_amount: number;
        variation_percent: number;
      };
    };
    by_payment_method: Record<string, { count: number; total: number }>;
    by_context: Record<string, { count: number; total: number }>;
    best_day: { date: string; day_name: string; total: number } | null;
    daily_breakdown: Array<{
      date: string;
      day_name: string;
      sales_count: number;
      total: number;
      cash: number;
      transfer: number;
      card: number;
    }>;
  } | null>(null);
  const [profitability, setProfitability] = useState<ProfitabilityReport | null>(null);
  const [expenses, setExpenses] = useState<ExpensesReport | null>(null);

  // Estados de loading específicos por sección
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingPeriodReports, setLoadingPeriodReports] = useState(false);
  const [loadingCharts, setLoadingCharts] = useState(false);

  // Memoizar formatCurrency para evitar recrear la función
  const formatCurrency = useMemo(() => {
    return (value: number) => {
      return new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency: 'UYU',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      setLoadingDashboard(true);
      const [dashboardData, monthlyData] = await Promise.all([
        getDashboardStats(selectedVenueId || undefined),
        getMonthlyReport({ venue_id: selectedVenueId || undefined })
      ]);
      setDashboard(dashboardData);
      setMonthlyReport(monthlyData);
    } finally {
      setLoadingDashboard(false);
    }
  }, [selectedVenueId, getDashboardStats, getMonthlyReport]);

  const loadStockAlerts = useCallback(async () => {
    const alertsData = await getLowStockAlerts(selectedVenueId || undefined);
    setStockAlerts(alertsData);
  }, [selectedVenueId, getLowStockAlerts]);

  const loadTrend = useCallback(async () => {
    try {
      setLoadingCharts(true);
      const trend = await getSalesTrend(trendDays, selectedVenueId || undefined);
      setTrendData(trend);
    } finally {
      setLoadingCharts(false);
    }
  }, [trendDays, selectedVenueId, getSalesTrend]);

  const loadCategoryReport = useCallback(async () => {
    try {
      setLoadingCharts(true);
      const report = await getCategoryReport({
        venue_id: selectedVenueId || undefined,
        start_date: debouncedFilters.start_date,
        end_date: debouncedFilters.end_date
      });
      setCategoryReport(report);
    } finally {
      setLoadingCharts(false);
    }
  }, [selectedVenueId, debouncedFilters.start_date, debouncedFilters.end_date, getCategoryReport]);

  const loadVenueComparison = useCallback(async () => {
    try {
      setLoadingCharts(true);
      const report = await getVenueComparisonReport({
        start_date: debouncedFilters.start_date,
        end_date: debouncedFilters.end_date
      });
      setVenueComparison(report);
    } finally {
      setLoadingCharts(false);
    }
  }, [debouncedFilters.start_date, debouncedFilters.end_date, getVenueComparisonReport]);

  // Cargar dashboard y alertas al montar
  useEffect(() => {
    loadDashboard();
    loadStockAlerts();
  }, [loadDashboard, loadStockAlerts]);

  // Cargar tendencia cuando cambia el tab o los días
  useEffect(() => {
    if (activeTab === 'charts') {
      loadTrend();
      loadCategoryReport();
      if (venues.length > 1) {
        loadVenueComparison();
      }
    }
  }, [activeTab, loadTrend, loadCategoryReport, loadVenueComparison, venues.length]);

  // Cargar reportes según la sub-tab activa (usa debouncedFilters)
  const loadPeriodReports = useCallback(async (subTab: string) => {
    try {
      setLoadingPeriodReports(true);
      switch (subTab) {
        case 'summary':
          const [summaryData, topProductsData] = await Promise.all([
            getSalesSummary(debouncedFilters),
            getTopProducts(debouncedFilters)
          ]);
          setSummary(summaryData);
          setTopProducts(topProductsData);
          break;
        case 'profitability':
          const profitabilityData = await getProfitabilityReport(debouncedFilters);
          setProfitability(profitabilityData);
          break;
        case 'expenses':
          const expensesData = await getExpensesReport(debouncedFilters);
          setExpenses(expensesData);
          break;
        case 'top-products':
          const topProductsOnly = await getTopProducts(debouncedFilters);
          setTopProducts(topProductsOnly);
          break;
      }
    } finally {
      setLoadingPeriodReports(false);
    }
  }, [debouncedFilters, getSalesSummary, getTopProducts, getProfitabilityReport, getExpensesReport]);

  // Cargar automáticamente cuando cambia la tab period, sub-tab o filtros con debounce
  useEffect(() => {
    if (activeTab === 'period') {
      loadPeriodReports(activePeriodTab);
    }
  }, [activeTab, activePeriodTab, debouncedFilters, loadPeriodReports]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <Header
        title={t('reports.title')}
        description={t('reports.description')}
        icon={<BarChart3 className="w-6 h-6" />}
      />

      {/* Filtro de Sede */}
      {!loadingVenues && venues.length > 1 && (
          <Card className="mt-6 mb-4 border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('reports.venue')}
                  </Label>
                  <Select value={selectedVenueId || 'all'} onValueChange={(value) => {
                    const venueId = value === 'all' ? undefined : value;
                    setSelectedVenueId(venueId);
                    setFilters(prev => ({ ...prev, venue_id: venueId || '' }));
                  }}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 w-64 h-10">
                      <SelectValue placeholder={t('reports.allVenues')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('reports.allVenues')}</SelectItem>
                      {venues.filter(v => v.is_active).map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedVenue && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('reports.selectedVenue')}: <span className="font-semibold">{selectedVenue.name}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-md font-semibold"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="period" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-md font-semibold"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Reportes por Período
            </TabsTrigger>
            <TabsTrigger 
              value="charts" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-md font-semibold"
            >
              <LineChart className="w-4 h-4 mr-2" />
              Gráficas
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Dashboard */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {loadingDashboard ? (
              <>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-1 w-12 rounded-full" />
                  <Skeleton className="h-8 w-48" />
                </div>
                {/* Skeleton para KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-2 border-gray-200 dark:border-gray-700">
                      <CardContent className="pt-6">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-10 w-24 mb-2" />
                        <Skeleton className="h-3 w-20" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {/* Skeleton para gráficas */}
                <Card className="border-2 border-gray-200 dark:border-gray-700">
                  <CardContent className="pt-6">
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              </>
            ) : dashboard ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('reports.dashboard.title')}
                  </h2>
                </div>

                <DashboardKPIs dashboard={dashboard} formatCurrency={formatCurrency} />

                {/* Gráfica de ventas del mes actual */}
                {monthlyReport && monthlyReport.daily_breakdown.length > 0 && (
                  <MonthlySalesChart
                    monthName={monthlyReport.period.month_name}
                    dailyBreakdown={monthlyReport.daily_breakdown}
                    summary={monthlyReport.summary}
                    bestDay={monthlyReport.best_day}
                    formatCurrency={formatCurrency}
                  />
                )}

                {/* Gráfica de métodos de pago */}
                <PaymentMethodsPieChart 
                  paymentMethods={dashboard.payment_methods}
                  formatCurrency={formatCurrency}
                />
              </>
            ) : null}

            {stockAlerts && stockAlerts.summary.total_alerts > 0 && (
              <StockAlertsCard stockAlerts={stockAlerts} />
            )}
          </TabsContent>

          {/* Tab 2: Reportes por Período */}
          <TabsContent value="period" className="space-y-6 mt-6">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('reports.periodReports.title')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('reports.periodReports.description')}
                </p>
              </div>
            </div>
            
            {/* Filtros */}
            <Card className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      {t('reports.startDate')}
                    </Label>
                    <DatePicker
                      value={startDate}
                      onChange={(date) => date && setStartDate(date)}
                      placeholder={t('reports.startDate')}
                      className="h-10 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      {t('reports.endDate')}
                    </Label>
                    <DatePicker
                      value={endDate}
                      onChange={(date) => date && setEndDate(date)}
                      placeholder={t('reports.endDate')}
                      className="h-10 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600"
                    />
                  </div>

                  <div className="flex items-end">
                    {summary && !isLoading && (
                      <Badge 
                        variant="outline" 
                        className="border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-2 h-10 flex items-center gap-2 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <div className="flex flex-col items-start">
                          <span className="text-xs font-semibold leading-tight">
                            {t('reports.generated')}
                          </span>
                          <span className="text-[10px] leading-tight text-green-600 dark:text-green-400">
                            {format(startDate, 'dd MMM yyyy', { locale: es })} - {format(endDate, 'dd MMM yyyy', { locale: es })}
                          </span>
                        </div>
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sub-tabs para diferentes reportes */}
            <Tabs value={activePeriodTab} onValueChange={setActivePeriodTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg">
                <TabsTrigger 
                  value="summary" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-md font-semibold text-sm"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Resumen
                </TabsTrigger>
                <TabsTrigger 
                  value="profitability" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-md font-semibold text-sm"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Rentabilidad
                </TabsTrigger>
                <TabsTrigger 
                  value="expenses" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-md font-semibold text-sm"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Gastos
                </TabsTrigger>
                <TabsTrigger 
                  value="top-products" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-md font-semibold text-sm"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Top Productos
                </TabsTrigger>
              </TabsList>

              {/* Sub-tab: Resumen */}
              <TabsContent value="summary" className="space-y-6 mt-6">
                {loadingPeriodReports ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2].map((i) => (
                        <Card key={i} className="border-2 border-gray-200 dark:border-gray-700">
                          <CardContent className="pt-6">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-10 w-24 mb-2" />
                            <Skeleton className="h-3 w-20" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Card className="border-2 border-gray-200 dark:border-gray-700">
                      <CardContent className="pt-6">
                        <Skeleton className="h-6 w-48 mb-4" />
                        <div className="space-y-3">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : summary ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg">
                        <CardContent className="pt-6">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('reports.totalRevenue')}
                          </p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            ${summary.total_revenue.toLocaleString('es-UY')}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {summary.total_sales} {t('reports.sales')}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg">
                        <CardContent className="pt-6">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('reports.totalSales')}
                          </p>
                          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {summary.total_sales}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {t('reports.completedSales')}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <TopProductsCard topProducts={topProducts} />
                  </>
                ) : (
                  <Card className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                    <CardContent className="pt-12 pb-12 text-center">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {t('reports.noData')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('reports.noDataDescription')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Sub-tab: Rentabilidad */}
              <TabsContent value="profitability" className="space-y-6 mt-6">
                {loadingPeriodReports ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="border-2 border-gray-200 dark:border-gray-700">
                          <CardContent className="pt-6">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-10 w-24" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Card className="border-2 border-gray-200 dark:border-gray-700">
                      <CardContent className="pt-6">
                        <Skeleton className="h-6 w-48 mb-4" />
                        <div className="space-y-3">
                          {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : profitability ? (
                  <ProfitabilityCard profitability={profitability} formatCurrency={formatCurrency} />
                ) : (
                  <Card className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                    <CardContent className="pt-12 pb-12 text-center">
                      <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {t('reports.noData')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('reports.noDataDescription')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Sub-tab: Gastos */}
              <TabsContent value="expenses" className="space-y-6 mt-6">
                {loadingPeriodReports ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-2 border-gray-200 dark:border-gray-700">
                          <CardContent className="pt-6">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-10 w-24" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Card className="border-2 border-gray-200 dark:border-gray-700">
                      <CardContent className="pt-6">
                        <Skeleton className="h-6 w-48 mb-4" />
                        <div className="space-y-3">
                          {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : expenses ? (
                  <ExpensesCard expenses={expenses} formatCurrency={formatCurrency} />
                ) : (
                  <Card className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                    <CardContent className="pt-12 pb-12 text-center">
                      <TrendingDown className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {t('reports.noData')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('reports.noDataDescription')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Sub-tab: Top Productos */}
              <TabsContent value="top-products" className="space-y-6 mt-6">
                {loadingPeriodReports ? (
                  <Card className="border-2 border-gray-200 dark:border-gray-700">
                    <CardContent className="pt-6">
                      <Skeleton className="h-6 w-48 mb-4" />
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : topProducts && topProducts.length > 0 ? (
                  <TopProductsCard topProducts={topProducts} />
                ) : (
                  <Card className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                    <CardContent className="pt-12 pb-12 text-center">
                      <Package className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {t('reports.noData')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('reports.noDataDescription')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Tab 3: Gráficas */}
          <TabsContent value="charts" className="space-y-6 mt-6">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('reports.charts.title')}
              </h2>
            </div>

            {/* Selector de Período */}
            <Card className="border-2 border-pink-200 dark:border-pink-800 bg-white dark:bg-gray-800 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('reports.charts.period')}:
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant={trendDays === 7 ? "default" : "outline"}
                      onClick={() => setTrendDays(7)}
                      className={trendDays === 7 ? "bg-pink-600 text-white hover:bg-pink-700" : ""}
                    >
                      7 {t('reports.charts.days')}
                    </Button>
                    <Button
                      variant={trendDays === 30 ? "default" : "outline"}
                      onClick={() => setTrendDays(30)}
                      className={trendDays === 30 ? "bg-pink-600 text-white hover:bg-pink-700" : ""}
                    >
                      30 {t('reports.charts.days')}
                    </Button>
                    <Button
                      variant={trendDays === 90 ? "default" : "outline"}
                      onClick={() => setTrendDays(90)}
                      className={trendDays === 90 ? "bg-pink-600 text-white hover:bg-pink-700" : ""}
                    >
                      90 {t('reports.charts.days')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Tendencia con Lazy Loading */}
            {trendData && trendData.data.length > 0 && (
              <Suspense fallback={
                <Card className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                  <CardContent className="pt-12 pb-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">{t('reports.charts.loading')}</p>
                  </CardContent>
                </Card>
              }>
                <SalesTrendChart trendData={trendData} formatCurrency={formatCurrency} />
              </Suspense>
            )}

            {loadingCharts && !trendData && (
              <>
                <Card className="border-2 border-gray-200 dark:border-gray-700">
                  <CardContent className="pt-6">
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
                <Card className="border-2 border-gray-200 dark:border-gray-700">
                  <CardContent className="pt-6">
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              </>
            )}

            {!trendData && !loadingCharts && (
              <Card className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                <CardContent className="pt-12 pb-12 text-center">
                  <LineChart className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {t('reports.charts.noData')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('reports.charts.noDataDescription')}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Categorías */}
            {categoryReport && categoryReport.categories.length > 0 && (
              <CategoryBarChart 
                categories={categoryReport.categories} 
                formatCurrency={formatCurrency} 
              />
            )}

            {/* Gráfico de Comparativa de Sedes */}
            {venueComparison && venueComparison.venues.length > 1 && (
              <VenueComparisonChart 
                venues={venueComparison.venues}
                globalStats={venueComparison.global}
                formatCurrency={formatCurrency}
              />
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
