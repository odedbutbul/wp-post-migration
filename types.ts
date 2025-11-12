export interface SavedSiteConfig {
    url: string;
    username: string;
    proxyUrl?: string;
}

export interface SiteConfig {
    url: string;
    token: string; // base64 encoded 'username:password'
    username: string; // For display purposes
    proxyUrl?: string;
}

export interface WpPost {
    id: number;
    date: string;
    title: {
        rendered: string;
    };
    content: {
        rendered: string;
        protected: boolean;
    };
    excerpt: {
        rendered: string;
        protected: boolean;
    };
    author: number;
    featured_media: number;
    status: 'publish' | 'future' | 'draft' | 'pending' | 'private';
    categories: number[];
    tags: number[];
    _embedded: {
        author: WpUser[];
        'wp:featuredmedia'?: WpMedia[];
        'wp:term'?: WpTerm[][];
    };
}

export interface WpUser {
    id: number;
    name: string;
    link: string;
}

export interface WpMedia {
    id: number;
    source_url: string;
    mime_type: string;
    media_details: {
        file: string;
    }
}

export interface WpTerm {
    id: number;
    name: string;
    slug: string;
    taxonomy: 'category' | 'post_tag';
}

export interface PostStatus {
    status: 'idle' | 'exporting' | 'success' | 'error';
    message?: string;
}

export interface CreatePostPayload {
    title: string;
    content: string;
    status: 'publish' | 'future' | 'draft' | 'pending' | 'private';
    categories?: number[];
    tags?: number[];
    featured_media?: number;
}
