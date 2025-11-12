import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { SiteConfig, WpContent, ItemStatus } from '../types';
import { getContent, getFullContentDetails, transferContent } from '../services/wordpressService';
import { PostList } from '../components/PostList';
import { ContentEditorModal } from '../components/ContentEditorModal';

interface MigrationPageProps {
    sourceConfig: SiteConfig | null;
    destConfig: SiteConfig | null;
    onNavigateToSettings: () => void;
}

export const MigrationPage: React.FC<MigrationPageProps> = ({ sourceConfig, destConfig, onNavigateToSettings }) => {
    const [contentType, setContentType] = useState<'posts' | 'pages'>('posts');
    
    // Content data and statuses
    const [contentItems, setContentItems] = useState<WpContent[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<{ loaded: number; total: number } | null>(null);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [itemStatuses, setItemStatuses] = useState<Record<number, ItemStatus>>({});
    
    // UI controls & multi-select state
    const [searchTerm, setSearchTerm] = useState('');
    const [skipImageTransfer, setSkipImageTransfer] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
    const [isBulkExporting, setIsBulkExporting] = useState<boolean>(false);

    // Editor modal state
    const [editingItem, setEditingItem] = useState<WpContent | null>(null);

    const filteredContent = useMemo(() => {
        if (!searchTerm) return contentItems;
        const decodeHtml = (html: string) => {
            const txt = document.createElement("textarea");
            txt.innerHTML = html;
            return txt.value;
        }
        return contentItems.filter(item =>
            decodeHtml(item.title.rendered).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [contentItems, searchTerm]);

    const fetchContent = useCallback((config: SiteConfig, type: 'posts' | 'pages', isRefresh: boolean = false) => {
        setError(null);
        if (!isRefresh) {
            setContentItems([]);
            setItemStatuses({});
            setSelectedItemIds(new Set());
            setIsLoading(true);
            setLoadingProgress(null);
        }
        return getContent(config, type, setLoadingProgress)
            .then(fetchedContent => {
                setContentItems(fetchedContent);
            })
            .catch(err => {
                setError(`Failed to fetch ${type}: ${err.message}. Please check your connection on the Settings page.`);
            })
            .finally(() => {
                if (!isRefresh) setIsLoading(false);
                setLoadingProgress(null);
            });
    }, []);

    useEffect(() => {
        if (sourceConfig) {
            fetchContent(sourceConfig, contentType);
        } else {
            // If source config is removed, clear content
            setContentItems([]);
            setError(null);
        }
    }, [sourceConfig, contentType, fetchContent]);

    const handleRefresh = useCallback(async () => {
        if (!sourceConfig) return;
        setIsRefreshing(true);
        setError(null);
        await fetchContent(sourceConfig, contentType, true);
        setIsRefreshing(false);
        setSelectedItemIds(new Set());
    }, [sourceConfig, contentType, fetchContent]);

    const handleExportItem = useCallback(async (itemId: number) => {
        if (!sourceConfig || !destConfig) {
            alert("Please connect to both source and destination sites first.");
            return;
        }
        setItemStatuses(prev => ({ ...prev, [itemId]: { status: 'exporting' } }));
        try {
            const itemToExport = await getFullContentDetails(itemId, contentType, sourceConfig);
            await transferContent(itemToExport, contentType, sourceConfig, destConfig, skipImageTransfer);
            setItemStatuses(prev => ({ ...prev, [itemId]: { status: 'success' } }));
        // Fix: Corrected syntax for catch block. Replaced `->` with `{`.
        } catch (err: any) {
            console.error(`Failed to export ${contentType} ${itemId}:`, err);
            setItemStatuses(prev => ({ ...prev, [itemId]: { status: 'error', message: err.message } }));
        }
    }, [sourceConfig, destConfig, skipImageTransfer, contentType]);

    const handleEditItem = (itemId: number) => {
        const itemToEdit = contentItems.find(item => item.id === itemId);
        if (itemToEdit) {
            setEditingItem(itemToEdit);
        }
    };

    const handleExportEditedContent = useCallback(async (editedContent: WpContent) => {
        if (!sourceConfig || !destConfig) {
            alert("Please connect to both source and destination sites first.");
            return;
        }
        const itemId = editedContent.id;
        setItemStatuses(prev => ({ ...prev, [itemId]: { status: 'exporting' } }));
        try {
            await transferContent(editedContent, contentType, sourceConfig, destConfig, skipImageTransfer);
            setItemStatuses(prev => ({ ...prev, [itemId]: { status: 'success' } }));
            setEditingItem(null); // Close modal on success
        } catch (err: any) {
            console.error(`Failed to export edited ${contentType} ${itemId}:`, err);
            // We don't update the main list status here, the modal will show the error
            throw err; // Re-throw to be caught by the modal
        }
    }, [sourceConfig, destConfig, skipImageTransfer, contentType]);


    // --- Multi-select Handlers ---
    const handleToggleSelection = (itemId: number) => {
        setSelectedItemIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const handleToggleSelectAll = () => {
        if (selectedItemIds.size === filteredContent.length) {
            setSelectedItemIds(new Set());
        } else {
            setSelectedItemIds(new Set(filteredContent.map(p => p.id)));
        }
    };

     const handleBulkExport = async () => {
        if (!sourceConfig || !destConfig || selectedItemIds.size === 0) return;
        setIsBulkExporting(true);
        const initialStatuses: Record<number, ItemStatus> = {};
        selectedItemIds.forEach(id => {
            initialStatuses[id] = { status: 'exporting' };
        });
        setItemStatuses(prev => ({ ...prev, ...initialStatuses }));

        for (const itemId of selectedItemIds) {
            await handleExportItem(itemId);
        }
        
        setIsBulkExporting(false);
        setSelectedItemIds(new Set());
    };

    const getTabClassName = (tabType: typeof contentType) => 
        `px-3 py-2 font-medium text-sm rounded-md cursor-pointer transition-colors ${
            contentType === tabType
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
        }`;


    if (!sourceConfig || !destConfig) {
        return (
            <div className="text-center bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700/50 p-12">
                <h3 className="text-2xl font-bold tracking-tight">Connections Needed</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-xl mx-auto">
                    To begin migrating content, please set up your source and destination WordPress sites on the settings page.
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
        <div className="space-y-6">
            {editingItem && (
                <ContentEditorModal
                    item={editingItem}
                    onClose={() => setEditingItem(null)}
                    onExport={handleExportEditedContent}
                />
            )}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                <nav className="flex space-x-2" aria-label="Tabs">
                    <button onClick={() => setContentType('posts')} className={getTabClassName('posts')}>
                        Posts
                    </button>
                    <button onClick={() => setContentType('pages')} className={getTabClassName('pages')}>
                        Pages
                    </button>
                </nav>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
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
                        Fetching {contentType}... 
                        {loadingProgress && ` (${loadingProgress.loaded}/${loadingProgress.total})`}
                    </p>
                </div>
            ) : contentItems.length > 0 ? (
                <PostList
                    items={filteredContent}
                    statuses={itemStatuses}
                    onExport={handleExportItem}
                    onEdit={handleEditItem}
                    isDestinationConnected={!!destConfig}
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    skipImageTransfer={skipImageTransfer}
                    onSkipImageChange={setSkipImageTransfer}
                    selectedIds={selectedItemIds}
                    onToggleSelection={handleToggleSelection}
                    onToggleSelectAll={handleToggleSelectAll}
                    onBulkExport={handleBulkExport}
                    isBulkExporting={isBulkExporting}
                    contentType={contentType}
                />
            ) : sourceConfig && !isLoading && (
                 <div className="text-center bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700/50 p-12">
                    <h3 className="text-xl font-medium">No {contentType === 'posts' ? 'Posts' : 'Pages'} Found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">The source WordPress site does not have any {contentType}, or they are not publicly accessible via the REST API.</p>
                </div>
            )}
        </div>
    )
};