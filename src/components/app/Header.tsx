
"use client";

import NextImage from 'next/image'; // Changed Image to NextImage to avoid conflict if any
import { Languages } from 'lucide-react';
import { useLanguage, type Locale } from '@/contexts/LanguageContext';
// import { useTranslations } from '@/lib/translations'; // t.appSubtitle not needed here anymore
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const logoPath = "/logo.png"; 

const availableLanguages: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
];

export function Header() {
  const { language, setLanguage } = useLanguage();
  // const t = useTranslations(); // Not needed here anymore

  const handleLanguageChange = (value: string) => {
    setLanguage(value as Locale);
  };

  return (
    // Removed outer <header> tag and mb-8, as page.tsx handles container and spacing
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <NextImage 
          src={logoPath} 
          alt="Aijolot Travel Guide Logo" 
          width={50} 
          height={50} 
          className="h-12 w-auto" 
          data-ai-hint="axolotl logo"
          priority
        />
        {/* The H1 title "Aijolot Travel Guide" has been moved to the hero section in page.tsx */}
      </div>
      <div className="flex items-center gap-2">
        <Languages className="h-5 w-5 text-muted-foreground" />
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[120px] sm:w-[150px] text-sm">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            {availableLanguages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* The tagline paragraph <p> has been moved to the hero section in page.tsx */}
    </div>
  );
}
