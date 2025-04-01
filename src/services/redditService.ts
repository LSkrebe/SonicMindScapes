
interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  selftext: string;
  author: string;
  score: number;
  created_utc: number;
  permalink: string;
  url: string;
  num_comments: number;
}

export async function fetchUserSubreddits(token: string): Promise<string[]> {
  try {
    const response = await fetch('https://oauth.reddit.com/subreddits/mine/subscriber', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch subreddits');
    }
    
    const data = await response.json();
    return data.data.children.map((subreddit: any) => subreddit.data.display_name);
  } catch (error) {
    console.error('Error fetching subreddits:', error);
    throw error;
  }
}

export async function fetchPostsFromSubreddit(token: string, subreddit: string, limit = 25): Promise<RedditPost[]> {
  try {
    const response = await fetch(`https://oauth.reddit.com/r/${subreddit}/hot?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch posts from ${subreddit}`);
    }
    
    const data = await response.json();
    
    return data.data.children
      .map((post: any) => post.data)
      .filter((post: any) => post.selftext && post.selftext.length > 100)
      .map((post: any) => ({
        id: post.id,
        subreddit: post.subreddit,
        title: post.title,
        selftext: post.selftext,
        author: post.author,
        score: post.score,
        created_utc: post.created_utc,
        permalink: post.permalink,
        url: post.url,
        num_comments: post.num_comments
      }));
  } catch (error) {
    console.error(`Error fetching posts from ${subreddit}:`, error);
    throw error;
  }
}

export { type RedditPost };
