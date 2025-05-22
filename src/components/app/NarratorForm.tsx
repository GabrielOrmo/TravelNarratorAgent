
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Wand2, Castle, HelpCircle, Newspaper, Upload, Camera, Image as ImageIcon, AlertTriangle, Search, MapPin, LocateFixed, Loader2, XCircle } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { TravelNarrativeResult, PlaceSuggestion } from "@/app/actions";
import { getPlaceAutocompleteSuggestions, generateTravelNarrativeAction } from "@/app/actions";
import { narratorFormSchema, type NarratorFormValues } from "@/lib/validators";
import { useLanguage, type Locale } from "@/contexts/LanguageContext";
import { useTranslations } from "@/lib/translations";
import { cn } from "@/lib/utils";


const USER_ID_STORAGE_KEY = 'aijolot-user-id';

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
  const { language: currentLanguage } = useLanguage();
  const t = useTranslations();
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCameraView, setShowCameraView] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);

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
    },
  });

  useEffect(() => {
    setIsMounted(true);
    let storedUserId = localStorage.getItem(USER_ID_STORAGE_KEY);
    if (!storedUserId) {
      storedUserId = crypto.randomUUID();
      localStorage.setItem(USER_ID_STORAGE_KEY, storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  const stopCameraTracks = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null; 
    }
    setHasCameraPermission(null); 
  }, []);

  const clearImage = useCallback(() => {
    setImagePreview(null);
    form.setValue("imageDataUri", undefined, { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
    stopCameraTracks();
    setShowCameraView(false);
  }, [form, stopCameraTracks]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        form.setValue("locationQuery", undefined, { shouldValidate: true }); 
        form.setValue("imageDataUri", dataUri, { shouldValidate: true });
        setImagePreview(dataUri);
        setShowCameraView(false);
        setShowSuggestions(false);
        stopCameraTracks();
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
        setShowCameraView(false); 
        toast({
          variant: 'destructive',
          title: t.cameraAccessProblemTitle,
          description: t.cameraAccessProblemDescription,
        });
      }
    } else {
      setHasCameraPermission(false);
      setShowCameraView(false); 
      toast({
        variant: 'destructive',
        title: t.cameraAccessProblemTitle,
        description: t.cameraNotSupported,
      });
    }
  }, [toast, t]);
  
  useEffect(() => {
    if (showCameraView && hasCameraPermission === null && isMounted) {
      startCamera();
    }
    return () => {
      if (!showCameraView) {
          stopCameraTracks();
      }
    };
  }, [showCameraView, startCamera, hasCameraPermission, isMounted, stopCameraTracks]);


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
        form.setValue("locationQuery", undefined, { shouldValidate: true });
        form.setValue("imageDataUri", dataUri, { shouldValidate: true });
        setImagePreview(dataUri);
        setShowCameraView(false);
        stopCameraTracks();
      }
    }
  };

  const handleRequestLocation = () => {
    clearImage();
    form.setValue("locationQuery", undefined, { shouldValidate: true });
    setShowSuggestions(false);

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
            case error.PERMISSION_DENIED: message = t.geolocationPermissionDenied; break;
            case error.POSITION_UNAVAILABLE: message = t.geolocationPositionUnavailable; break;
            case error.TIMEOUT: message = t.geolocationTimeout; break;
            default: message = t.geolocationUnknownError; break;
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
    setShowSuggestions(false);
    onGenerationStart();
    try {
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

  const handleLocationQueryChange = async (query: string) => {
    form.setValue("locationQuery", query, { shouldValidate: true });
    if (query && imagePreview) {
        clearImage();
    }
    if (query && showCameraView) {
        setShowCameraView(false);
        stopCameraTracks();
    }

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsFetchingSuggestions(false);
      return;
    }
    
    setIsFetchingSuggestions(true);
    setShowSuggestions(true);

    debounceTimeoutRef.current = setTimeout(async () => {
      const result = await getPlaceAutocompleteSuggestions(query);
      setIsFetchingSuggestions(false);
      if ("error" in result) {
        toast({ variant: "destructive", title: t.autocompleteErrorTitle, description: result.error });
        setSuggestions([]);
      } else {
        setSuggestions(result);
      }
      setShowSuggestions(result && !("error" in result) && result.length > 0);
    }, 500);
  };

  const handleSuggestionClick = (suggestion: PlaceSuggestion) => {
    form.setValue("locationQuery", suggestion.description, { shouldValidate: true });
    clearImage();
    if (showCameraView) {
      setShowCameraView(false);
      stopCameraTracks();
    }
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsContainerRef.current && !suggestionsContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUploadButtonClick = () => {
    clearImage();
    form.setValue("locationQuery", undefined, {shouldValidate: true});
    if (showCameraView) {
      setShowCameraView(false);
      stopCameraTracks();
    }
    fileInputRef.current?.click();
  }

  const handleCameraButtonClick = () => {
    clearImage();
    form.setValue("locationQuery", undefined, {shouldValidate: true});
    setShowCameraView(true);
  }

  const handleCancelCamera = () => {
    setShowCameraView(false);
    stopCameraTracks();
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-3 mt-4">
            <Skeleton className="h-5 w-1/3 mb-2" />
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-md border p-3 mt-2" />)}
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
            {/* Location Text Input */}
            <FormField
              control={form.control}
              name="locationQuery"
              render={({ field }) => (
                <FormItem className="relative">
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
                      onChange={(e) => handleLocationQueryChange(e.target.value)}
                      onFocus={() => { if (field.value && suggestions.length > 0) setShowSuggestions(true); }}
                      autoComplete="off"
                      disabled={showCameraView}
                    />
                  </FormControl>
                  {showSuggestions && (
                    <div 
                      ref={suggestionsContainerRef}
                      className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
                    >
                      {isFetchingSuggestions && suggestions.length === 0 && (
                        <div className="p-3 text-sm text-muted-foreground flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t.autocompleteLoading}
                        </div>
                      )}
                      {!isFetchingSuggestions && suggestions.length === 0 && form.getValues("locationQuery") && form.getValues("locationQuery")!.length >=2 && (
                         <div className="p-3 text-sm text-muted-foreground">{t.autocompleteNoResults}</div>
                      )}
                      {suggestions.map((suggestion) => (
                        <Button type="button" variant="ghost" key={suggestion.place_id} onClick={() => handleSuggestionClick(suggestion)} className="w-full justify-start text-left px-3 py-2 h-auto">
                          {suggestion.description}
                        </Button>
                      ))}
                    </div>
                  )}
                  <FormDescription>{t.locationNameDescription}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Action Buttons & Camera/Image Specific UI */}
            <div className="space-y-4">
              {!showCameraView && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button type="button" variant="outline" onClick={handleRequestLocation} disabled={isFetchingLocation || isGenerating} className="gap-1">
                    <LocateFixed className={`h-4 w-4 ${isFetchingLocation ? 'animate-pulse' : ''}`} />
                    {t.useCurrentLocationButton}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCameraButtonClick} disabled={isGenerating} className="gap-1">
                    <Camera className="h-4 w-4" />
                    {t.scanWithCameraButton}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleUploadButtonClick} disabled={isGenerating} className="gap-1">
                    <Upload className="h-4 w-4" />
                    {t.uploadImageButton}
                  </Button>
                </div>
              )}
              <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <canvas ref={canvasRef} className="hidden" />

              {locationError && !showCameraView && (
                <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>{t.geolocationErrorTitle}</AlertTitle><AlertDescription>{locationError}</AlertDescription></Alert>
              )}
              {latitude && longitude && !locationError && !showCameraView && (
                <Alert variant="default" className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
                  <LocateFixed className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-700 dark:text-green-300">{t.geolocationSuccessTitle}</AlertTitle>
                  <AlertDescription className="text-green-600 dark:text-green-400">
                    {t.geolocationCoordinates}: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </AlertDescription>
                </Alert>
              )}

              {showCameraView && (
                <div className="space-y-2">
                  {hasCameraPermission === false && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{t.cameraAccessProblemTitle}</AlertTitle>
                      <AlertDescription>{t.cameraAccessProblemDescription} {t.cameraNotSupported}</AlertDescription>
                    </Alert>
                  )}
                  <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted data-testid="camera-feed"/>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" onClick={handleCaptureImage} disabled={isGenerating || hasCameraPermission === false || !videoRef.current?.srcObject}>
                      <Camera className="h-4 w-4 mr-2" /> {t.captureImageButton}
                    </Button>
                     <Button type="button" variant="outline" onClick={handleCancelCamera} disabled={isGenerating}>
                      <XCircle className="h-4 w-4 mr-2" /> {t.cancelCameraButton}
                    </Button>
                  </div>
                </div>
              )}

              {imagePreview && !showCameraView && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">{t.imagePreviewTitle}</h4>
                  <div className="relative w-full aspect-video border rounded-md overflow-hidden">
                    <NextImage src={imagePreview} alt={t.imagePreviewAlt} layout="fill" objectFit="contain" data-ai-hint="landmark photo"/>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearImage} disabled={isGenerating}>
                    <XCircle className="h-4 w-4 mr-2" /> {t.clearImageButton}
                  </Button>
                </div>
              )}
              <FormMessage>{form.formState.errors.imageDataUri?.message || form.formState.errors.root?.message}</FormMessage>
            </div>
            
            {/* Information Style */}
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
                         <div key={style.id}>
                          <RadioGroupItem
                            value={style.id}
                            id={`style-${style.id.toLowerCase()}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`style-${style.id.toLowerCase()}`}
                            className={cn(
                              "flex flex-col p-4 border rounded-lg cursor-pointer transition-colors",
                              "hover:bg-accent/10 dark:hover:bg-accent/20",
                              "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent peer-data-[state=checked]:text-accent-foreground",
                              field.value === style.id ? "border-primary bg-accent text-accent-foreground" : "bg-card text-card-foreground border-border"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <style.icon className={cn("h-5 w-5 shrink-0", field.value === style.id ? "text-accent-foreground" : "text-muted-foreground")} />
                              <span className="font-semibold text-sm">{style.label}</span>
                            </div>
                            <FormDescription className={cn("text-xs mt-1 pl-7", field.value === style.id ? "text-accent-foreground/90" : "text-muted-foreground")}>
                              {style.description}
                            </FormDescription>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
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
