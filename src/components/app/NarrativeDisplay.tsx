
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BotMessageSquare, User, Volume2, MapPin, Mic, CornerDownLeft, AlertTriangle, Info, Send, Compass } from "lucide-react";
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
  onExploreNewLocation: () => void; // New prop
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  audioDataUri?: string;
  timestamp: Date;
}

const TYPING_SPEED_MS = 30;
const SCROLL_THRESHOLD = 50; // Pixels from bottom to trigger auto-scroll

export function NarrativeDisplay({
  narrativeText,
  audioDataUri,
  locationDescription,
  outputLanguage,
  informationStyle,
  userId,
  latitude,
  longitude,
  onExploreNewLocation, // Destructure new prop
}: NarrativeDisplayProps) {
  const initialAudioRef = useRef<HTMLAudioElement>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const { toast } = useToast();
  const { language: currentGlobalLanguage } = useLanguage();
  const t = useTranslations();

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentDisplayedText, setCurrentDisplayedText] = useState<Record<string, string>>({}); // Stores progressively typed text for each AI message
  const [activeTypingMessageId, setActiveTypingMessageId] = useState<string | null>(null); // ID of the AI message currently being typed

  const chatEndRef = useRef<HTMLDivElement>(null); // For scrolling to the end of messages
  const chatScrollAreaRef = useRef<HTMLDivElement>(null); // Ref for the ScrollArea root


  const [isRecording, setIsRecording] = useState(false);
  const [transcribedQuestion, setTranscribedQuestion] = useState("");
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  // Typing animation effect for AI messages
  useEffect(() => {
    if (!activeTypingMessageId) return;

    const messageToAnimate = chatHistory.find(msg => msg.id === activeTypingMessageId && msg.sender === 'ai');
    if (!messageToAnimate || !messageToAnimate.text) {
      setActiveTypingMessageId(null);
      return;
    }

    // Initialize displayed text for this message if not already
    if (currentDisplayedText[activeTypingMessageId] === undefined) {
      setCurrentDisplayedText(prev => ({ ...prev, [activeTypingMessageId]: "" }));
    }

    let index = (currentDisplayedText[activeTypingMessageId] || "").length;

    if (index >= messageToAnimate.text.length) {
      setActiveTypingMessageId(null); // Animation finished
      // Final scroll to ensure end is visible
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
      return;
    }

    const intervalId = setInterval(() => {
      setCurrentDisplayedText(prev => ({
        ...prev,
        [activeTypingMessageId]: (prev[activeTypingMessageId] || "") + messageToAnimate.text[index]
      }));
      index++;

      // Conditional auto-scroll
      const viewport = chatScrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      if (viewport) {
        const { scrollHeight, scrollTop, clientHeight } = viewport;
        // Scroll if user is near the bottom or if it's the beginning of the message
        if (scrollHeight - scrollTop - clientHeight <= SCROLL_THRESHOLD || index <= 2) {
          chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      } else { // Fallback if viewport not found (less likely but safe)
        chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }


      if (index >= messageToAnimate.text.length) {
        clearInterval(intervalId);
        setActiveTypingMessageId(null); // Animation finished
        // Final scroll after animation completes
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
      }
    }, TYPING_SPEED_MS);

    return () => clearInterval(intervalId);
  }, [activeTypingMessageId, chatHistory, currentDisplayedText]);


  // Effect to initialize or reset chat when main narrative changes
  useEffect(() => {
    setChatHistory([]); // Clear previous chat history
    setCurrentDisplayedText({});
    setActiveTypingMessageId(null);

    if (narrativeText) {
      const initialMessageId = `ai-initial-${Date.now()}`;
      const initialAiMessage: ChatMessage = {
        id: initialMessageId,
        sender: 'ai',
        text: narrativeText,
        audioDataUri: audioDataUri, // Use the prop for the initial audio
        timestamp: new Date(),
      };
      setChatHistory([initialAiMessage]);
      if(narrativeText.trim() !== "") {
        setActiveTypingMessageId(initialMessageId); // Start typing animation for the initial message
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrativeText]); // audioDataUri removed from deps as it's part of the initial message


  // Effect for the initial audio player (separate from chat history audio)
  useEffect(() => {
    if (audioDataUri && initialAudioRef.current) {
      initialAudioRef.current.src = audioDataUri;
      initialAudioRef.current.load(); // Ensure the new src is loaded
    }
  }, [audioDataUri]);


  // Speech Recognition Setup
   useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognitionInstance = new SpeechRecognitionAPI();
        recognitionInstance.continuous = false; // Stop after first phrase
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = currentGlobalLanguage || 'en-US'; // Set based on global language

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          setTranscribedQuestion(transcript);
          setIsRecording(false);
          if (transcript) handleFollowUpSubmit(transcript); // Submit if transcript is not empty
        };

        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          let errorMsgForToast = event.error;
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setMicPermissionError(t.micDeniedToastDescription); // Specific message for permission issues
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
      // Handle server-side rendering or environments without window.SpeechRecognition
      setMicPermissionError(t.voiceInputNotReadyToastDescription("Speech recognition not available in this environment."));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, currentGlobalLanguage, t]); // Add t to dependencies

  const handleToggleRecording = () => {
    if (!speechRecognition) {
      toast({ variant: "destructive", title: t.voiceInputNotReadyToastTitle, description: t.voiceInputNotReadyToastDescription(micPermissionError || "Speech recognition is not available.") });
      return;
    }

    if (isRecording) {
      speechRecognition.stop();
      setIsRecording(false);
    } else {
      setMicPermissionError(null); // Clear previous mic errors
      setTranscribedQuestion(""); // Clear previous question
      try {
        // Update language if it changed
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
    setTranscribedQuestion(""); // Clear input after submission

    const initialNarrativeMessage = chatHistory.find(msg => msg.id.startsWith('ai-initial'));
    const contextNarrative = initialNarrativeMessage ? initialNarrativeMessage.text : narrativeText; // Fallback to prop if somehow not in history


    const actionInput: FollowUpServerInput = {
      currentNarrativeText: contextNarrative,
      locationDescription: locationDescription, // locationDescription is from props
      userQuestion: trimmedQuestion,
      language: outputLanguage, // outputLanguage is from props (original narrative language)
      informationStyle: informationStyle, // from props
      userId: userId, // from props
      latitude: latitude, // from props
      longitude: longitude, // from props
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
        setActiveTypingMessageId(aiResponseMessageId); // Start typing this new AI message
      }
      toast({ title: t.followUpAnswerReadyToastTitle, description: t.followUpAnswerReadyToastDescription });
    }
  };


  return (
    <Card className="shadow-lg w-full flex flex-col max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-10rem)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BotMessageSquare className="h-6 w-6 text-primary" />
          <span>{t.narrativeDisplayTitle}</span>
        </CardTitle>
        <CardDescription>
          {t.narrativeDisplayDescription}
        </CardDescription>
      </CardHeader>

      {/* Static Info: Location and Initial Audio Player */}
      <CardContent className="space-y-2 pb-2">
        {locationDescription && (
          <div className="pb-1">
            <h3 className="font-semibold mb-0.5 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-accent" />
              {t.identifiedLocationLabel}
            </h3>
            <p className="text-xs text-foreground pl-6 break-words">{locationDescription}</p>
          </div>
        )}
        {/* Initial Audio: Only show if audioDataUri (for initial narrative) is present */}
        {chatHistory.some(msg => msg.id.startsWith('ai-initial') && msg.audioDataUri) && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-2 text-sm pt-1">
                <Volume2 className="h-4 w-4 text-secondary" />
                {t.audioNarrationLabel} ({t.initialNarrativeLabel})
              </h3>
              <audio ref={initialAudioRef} controls src={chatHistory.find(msg => msg.id.startsWith('ai-initial'))?.audioDataUri} className="w-full">
                {t.audioNotSupported}
              </audio>
            </div>
          </>
        )}
         {/* Show if main narrative text exists but no audio for it */}
        {!chatHistory.some(msg => msg.id.startsWith('ai-initial') && msg.audioDataUri) && narrativeText && (
             <>
                <Separator />
                <Alert variant="default" className="bg-muted/50 mt-1 text-xs py-2">
                    <Info className="h-3 w-3" />
                    <AlertTitle className="text-xs">{t.audioUnavailableTitle}</AlertTitle>
                    <AlertDescription className="text-xs">{t.audioUnavailableDescription}</AlertDescription>
                </Alert>
            </>
        )}
      </CardContent>

      <Separator />

      {/* Chat History Scroll Area */}
      <ScrollArea 
        ref={chatScrollAreaRef} 
        className="flex-grow w-full p-4 bg-background" /* Removed min-h here to rely on flex-grow */
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
                    ? (currentDisplayedText[message.id] || "") + "▎" // Typing indicator
                    : message.text || (message.sender === 'ai' ? t.noNarrativeText : "") // Fallback for empty AI text
                  }
                </p>
              </div>
              {/* Audio player for AI follow-up messages, shown after typing is complete */}
              {message.sender === 'ai' && message.audioDataUri && activeTypingMessageId !== message.id && message.text.trim() !== "" && (
                <audio
                  ref={(el) => { audioRefs.current[message.id] = el; }} // Assign ref for this specific audio player
                  controls
                  src={message.audioDataUri}
                  className="w-full max-w-[250px] mt-2 ml-0 sm:ml-2 self-start h-8" // Smaller, left-aligned
                >
                  {t.audioNotSupported}
                </audio>
              )}
              <p className={`text-xs mt-1 px-1 ${message.sender === 'user' ? 'text-muted-foreground/80 self-end' : 'text-muted-foreground/80 self-start'}`}>
                {message.sender === 'user' ? <User className="inline h-3 w-3 mr-1" /> : <BotMessageSquare className="inline h-3 w-3 mr-1 text-primary" />}
                {/* Consider adding message.timestamp here, formatted */}
              </p>
            </div>
          ))}
          <div ref={chatEndRef} /> {/* Invisible div to scroll to */}
        </div>
        {!chatHistory.length && (
            <div className="text-center text-muted-foreground py-8">
                <BotMessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p>{t.startConversationPlaceholder}</p>
            </div>
        )}
      </ScrollArea>

      {/* Follow-up Input Area - only show if there's a chat history */}
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
