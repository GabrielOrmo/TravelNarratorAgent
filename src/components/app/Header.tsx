import { Landmark } from 'lucide-react';

export function Header() {
  return (
    <header className="mb-8 text-center">
      <div className="inline-flex items-center gap-3">
        <Landmark className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          TravelNarrator
        </h1>
      </div>
      <p className="mt-3 text-lg text-muted-foreground">
        Your personal AI-powered travel tour guide.
      </p>
    </header>
  );
}
