
// src/components/app/NarrativeDisplay.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BotMessageSquare, Volume2, MapPin, Mic, CornerDownLeft, User, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { generateFollowUpAnswerAction, type FollowUpResult } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface NarrativeDisplayProps {
  narrativeText: string;
  audioDataUri: string;
  locationDescription: string; 
}

export function NarrativeDisplay({ narrativeText, audioDataUri, locationDescription }: NarrativeDisplayProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const followUpAudioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [transcribedQuestion, setTranscribedQuestion] = useState("");
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [followUpResult, setFollowUpResult] = useState<FollowUpResult | null>(null);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load(); 
    }
  }, [audioDataUri]);

  useEffect(() => {
    if (followUpResult?.answerAudioDataUri && followUpAudioRef.current) {
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
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[event.results.length -1][0].transcript.trim();
          setTranscribedQuestion(transcript);
          setIsRecording(false);
          handleFollowUpSubmit(transcript);
        };

        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setMicPermissionError("Microphone access was denied. Please enable it in your browser settings to use voice input.");
             toast({
              variant: "destructive",
              title: "Microphone Access Denied",
              description: "Please enable microphone permissions in your browser settings.",
            });
          } else {
             toast({
              variant: "destructive",
              title: "Speech Recognition Error",
              description: `Could not process audio: ${event.error}`,
            });
          }
          setIsRecording(false);
        };
        
        recognitionInstance.onend = () => {
          setIsRecording(false);
        };
        setSpeechRecognition(recognitionInstance);
      } else {
        setMicPermissionError("Speech recognition is not supported by your browser.");
      }
    } else {
       setMicPermissionError("Speech recognition is not available or not supported by your browser.");
    }
  }, [toast]);

  const handleToggleRecording = () => {
    if (!speechRecognition) {
      toast({
        variant: "destructive",
        title: "Voice Input Not Ready",
        description: micPermissionError || "Speech recognition is not available.",
      });
      return;
    }

    if (isRecording) {
      speechRecognition.stop();
      setIsRecording(false);
    } else {
      setMicPermissionError(null); // Clear previous permission errors
      setTranscribedQuestion(""); // Clear previous question
      setFollowUpResult(null); // Clear previous follow-up
      try {
        speechRecognition.start();
        setIsRecording(true);
      } catch (e: any) {
         console.error("Error starting speech recognition:", e);
         toast({
            variant: "destructive",
            title: "Could Not Start Recording",
            description: e.message || "Unknown error starting voice input.",
         });
         setIsRecording(false);
      }
    }
  };

  const handleFollowUpSubmit = async (question: string) => {
    if (!question.trim() || !narrativeText || !locationDescription) {
      if(!question.trim()) {
        toast({
          variant: "destructive",
          title: "Empty Question",
          description: "Please ask a question.",
        });
      }
      return;
    }

    setIsGeneratingFollowUp(true);
    setFollowUpResult(null);

    const result = await generateFollowUpAnswerAction({
      currentNarrativeText: narrativeText,
      locationDescription: locationDescription,
      userQuestion: question,
    });

    setIsGeneratingFollowUp(false);

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: "Follow-up Failed",
        description: result.error,
      });
    } else {
      setFollowUpResult(result);
       toast({
        title: "Follow-up Answer Ready!",
        description: "Your question has been answered.",
      });
    }
  };


  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BotMessageSquare className="h-6 w-6 text-primary" />
          <span>Your Personalized Tour</span>
        </CardTitle>
        <CardDescription>
          Listen to the generated narrative for your selected location and ask follow-up questions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {locationDescription && (
          <div className="pb-2">
            <h3 className="font-semibold mb-1 flex items-center gap-2 text-md">
              <MapPin className="h-5 w-5 text-accent" />
              Identified Location:
            </h3>
            <p className="text-sm text-foreground pl-7">{locationDescription}</p>
          </div>
        )}
        <Separator />
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2 pt-2">
            <Volume2 className="h-5 w-5 text-secondary" />
            Audio Narration
          </h3>
          {audioDataUri ? (
            <audio ref={audioRef} controls src={audioDataUri} className="w-full">
              Your browser does not support the audio element.
            </audio>
          ) : (
            <p className="text-sm text-muted-foreground">Audio is being processed or is unavailable.</p>
          )}
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold mb-2">Narrative Text</h3>
          <ScrollArea className="h-60 w-full rounded-md border p-4 bg-background">
            <p className="text-sm whitespace-pre-wrap">{narrativeText || "No narrative text available."}</p>
          </ScrollArea>
        </div>
        
        {narrativeText && (
          <>
            <Separator />
            <div className="space-y-4 pt-2">
              <h3 className="font-semibold flex items-center gap-2">
                <CornerDownLeft className="h-5 w-5 text-primary" />
                Ask a Follow-up Question
              </h3>
              {micPermissionError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Microphone Issue</AlertTitle>
                  <AlertDescription>{micPermissionError}</AlertDescription>
                </Alert>
              )}
              <div className="flex items-center gap-2">
                <Textarea
                  placeholder="Type your question or use the microphone..."
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
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </div>
               <Button 
                onClick={() => handleFollowUpSubmit(transcribedQuestion)} 
                disabled={isGeneratingFollowUp || isRecording || !transcribedQuestion.trim()}
                className="w-full"
              >
                {isGeneratingFollowUp ? "Getting Answer..." : "Submit Question"}
              </Button>

              {isGeneratingFollowUp && (
                 <div className="flex items-center justify-center py-4">
                    <BotMessageSquare className="h-6 w-6 animate-pulse text-primary mr-2" />
                    <p className="text-sm text-muted-foreground">AI is thinking...</p>
                 </div>
              )}

              {followUpResult && (
                <div className="mt-4 space-y-3 p-4 border rounded-md bg-muted/50">
                  <div>
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-accent" /> Your Question:
                    </h4>
                    <p className="text-sm text-foreground pl-6">{transcribedQuestion}</p>
                  </div>
                  <div>
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <BotMessageSquare className="h-4 w-4 text-primary" /> AI's Answer:
                    </h4>
                     {followUpResult.answerAudioDataUri && (
                        <audio ref={followUpAudioRef} controls src={followUpResult.answerAudioDataUri} className="w-full my-2">
                          Your browser does not support the audio element.
                        </audio>
                      )}
                    <ScrollArea className="h-32 w-full rounded-md border bg-background p-3">
                      <p className="text-sm whitespace-pre-wrap">{followUpResult.answerText}</p>
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
            Narrative, answers, and audio generated by AI. Enjoy your virtual tour!
        </p>
      </CardFooter>
    </Card>
  );
}
