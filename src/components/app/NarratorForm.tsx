
// src/components/app/NarratorForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Wand2, Info, Newspaper, Castle, HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { TravelNarrativeResult } from "@/app/actions";
import { narratorFormSchema, type NarratorFormValues } from "@/lib/validators";

const informationStyles = [
  { id: "Historical", label: "Historical", description: "Focus on facts, dates, and historical significance.", icon: Castle },
  { id: "Curious", label: "Curious", description: "Uncover interesting tidbits and unusual details.", icon: HelpCircle },
  { id: "Legends", label: "Legends", description: "Explore myths, folklore, and captivating stories.", icon: Newspaper },
] as const;

interface NarratorFormProps {
  onGenerationStart: () => void;
  onGenerationComplete: (data: TravelNarrativeResult) => void;
  onGenerationError: (message: string) => void;
  isGenerating: boolean;
}

export function NarratorForm({
  onGenerationStart,
  onGenerationComplete,
  onGenerationError,
  isGenerating,
}: NarratorFormProps) {
  const form = useForm<NarratorFormValues>({
    resolver: zodResolver(narratorFormSchema),
    defaultValues: {
      locationDescription: "",
      informationStyle: "Curious",
    },
  });

  async function onSubmit(data: NarratorFormValues) {
    onGenerationStart();
    try {
      // Dynamically import the server action
      const { generateTravelNarrativeAction } = await import("@/app/actions");
      const result = await generateTravelNarrativeAction(data);
      if ("error" in result) {
        onGenerationError(result.error);
      } else {
        onGenerationComplete(result);
      }
    } catch (error) {
      onGenerationError("An unexpected error occurred during submission.");
    }
  }

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-6 w-6 text-primary" />
          <span>Describe Your Destination</span>
        </CardTitle>
        <CardDescription>
          Tell us about the place you want to hear about, and choose your preferred style of narration.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="locationDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., The Eiffel Tower in Paris, a majestic iron lattice structure..."
                      className="resize-none min-h-[100px]"
                      {...field}
                      aria-describedby="location-description-help"
                    />
                  </FormControl>
                  <FormDescription id="location-description-help">
                    Provide a brief description of the landmark or location.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="informationStyle"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Information Style</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      {informationStyles.map((style) => (
                        <FormItem key={style.id} className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-accent/50 transition-colors">
                          <FormControl>
                            <RadioGroupItem value={style.id} />
                          </FormControl>
                          <div className="flex-1">
                            <FormLabel className="font-normal flex items-center gap-2">
                              <style.icon className="h-5 w-5 text-muted-foreground"/>
                              {style.label}
                            </FormLabel>
                            <FormDescription className="text-xs">
                              {style.description}
                            </FormDescription>
                          </div>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isGenerating} className="w-full">
              <Wand2 className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Narrative"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
