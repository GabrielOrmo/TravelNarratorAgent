
"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass } from 'lucide-react';
import { useTranslations } from '@/lib/translations';

export function PlaceholderCard() {
  const t = useTranslations();
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-primary" />
          <span>{t.placeholderCardTitle}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          {t.placeholderCardDescription}
        </p>
        <div className="aspect-[16/9] relative overflow-hidden rounded-lg">
          <Image
            src="https://placehold.co/600x400.png"
            alt="Placeholder image of a scenic travel destination"
            layout="fill"
            objectFit="cover"
            data-ai-hint="travel landmark"
            className="rounded-md"
          />
        </div>
      </CardContent>
    </Card>
  );
}
