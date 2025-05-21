
// src/components/app/NarratorForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Wand2, Info, Newspaper, Castle, HelpCircle, Upload, Camera, Image as ImageIcon, AlertTriangle } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "camera">("upload");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<NarratorFormValues>({
    resolver: zodResolver(narratorFormSchema),
    defaultValues: {
      imageDataUri: "",
      informationStyle: "Curious",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
        form.setValue("imageDataUri", dataUri, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    } else {
        setHasCameraPermission(false);
         toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === "camera" && hasCameraPermission === null) {
      startCamera();
    }
    return () => { // Cleanup: stop camera stream when component unmounts or tab changes
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeTab, startCamera, hasCameraPermission]);

  const handleCaptureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg'); // Or image/png
        setImagePreview(dataUri);
        form.setValue("imageDataUri", dataUri, { shouldValidate: true });

        // Stop camera stream after capture
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  async function onSubmit(data: NarratorFormValues) {
    if (!data.imageDataUri) {
      form.setError("imageDataUri", { type: "manual", message: "Please upload or capture an image of the location."})
      return;
    }
    onGenerationStart();
    try {
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
          <ImageIcon className="h-6 w-6 text-primary" />
          <span>Show Us Your Destination</span>
        </CardTitle>
        <CardDescription>
          Upload an image or use your camera to capture the landmark. Then, choose your narration style.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="imageDataUri"
              render={({ field }) => ( // field is not directly used for input element but for error display
                <FormItem>
                  <FormLabel>Location Image</FormLabel>
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "upload" | "camera")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload"><Upload className="mr-2 h-4 w-4" />Upload Image</TabsTrigger>
                      <TabsTrigger value="camera"><Camera className="mr-2 h-4 w-4" />Use Camera</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="mt-4">
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="cursor-pointer"
                        />
                      </FormControl>
                      <FormDescription className="mt-2">
                        Upload a clear picture of the landmark or location.
                      </FormDescription>
                    </TabsContent>
                    <TabsContent value="camera" className="mt-4 space-y-4">
                        {hasCameraPermission === false && (
                             <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Camera Access Problem</AlertTitle>
                                <AlertDescription>
                                Could not access the camera. Please ensure permissions are granted and your browser supports it. You can still upload an image.
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                autoPlay
                                playsInline
                                muted
                                data-testid="camera-feed"
                            />
                            {/* Canvas for capturing frame, hidden */}
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </div>
                        <Button type="button" onClick={handleCaptureImage} disabled={isGenerating || hasCameraPermission === false || !videoRef.current?.srcObject} className="w-full">
                            <Camera className="mr-2 h-4 w-4" /> Capture Image
                        </Button>
                    </TabsContent>
                  </Tabs>
                  {imagePreview && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">Image Preview:</h4>
                      <div className="relative w-full aspect-video border rounded-md overflow-hidden">
                        <Image src={imagePreview} alt="Selected location preview" layout="fill" objectFit="contain" data-ai-hint="landmark photo" />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => {
                          setImagePreview(null);
                          form.setValue("imageDataUri", "", { shouldValidate: true });
                          if(fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
                           if (activeTab === "camera" && hasCameraPermission) { // Restart camera if it was stopped
                                startCamera();
                           }
                      }}>
                        Clear Image
                      </Button>
                    </div>
                  )}
                  <FormMessage /> {/* For imageDataUri field errors */}
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
            <Button type="submit" disabled={isGenerating || !form.formState.isValid || !imagePreview} className="w-full">
              <Wand2 className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Narrative"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
