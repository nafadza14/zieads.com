const IG_API_BASE = 'https://graph.instagram.com/v21.0';

export interface IGProfile {
  user_id: string;
  username: string;
  name: string;
  account_type: string;
  profile_picture_url: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  biography: string;
  website: string;
}

export interface IGMedia {
  id: string;
  caption: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
  media_url: string;
  permalink: string;
  thumbnail_url: string;
  timestamp: string;
  username: string;
  like_count?: number;
  comments_count?: number;
}

export interface IGMediaInsight {
  name: string;
  period: string;
  values: Array<{ value: number }>;
  title: string;
  description: string;
}

export interface IGComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  like_count: number;
  replies?: { data: IGComment[] };
}

async function igFetch<T>(url: string, token: string, options?: RequestInit): Promise<T> {
  const separator = url.includes('?') ? '&' : '?';
  const fullUrl = `${url}${separator}access_token=${encodeURIComponent(token)}`;
  
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  const body = await res.json();

  if (!res.ok) {
    const errMsg = body?.error?.message || JSON.stringify(body);
    console.error(`[InstagramAPI] ${res.status} Error:`, errMsg);
    throw new Error(`Instagram API Error (${res.status}): ${errMsg}`);
  }

  return body as T;
}

/**
 * Fetch the authenticated user's profile.
 */
export async function getProfile(token: string): Promise<IGProfile> {
  const fields = 'user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count,biography,website';
  const data = await igFetch<IGProfile>(
    `${IG_API_BASE}/me?fields=${fields}`,
    token
  );
  return data;
}

/**
 * Fetch recent media for the authenticated user.
 */
export async function getRecentMedia(
  token: string,
  limit: number = 25,
  after?: string
): Promise<{ data: IGMedia[]; paging?: { cursors: { after: string }; next?: string } }> {
  const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,is_shared_to_feed,like_count,comments_count';
  let url = `${IG_API_BASE}/me/media?fields=${fields}&limit=${limit}`;
  if (after) url += `&after=${after}`;
  return igFetch(url, token);
}

/**
 * Fetch insights for a specific media object.
 * Different media types require different metrics.
 */
export async function getMediaInsights(
  token: string,
  mediaId: string,
  mediaType: string
): Promise<IGMediaInsight[]> {
  let metrics: string;
  
  if (mediaType === 'REELS' || mediaType === 'VIDEO') {
    metrics = 'plays,reach,likes,comments,shares,saved,total_interactions';
  } else if (mediaType === 'STORY') {
    metrics = 'impressions,reach,replies,taps_forward,taps_back,exits';
  } else {
    // IMAGE, CAROUSEL_ALBUM
    metrics = 'impressions,reach,engagement,saved,likes,comments,shares';
  }

  try {
    const result = await igFetch<{ data: IGMediaInsight[] }>(
      `${IG_API_BASE}/${mediaId}/insights?metric=${metrics}`,
      token
    );
    return result.data || [];
  } catch (err: any) {
    // Insights may not be available for posts < 24h old
    if (err.message?.includes('not enough data') || err.message?.includes('Insights are not available')) {
      console.log(`[InstagramAPI] Insights not yet available for media ${mediaId}`);
      return [];
    }
    throw err;
  }
}

/**
 * Fetch account-level insights for a date range.
 */
export async function getAccountInsights(
  token: string,
  userId: string,
  since: number,
  until: number
): Promise<IGMediaInsight[]> {
  const metrics = 'impressions,reach,profile_views,website_clicks,follower_count';
  try {
    const result = await igFetch<{ data: IGMediaInsight[] }>(
      `${IG_API_BASE}/${userId}/insights?metric=${metrics}&period=day&since=${since}&until=${until}`,
      token
    );
    return result.data || [];
  } catch (err: any) {
    console.error(`[InstagramAPI] Account insights error:`, err.message);
    return [];
  }
}

/**
 * Fetch comments on a specific media object.
 */
export async function getMediaComments(
  token: string,
  mediaId: string
): Promise<IGComment[]> {
  try {
    const result = await igFetch<{ data: IGComment[] }>(
      `${IG_API_BASE}/${mediaId}/comments?fields=id,text,username,timestamp,like_count,replies{id,text,username,timestamp}`,
      token
    );
    return result.data || [];
  } catch (err: any) {
    console.error(`[InstagramAPI] Comments fetch error for media ${mediaId}:`, err.message);
    return [];
  }
}

/**
 * Reply to a comment on Instagram.
 */
export async function replyToComment(
  token: string,
  commentId: string,
  message: string
): Promise<{ id: string }> {
  return igFetch<{ id: string }>(
    `${IG_API_BASE}/${commentId}/replies`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ message }),
    }
  );
}

/**
 * Step 1 of publishing: Create a media container.
 */
export async function createMediaContainer(
  token: string,
  igUserId: string,
  params: {
    image_url?: string;
    video_url?: string;
    caption?: string;
    media_type?: 'REELS';
  }
): Promise<{ id: string }> {
  return igFetch<{ id: string }>(
    `${IG_API_BASE}/${igUserId}/media`,
    token,
    {
      method: 'POST',
      body: JSON.stringify(params),
    }
  );
}

/**
 * Check the status of a media container (used for videos).
 */
export async function checkContainerStatus(
  token: string,
  containerId: string
): Promise<{ status_code: string; status: string }> {
  return igFetch<{ status_code: string; status: string }>(
    `${IG_API_BASE}/${containerId}?fields=status_code,status`,
    token
  );
}

/**
 * Step 2 of publishing: Publish the container.
 */
export async function publishMedia(
  token: string,
  igUserId: string,
  containerId: string
): Promise<{ id: string }> {
  return igFetch<{ id: string }>(
    `${IG_API_BASE}/${igUserId}/media_publish`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ creation_id: containerId }),
    }
  );
}

/**
 * Full publish flow: create container, poll status (for video), then publish.
 */
export async function publishPost(
  token: string,
  igUserId: string,
  params: {
    image_url?: string;
    video_url?: string;
    caption?: string;
    media_type?: 'REELS';
  }
): Promise<{ mediaId: string; permalink?: string }> {
  // Step 1: Create container
  console.log(`[InstagramAPI] Creating media container for user ${igUserId}...`);
  const container = await createMediaContainer(token, igUserId, params);
  console.log(`[InstagramAPI] Container created: ${container.id}`);

  // Step 2: For video/reels, poll status until FINISHED
  if (params.video_url || params.media_type === 'REELS') {
    let attempts = 0;
    const maxAttempts = 36; // 3 minutes at 5-second intervals
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const status = await checkContainerStatus(token, container.id);
      console.log(`[InstagramAPI] Container ${container.id} status: ${status.status_code}`);
      
      if (status.status_code === 'FINISHED') break;
      if (status.status_code === 'ERROR') {
        throw new Error(`Instagram container processing failed: ${status.status || 'Unknown error'}`);
      }
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Instagram container processing timed out after 3 minutes');
    }
  }

  // Step 3: Publish
  console.log(`[InstagramAPI] Publishing container ${container.id}...`);
  const published = await publishMedia(token, igUserId, container.id);
  console.log(`[InstagramAPI] Published successfully. Media ID: ${published.id}`);

  return { mediaId: published.id };
}
