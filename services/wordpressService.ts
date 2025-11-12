import type { SiteConfig, WpPost, WpMedia, WpTerm, CreatePostPayload } from '../types';

// A version of SiteConfig without the username, for validation purposes
interface ConnectionConfig {
    url: string;
    token: string;
    proxyUrl?: string;
}

// Helper to build the final URL, applying a proxy if provided
function getFinalUrl(rawUrl: string, proxyUrl?: string): string {
    if (proxyUrl) {
        const cleanedProxy = proxyUrl.replace(/\/+$/, '');
        return `${cleanedProxy}/${rawUrl}`;
    }
    return rawUrl;
}

// Helper to handle API requests and errors
async function apiFetch<T,>(url:string, config: RequestInit = {}): Promise<T> {
    const response = await fetch(url, config);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json() as Promise<T>;
}

export async function validateConnection(config: ConnectionConfig): Promise<void> {
    try {
        const rootApiUrl = `${config.url}/wp-json/`;
        const rootResponse = await fetch(getFinalUrl(rootApiUrl, config.proxyUrl));
        if (!rootResponse.ok) {
            throw new Error(`Cannot reach the WordPress REST API endpoint. Please check the URL. (Status: ${rootResponse.status})`);
        }

        const authApiUrl = `${config.url}/wp-json/wp/v2/users/me?context=edit`;
        const response = await fetch(getFinalUrl(authApiUrl, config.proxyUrl), {
            headers: { 'Authorization': `Basic ${config.token}` }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error("Authentication failed. Please check your username and Application Password.");
            }
            const errorData = await response.json().catch(() => ({ message: 'Unknown authentication error' }));
            throw new Error(errorData.message || `Authentication check failed with status: ${response.status}`);
        }
    } catch (error: any) {
        if (error.message.includes('Failed to fetch')) {
             const detailedMessage = `Network error: Could not connect to the URL. This is often due to one of the following:

1. **CORS Policy:** The WordPress site is not configured to allow requests from this application. A security plugin or server setting might be blocking it.

2. **Invalid URL:** The URL is incorrect, or the site is offline.

3. **Mixed Content:** Trying to connect to an 'http' site from this secure 'https' application, which is blocked by browsers.

**To fix CORS issues**, you may need to install a CORS plugin on your WordPress site or use the "CORS Proxy URL" field below.`;
            throw new Error(detailedMessage);
        }
        throw error;
    }
}


export async function getPosts(config: SiteConfig, onProgress?: (progress: { loaded: number; total: number }) => void): Promise<WpPost[]> {
    const perPage = 100;
    const firstPageUrl = `${config.url}/wp-json/wp/v2/posts?_embed&per_page=${perPage}&page=1`;

    const initialResponse = await fetch(getFinalUrl(firstPageUrl, config.proxyUrl), {
        headers: { 'Authorization': `Basic ${config.token}` }
    });

    if (!initialResponse.ok) {
        const errorData = await initialResponse.json().catch(() => ({ message: 'Unknown error getting posts' }));
        throw new Error(errorData.message || `HTTP error! status: ${initialResponse.status}`);
    }

    const totalPages = parseInt(initialResponse.headers.get('X-WP-TotalPages') || '1', 10);
    const totalPosts = parseInt(initialResponse.headers.get('X-WP-Total') || '0', 10);
    
    const firstPagePosts = await initialResponse.json() as WpPost[];
    let allPosts = [...firstPagePosts];

    onProgress?.({ loaded: allPosts.length, total: totalPosts });

    if (totalPages <= 1) {
        return allPosts;
    }

    const pagePromises: Promise<WpPost[]>[] = [];
    for (let page = 2; page <= totalPages; page++) {
        const pageUrl = `${config.url}/wp-json/wp/v2/posts?_embed&per_page=${perPage}&page=${page}`;
        pagePromises.push(apiFetch<WpPost[]>(getFinalUrl(pageUrl, config.proxyUrl), {
            headers: { 'Authorization': `Basic ${config.token}` }
        }));
    }

    const remainingPagesResults = await Promise.all(pagePromises);
    for (const pagePosts of remainingPagesResults) {
        allPosts.push(...pagePosts);
    }
    
    onProgress?.({ loaded: allPosts.length, total: totalPosts });
    return allPosts;
}

export async function getFullPostDetails(postId: number, config: SiteConfig): Promise<WpPost> {
    const apiUrl = `${config.url}/wp-json/wp/v2/posts/${postId}?_embed`;
    return apiFetch<WpPost>(getFinalUrl(apiUrl, config.proxyUrl), {
        headers: { 'Authorization': `Basic ${config.token}` }
    });
}

async function uploadMedia(imageUrl: string, filename: string, sourceConfig: SiteConfig, destConfig: SiteConfig): Promise<WpMedia> {
    let imageResponse: Response;
    try {
        imageResponse = await fetch(getFinalUrl(imageUrl, sourceConfig.proxyUrl));
    } catch (error: any) {
        console.error("Image download failed:", error);
        let detailedMessage: string;
        if (sourceConfig.proxyUrl) {
            detailedMessage = `Image download failed using the proxy. The 'Failed to fetch' error can happen for several reasons:

1.  **Proxy Error:** The Proxy URL ('${sourceConfig.proxyUrl}') is incorrect, has a typo, or the proxy service is down.
2.  **Original Image URL Error:** The image URL from the source site might be invalid or unreachable by the proxy.
3.  **Network Issue:** Your own network connection might be unstable.

**Action:** Please double-check your Proxy URL. If it's correct, the proxy service itself may be the issue. Try a different one.`;
        } else {
            detailedMessage = `Image download failed. This is typically a CORS security error from the source server.

**Primary Solution:** Use the "CORS Proxy URL" field for the **Source Site**. This is the most common fix for 'Failed to fetch' errors when downloading media.

**Other Possibilities:**
1.  **Mixed Content:** The image is on 'http://' while this app is on 'https://'. Browsers block this.
2.  **Invalid Image URL:** The URL for the image itself may be wrong or the image is not publicly accessible.
3.  **Network Issue:** A firewall or unstable connection could be blocking the download.`;
        }
        throw new Error(detailedMessage);
    }
    
    if (!imageResponse.ok) {
        throw new Error(`Failed to download image from source. The server responded with status ${imageResponse.status} (${imageResponse.statusText}). This could be a permissions issue on the source file or an invalid image URL.`);
    }
    const imageBlob = await imageResponse.blob();

    try {
        const apiUrl = `${destConfig.url}/wp-json/wp/v2/media`;
        const formData = new FormData();
        formData.append('file', imageBlob, filename);
        
        const response = await fetch(getFinalUrl(apiUrl, destConfig.proxyUrl), {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${destConfig.token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown media upload error' }));
            throw new Error(errorData.message || `Media upload to destination failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error("Image upload failed:", error);
        throw new Error(`Could not upload image to destination site. This is often a CORS policy problem, a permissions issue, or a network error. Details: ${error.message}`);
    }
}

async function findOrCreateTerm(term: WpTerm, destConfig: SiteConfig): Promise<number> {
    const taxonomyEndpoint = term.taxonomy === 'category' ? 'categories' : 'tags';
    const searchUrl = `${destConfig.url}/wp-json/wp/v2/${taxonomyEndpoint}?slug=${term.slug}`;

    const existingTerms = await apiFetch<WpTerm[]>(getFinalUrl(searchUrl, destConfig.proxyUrl), {
        headers: { 'Authorization': `Basic ${destConfig.token}` }
    });

    if (existingTerms.length > 0) {
        return existingTerms[0].id;
    }

    const createUrl = `${destConfig.url}/wp-json/wp/v2/${taxonomyEndpoint}`;
    const newTerm = await apiFetch<WpTerm>(getFinalUrl(createUrl, destConfig.proxyUrl), {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${destConfig.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: term.name, slug: term.slug })
    });
    return newTerm.id;
}


export async function transferPost(post: WpPost, sourceConfig: SiteConfig, destConfig: SiteConfig, skipImageTransfer: boolean = false): Promise<void> {
    const postPayload: CreatePostPayload = {
        title: post.title.rendered,
        content: post.content.rendered,
        status: post.status,
    };

    if (!skipImageTransfer) {
        try {
            const featuredMedia = post._embedded['wp:featuredmedia']?.[0];
            if (featuredMedia) {
                const newMedia = await uploadMedia(featuredMedia.source_url, featuredMedia.media_details.file, sourceConfig, destConfig);
                postPayload.featured_media = newMedia.id;
            }
        } catch (error: any) {
            console.error("Error during media transfer:", error);
            throw new Error(`Media transfer failed: ${error.message}`);
        }
    }
    
    try {
        const terms = post._embedded['wp:term']?.flat() || [];
        const categoryIds: number[] = [];
        const tagIds: number[] = [];

        for (const term of terms) {
            const newTermId = await findOrCreateTerm(term, destConfig);
            if (term.taxonomy === 'category') {
                categoryIds.push(newTermId);
            } else {
                tagIds.push(newTermId);
            }
        }
        if (categoryIds.length > 0) postPayload.categories = categoryIds;
        if (tagIds.length > 0) postPayload.tags = tagIds;
    } catch (error: any) {
        console.error("Error during taxonomy transfer:", error);
        throw new Error(`Taxonomy (category/tag) transfer failed: ${error.message}`);
    }
    
    try {
        const createPostUrl = `${destConfig.url}/wp-json/wp/v2/posts`;
        await apiFetch<WpPost>(getFinalUrl(createPostUrl, destConfig.proxyUrl), {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${destConfig.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postPayload),
        });
    } catch (error: any) {
        console.error("Error during post creation:", error);
        throw new Error(`Post creation failed: ${error.message}`);
    }
}
