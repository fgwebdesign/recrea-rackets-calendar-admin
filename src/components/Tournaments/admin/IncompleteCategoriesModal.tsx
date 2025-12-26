"use client"

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Users, XCircle } from 'lucide-react';
import { useTranslations } from '@/contexts/TranslationContext';

interface IncompleteCategory {
  category: string;
  registered: number;
  max: number;
  missing: number;
}

interface IncompleteCategoriesModalProps {
  open: boolean;
  onClose: () => void;
  incompleteCategories: IncompleteCategory[];
  totalCategories: number;
  incompleteCount: number;
}

export function IncompleteCategoriesModal({
  open,
  onClose,
  incompleteCategories,
  totalCategories,
  incompleteCount,
}: IncompleteCategoriesModalProps) {
  const t = useTranslations('tournaments');
  const tCommon = useTranslations('common');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {t('autoScheduling.incompleteCategories.title')}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {t('autoScheduling.incompleteCategories.description')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {t('autoScheduling.incompleteCategories.alertTitle')}
            </AlertTitle>
            <AlertDescription>
              {t('autoScheduling.incompleteCategories.alertDescription')
                .replace('{incomplete}', incompleteCount.toString())
                .replace('{total}', totalCategories.toString())}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              {t('autoScheduling.incompleteCategories.categoriesList')}
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {incompleteCategories.map((category, index) => {
                const progress = (category.registered / category.max) * 100;
                const isAlmostComplete = progress >= 75;
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {category.category}
                        </p>
                        <div className="mt-1.5">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>
                              {t('autoScheduling.incompleteCategories.registered')
                                .replace('{registered}', category.registered.toString())
                                .replace('{max}', category.max.toString())}
                            </span>
                            <span className="font-medium">
                              {t('autoScheduling.incompleteCategories.missing')
                                .replace('{missing}', category.missing.toString())}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isAlmostComplete
                                  ? 'bg-green-500'
                                  : progress >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {category.missing > 0 && (
                      <div className="ml-3 flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                        <XCircle className="h-4 w-4" />
                        <span>{category.missing}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              {t('autoScheduling.incompleteCategories.helpText')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">
            {tCommon('understood')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

