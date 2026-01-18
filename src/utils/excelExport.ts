import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MonthlyReport {
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
  };
  daily_breakdown: Array<{
    date: string;
    day_name: string;
    sales_count: number;
    total: number;
    cash: number;
    transfer: number;
    card: number;
  }>;
}

interface ProfitabilityReport {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    profit_margin_percent: number;
  };
  by_product: Array<{
    product_id: string;
    product_name: string;
    quantity_sold: number;
    revenue: number;
    cost: number;
    profit: number;
    profit_margin_percent: number;
  }>;
  by_category: Array<{
    category_id: string | null;
    category_name: string;
    quantity_sold: number;
    revenue: number;
    cost: number;
    profit: number;
    profit_margin_percent: number;
  }>;
}

interface ExpensesReport {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_expenses: number;
    total_units_sold: number;
    average_cost_per_unit: number;
  };
  by_product: Array<{
    product_id: string;
    product_name: string;
    quantity_sold: number;
    total_cost: number;
    average_cost_per_unit: number;
  }>;
  by_category: Array<{
    category_id: string | null;
    category_name: string;
    quantity_sold: number;
    total_cost: number;
    average_cost_per_unit: number;
  }>;
}

export function exportMonthlyReportToExcel(report: MonthlyReport, formatCurrency: (value: number) => string) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summaryData = [
    ['REPORTE MENSUAL DE VENTAS'],
    ['Período', `${report.period.month_name} ${report.period.year}`],
    ['Fecha Inicio', format(new Date(report.period.start_date), 'dd/MM/yyyy')],
    ['Fecha Fin', format(new Date(report.period.end_date), 'dd/MM/yyyy')],
    [''],
    ['RESUMEN'],
    ['Total Ventas', report.summary.total_sales],
    ['Ingresos Totales', report.summary.total_revenue],
    ['Promedio Diario', formatCurrency(report.summary.average_daily)],
    ['Ticket Promedio', formatCurrency(report.summary.average_ticket)],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

  // Hoja 2: Desglose Diario
  const dailyData = [
    ['Fecha', 'Día', 'Cantidad Ventas', 'Total Efectivo', 'Total Transferencia', 'Total Tarjeta', 'Total General']
  ];

  report.daily_breakdown.forEach(day => {
    dailyData.push([
      format(new Date(day.date), 'dd/MM/yyyy'),
      day.day_name,
      day.sales_count,
      formatCurrency(day.cash),
      formatCurrency(day.transfer),
      formatCurrency(day.card),
      formatCurrency(day.total)
    ]);
  });

  const dailyWs = XLSX.utils.aoa_to_sheet(dailyData);
  XLSX.utils.book_append_sheet(wb, dailyWs, 'Desglose Diario');

  // Generar nombre de archivo
  const fileName = `Reporte_Mensual_${report.period.month_name}_${report.period.year}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportProfitabilityReportToExcel(report: ProfitabilityReport, formatCurrency: (value: number) => string) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summaryData = [
    ['REPORTE DE RENTABILIDAD'],
    ['Período', `${format(new Date(report.period.start_date), 'dd/MM/yyyy')} - ${format(new Date(report.period.end_date), 'dd/MM/yyyy')}`],
    [''],
    ['RESUMEN'],
    ['Ingresos Totales', formatCurrency(report.summary.total_revenue)],
    ['Costos Totales', formatCurrency(report.summary.total_cost)],
    ['Ganancia Total', formatCurrency(report.summary.total_profit)],
    ['Margen de Ganancia (%)', `${report.summary.profit_margin_percent.toFixed(2)}%`],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

  // Hoja 2: Por Producto
  const productData = [
    ['Producto', 'Cantidad Vendida', 'Ingresos', 'Costos', 'Ganancia', 'Margen (%)']
  ];

  report.by_product.forEach(product => {
    productData.push([
      product.product_name,
      product.quantity_sold,
      formatCurrency(product.revenue),
      formatCurrency(product.cost),
      formatCurrency(product.profit),
      `${product.profit_margin_percent.toFixed(2)}%`
    ]);
  });

  const productWs = XLSX.utils.aoa_to_sheet(productData);
  XLSX.utils.book_append_sheet(wb, productWs, 'Por Producto');

  // Hoja 3: Por Categoría
  const categoryData = [
    ['Categoría', 'Cantidad Vendida', 'Ingresos', 'Costos', 'Ganancia', 'Margen (%)']
  ];

  report.by_category.forEach(category => {
    categoryData.push([
      category.category_name,
      category.quantity_sold,
      formatCurrency(category.revenue),
      formatCurrency(category.cost),
      formatCurrency(category.profit),
      `${category.profit_margin_percent.toFixed(2)}%`
    ]);
  });

  const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
  XLSX.utils.book_append_sheet(wb, categoryWs, 'Por Categoría');

  // Generar nombre de archivo
  const fileName = `Reporte_Rentabilidad_${format(new Date(report.period.start_date), 'yyyy-MM-dd')}_${format(new Date(report.period.end_date), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportExpensesReportToExcel(report: ExpensesReport, formatCurrency: (value: number) => string) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summaryData = [
    ['REPORTE DE GASTOS'],
    ['Período', `${format(new Date(report.period.start_date), 'dd/MM/yyyy')} - ${format(new Date(report.period.end_date), 'dd/MM/yyyy')}`],
    [''],
    ['RESUMEN'],
    ['Gastos Totales', formatCurrency(report.summary.total_expenses)],
    ['Total Unidades Vendidas', report.summary.total_units_sold],
    ['Costo Promedio por Unidad', formatCurrency(report.summary.average_cost_per_unit)],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

  // Hoja 2: Por Producto
  const productData = [
    ['Producto', 'Cantidad Vendida', 'Costo Total', 'Costo Promedio por Unidad']
  ];

  report.by_product.forEach(product => {
    productData.push([
      product.product_name,
      product.quantity_sold,
      formatCurrency(product.total_cost),
      formatCurrency(product.average_cost_per_unit)
    ]);
  });

  const productWs = XLSX.utils.aoa_to_sheet(productData);
  XLSX.utils.book_append_sheet(wb, productWs, 'Por Producto');

  // Hoja 3: Por Categoría
  const categoryData = [
    ['Categoría', 'Cantidad Vendida', 'Costo Total', 'Costo Promedio por Unidad']
  ];

  report.by_category.forEach(category => {
    categoryData.push([
      category.category_name,
      category.quantity_sold,
      formatCurrency(category.total_cost),
      formatCurrency(category.average_cost_per_unit)
    ]);
  });

  const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
  XLSX.utils.book_append_sheet(wb, categoryWs, 'Por Categoría');

  // Generar nombre de archivo
  const fileName = `Reporte_Gastos_${format(new Date(report.period.start_date), 'yyyy-MM-dd')}_${format(new Date(report.period.end_date), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
