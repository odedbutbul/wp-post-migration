import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { SiteConfig, WpPost, PostStatus } from '../types';
import { getPosts, getFullPostDetails, transferPost } from '../services/wordpressService';
import { PostList } from '../components/PostList';

interface MigrationPageProps {
    sourceConfig: SiteConfig | null;
    destConfig: SiteConfig | null;
    onNavigateToSettings: () => void;
}

export const MigrationPage: React.FC<MigrationPageProps> = ({ sourceConfig, destConfig, onNavigateToSettings }) => {
    // Post data and statuses
    const [posts, setPosts] = useState<WpPost[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<{ loaded: number; total: number } | null>(null);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [postStatuses, setPostStatuses] = useState<Record<number, PostStatus>>({});
    
    // UI controls & multi-select state
    const [searchTerm, setSearchTerm] = useState('');
    const [skipImageTransfer, setSkipImageTransfer] = useState(false);
    const [selectedPostIds, setSelectedPostIds] = useState<Set<number>>(new Set());
    const [isBulkExporting, setIsBulkExporting] = useState<boolean>(false);

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

    const fetchPosts = useCallback((config: SiteConfig, isRefresh: boolean = false) => {
        setError(null);
        if (!isRefresh) {
            setPosts([]);
            setPostStatuses({});
            setSelectedPostIds(new Set());
            setIsLoading(true);
            setLoadingProgress(null);
        }
        return getPosts(config, setLoadingProgress)
            .then(fetchedPosts => {
                setPosts(fetchedPosts);
            })
            .catch(err => {
                setError(`Failed to fetch posts: ${err.message}. Please check your connection on the Settings page.`);
            })
            .finally(() => {
                if (!isRefresh) setIsLoading(false);
                setLoadingProgress(null);
            });
    }, []);

    useEffect(() => {
        if (sourceConfig) {
            fetchPosts(sourceConfig);
        } else {
            // If source config is removed, clear posts
            setPosts([]);
            setError(null);
        }
    }, [sourceConfig, fetchPosts]);

    const handleRefreshPosts = useCallback(async () => {
        if (!sourceConfig) return;
        setIsRefreshing(true);
        setError(null);
        await fetchPosts(sourceConfig, true);
        setIsRefreshing(false);
        setSelectedPostIds(new Set());
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

    // --- Multi-select Handlers ---
    const handleTogglePostSelection = (postId: number) => {
        setSelectedPostIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    };

    const handleToggleSelectAll = () => {
        if (selectedPostIds.size === filteredPosts.length) {
            setSelectedPostIds(new Set());
        } else {
            setSelectedPostIds(new Set(filteredPosts.map(p => p.id)));
        }
    };

     const handleBulkExport = async () => {
        if (!sourceConfig || !destConfig || selectedPostIds.size === 0) return;
        setIsBulkExporting(true);
        const initialStatuses: Record<number, PostStatus> = {};
        selectedPostIds.forEach(id => {
            initialStatuses[id] = { status: 'exporting' };
        });
        setPostStatuses(prev => ({ ...prev, ...initialStatuses }));

        for (const postId of selectedPostIds) {
            await handleExportPost(postId);
        }
        
        setIsBulkExporting(false);
        setSelectedPostIds(new Set());
    };

    if (!sourceConfig || !destConfig) {
        return (
            <div className="text-center bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700/50 p-12">
                <h3 className="text-2xl font-bold tracking-tight">Connections Needed</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-xl mx-auto">
                    To begin migrating posts, please set up your source and destination WordPress sites on the settings page.
                </p>
                <button 
                    onClick={onNavigateToSettings}
                    className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
                >
                    Go to Settings
                </button>
            </div>
        )
    }

    return (
        <>
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col justify-center items-center h-48 bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700/50">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="ml-4 text-lg mt-4">
                        Fetching posts... 
                        {loadingProgress && ` (${loadingProgress.loaded}/${loadingProgress.total})`}
                    </p>
                </div>
            ) : posts.length > 0 ? (
                <PostList
                    posts={filteredPosts}
                    statuses={postStatuses}
                    onExport={handleExportPost}
                    isDestinationConnected={!!destConfig}
                    onRefresh={handleRefreshPosts}
                    isRefreshing={isRefreshing}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    skipImageTransfer={skipImageTransfer}
                    onSkipImageChange={setSkipImageTransfer}
                    selectedIds={selectedPostIds}
                    onToggleSelection={handleTogglePostSelection}
                    onToggleSelectAll={handleToggleSelectAll}
                    onBulkExport={handleBulkExport}
                    isBulkExporting={isBulkExporting}
                />
            ) : sourceConfig && !isLoading && (
                 <div className="text-center bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700/50 p-12">
                    <h3 className="text-xl font-medium">No Posts Found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">The source WordPress site does not have any posts, or they are not publicly accessible via the REST API.</p>
                </div>
            )}
        </>
    )
};
