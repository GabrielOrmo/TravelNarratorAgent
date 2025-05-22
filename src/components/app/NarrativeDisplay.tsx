
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BotMessageSquare, Volume2, MapPin, Mic, CornerDownLeft, User, AlertTriangle, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { generateFollowUpAnswerAction, type FollowUpResult, type FollowUpServerInput } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslations } from "@/lib/translations";

interface NarrativeDisplayProps {
  narrativeText: string;
  audioDataUri: string; 
  locationDescription: string;
  outputLanguage: string;
  informationStyle: string;
  userId: string;
  latitude?: number | null;
  longitude?: number | null;
}

const TYPING_SPEED_MS = 30; // Adjust for desired speed

export function NarrativeDisplay({ 
  narrativeText, 
  audioDataUri, 
  locationDescription, 
  outputLanguage,
  informationStyle,
  userId,
  latitude,
  longitude 
}: NarrativeDisplayProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const followUpAudioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const { language: currentGlobalLanguage } = useLanguage();
  const t = useTranslations();

  const [displayedNarrativeText, setDisplayedNarrativeText] = useState("");
  const [displayedFollowUpAnswerText, setDisplayedFollowUpAnswerText] = useState("");

  const narrativeEndRef = useRef<HTMLDivElement>(null);
  const followUpEndRef = useRef<HTMLDivElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [transcribedQuestion, setTranscribedQuestion] = useState("");
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [followUpResult, setFollowUpResult] = useState<FollowUpResult | null>(null);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  // Effect for main narrative typing animation
  useEffect(() => {
    if (!narrativeText) {
      setDisplayedNarrativeText("");
      return;
    }

    setDisplayedNarrativeText(""); // Reset before starting
    let index = 0;
    const intervalId = setInterval(() => {
      setDisplayedNarrativeText((prev) => prev + narrativeText[index]);
      narrativeEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      index++;
      if (index === narrativeText.length) {
        clearInterval(intervalId);
      }
    }, TYPING_SPEED_MS);

    return () => clearInterval(intervalId);
  }, [narrativeText]);

  // Effect for follow-up answer typing animation
  useEffect(() => {
    const answer = followUpResult?.answerText;
    if (!answer) {
      setDisplayedFollowUpAnswerText("");
      return;
    }
    
    setDisplayedFollowUpAnswerText(""); // Reset before starting
    let index = 0;
    const intervalId = setInterval(() => {
      setDisplayedFollowUpAnswerText((prev) => prev + answer[index]);
      followUpEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      index++;
      if (index === answer.length) {
        clearInterval(intervalId);
      }
    }, TYPING_SPEED_MS);

    return () => clearInterval(intervalId);
  }, [followUpResult?.answerText]);


  useEffect(() => {
    if (audioDataUri && audioRef.current) {
      audioRef.current.src = audioDataUri; 
      audioRef.current.load();
    }
  }, [audioDataUri]);

  useEffect(() => {
    if (followUpResult?.answerAudioDataUri && followUpAudioRef.current) {
      followUpAudioRef.current.src = followUpResult.answerAudioDataUri; 
      followUpAudioRef.current.load();
    }
  }, [followUpResult?.answerAudioDataUri]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognitionInstance = new SpeechRecognitionAPI();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = currentGlobalLanguage || 'en-US';

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[event.results.length -1][0].transcript.trim();
          setTranscribedQuestion(transcript);
          setIsRecording(false);
          handleFollowUpSubmit(transcript);
        };

        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          let errorMsgForToast = event.error;
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setMicPermissionError(t.micDeniedToastDescription);
             toast({
              variant: "destructive",
              title: t.micDeniedToastTitle,
              description: t.micDeniedToastDescription,
            });
          } else {
             toast({
              variant: "destructive",
              title: t.speechErrorToastTitle,
              description: t.speechErrorToastDescription(errorMsgForToast),
            });
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
  }, [toast, currentGlobalLanguage, t]);

  const handleToggleRecording = () => {
    if (!speechRecognition) {
      toast({
        variant: "destructive",
        title: t.voiceInputNotReadyToastTitle,
        description: t.voiceInputNotReadyToastDescription(micPermissionError || "Speech recognition is not available."),
      });
      return;
    }

    if (isRecording) {
      speechRecognition.stop();
      setIsRecording(false);
    } else {
      setMicPermissionError(null);
      setTranscribedQuestion("");
      setFollowUpResult(null); // Clear previous follow-up result
      setDisplayedFollowUpAnswerText(""); // Clear previous typed follow-up
      try {
        if (speechRecognition.lang !== (currentGlobalLanguage || 'en-US')) {
            speechRecognition.lang = currentGlobalLanguage || 'en-US';
        }
        speechRecognition.start();
        setIsRecording(true);
      } catch (e: any) {
         console.error("Error starting speech recognition:", e);
         toast({
            variant: "destructive",
            title: t.couldNotStartRecordingToastTitle,
            description: t.couldNotStartRecordingToastDescription(e.message),
         });
         setIsRecording(false);
      }
    }
  };

  const handleFollowUpSubmit = async (question: string) => {
    if (!question.trim() || !narrativeText) { 
      if(!question.trim()) {
        toast({
          variant: "destructive",
          title: t.emptyQuestionToastTitle,
          description: t.emptyQuestionToastDescription,
        });
      }
      return;
    }
    if (!userId) {
       toast({
        variant: "destructive",
        title: "User ID Missing",
        description: "Cannot process follow-up without a User ID.",
      });
      return;
    }


    setIsGeneratingFollowUp(true);
    setFollowUpResult(null); // Clear previous result
    setDisplayedFollowUpAnswerText(""); // Clear previous typed text

    const actionInput: FollowUpServerInput = {
      locationDescription: locationDescription, 
      userQuestion: question,
      language: currentGlobalLanguage,
      informationStyle: informationStyle,
      userId: userId,
      latitude: latitude,
      longitude: longitude,
    };

    const result = await generateFollowUpAnswerAction(actionInput);

    setIsGeneratingFollowUp(false);

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: t.followUpFailedToastTitle,
        description: result.error,
      });
    } else {
      setFollowUpResult(result);
       toast({
        title: t.followUpAnswerReadyToastTitle,
        description: t.followUpAnswerReadyToastDescription,
      });
    }
  };


  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BotMessageSquare className="h-6 w-6 text-primary" />
          <span>{t.narrativeDisplayTitle}</span>
        </CardTitle>
        <CardDescription>
          {t.narrativeDisplayDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {locationDescription && (
          <div className="pb-2">
            <h3 className="font-semibold mb-1 flex items-center gap-2 text-md">
              <MapPin className="h-5 w-5 text-accent" />
              {t.identifiedLocationLabel}
            </h3>
            <p className="text-sm text-foreground pl-7">{locationDescription}</p>
          </div>
        )}
        <Separator />
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2 pt-2">
            <Volume2 className="h-5 w-5 text-secondary" />
            {t.audioNarrationLabel}
          </h3>
          {audioDataUri ? (
            <audio ref={audioRef} controls src={audioDataUri} className="w-full">
              {t.audioNotSupported}
            </audio>
          ) : (
            <Alert variant="default" className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertTitle>{t.audioUnavailableTitle}</AlertTitle>
              <AlertDescription>
                {t.audioUnavailableDescription}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold mb-2">{t.narrativeTextLabel}</h3>
          <ScrollArea className="min-h-[6rem] max-h-80 w-full rounded-md border p-4 bg-background">
            <p className="text-sm whitespace-pre-wrap break-words">
              {displayedNarrativeText || (!narrativeText && t.noNarrativeText) || ""}
            </p>
            <div ref={narrativeEndRef} />
          </ScrollArea>
        </div>
        
        {narrativeText && (
          <>
            <Separator />
            <div className="space-y-4 pt-2">
              <h3 className="font-semibold flex items-center gap-2">
                <CornerDownLeft className="h-5 w-5 text-primary" />
                {t.followUpQuestionLabel}
              </h3>
              {micPermissionError && (
                <Alert variant="destructive">
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
                  rows={2}
                  className="flex-grow"
                  disabled={isRecording || isGeneratingFollowUp}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleRecording}
                  disabled={!speechRecognition || isGeneratingFollowUp}
                  className={isRecording ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}
                  aria-label={isRecording ? t.stopRecordingButtonAria : t.startRecordingButtonAria}
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </div>
               <Button 
                onClick={() => handleFollowUpSubmit(transcribedQuestion)} 
                disabled={isGeneratingFollowUp || isRecording || !transcribedQuestion.trim() || !userId}
                className="w-full"
              >
                {isGeneratingFollowUp ? t.gettingAnswerButton : t.submitQuestionButton}
              </Button>

              {isGeneratingFollowUp && (
                 <div className="flex items-center justify-center py-4">
                    <BotMessageSquare className="h-6 w-6 animate-pulse text-primary mr-2" />
                    <p className="text-sm text-muted-foreground">{t.aiThinking}</p>
                 </div>
              )}

              {followUpResult && (
                <div className="mt-4 space-y-3 p-4 border rounded-md bg-muted/50">
                  <div>
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-accent" /> {t.yourQuestionLabel}
                    </h4>
                    <p className="text-sm text-foreground pl-6">{transcribedQuestion}</p>
                  </div>
                  <div>
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <BotMessageSquare className="h-4 w-4 text-primary" /> {t.aiAnswerLabel}
                    </h4>
                     {followUpResult.answerAudioDataUri && (
                        <audio ref={followUpAudioRef} controls src={followUpResult.answerAudioDataUri} className="w-full my-2">
                          {t.audioNotSupported}
                        </audio>
                      )}
                    <ScrollArea className="min-h-[4rem] max-h-60 w-full rounded-md border bg-background p-3">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {displayedFollowUpAnswerText}
                      </p>
                      <div ref={followUpEndRef} />
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
            {t.narrativeDisplayFooterWebhook}
        </p>
      </CardFooter>
    </Card>
  );
}

