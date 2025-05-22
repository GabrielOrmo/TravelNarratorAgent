
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BotMessageSquare, User, Volume2, MapPin, Mic, CornerDownLeft, AlertTriangle, Info, Send, Compass, Play, Pause } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { generateFollowUpAnswerAction, type FollowUpResult, type FollowUpServerInput } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslations } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface NarrativeDisplayProps {
  narrativeText: string;
  audioDataUri: string;
  locationDescription: string;
  outputLanguage: string;
  informationStyle: string;
  userId: string;
  latitude?: number | null;
  longitude?: number | null;
  onExploreNewLocation: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  audioDataUri?: string;
  timestamp: Date;
}

const TYPING_SPEED_MS = 30;
const SCROLL_THRESHOLD = 50; 

export function NarrativeDisplay({
  narrativeText,
  audioDataUri, // This is for the initial narrative
  locationDescription,
  outputLanguage,
  informationStyle,
  userId,
  latitude,
  longitude,
  onExploreNewLocation,
}: NarrativeDisplayProps) {
  const initialAudioRef = useRef<HTMLAudioElement>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const { toast } = useToast();
  const { language: currentGlobalLanguage } = useLanguage();
  const t = useTranslations();

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentDisplayedText, setCurrentDisplayedText] = useState<Record<string, string>>({});
  const [activeTypingMessageId, setActiveTypingMessageId] = useState<string | null>(null);
  const [isPlayingInitialAudio, setIsPlayingInitialAudio] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);


  const [isRecording, setIsRecording] = useState(false);
  const [transcribedQuestion, setTranscribedQuestion] = useState("");
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTypingMessageId) return;

    const messageToAnimate = chatHistory.find(msg => msg.id === activeTypingMessageId && msg.sender === 'ai');
    if (!messageToAnimate || !messageToAnimate.text) {
      setActiveTypingMessageId(null);
      return;
    }

    if (currentDisplayedText[activeTypingMessageId] === undefined) {
      setCurrentDisplayedText(prev => ({ ...prev, [activeTypingMessageId]: "" }));
    }

    let index = (currentDisplayedText[activeTypingMessageId] || "").length;

    if (index >= messageToAnimate.text.length) {
      setActiveTypingMessageId(null);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
      return;
    }

    const intervalId = setInterval(() => {
      setCurrentDisplayedText(prev => ({
        ...prev,
        [activeTypingMessageId]: (prev[activeTypingMessageId] || "") + messageToAnimate.text[index]
      }));
      index++;

      const viewport = chatScrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      if (viewport) {
        const { scrollHeight, scrollTop, clientHeight } = viewport;
        if (scrollHeight - scrollTop - clientHeight <= SCROLL_THRESHOLD || index <= 2) {
          chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      } else {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }


      if (index >= messageToAnimate.text.length) {
        clearInterval(intervalId);
        setActiveTypingMessageId(null);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
      }
    }, TYPING_SPEED_MS);

    return () => clearInterval(intervalId);
  }, [activeTypingMessageId, chatHistory, currentDisplayedText]);


  useEffect(() => {
    setChatHistory([]);
    setCurrentDisplayedText({});
    setActiveTypingMessageId(null);
    setIsPlayingInitialAudio(false); // Reset playing state

    if (narrativeText) {
      const initialMessageId = `ai-initial-${Date.now()}`;
      const initialAiMessage: ChatMessage = {
        id: initialMessageId,
        sender: 'ai',
        text: narrativeText,
        audioDataUri: audioDataUri, // Use the prop here for the first message
        timestamp: new Date(),
      };
      setChatHistory([initialAiMessage]);
      if(narrativeText.trim() !== "") {
        setActiveTypingMessageId(initialMessageId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrativeText]); // Rerun if initial narrativeText changes


  useEffect(() => {
    // Setup for the initial audio player
    if (audioDataUri && initialAudioRef.current) {
      initialAudioRef.current.src = audioDataUri;
      initialAudioRef.current.load();
      initialAudioRef.current.onended = () => setIsPlayingInitialAudio(false);
      initialAudioRef.current.onpause = () => setIsPlayingInitialAudio(false);
      initialAudioRef.current.onplay = () => setIsPlayingInitialAudio(true);
    }
     return () => {
      if (initialAudioRef.current) {
        initialAudioRef.current.onended = null;
        initialAudioRef.current.onpause = null;
        initialAudioRef.current.onplay = null;
      }
    };
  }, [audioDataUri]);


   useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognitionInstance = new SpeechRecognitionAPI();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = currentGlobalLanguage || 'en-US';

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          setTranscribedQuestion(transcript);
          setIsRecording(false);
          if (transcript) handleFollowUpSubmit(transcript);
        };

        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          let errorMsgForToast = event.error;
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setMicPermissionError(t.micDeniedToastDescription);
            toast({ variant: "destructive", title: t.micDeniedToastTitle, description: t.micDeniedToastDescription });
          } else {
            toast({ variant: "destructive", title: t.speechErrorToastTitle, description: t.speechErrorToastDescription(errorMsgForToast) });
          }
          setIsRecording(false);
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
        };
        setSpeechRecognition(recognitionInstance);
      } else {
         setMicPermissionError(t.voiceInputNotReadyToastDescription("Speech recognition API not found in browser."));
      }
    } else {
      setMicPermissionError(t.voiceInputNotReadyToastDescription("Speech recognition not available in this environment."));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, currentGlobalLanguage, t]);

  const handleToggleRecording = () => {
    if (!speechRecognition) {
      toast({ variant: "destructive", title: t.voiceInputNotReadyToastTitle, description: t.voiceInputNotReadyToastDescription(micPermissionError || "Speech recognition is not available.") });
      return;
    }

    if (isRecording) {
      speechRecognition.stop();
      setIsRecording(false);
    } else {
      setMicPermissionError(null);
      setTranscribedQuestion("");
      try {
        if(speechRecognition.lang !== (currentGlobalLanguage || 'en-US')) {
            speechRecognition.lang = currentGlobalLanguage || 'en-US';
        }
        speechRecognition.start();
        setIsRecording(true);
      } catch (e: any) {
        console.error("Error starting speech recognition:", e);
        toast({ variant: "destructive", title: t.couldNotStartRecordingToastTitle, description: t.couldNotStartRecordingToastDescription(e.message) });
        setIsRecording(false);
      }
    }
  };

  const handleFollowUpSubmit = async (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      toast({ variant: "destructive", title: t.emptyQuestionToastTitle, description: t.emptyQuestionToastDescription });
      return;
    }
    if (!userId) {
      toast({ variant: "destructive", title: "User ID Missing", description: "Cannot process follow-up without a User ID." });
      return;
    }

    setIsGeneratingFollowUp(true);

    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: trimmedQuestion,
      timestamp: new Date(),
    };
    setChatHistory(prev => [...prev, userMessage]);
    setTranscribedQuestion("");

    const actionInput: FollowUpServerInput = {
      currentNarrativeText: narrativeText, // This is the initial narrative text prop
      locationDescription: locationDescription,
      userQuestion: trimmedQuestion,
      language: outputLanguage, 
      informationStyle: informationStyle,
      userId: userId,
      latitude: latitude,
      longitude: longitude,
    };

    const result = await generateFollowUpAnswerAction(actionInput);
    setIsGeneratingFollowUp(false);

    if ("error" in result) {
      toast({ variant: "destructive", title: t.followUpFailedToastTitle, description: result.error });
    } else {
      const aiResponseMessageId = `ai-followup-${Date.now()}`;
      const aiResponseMessage: ChatMessage = {
        id: aiResponseMessageId,
        sender: 'ai',
        text: result.answerText,
        audioDataUri: result.answerAudioDataUri,
        timestamp: new Date(),
      };
      setChatHistory(prev => [...prev, aiResponseMessage]);
      if (result.answerText.trim() !== "") {
        setActiveTypingMessageId(aiResponseMessageId);
      }
      toast({ title: t.followUpAnswerReadyToastTitle, description: t.followUpAnswerReadyToastDescription });
    }
  };

  const handleToggleInitialAudio = () => {
    if (initialAudioRef.current) {
      if (isPlayingInitialAudio) {
        initialAudioRef.current.pause();
      } else {
        initialAudioRef.current.play().catch(err => console.error("Error playing audio:", err));
      }
      setIsPlayingInitialAudio(!isPlayingInitialAudio);
    }
  };

  // Hidden audio element for the initial narrative, controlled by the speaker button
  const initialAudioElement = audioDataUri ? (
    <audio ref={initialAudioRef} src={audioDataUri} className="hidden" preload="metadata" />
  ) : null;


  return (
    <Card className="shadow-lg w-full flex flex-col max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-10rem)]">
      <CardHeader className="py-3">
        <div className="flex items-center gap-2">
          <BotMessageSquare className="h-6 w-6 text-primary shrink-0" />
          <div>
            <CardTitle className="text-xl">
              {t.narrativeDisplayTitle}
            </CardTitle>
            {locationDescription && (
              <CardDescription className="text-xs">
                {t.chattingAboutLocation(locationDescription)}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-2 pt-0">
         {/* Removed original Location Context and Audio Section */}
         {/* New minimal Location Context & Initial Audio Control Button */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 pb-1 border-b border-t">
          <div className="flex items-center gap-1 overflow-hidden">
            <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
            <span className="truncate" title={locationDescription}>{t.identifiedLocationLabel}: {locationDescription}</span>
          </div>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleInitialAudio}
                  disabled={!audioDataUri || activeTypingMessageId?.startsWith('ai-initial')}
                  className="h-7 w-7 shrink-0"
                  aria-label={isPlayingInitialAudio ? t.pauseInitialNarrativeTooltip : t.playInitialNarrativeTooltip}
                >
                  {isPlayingInitialAudio ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{!audioDataUri ? t.initialAudioNotAvailableTooltip : isPlayingInitialAudio ? t.pauseInitialNarrativeTooltip : t.playInitialNarrativeTooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {initialAudioElement}
      </CardContent>

      {/* Removed Separator here as the border-b above serves a similar purpose */}

      <ScrollArea 
        ref={chatScrollAreaRef} 
        className="flex-grow w-full p-4 bg-background min-h-0" 
      >
        <div className="space-y-4">
          {chatHistory.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'
                }`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-xl shadow-sm ${message.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-card text-card-foreground rounded-bl-none border'
                  }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {activeTypingMessageId === message.id
                    ? (currentDisplayedText[message.id] || "") + "▎" 
                    : message.text || (message.sender === 'ai' ? t.noNarrativeText : "") 
                  }
                </p>
              </div>
              {message.sender === 'ai' && message.audioDataUri && activeTypingMessageId !== message.id && message.text.trim() !== "" && !message.id.startsWith('ai-initial') && ( // Don't show player for initial narrative here
                <audio
                  ref={(el) => { audioRefs.current[message.id] = el; }}
                  controls
                  src={message.audioDataUri}
                  className="w-full max-w-[250px] mt-2 ml-0 sm:ml-2 self-start h-8"
                >
                  {t.audioNotSupported}
                </audio>
              )}
              <p className={`text-xs mt-1 px-1 ${message.sender === 'user' ? 'text-muted-foreground/80 self-end' : 'text-muted-foreground/80 self-start'}`}>
                {message.sender === 'user' ? <User className="inline h-3 w-3 mr-1" /> : <BotMessageSquare className="inline h-3 w-3 mr-1 text-primary" />}
              </p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        {!chatHistory.length && (
            <div className="text-center text-muted-foreground py-8">
                <BotMessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p>{t.startConversationPlaceholder}</p>
            </div>
        )}
      </ScrollArea>

      {chatHistory.length > 0 && (
        <>
          <Separator />
          <div className="p-3 border-t space-y-2 bg-muted/50">
            {micPermissionError && (
              <Alert variant="destructive" className="mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t.micIssueAlertTitle}</AlertTitle>
                <AlertDescription>{t.micIssueAlertDescription(micPermissionError)}</AlertDescription>
              </Alert>
            )}
            <div className="flex items-center gap-2">
              <Textarea
                placeholder={t.followUpPlaceholder}
                value={transcribedQuestion}
                onChange={(e) => setTranscribedQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isGeneratingFollowUp && !isRecording && transcribedQuestion.trim()) {
                    e.preventDefault();
                    handleFollowUpSubmit(transcribedQuestion);
                  }
                }}
                rows={1}
                className="flex-grow resize-none py-2.5 px-3 text-sm focus-within:ring-1 focus-within:ring-ring"
                disabled={isRecording || isGeneratingFollowUp}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleRecording}
                disabled={!speechRecognition || isGeneratingFollowUp}
                className={cn("shrink-0 rounded-full", isRecording ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "text-muted-foreground hover:text-primary")}
                aria-label={isRecording ? t.stopRecordingButtonAria : t.startRecordingButtonAria}
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => handleFollowUpSubmit(transcribedQuestion)}
                disabled={isGeneratingFollowUp || isRecording || !transcribedQuestion.trim() || !userId}
                className="shrink-0 rounded-full"
                size="icon"
                aria-label={t.submitQuestionButton}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            {isGeneratingFollowUp && (
              <div className="flex items-center justify-center pt-1">
                <BotMessageSquare className="h-4 w-4 animate-pulse text-primary mr-1.5" />
                <p className="text-xs text-muted-foreground">{t.aiThinking}</p>
              </div>
            )}
          </div>
        </>
      )}
      <CardFooter className="py-3 border-t flex-col items-start gap-2 bg-muted/30">
         <p className="text-xs text-muted-foreground">
          {t.narrativeDisplayFooterWebhook}
        </p>
        <Button variant="outline" size="sm" onClick={onExploreNewLocation} className="w-full sm:w-auto self-end">
          <Compass className="h-4 w-4 mr-2" />
          {t.exploreNewLocationButton}
        </Button>
      </CardFooter>
    </Card>
  );
}
