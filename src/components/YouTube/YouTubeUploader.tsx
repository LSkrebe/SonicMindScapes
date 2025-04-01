
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle, Loader2, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { authenticateWithYouTube, uploadVideo, getVideoUrl } from '@/services/youtubeService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RedditPost } from '@/services/redditService';

interface YouTubeUploaderProps {
  videoBlob: Blob;
  selectedPosts: RedditPost[];
}

const YouTubeUploader: React.FC<YouTubeUploaderProps> = ({ videoBlob, selectedPosts }) => {
  const [clientId, setClientId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('22'); // "People & Blogs" category
  const [privacyStatus, setPrivacyStatus] = useState<'private' | 'public' | 'unlisted'>('private');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Set default values based on selected posts
  React.useEffect(() => {
    if (selectedPosts.length > 0) {
      // Generate title from first post
      setTitle(`${selectedPosts[0].title.substring(0, 80)}${selectedPosts.length > 1 ? ' & more' : ''}`);
      
      // Generate description
      const desc = selectedPosts.map(post => {
        return `Source: Reddit post "${post.title}" from r/${post.subreddit}\nLink: https://reddit.com${post.permalink}\n\n`;
      }).join('');
      
      setDescription(`${desc}This video was automatically generated using RedditVocalScribe.`);
      
      // Generate tags
      setTags(selectedPosts.map(post => post.subreddit).join(','));
    }
  }, [selectedPosts]);
  
  const handleAuthenticate = async () => {
    if (!clientId || !apiKey) {
      toast({
        title: "Missing Information",
        description: "Please provide YouTube Client ID and API Key",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsAuthenticating(true);
      
      const token = await authenticateWithYouTube({
        clientId,
        apiKey
      });
      
      setAccessToken(token);
      
      toast({
        title: "Authentication Successful",
        description: "Successfully connected to YouTube",
      });
    } catch (error) {
      console.error('Failed to authenticate with YouTube:', error);
      toast({
        title: "Authentication Failed",
        description: "Could not authenticate with YouTube. Please check your credentials.",
        variant: "destructive"
      });
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  const handleUpload = async () => {
    if (!accessToken) {
      toast({
        title: "Not Authenticated",
        description: "Please authenticate with YouTube before uploading",
        variant: "destructive"
      });
      return;
    }
    
    if (!title) {
      toast({
        title: "Missing Information",
        description: "Please provide a title for the video",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      const videoId = await uploadVideo(
        videoBlob,
        {
          title,
          description,
          tags: tags.split(',').map(tag => tag.trim()),
          category,
          privacyStatus
        },
        accessToken
      );
      
      setUploadedVideoId(videoId);
      
      toast({
        title: "Upload Successful",
        description: "Your video has been successfully uploaded to YouTube",
      });
    } catch (error) {
      console.error('Failed to upload video to YouTube:', error);
      toast({
        title: "Upload Failed",
        description: "Could not upload the video to YouTube. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const getVideoLink = () => {
    if (!uploadedVideoId) return '#';
    return getVideoUrl(uploadedVideoId);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload to YouTube</CardTitle>
        <CardDescription>
          Publish your video to your YouTube channel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-800" />
          <AlertDescription>
            This is a demo implementation. Actual YouTube upload requires server-side implementation of OAuth.
          </AlertDescription>
        </Alert>
        
        {!accessToken ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-id">YouTube Client ID</Label>
              <Input
                id="client-id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter your YouTube Client ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api-key">YouTube API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your YouTube API Key"
              />
            </div>
            
            <Button 
              onClick={handleAuthenticate} 
              disabled={isAuthenticating}
              className="w-full"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Connect to YouTube"
              )}
            </Button>
          </div>
        ) : (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <Check className="h-4 w-4 text-green-800" />
            <AlertDescription>
              Connected to YouTube successfully
            </AlertDescription>
          </Alert>
        )}
        
        {accessToken && !uploadedVideoId && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Video Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                maxLength={100}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter video description"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="reddit,voiceover,story"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Film & Animation</SelectItem>
                    <SelectItem value="2">Autos & Vehicles</SelectItem>
                    <SelectItem value="10">Music</SelectItem>
                    <SelectItem value="15">Pets & Animals</SelectItem>
                    <SelectItem value="17">Sports</SelectItem>
                    <SelectItem value="20">Gaming</SelectItem>
                    <SelectItem value="22">People & Blogs</SelectItem>
                    <SelectItem value="23">Comedy</SelectItem>
                    <SelectItem value="24">Entertainment</SelectItem>
                    <SelectItem value="25">News & Politics</SelectItem>
                    <SelectItem value="26">Howto & Style</SelectItem>
                    <SelectItem value="27">Education</SelectItem>
                    <SelectItem value="28">Science & Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="privacy">Privacy Status</Label>
              <Select 
                value={privacyStatus} 
                onValueChange={(value) => setPrivacyStatus(value as 'private' | 'public' | 'unlisted')}
              >
                <SelectTrigger id="privacy">
                  <SelectValue placeholder="Select privacy status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading to YouTube...
                </>
              ) : (
                "Upload to YouTube"
              )}
            </Button>
          </div>
        )}
        
        {uploadedVideoId && (
          <div className="py-4">
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <Check className="h-16 w-16 text-green-600 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-green-800 mb-2">Upload Complete!</h3>
              <p className="text-green-700 mb-4">
                Your video has been successfully uploaded to YouTube
              </p>
              <Button asChild>
                <a href={getVideoLink()} target="_blank" rel="noopener noreferrer">
                  View on YouTube
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default YouTubeUploader;
