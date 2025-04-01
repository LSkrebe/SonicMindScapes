
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Loader2, Volume2 } from 'lucide-react';
import { getVoices, generateSpeech, blobToBase64, type Voice } from '@/services/voiceService';
import { RedditPost } from '@/services/redditService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VoiceSelectorProps {
  selectedPosts: RedditPost[];
  onVoiceGenerated: (audioBlob: Blob) => void;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedPosts, onVoiceGenerated }) => {
  const [apiKey, setApiKey] = useState('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [isGenerating, setIsGenerating] = useState(false);
  const [combinedText, setCombinedText] = useState('');
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load API key from localStorage if available
    const savedApiKey = localStorage.getItem('elevenlabs_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      fetchVoices(savedApiKey);
    }
    
    // Combine post content
    const combined = selectedPosts
      .map(post => {
        return `Title: ${post.title}\n\n${post.selftext}\n\n---\n\n`;
      })
      .join('');
    
    setCombinedText(combined);
  }, [selectedPosts]);

  const fetchVoices = async (key: string) => {
    try {
      const fetchedVoices = await getVoices(key);
      setVoices(fetchedVoices);
      
      // Set default voice if available
      if (fetchedVoices.length > 0) {
        setSelectedVoiceId(fetchedVoices[0].voice_id);
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      toast({
        title: "Voice Fetch Failed",
        description: "Could not load voices from ElevenLabs. Please check your API key.",
        variant: "destructive"
      });
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setApiKey(key);
    
    // Save API key to localStorage
    localStorage.setItem('elevenlabs_api_key', key);
    
    if (key.length >= 30) {
      fetchVoices(key);
    }
  };

  const handleGenerateVoiceover = async () => {
    if (!apiKey || !selectedVoiceId || !combinedText) {
      toast({
        title: "Missing Information",
        description: "Please provide API key, select a voice, and ensure text content is available.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsGenerating(true);
      
      const audioBlob = await generateSpeech({
        apiKey,
        text: combinedText,
        voiceId: selectedVoiceId,
        stability,
        similarityBoost,
      });
      
      onVoiceGenerated(audioBlob);
      
      toast({
        title: "Voiceover Generated",
        description: "Your voiceover has been successfully generated!",
      });
    } catch (error) {
      console.error('Failed to generate voiceover:', error);
      toast({
        title: "Voiceover Generation Failed",
        description: "Could not generate the voiceover. Please check your API key and try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const testSelectedVoice = async () => {
    if (!apiKey || !selectedVoiceId) {
      toast({
        title: "Missing Information",
        description: "Please provide API key and select a voice to test.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsTestingVoice(true);
      
      // Use a short sample text for testing
      const testText = "This is a test of the selected voice. How does it sound?";
      
      const audioBlob = await generateSpeech({
        apiKey,
        text: testText,
        voiceId: selectedVoiceId,
        stability,
        similarityBoost,
      });
      
      // Create audio element
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Stop previous audio if playing
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      }
      
      // Play the new audio
      setPreviewAudio(audio);
      audio.play();
      
    } catch (error) {
      console.error('Failed to test voice:', error);
      toast({
        title: "Voice Test Failed",
        description: "Could not test the selected voice. Please check your API key and try again.",
        variant: "destructive"
      });
    } finally {
      setIsTestingVoice(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Voiceover</CardTitle>
        <CardDescription>
          Convert selected Reddit posts to speech using ElevenLabs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">ElevenLabs API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={handleApiKeyChange}
            placeholder="Enter your ElevenLabs API key"
          />
          <p className="text-xs text-muted-foreground">
            Your API key is stored locally and never sent to our servers
          </p>
        </div>
        
        {voices.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="voice-select">Select Voice</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedVoiceId}
                  onValueChange={setSelectedVoiceId}
                >
                  <SelectTrigger id="voice-select">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.voice_id} value={voice.voice_id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={testSelectedVoice}
                  disabled={isTestingVoice || !selectedVoiceId}
                >
                  {isTestingVoice ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="stability">Stability ({stability})</Label>
              </div>
              <Slider
                id="stability"
                min={0}
                max={1}
                step={0.01}
                value={[stability]}
                onValueChange={(values) => setStability(values[0])}
              />
              <p className="text-xs text-muted-foreground">
                Higher values make the voice more consistent but may sound flatter
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="similarity-boost">Similarity Boost ({similarityBoost})</Label>
              </div>
              <Slider
                id="similarity-boost"
                min={0}
                max={1}
                step={0.01}
                value={[similarityBoost]}
                onValueChange={(values) => setSimilarityBoost(values[0])}
              />
              <p className="text-xs text-muted-foreground">
                Higher values make the voice more similar to the original but may reduce quality
              </p>
            </div>
          </div>
        ) : apiKey.length >= 30 ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Could not load voices. Please check your API key.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Enter your ElevenLabs API key to load available voices
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="content-preview">Content Preview</Label>
          <Textarea
            id="content-preview"
            value={combinedText}
            onChange={(e) => setCombinedText(e.target.value)}
            rows={8}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            This text will be converted to speech
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleGenerateVoiceover} 
          disabled={isGenerating || !apiKey || !selectedVoiceId}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Voiceover...
            </>
          ) : (
            "Generate Voiceover"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VoiceSelector;
