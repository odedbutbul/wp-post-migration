export interface SavedConnection {
    id: string;
    name: string;
    url: string;
    username: string; // For display purposes
    token: string; // base64 encoded 'username:password'
    proxyUrl?: string;
}

export interface SiteConfig {
    url: string;
    token: string;
    username: string;
    proxyUrl?: string;
}

export interface WpContent {
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
    parent?: number;
    menu_order?: number;
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

export interface ItemStatus {
    status: 'idle' | 'exporting' | 'success' | 'error';
    message?: string;
}

export interface CreateContentPayload {
    title: string;
    content: string;
    status: 'publish' | 'future' | 'draft' | 'pending' | 'private';
    categories?: number[];
    tags?: number[];
    featured_media?: number;
    parent?: number;
}