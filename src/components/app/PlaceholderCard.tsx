import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass } from 'lucide-react';

export function PlaceholderCard() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-primary" />
          <span>Ready to Explore?</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Enter a location description and choose your preferred narration style to get started. 
          We'll craft a unique audio guide just for you!
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
