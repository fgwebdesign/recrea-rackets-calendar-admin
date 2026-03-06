'use client';

import { useState, useEffect } from 'react';
import { Percent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ClubSettings } from '@/types/professor';

interface CommissionCardProps {
  clubSettings: ClubSettings;
  onSave: (percent: number) => Promise<void>;
  isLoading?: boolean;
}

export function CommissionCard({ clubSettings, onSave, isLoading }: CommissionCardProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(String(clubSettings.club_commission_percent ?? 0));
  }, [clubSettings.club_commission_percent]);

  const handleSave = async () => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 100) return;
    setSaving(true);
    try {
      await onSave(num);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Percent className="h-4 w-4" />
            <span>Comisión del club</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-20 h-9 text-center tabular-nums"
              placeholder="0"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSave}
            disabled={saving || isLoading}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
