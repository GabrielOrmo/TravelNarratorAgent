
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Header } from "@/components/app/Header";
import { NarratorForm } from "@/components/app/NarratorForm";
import { NarrativeDisplay } from "@/components/app/NarrativeDisplay";
import { LoadingSpinner } from "@/components/app/LoadingSpinner";
// PlaceholderCard is no longer used here for the initial view.
// import { PlaceholderCard } from "@/components/app/PlaceholderCard"; 
import { useToast } from "@/hooks/use-toast";
import type { TravelNarrativeResult } from "./actions";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslations } from "@/lib/translations";

export default function HomePage() {
  const [uiMode, setUiMode] = useState<'form' | 'chat'>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrativeResult, setNarrativeResult] = useState<TravelNarrativeResult | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const { toast } = useToast();
  const { language } = useLanguage(); // currentLanguage is passed to NarratorForm
  const t = useTranslations();
  const chatDisplayContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    if (uiMode === 'chat' && narrativeResult && chatDisplayContainerRef.current) {
      // Using a timeout to ensure the element is rendered and layout shifts (if any) are complete
      const timer = setTimeout(() => {
        chatDisplayContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100); // 100ms delay, adjust if needed
      return () => clearTimeout(timer);
    }
  }, [uiMode, narrativeResult]);

  const handleGenerationStart = () => {
    setIsGenerating(true);
  };

  const handleGenerationComplete = (data: TravelNarrativeResult) => {
    setIsGenerating(false);
    setNarrativeResult(data);
    setUiMode('chat'); // Switch to chat mode
    toast({
      title: t.toastNarrativeGeneratedTitle,
      description: t.toastNarrativeGeneratedDescription(data.locationDescription),
    });
  };

  const handleGenerationError = (message: string) => {
    setIsGenerating(false);
    toast({
      variant: "destructive",
      title: t.toastGenerationFailedTitle,
      description: message,
    });
  };

  const handleExploreNewLocation = () => {
    setUiMode('form');
    setNarrativeResult(null); 
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/30">
      {/* Fixed Header: Logo and Language Switcher */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background shadow-md">
        <div className="container mx-auto px-4 py-4">
          <Header />
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-72 sm:h-80 md:h-96 w-full text-white pt-20"> {/* Added pt-20 for fixed header */}
        <Image
          src="/banner.png"
          alt={t.heroImageAlt}
          layout="fill"
          objectFit="cover"
          className="z-0"
          priority
          data-ai-hint="travel banner"
        />
        <div className="absolute inset-0 bg-black/50 z-10 flex flex-col items-center justify-center text-center p-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_50%)]">
            Aijolot Travel Guide
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-200 [text-shadow:_1px_1px_2px_rgb(0_0_0_/_50%)]">
            {t.appSubtitle} {/* Tagline */}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex-grow">
        <main className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: NarratorForm or empty if in chat mode */}
            {uiMode === 'form' && (
              <div className="w-full max-w-lg mx-auto lg:max-w-none lg:mx-0">
                <NarratorForm
                  onGenerationStart={handleGenerationStart}
                  onGenerationComplete={handleGenerationComplete}
                  onGenerationError={handleGenerationError}
                  isGenerating={isGenerating}
                />
              </div>
            )}
            {uiMode === 'chat' && <div className="hidden lg:block w-full max-w-lg mx-auto lg:max-w-none lg:mx-0" aria-hidden="true"> {/* Placeholder for left col in chat mode on large screens */} </div>}


            {/* Right Column: LoadingSpinner, NarrativeDisplay, or initially empty in form mode */}
            <div ref={chatDisplayContainerRef} className="w-full max-w-lg mx-auto lg:max-w-none lg:mx-0">
              {uiMode === 'form' && isGenerating && <LoadingSpinner />}
              {/* No PlaceholderCard here to keep it empty initially in form mode */}
              {uiMode === 'chat' && narrativeResult && (
                <NarrativeDisplay
                  narrativeText={narrativeResult.narrativeText}
                  audioDataUri={narrativeResult.audioDataUri}
                  locationDescription={narrativeResult.locationDescription}
                  outputLanguage={narrativeResult.outputLanguage}
                  informationStyle={narrativeResult.informationStyle}
                  userId={narrativeResult.userId}
                  latitude={narrativeResult.latitude}
                  longitude={narrativeResult.longitude}
                  onExploreNewLocation={handleExploreNewLocation}
                />
              )}
            </div>
          </div>
        </main>
      </div>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        {currentYear !== null ? `© ${currentYear} ${t.footerCopyright}` : t.loadingYear}
      </footer>
    </div>
  );
}
