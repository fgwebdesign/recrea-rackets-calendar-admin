'use client';

import { useState } from 'react';
import { ClockIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/contexts/TranslationContext';

interface TimeSlot {
  slot_id: string;
  label: string;
  is_available: boolean;
  remaining_slots: number;
  percentage_full: number;
  total_capacity: number;
  current_usage: number;
}

interface TimeSlotSelectorProps {
  slots: TimeSlot[];
  selectedSlot: string;
  onSlotSelect: (slotId: string) => void;
  disabled?: boolean;
}

export function TimeSlotSelector({ slots, selectedSlot, onSlotSelect, disabled }: TimeSlotSelectorProps) {
  const t = useTranslations('tournaments');
  const [isOpen, setIsOpen] = useState(false);

  const getSlotStatus = (slot: TimeSlot) => {
    if (!slot.is_available) return 'full';
    if (slot.remaining_slots <= 2) return 'low';
    return 'available';
  };

  const getSlotColors = (status: string) => {
    switch (status) {
      case 'available':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-800 dark:text-green-200',
          icon: 'text-green-600 dark:text-green-400',
          badge: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
        };
      case 'low':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-200',
          icon: 'text-yellow-600 dark:text-yellow-400',
          badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
        };
      case 'full':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          icon: 'text-red-600 dark:text-red-400',
          badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200 dark:border-gray-800',
          text: 'text-gray-800 dark:text-gray-200',
          icon: 'text-gray-600 dark:text-gray-400',
          badge: 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
        };
    }
  };

  const getSlotIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'low':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'full':
        return <XCircleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const selectedSlotData = slots.find(slot => slot.slot_id === selectedSlot);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {t('adminRegister.timeSlotSelector.label')}
      </label>
      
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full p-5 border rounded-xl text-left transition-all duration-200 ${
          disabled 
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border-gray-300 dark:border-gray-600'
            : selectedSlotData
            ? `${getSlotColors(getSlotStatus(selectedSlotData)).bg} ${getSlotColors(getSlotStatus(selectedSlotData)).border} ${getSlotColors(getSlotStatus(selectedSlotData)).text} border-2 hover:shadow-lg`
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedSlotData ? (
              <>
                <div className={getSlotColors(getSlotStatus(selectedSlotData)).icon}>
                  {getSlotIcon(getSlotStatus(selectedSlotData))}
                </div>
                <div>
                  <div className="font-medium">{selectedSlotData.label}</div>
                  <div className="text-sm opacity-75">
                    {selectedSlotData.remaining_slots} {t('adminRegister.timeSlotSelector.slotsAvailable')}
                  </div>
                </div>
              </>
            ) : (
              <>
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">{t('adminRegister.timeSlotSelector.selectPlaceholder')}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedSlotData && (
              <Badge className={getSlotColors(getSlotStatus(selectedSlotData)).badge}>
                {selectedSlotData.percentage_full}% {t('adminRegister.timeSlotSelector.occupied')}
              </Badge>
            )}
            <svg
              className={`h-5 w-5 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              } ${disabled ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Dropdown Options */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-80 overflow-y-auto">
          {slots.map((slot) => {
            const status = getSlotStatus(slot);
            const colors = getSlotColors(status);
            
            return (
              <button
                key={slot.slot_id}
                type="button"
                onClick={() => {
                  onSlotSelect(slot.slot_id);
                  setIsOpen(false);
                }}
                disabled={!slot.is_available}
                className={`w-full p-5 text-left transition-all duration-200 hover:bg-opacity-80 ${
                  !slot.is_available 
                    ? `${colors.bg} ${colors.border} ${colors.text} opacity-60 cursor-not-allowed`
                    : `${colors.bg} ${colors.border} ${colors.text} hover:shadow-lg`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={colors.icon}>
                      {getSlotIcon(status)}
                    </div>
                    <div>
                      <div className="font-medium">{slot.label}</div>
                      <div className="text-sm opacity-75">
                        {slot.is_available 
                          ? `${slot.remaining_slots} ${t('adminRegister.timeSlotSelector.slotsAvailable')}`
                          : t('adminRegister.timeSlotSelector.full')
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={colors.badge}>
                      {slot.percentage_full}% {t('adminRegister.timeSlotSelector.occupied')}
                    </Badge>
                    {!slot.is_available && (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Slot Info */}
      {selectedSlotData && (
        <div className={`mt-4 p-4 rounded-lg border ${getSlotColors(getSlotStatus(selectedSlotData)).bg} ${getSlotColors(getSlotStatus(selectedSlotData)).border}`}>
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon className={`h-4 w-4 ${getSlotColors(getSlotStatus(selectedSlotData)).icon}`} />
            <h4 className={`font-medium ${getSlotColors(getSlotStatus(selectedSlotData)).text}`}>
              {t('adminRegister.timeSlotSelector.scheduleInfo')}:
            </h4>
          </div>
          <div className={`text-sm space-y-1 ${getSlotColors(getSlotStatus(selectedSlotData)).text}`}>
            <p><strong>{selectedSlotData.label}</strong></p>
            <p>{t('adminRegister.timeSlotSelector.availableSlots')}: {selectedSlotData.remaining_slots}</p>
            <p>{t('adminRegister.timeSlotSelector.occupation')}: {selectedSlotData.percentage_full}%</p>
            <p>{t('adminRegister.timeSlotSelector.totalCapacity')}: {selectedSlotData.total_capacity} {t('adminRegister.timeSlotSelector.teams')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
