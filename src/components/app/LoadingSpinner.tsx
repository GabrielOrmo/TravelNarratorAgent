import { Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export function LoadingSpinner() {
  return (
    <Card className="shadow-lg">
      <CardContent className="flex flex-col items-center justify-center p-10 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Generating your personalized tour...</p>
      </CardContent>
    </Card>
  );
}
