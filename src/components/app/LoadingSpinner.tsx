
"use client";

import { Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from '@/lib/translations';

export function LoadingSpinner() {
  const t = useTranslations();
  return (
    <Card className="shadow-lg">
      <CardContent className="flex flex-col items-center justify-center p-10 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">{t.loadingSpinnerText}</p>
      </CardContent>
    </Card>
  );
}
