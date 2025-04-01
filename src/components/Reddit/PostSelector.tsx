
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Clock, Search, Trash } from 'lucide-react';
import { fetchPostsFromSubreddit, fetchUserSubreddits, type RedditPost } from '@/services/redditService';

interface PostSelectorProps {
  authToken: string;
  onPostsSelected: (posts: RedditPost[]) => void;
}

const PostSelector: React.FC<PostSelectorProps> = ({ authToken, onPostsSelected }) => {
  const [subreddits, setSubreddits] = useState<string[]>([]);
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>('');
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<RedditPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (authToken) {
      loadSubreddits();
    }
  }, [authToken]);

  const loadSubreddits = async () => {
    try {
      setIsLoading(true);
      const userSubreddits = await fetchUserSubreddits(authToken);
      setSubreddits(userSubreddits);
      
      if (userSubreddits.length > 0) {
        setSelectedSubreddit(userSubreddits[0]);
        await loadPosts(userSubreddits[0]);
      }
    } catch (error) {
      console.error('Error loading subreddits:', error);
      toast({
        title: "Failed to Load Subreddits",
        description: "Could not load your subreddits. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async (subreddit: string) => {
    try {
      setIsLoading(true);
      setPosts([]);
      const fetchedPosts = await fetchPostsFromSubreddit(authToken, subreddit);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error(`Error loading posts from ${subreddit}:`, error);
      toast({
        title: "Failed to Load Posts",
        description: `Could not load posts from r/${subreddit}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubredditChange = async (value: string) => {
    setSelectedSubreddit(value);
    await loadPosts(value);
  };

  const togglePostSelection = (post: RedditPost) => {
    setSelectedPosts(prevSelected => {
      const isAlreadySelected = prevSelected.some(p => p.id === post.id);
      
      if (isAlreadySelected) {
        return prevSelected.filter(p => p.id !== post.id);
      } else {
        return [...prevSelected, post];
      }
    });
  };

  const handleContinue = () => {
    if (selectedPosts.length === 0) {
      toast({
        title: "No Posts Selected",
        description: "Please select at least one post to continue.",
        variant: "destructive"
      });
      return;
    }
    
    onPostsSelected(selectedPosts);
  };

  const clearSelections = () => {
    setSelectedPosts([]);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.selftext.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isPostSelected = (postId: string) => {
    return selectedPosts.some(post => post.id === postId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Reddit Posts</CardTitle>
          <CardDescription>
            Choose posts from your subscribed subreddits to convert to voice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-1/3">
              <label htmlFor="subreddit-select" className="text-sm font-medium">
                Subreddit
              </label>
              <Select
                disabled={isLoading}
                value={selectedSubreddit}
                onValueChange={handleSubredditChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a subreddit" />
                </SelectTrigger>
                <SelectContent>
                  {subreddits.map((subreddit) => (
                    <SelectItem key={subreddit} value={subreddit}>
                      r/{subreddit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:w-2/3">
              <label htmlFor="search" className="text-sm font-medium">
                Search Posts
              </label>
              <div className="relative mt-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title or content..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Posts</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              {selectedPosts.length} selected
              {selectedPosts.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={clearSelections}
                  className="ml-1 h-6 w-6"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-4 w-4 rounded-sm mt-1" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No posts found. Try another subreddit or search query.
              </div>
            ) : (
              <div className="divide-y max-h-[400px] overflow-y-auto scrollbar-hide">
                {filteredPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className={`p-4 flex gap-3 hover:bg-muted/50 cursor-pointer ${
                      isPostSelected(post.id) ? 'bg-muted/50' : ''
                    }`}
                    onClick={() => togglePostSelection(post)}
                  >
                    <Checkbox 
                      checked={isPostSelected(post.id)}
                      onCheckedChange={() => togglePostSelection(post)}
                      className="mt-1"
                    />
                    <div>
                      <h4 className="font-medium text-sm">{post.title}</h4>
                      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                        <span>r/{post.subreddit}</span>
                        <span>•</span>
                        <span>u/{post.author}</span>
                        <span>•</span>
                        <div className="flex items-center">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {formatDate(post.created_utc)}
                        </div>
                      </div>
                      <p className="mt-2 text-sm line-clamp-2">
                        {post.selftext}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedPosts.length} posts selected
          </div>
          <Button onClick={handleContinue} disabled={selectedPosts.length === 0}>
            Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PostSelector;
