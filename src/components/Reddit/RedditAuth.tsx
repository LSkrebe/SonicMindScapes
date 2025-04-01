
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { LogIn } from 'lucide-react';

interface RedditAuthProps {
  onAuthenticated: (token: string) => void;
}

const RedditAuth: React.FC<RedditAuthProps> = ({ onAuthenticated }) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Set default redirect URI based on the current URL
  useEffect(() => {
    // Default to current origin (without path)
    setRedirectUri(window.location.origin);
    
    // Check for stored redirect URI
    const storedUri = localStorage.getItem('reddit_redirect_uri');
    if (storedUri) {
      setRedirectUri(storedUri);
    }
  }, []);
  
  // Check if we're returning from OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code && localStorage.getItem('reddit_client_id') && localStorage.getItem('reddit_client_secret')) {
      exchangeCodeForToken(
        code, 
        localStorage.getItem('reddit_client_id') as string,
        localStorage.getItem('reddit_client_secret') as string,
        localStorage.getItem('reddit_redirect_uri') as string
      );
    }
    
    // Check for stored token
    const storedToken = localStorage.getItem('reddit_access_token');
    if (storedToken) {
      setAuthToken(storedToken);
      onAuthenticated(storedToken);
    }
  }, []);

  const initiateOAuthFlow = () => {
    if (!clientId) {
      toast({
        title: "Missing Information",
        description: "Please enter your Reddit Client ID",
        variant: "destructive"
      });
      return;
    }

    // Store credentials for when we return from OAuth redirect
    localStorage.setItem('reddit_client_id', clientId);
    localStorage.setItem('reddit_client_secret', clientSecret);
    localStorage.setItem('reddit_redirect_uri', redirectUri);
    
    // Reddit OAuth URL
    const redditAuthUrl = 'https://www.reddit.com/api/v1/authorize';
    const scope = 'identity read history mysubreddits';
    const state = Math.random().toString(36).substring(2, 15);
    const duration = 'permanent';
    const responseType = 'code';
    
    localStorage.setItem('reddit_auth_state', state);
    
    const authUrl = `${redditAuthUrl}?client_id=${clientId}&response_type=${responseType}&state=${state}&redirect_uri=${redirectUri}&duration=${duration}&scope=${scope}`;
    
    console.log("Redirecting to:", authUrl);
    
    // Redirect to Reddit for authorization
    window.location.href = authUrl;
  };

  const exchangeCodeForToken = async (code: string, clientId: string, clientSecret: string, redirectUri: string) => {
    try {
      setIsAuthenticating(true);
      
      console.log("Exchanging code for token with redirect URI:", redirectUri);
      
      const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri
        })
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to get access token: ${errorText}`);
      }
      
      const data = await tokenResponse.json();
      const token = data.access_token;
      
      // Save token
      localStorage.setItem('reddit_access_token', token);
      setAuthToken(token);
      onAuthenticated(token);
      
      toast({
        title: "Authentication Successful",
        description: "You've been successfully authenticated with Reddit",
      });
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error(error);
      toast({
        title: "Authentication Failed",
        description: "Could not authenticate with Reddit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('reddit_access_token');
    localStorage.removeItem('reddit_client_id');
    localStorage.removeItem('reddit_client_secret');
    localStorage.removeItem('reddit_redirect_uri');
    setAuthToken(null);
    toast({
      title: "Logged Out",
      description: "You've been logged out of Reddit"
    });
  };
  
  if (authToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reddit Account</CardTitle>
          <CardDescription>You're connected to Reddit</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleLogout} variant="outline">Log Out</Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect to Reddit</CardTitle>
        <CardDescription>
          Enter your Reddit API credentials to connect to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="client-id">Client ID</Label>
          <Input
            id="client-id"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Enter your Reddit Client ID"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-secret">Client Secret</Label>
          <Input
            id="client-secret"
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="Enter your Reddit Client Secret"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="redirect-uri">Redirect URI</Label>
          <Input
            id="redirect-uri"
            value={redirectUri}
            onChange={(e) => setRedirectUri(e.target.value)}
            placeholder="Enter the exact Redirect URI registered in your Reddit app"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This must match exactly what you entered in Reddit's developer settings
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={initiateOAuthFlow} 
          disabled={isAuthenticating}
          className="w-full"
        >
          <LogIn className="mr-2 h-4 w-4" />
          {isAuthenticating ? "Authenticating..." : "Connect Reddit Account"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RedditAuth;
