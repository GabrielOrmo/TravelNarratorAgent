
"use client";

import Image from 'next/image';
import { Languages } from 'lucide-react';
import { useLanguage, type Locale } from '@/contexts/LanguageContext';
import { useTranslations } from '@/lib/translations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Ensure you have a logo.png in your /public folder
const logoPath = "/logo.png"; // Or use "https://placehold.co/150x40.png?text=Aijolot" if logo not ready

const availableLanguages: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
];

export function Header() {
  const { language, setLanguage } = useLanguage();
  const t = useTranslations();

  const handleLanguageChange = (value: string) => {
    setLanguage(value as Locale);
  };

  return (
    <header className="mb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image 
            src={logoPath} 
            alt="Aijolot Travel Guide Logo" 
            width={50} // Adjust width as needed
            height={50} // Adjust height as needed
            className="h-12 w-auto" // Tailwind classes for responsive height
            data-ai-hint="axolotl logo"
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Aijolot Travel Guide
          </h1>
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
      </div>
      <p className="mt-3 text-lg text-muted-foreground text-center sm:text-left">
        {t.appSubtitle}
      </p>
    </header>
  );
}
