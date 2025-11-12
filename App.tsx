import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WordPressConnector } from './components/WordPressConnector';
import { PostList } from './components/PostList';
import type { SiteConfig, WpPost, PostStatus, SavedSiteConfig } from './types';
import { getPosts, getFullPostDetails, transferPost } from './services/wordpressService';
import { LogoIcon } from './components/icons';

const App: React.FC = () => {
    // Site configurations
    const [sourceConfig, setSourceConfig] = useState<SiteConfig | null>(() => JSON.parse(localStorage.getItem('wpMigrator-sourceConfig') || 'null'));
    const [destConfig, setDestConfig] = useState<SiteConfig | null>(() => JSON.parse(localStorage.getItem('wpMigrator-destConfig') || 'null'));

    // Connection History
    const [sourceHistory, setSourceHistory] = useState<SavedSiteConfig[]>(() => JSON.parse(localStorage.getItem('wpMigrator-sourceHistory') || '[]'));
    const [destHistory, setDestHistory] = useState<SavedSiteConfig[]>(() => JSON.parse(localStorage.getItem('wpMigrator-destHistory') || '[]'));

    // Post data and statuses
    const [posts, setPosts] = useState<WpPost[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<{ loaded: number; total: number } | null>(null);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [postStatuses, setPostStatuses] = useState<Record<number, PostStatus>>({});
    
    // UI controls
    const [searchTerm, setSearchTerm] = useState('');
    const [skipImageTransfer, setSkipImageTransfer] = useState(false);
    
    // --- LocalStorage Effects ---
    useEffect(() => { localStorage.setItem('wpMigrator-sourceConfig', JSON.stringify(sourceConfig)); }, [sourceConfig]);
    useEffect(() => { localStorage.setItem('wpMigrator-destConfig', JSON.stringify(destConfig)); }, [destConfig]);
    useEffect(() => { localStorage.setItem('wpMigrator-sourceHistory', JSON.stringify(sourceHistory)); }, [sourceHistory]);
    useEffect(() => { localStorage.setItem('wpMigrator-destHistory', JSON.stringify(destHistory)); }, [destHistory]);

    // --- Core Logic ---
    const fetchPosts = useCallback((config: SiteConfig, isRefresh: boolean = false) => {
        setError(null);
        if (!isRefresh) {
            setPosts([]);
            setPostStatuses({});
            setIsLoading(true);
            setLoadingProgress(null);
        }
        return getPosts(config, setLoadingProgress)
            .then(fetchedPosts => {
                setPosts(fetchedPosts);
            })
            .catch(err => {
                setError(`Connection failed: ${err.message}. The saved credentials might be invalid or the site is unreachable.`);
                setSourceConfig(null);
            })
            .finally(() => {
                if (!isRefresh) setIsLoading(false);
                setLoadingProgress(null);
            });
    }, []);

    useEffect(() => {
        if (sourceConfig && posts.length === 0) {
            fetchPosts(sourceConfig);
        }
    }, [sourceConfig, posts.length, fetchPosts]);

    // --- Event Handlers ---
    const updateHistory = (newConfig: SiteConfig, type: 'source' | 'destination') => {
        const { url, username, proxyUrl } = newConfig;
        const savedItem: SavedSiteConfig = { url, username, proxyUrl };

        const setHistory = type === 'source' ? setSourceHistory : setDestHistory;
        
        setHistory(prevHistory => {
            const otherItems = prevHistory.filter(item => !(item.url === url && item.username === username));
            return [savedItem, ...otherItems].slice(0, 5); // Keep most recent 5
        });
    };
    
    const handleSourceConnect = (config: SiteConfig) => {
        setSourceConfig(config);
        updateHistory(config, 'source');
    };

    const handleDestConnect = (config: SiteConfig) => {
        setDestConfig(config);
        updateHistory(config, 'destination');
    };
    
    const handleHistoryDelete = (itemToDelete: SavedSiteConfig, type: 'source' | 'destination') => {
        const setHistory = type === 'source' ? setSourceHistory : setDestHistory;
        setHistory(prev => prev.filter(item => !(item.url === itemToDelete.url && item.username === itemToDelete.username)));
    }

    const handleSourceDisconnect = () => { setSourceConfig(null); setPosts([]); setError(null); };
    const handleDestDisconnect = () => { setDestConfig(null); };

    const handleRefreshPosts = useCallback(async () => {
        if (!sourceConfig) return;
        setIsRefreshing(true);
        setError(null);
        await fetchPosts(sourceConfig, true);
        setIsRefreshing(false);
    }, [sourceConfig, fetchPosts]);

    const handleExportPost = useCallback(async (postId: number) => {
        if (!sourceConfig || !destConfig) {
            alert("Please connect to both source and destination sites first.");
            return;
        }
        setPostStatuses(prev => ({ ...prev, [postId]: { status: 'exporting' } }));
        try {
            const postToExport = await getFullPostDetails(postId, sourceConfig);
            await transferPost(postToExport, sourceConfig, destConfig, skipImageTransfer);
            setPostStatuses(prev => ({ ...prev, [postId]: { status: 'success' } }));
        } catch (err: any) {
            console.error(`Failed to export post ${postId}:`, err);
            setPostStatuses(prev => ({ ...prev, [postId]: { status: 'error', message: err.message } }));
        }
    }, [sourceConfig, destConfig, skipImageTransfer]);

    const filteredPosts = useMemo(() => {
        if (!searchTerm) return posts;
        const decodeHtml = (html: string) => {
            const txt = document.createElement("textarea");
            txt.innerHTML = html;
            return txt.value;
        }
        return posts.filter(post =>
            decodeHtml(post.title.rendered).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [posts, searchTerm]);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            <header className="bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <LogoIcon className="h-8 w-8 text-blue-500" />
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">WordPress Post Migrator</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <WordPressConnector
                        siteType="Source"
                        onConnect={handleSourceConnect}
                        onDisconnect={handleSourceDisconnect}
                        config={sourceConfig}
                        history={sourceHistory}
                        onHistorySelect={() => {}} // Placeholder, logic is in connector
                        onHistoryDelete={(item) => handleHistoryDelete(item, 'source')}
                    />
                    <WordPressConnector
                        siteType="Destination"
                        onConnect={handleDestConnect}
                        onDisconnect={handleDestDisconnect}
                        config={destConfig}
                        history={destHistory}
                        onHistorySelect={() => {}} // Placeholder, logic is in connector
                        onHistoryDelete={(item) => handleHistoryDelete(item, 'destination')}
                    />
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {isLoading ? (
                     <div className="flex justify-center items-center h-40">
                        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="ml-4 text-lg">
                            Fetching posts... 
                            {loadingProgress && ` (${loadingProgress.loaded}/${loadingProgress.total})`}
                        </p>
                    </div>
                ) : posts.length > 0 ? (
                    <PostList
                        posts={filteredPosts}
                        onExport={handleExportPost}
                        statuses={postStatuses}
                        isDestinationConnected={!!destConfig}
                        onRefresh={handleRefreshPosts}
                        isRefreshing={isRefreshing}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        skipImageTransfer={skipImageTransfer}
                        onSkipImageChange={setSkipImageTransfer}
                    />
                ) : sourceConfig && !isLoading && (
                     <div className="text-center bg-white dark:bg-slate-800 rounded-lg shadow p-8">
                        <h3 className="text-lg font-medium">No Posts Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">The source WordPress site does not have any posts, or they are not publicly accessible via the REST API.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
