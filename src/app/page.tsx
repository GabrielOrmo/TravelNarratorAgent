// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/app/Header";
import { NarratorForm } from "@/components/app/NarratorForm";
import { NarrativeDisplay } from "@/components/app/NarrativeDisplay";
import { LoadingSpinner } from "@/components/app/LoadingSpinner";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { useToast } from "@/hooks/use-toast";
import type { TravelNarrativeResult } from "./actions";

export default function HomePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrativeResult, setNarrativeResult] = useState<TravelNarrativeResult | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleGenerationStart = () => {
    setIsGenerating(true);
    setNarrativeResult(null); // Clear previous results
  };

  const handleGenerationComplete = (data: TravelNarrativeResult) => {
    setIsGenerating(false);
    setNarrativeResult(data);
    toast({
      title: "Narrative Generated!",
      description: "Your personalized tour is ready.",
    });
  };

  const handleGenerationError = (message: string) => {
    setIsGenerating(false);
    toast({
      variant: "destructive",
      title: "Generation Failed",
      description: message,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <Header />
        <main className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="w-full max-w-lg mx-auto lg:max-w-none lg:mx-0">
              <NarratorForm
                onGenerationStart={handleGenerationStart}
                onGenerationComplete={handleGenerationComplete}
                onGenerationError={handleGenerationError}
                isGenerating={isGenerating}
              />
            </div>
            <div className="w-full max-w-lg mx-auto lg:max-w-none lg:mx-0">
              {isGenerating ? (
                <LoadingSpinner />
              ) : narrativeResult ? (
                <NarrativeDisplay
                  narrativeText={narrativeResult.narrativeText}
                  audioDataUri={narrativeResult.audioDataUri}
                />
              ) : (
                <PlaceholderCard />
              )}
            </div>
          </div>
        </main>
      </div>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        {currentYear !== null ? `© ${currentYear} TravelNarrator. AI-powered by Genkit.` : 'Loading year...'}
      </footer>
    </div>
  );
}
