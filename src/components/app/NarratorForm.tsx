
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Wand2, Castle, HelpCircle, Newspaper, Upload, Camera, Image as ImageIcon, AlertTriangle, Search, MapPin, LocateFixed } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import NextImage from "next/image"; 

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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { TravelNarrativeResult } from "@/app/actions";
import { narratorFormSchema, type NarratorFormValues } from "@/lib/validators";
import { useLanguage, type Locale } from "@/contexts/LanguageContext";
import { useTranslations } from "@/lib/translations";

const USER_ID_STORAGE_KEY = 'aijolot-user-id';

interface NarratorFormProps {
  onGenerationStart: () => void;
  onGenerationComplete: (data: TravelNarrativeResult) => void;
  onGenerationError: (message: string) => void;
  isGenerating: boolean;
  currentLanguage: Locale; 
}

export function NarratorForm({
  onGenerationStart,
  onGenerationComplete,
  onGenerationError,
  isGenerating,
  currentLanguage,
}: NarratorFormProps) {
  const { toast } = useToast();
  const t = useTranslations();
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "camera">("upload");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);


  const informationStyles = [
    { id: "Historical", label: t.styleHistoricalLabel, description: t.styleHistoricalDescription, icon: Castle },
    { id: "Curious", label: t.styleCuriousLabel, description: t.styleCuriousDescription, icon: HelpCircle },
    { id: "Legends", label: t.styleLegendsLabel, description: t.styleLegendsDescription, icon: Newspaper },
  ] as const;


  const form = useForm<NarratorFormValues>({
    resolver: zodResolver(narratorFormSchema),
    defaultValues: {
      imageDataUri: undefined,
      locationQuery: undefined,
      informationStyle: "Curious",
      outputLanguage: currentLanguage || "en",
    },
  });

  useEffect(() => {
    form.setValue("outputLanguage", currentLanguage);
  }, [currentLanguage, form]);

  useEffect(() => {
    setIsMounted(true);
    
    let storedUserId = localStorage.getItem(USER_ID_STORAGE_KEY);
    if (!storedUserId) {
      storedUserId = crypto.randomUUID();
      localStorage.setItem(USER_ID_STORAGE_KEY, storedUserId);
    }
    setUserId(storedUserId);

  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
        form.setValue("imageDataUri", dataUri, { shouldValidate: true });
        form.setValue("locationQuery", undefined, { shouldValidate: true }); 
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
          title: t.cameraAccessProblemTitle,
          description: t.cameraAccessProblemDescription,
        });
      }
    } else {
        setHasCameraPermission(false);
         toast({
          variant: 'destructive',
          title: t.cameraAccessProblemTitle,
          description: t.cameraNotSupported,
        });
    }
  }, [toast, t]);

  useEffect(() => {
    if (activeTab === "camera" && hasCameraPermission === null && isMounted) { 
      startCamera();
    }
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeTab, startCamera, hasCameraPermission, isMounted]);

  const handleCaptureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setImagePreview(dataUri);
        form.setValue("imageDataUri", dataUri, { shouldValidate: true });
        form.setValue("locationQuery", undefined, { shouldValidate: true }); 

        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(t.geolocationNotSupported);
      toast({ variant: "destructive", title: t.geolocationErrorTitle, description: t.geolocationNotSupported });
      return;
    }
    setIsFetchingLocation(true);
    setLocationError(null);
    setLatitude(null);
    setLongitude(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsFetchingLocation(false);
        toast({ title: t.geolocationSuccessTitle, description: t.geolocationSuccessDescription });
      },
      (error) => {
        let message = "";
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = t.geolocationPermissionDenied;
                break;
            case error.POSITION_UNAVAILABLE:
                message = t.geolocationPositionUnavailable;
                break;
            case error.TIMEOUT:
                message = t.geolocationTimeout;
                break;
            default:
                message = t.geolocationUnknownError;
                break;
        }
        setLocationError(message);
        setIsFetchingLocation(false);
        toast({ variant: "destructive", title: t.geolocationErrorTitle, description: message });
      }
    );
  };

  async function onSubmit(data: NarratorFormValues) {
    if (!userId) {
      onGenerationError("User ID not available. Please try again.");
      return;
    }
    onGenerationStart();
    try {
      const { generateTravelNarrativeAction } = await import("@/app/actions");
      // Pass currentLanguage (from context) instead of data.outputLanguage (from form)
      const result = await generateTravelNarrativeAction(data, currentLanguage, userId, latitude, longitude);
      if ("error" in result) {
        onGenerationError(result.error);
      } else {
        onGenerationComplete(result);
      }
    } catch (error) {
      console.error("Error in NarratorForm onSubmit:", error);
      onGenerationError(t.toastGenerationFailedTitle + ": " + (error instanceof Error ? error.message : "Unknown error"));
    }
  }

  const clearImage = () => {
    setImagePreview(null);
    form.setValue("imageDataUri", undefined, { shouldValidate: true });
    if(fileInputRef.current) fileInputRef.current.value = "";
     if (activeTab === "camera" && hasCameraPermission && isMounted) {
          startCamera();
     }
  }

  if (!isMounted) {
    return (
      <Card className="shadow-lg w-full">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-1" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-10 w-full" />
          </div>
           <div className="space-y-2">
             <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex items-center space-x-2 py-2">
            <Skeleton className="h-px flex-grow" />
            <span className="text-sm text-muted-foreground">{t.orSeparator}</span>
            <Skeleton className="h-px flex-grow" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <div className="grid grid-cols-2 gap-2 mb-2">
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-1/3 mb-2" />
            <Skeleton className="h-16 w-full rounded-md border p-3" />
            <Skeleton className="h-16 w-full rounded-md border p-3 mt-2" />
            <Skeleton className="h-16 w-full rounded-md border p-3 mt-2" />
          </div>
           <div className="space-y-2">
             <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <span>{t.formTitle}</span>
        </CardTitle>
        <CardDescription>
          {t.formDescription}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="locationQuery"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    {t.locationNameLabel}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder={t.locationNamePlaceholder}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (e.target.value && imagePreview) {
                          clearImage(); 
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {t.locationNameDescription}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
                <Button type="button" variant="outline" onClick={handleRequestLocation} disabled={isFetchingLocation || isGenerating} className="w-full">
                    <LocateFixed className={`mr-2 h-4 w-4 ${isFetchingLocation ? 'animate-pulse' : ''}`} />
                    {isFetchingLocation ? t.fetchingLocationButton : t.useCurrentLocationButton}
                </Button>
                {locationError && <Alert variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertTitle>{t.geolocationErrorTitle}</AlertTitle><AlertDescription>{locationError}</AlertDescription></Alert>}
                 {latitude && longitude && !locationError && (
                    <Alert variant="default" className="mt-2 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
                        <LocateFixed className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-700 dark:text-green-300">{t.geolocationSuccessTitle}</AlertTitle>
                        <AlertDescription className="text-green-600 dark:text-green-400">
                           {t.geolocationCoordinates}: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                        </AlertDescription>
                    </Alert>
                )}
            </div>


            <div className="flex items-center space-x-2">
              <Separator className="flex-grow" />
              <span className="text-sm text-muted-foreground">{t.orSeparator}</span>
              <Separator className="flex-grow" />
            </div>
            
            <FormField
              control={form.control}
              name="imageDataUri"
              render={() => ( 
                <FormItem>
                  <FormLabel  className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" /> 
                    {t.locationImageLabel}
                  </FormLabel>
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "upload" | "camera")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload"><Upload className="mr-2 h-4 w-4" />{t.uploadImageTab}</TabsTrigger>
                      <TabsTrigger value="camera"><Camera className="mr-2 h-4 w-4" />{t.useCameraTab}</TabsTrigger>
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
                        {t.uploadImageDescription}
                      </FormDescription>
                    </TabsContent>
                    <TabsContent value="camera" className="mt-4 space-y-4">
                        {hasCameraPermission === false && (
                             <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{t.cameraAccessProblemTitle}</AlertTitle>
                                <AlertDescription>
                                {t.cameraAccessProblemDescription} {t.cameraNotSupported}
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
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </div>
                        <Button type="button" onClick={handleCaptureImage} disabled={isGenerating || hasCameraPermission === false || !videoRef.current?.srcObject} className="w-full">
                            <Camera className="mr-2 h-4 w-4" /> {t.captureImageButton}
                        </Button>
                    </TabsContent>
                  </Tabs>
                  {imagePreview && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">{t.imagePreviewTitle}</h4>
                      <div className="relative w-full aspect-video border rounded-md overflow-hidden">
                        <NextImage src={imagePreview} alt="Selected location preview" layout="fill" objectFit="contain" data-ai-hint="landmark photo" />
                      </div>
                      <Button variant="outline" size="sm" onClick={clearImage}>
                        {t.clearImageButton}
                      </Button>
                    </div>
                  )}
                  <FormMessage /> 
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="informationStyle"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t.informationStyleLabel}</FormLabel>
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
            
            <FormField
                control={form.control}
                name="outputLanguage"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2">
                           {/* Using an existing icon, e.g. Languages from lucide-react */}
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-languages"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
                            {t.outputLanguageLabel}
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t.selectLanguagePlaceholder} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="en">{t.languageEn}</SelectItem>
                                <SelectItem value="es">{t.languageEs}</SelectItem>
                                <SelectItem value="fr">{t.languageFr}</SelectItem>
                                <SelectItem value="de">{t.languageDe}</SelectItem>
                                <SelectItem value="ja">{t.languageJa}</SelectItem>
                                {/* Add more languages here */}
                            </SelectContent>
                        </Select>
                        <FormDescription>
                            {t.outputLanguageDescription}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isGenerating || !form.formState.isValid || !userId} className="w-full">
              <Wand2 className="mr-2 h-4 w-4" />
              {isGenerating ? t.generatingButton : t.generateNarrativeButton}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

