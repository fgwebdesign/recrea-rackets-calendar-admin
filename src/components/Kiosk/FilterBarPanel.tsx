'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangeFilter } from '@/components/Kiosk/DateRangeFilter';
import { useTranslations } from '@/contexts/TranslationContext';
import { cn } from '@/lib/utils';

export type FilterBarPanelVariant = 'sales' | 'reports';

export interface FilterBarPanelBaseProps {
  variant: FilterBarPanelVariant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onApply: () => void;
  onClear: () => void;
  disabled?: boolean;
  /** Número de filtros activos (opcional, para badge) */
  activeFilterCount?: number;
  /** Texto del botón principal del pie (por defecto "Aplicar" en sales, "Generar reporte" en reports) */
  applyLabel?: string;
  /** Texto del botón que abre el panel (por defecto "Filtros") */
  triggerLabel?: string;
}

export interface FilterBarPanelSalesProps extends FilterBarPanelBaseProps {
  variant: 'sales';
  paymentMethod?: string;
  paymentStatus?: string;
  search: string;
  onPaymentMethodChange: (value: string | undefined) => void;
  onPaymentStatusChange: (value: string | undefined) => void;
  onSearchChange: (value: string) => void;
}

export interface FilterBarPanelReportsProps extends FilterBarPanelBaseProps {
  variant: 'reports';
}

export type FilterBarPanelProps = FilterBarPanelSalesProps | FilterBarPanelReportsProps;

export function FilterBarPanel(props: FilterBarPanelProps) {
  const t = useTranslations('kiosk');
  const {
    variant,
    open,
    onOpenChange,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onApply,
    onClear,
    disabled = false,
    activeFilterCount,
    applyLabel,
    triggerLabel
  } = props;

  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  const defaultApplyLabel =
    variant === 'sales' ? t('filters.apply') : t('reports.generate');
  const label = applyLabel ?? defaultApplyLabel;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'gap-2 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600',
            'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
          )}
          disabled={disabled}
        >
          <Filter className="h-4 w-4" />
          {triggerLabel ?? t('filters.filters')}
          {activeFilterCount != null && activeFilterCount > 0 && (
            <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 px-1.5 text-xs font-medium text-gray-700 dark:text-gray-200">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(90vw,520px)] p-0 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl rounded-xl"
        align="start"
        sideOffset={8}
      >
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white pb-4 mb-0 border-b border-gray-200 dark:border-gray-700">
            {t('filters.filters')}
          </h3>

          {/* Rango de fechas */}
          <section className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700/50 first:border-t-0 first:pt-0">
            <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-3">
              {t('filters.dateRange')}
            </Label>
            <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/50 p-4">
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={(d) => d && onStartDateChange(d)}
                onEndDateChange={(d) => d && onEndDateChange(d)}
                showPresets={true}
                disabled={disabled}
              />
            </div>
          </section>

          {/* Solo en variant sales: búsqueda y selects */}
          {props.variant === 'sales' && (
            <>
              <section className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700/50">
                <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-3">
                  {t('sales.searchPlaceholder')}
                </Label>
                <Input
                  placeholder={t('sales.searchPlaceholder')}
                  value={props.search}
                  onChange={(e) => props.onSearchChange(e.target.value)}
                  className="h-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-lg"
                  disabled={disabled}
                />
              </section>
              <section className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                      {t('sales.paymentMethod')}
                    </Label>
                    <Select
                      value={props.paymentMethod || 'all'}
                      onValueChange={(v) =>
                        props.onPaymentMethodChange(v === 'all' ? undefined : v)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-lg">
                        <SelectValue placeholder={t('sales.allPaymentMethods')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t('sales.allPaymentMethods')}
                        </SelectItem>
                        <SelectItem value="cash">{t('sales.paymentMethods.cash')}</SelectItem>
                        <SelectItem value="transfer">
                          {t('sales.paymentMethods.transfer')}
                        </SelectItem>
                        <SelectItem value="card">{t('sales.paymentMethods.card')}</SelectItem>
                        <SelectItem value="mercadopago">
                          {t('sales.paymentMethods.mercadopago')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                      {t('sales.status')}
                    </Label>
                    <Select
                      value={props.paymentStatus || 'all'}
                      onValueChange={(v) =>
                        props.onPaymentStatusChange(v === 'all' ? undefined : v)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-lg">
                        <SelectValue placeholder={t('sales.allStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('sales.allStatus')}</SelectItem>
                        <SelectItem value="completed">
                          {t('sales.paymentStatus.completed')}
                        </SelectItem>
                        <SelectItem value="pending">
                          {t('sales.paymentStatus.pending')}
                        </SelectItem>
                        <SelectItem value="cancelled">
                          {t('sales.paymentStatus.cancelled')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Pie: Limpiar + Aplicar */}
          <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClear();
                onOpenChange(false);
              }}
              disabled={disabled}
            >
              {t('filters.clearFilters')}
            </Button>
            <Button type="button" size="sm" onClick={handleApply} disabled={disabled}>
              {label}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
