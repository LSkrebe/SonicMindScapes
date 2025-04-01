
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { RedditPost } from '@/services/redditService';
import { createVideoWithSubtitles, estimateSubtitleTiming } from '@/services/videoService';

interface VideoCreatorProps {
  selectedPosts: RedditPost[];
  audioBlob: Blob;
  onVideoCreated: (videoBlob: Blob) => void;
}

const VideoCreator: React.FC<VideoCreatorProps> = ({ selectedPosts, audioBlob, onVideoCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  
  const [combinedText, setCombinedText] = useState('');
  const [subtitles, setSubtitles] = useState<{ text: string, startTime: number, endTime: number }[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  
  useEffect(() => {
    // Combine post content
    const combined = selectedPosts
      .map(post => {
        return `${post.title} ${post.selftext}`;
      })
      .join(' ');
    
    setCombinedText(combined);
    
    // Create audio element
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audioRef.current = audio;
    
    // Wait for audio metadata to load
    audio.onloadedmetadata = () => {
      // Estimate subtitle timing
      const estimatedSubtitles = estimateSubtitleTiming(combined, audio.duration);
      setSubtitles(estimatedSubtitles);
    };
    
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [selectedPosts, audioBlob]);
  
  const handleCreateVideo = async () => {
    try {
      setIsCreating(true);
      
      // This function would typically make a real video with subtitles
      // For now, we'll just simulate it and return audio
      const videoBlob = await createVideoWithSubtitles(audioBlob, combinedText);
      
      // Create video URL
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      
      // Update canvas with subtitles animation
      if (videoRef.current && canvasRef.current && audioRef.current) {
        // Set up event listener for time updates
        audioRef.current.ontimeupdate = () => {
          if (audioRef.current) {
            updateSubtitles(audioRef.current.currentTime);
          }
        };
      }
      
      onVideoCreated(videoBlob);
      
      toast({
        title: "Video Created",
        description: "Your video has been generated successfully!",
      });
    } catch (error) {
      console.error('Failed to create video:', error);
      toast({
        title: "Video Creation Failed",
        description: "Could not create the video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const updateSubtitles = (currentTime: number) => {
    // Find the current subtitle based on time
    const current = subtitles.find(
      subtitle => currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
    );
    
    if (current) {
      setCurrentSubtitle(current.text);
    } else {
      setCurrentSubtitle('');
    }
    
    // Draw subtitle on canvas
    renderSubtitle();
  };
  
  const renderSubtitle = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw subtitle text
    if (currentSubtitle) {
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Word wrap the subtitle
      const words = currentSubtitle.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > canvas.width - 40) {
          lines.push(currentLine);
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      });
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      // Draw each line
      const lineHeight = 30;
      const startY = (canvas.height - (lines.length * lineHeight)) / 2;
      
      lines.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, startY + (i * lineHeight));
      });
    }
  };
  
  const handleDownload = () => {
    if (!videoUrl) return;
    
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = 'reddit_voiceover.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const startPlayback = () => {
    if (videoRef.current && audioRef.current) {
      audioRef.current.play();
      renderAnimationLoop();
    }
  };
  
  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };
  
  const renderAnimationLoop = () => {
    if (!canvasRef.current || !audioRef.current) return;
    
    renderSubtitle();
    
    if (!audioRef.current.paused) {
      requestAnimationFrame(renderAnimationLoop);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Video</CardTitle>
        <CardDescription>
          Generate a video with voiceover and subtitles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {videoUrl ? (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <canvas 
                ref={canvasRef}
                width={640}
                height={360}
                className="absolute inset-0 w-full h-full"
              />
              {/* Hidden audio element for playback */}
              <audio ref={audioRef} src={videoUrl} className="hidden" />
              
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={startPlayback}
                  >
                    Play
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={pausePlayback}
                  >
                    Pause
                  </Button>
                </div>
              </div>
              
              {currentSubtitle && (
                <div className="absolute bottom-16 left-4 right-4 text-center">
                  <div className="bg-black/70 text-white p-2 rounded-md inline-block">
                    {currentSubtitle}
                  </div>
                </div>
              )}
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This is a preview with subtitles. For full video generation, a server-side process would be required.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center">
              <Button 
                onClick={handleDownload}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Audio
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center border rounded-lg">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Ready to create your video with voiceover and subtitles
              </p>
              <Button 
                onClick={handleCreateVideo} 
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Video...
                  </>
                ) : (
                  "Create Video"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Note: This is a simplified preview. Full video generation would require server-side processing.
        </p>
      </CardFooter>
    </Card>
  );
};

export default VideoCreator;
