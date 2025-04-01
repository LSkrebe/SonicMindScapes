
import React, { useState } from 'react';
import Header from '@/components/Layout/Header';
import RedditAuth from '@/components/Reddit/RedditAuth';
import PostSelector from '@/components/Reddit/PostSelector';
import VoiceSelector from '@/components/Voice/VoiceSelector';
import VideoCreator from '@/components/Video/VideoCreator';
import YouTubeUploader from '@/components/YouTube/YouTubeUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { type RedditPost } from '@/services/redditService';

const Index = () => {
  const [step, setStep] = useState(1);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<RedditPost[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  const handleRedditAuthenticated = (token: string) => {
    setAuthToken(token);
    setStep(Math.max(step, 2));
  };

  const handlePostsSelected = (posts: RedditPost[]) => {
    setSelectedPosts(posts);
    setStep(Math.max(step, 3));
  };

  const handleVoiceGenerated = (blob: Blob) => {
    setAudioBlob(blob);
    setStep(Math.max(step, 4));
  };

  const handleVideoCreated = (blob: Blob) => {
    setVideoBlob(blob);
    setStep(Math.max(step, 5));
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <RedditAuth onAuthenticated={handleRedditAuthenticated} />;
      case 2:
        return authToken ? 
          <PostSelector authToken={authToken} onPostsSelected={handlePostsSelected} /> : 
          <div className="text-center py-8">Please authenticate with Reddit first</div>;
      case 3:
        return selectedPosts.length > 0 ? 
          <VoiceSelector selectedPosts={selectedPosts} onVoiceGenerated={handleVoiceGenerated} /> : 
          <div className="text-center py-8">Please select posts first</div>;
      case 4:
        return audioBlob ? 
          <VideoCreator selectedPosts={selectedPosts} audioBlob={audioBlob} onVideoCreated={handleVideoCreated} /> : 
          <div className="text-center py-8">Please generate voiceover first</div>;
      case 5:
        return videoBlob ? 
          <YouTubeUploader videoBlob={videoBlob} selectedPosts={selectedPosts} /> : 
          <div className="text-center py-8">Please create video first</div>;
      default:
        return <div>Unknown step</div>;
    }
  };

  const getStepTitle = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return "Connect Reddit Account";
      case 2:
        return "Select Reddit Posts";
      case 3:
        return "Generate Voiceover";
      case 4:
        return "Create Video";
      case 5:
        return "Upload to YouTube";
      default:
        return `Step ${currentStep}`;
    }
  };

  const navigateToNextStep = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const navigateToPrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Reddit Vocal Scribe</h1>
          <p className="text-muted-foreground">
            Convert Reddit posts to YouTube videos with voiceovers and subtitles
          </p>
        </div>
        
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
              {[1, 2, 3, 4, 5].map((stepNumber) => (
                <li key={stepNumber} className="md:flex-1">
                  <Button
                    variant={stepNumber === step ? "default" : (stepNumber < step ? "outline" : "ghost")}
                    className={`w-full justify-start text-left ${
                      stepNumber < step ? "text-primary" : ""
                    } ${stepNumber > step ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={stepNumber > step}
                    onClick={() => stepNumber <= step && setStep(stepNumber)}
                  >
                    <span className="flex items-center">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center mr-2">
                        {stepNumber < step ? (
                          <span className="text-xs">✓</span>
                        ) : (
                          <span className="text-xs">{stepNumber}</span>
                        )}
                      </span>
                      <span className="hidden md:inline">{getStepTitle(stepNumber)}</span>
                    </span>
                  </Button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
        
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>{getStepTitle(step)}</CardTitle>
              <CardDescription>
                {step === 1 && "Connect your Reddit account to get started"}
                {step === 2 && "Select posts from your joined subreddits"}
                {step === 3 && "Convert selected posts to speech using ElevenLabs"}
                {step === 4 && "Create a video with voiceover and subtitles"}
                {step === 5 && "Upload your video to YouTube"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={navigateToPrevStep}
            disabled={step === 1}
          >
            Previous Step
          </Button>
          
          <Button
            onClick={navigateToNextStep}
            disabled={
              (step === 1 && !authToken) ||
              (step === 2 && selectedPosts.length === 0) ||
              (step === 3 && !audioBlob) ||
              (step === 4 && !videoBlob) ||
              step === 5
            }
          >
            Next Step
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
      
      <footer className="border-t py-4">
        <div className="container text-center text-sm text-muted-foreground">
          Reddit Vocal Scribe &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Index;
