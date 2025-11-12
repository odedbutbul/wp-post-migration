import React, { useRef, useEffect } from 'react';
import type { WpPost, PostStatus } from '../types';
import { PostItem } from './PostItem';
import { RefreshIcon, SpinnerIcon, SearchIcon, ExportIcon } from './icons';

interface PostListProps {
    posts: WpPost[];
    statuses: Record<number, PostStatus>;
    onExport: (postId: number) => void;
    isDestinationConnected: boolean;
    onRefresh: () => void;
    isRefreshing: boolean;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    skipImageTransfer: boolean;
    onSkipImageChange: (skip: boolean) => void;
    selectedIds: Set<number>;
    onToggleSelection: (id: number) => void;
    onToggleSelectAll: () => void;
    onBulkExport: () => void;
    isBulkExporting: boolean;
}

export const PostList: React.FC<PostListProps> = ({
    posts,
    statuses,
    onExport,
    isDestinationConnected,
    onRefresh,
    isRefreshing,
    searchTerm,
    onSearchChange,
    skipImageTransfer,
    onSkipImageChange,
    selectedIds,
    onToggleSelection,
    onToggleSelectAll,
    onBulkExport,
    isBulkExporting,
}) => {
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            const numSelected = selectedIds.size;
            const numPosts = posts.length;
            selectAllCheckboxRef.current.checked = numSelected > 0 && numSelected === numPosts;
            selectAllCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numPosts;
        }
    }, [selectedIds, posts.length]);
    
    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700/50 overflow-hidden">
             <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h2 className="text-lg font-semibold leading-6 text-slate-900 dark:text-white">Source Posts ({posts.length})</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Select posts to export to the destination site.</p>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                id="skip-image-transfer"
                                checked={skipImageTransfer}
                                onChange={(e) => onSkipImageChange(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="skip-image-transfer" className="ml-2 block text-sm text-slate-600 dark:text-slate-300">
                                Skip featured image
                            </label>
                        </div>
                        <button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="inline-flex items-center p-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Refresh posts"
                            title="Refresh posts"
                        >
                            {isRefreshing ? <SpinnerIcon className="h-5 w-5" /> : <RefreshIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                        </div>
                        <input
                            type="search"
                            name="search"
                            id="search"
                            className="block w-full rounded-md border-0 bg-white dark:bg-slate-900 py-2 pl-10 pr-3 text-slate-900 dark:text-slate-200 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                            placeholder="Search posts by title..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                    {selectedIds.size > 0 && (
                        <button 
                            onClick={onBulkExport}
                            disabled={!isDestinationConnected || isBulkExporting}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                           {isBulkExporting ? <SpinnerIcon className="h-5 w-5 mr-2" /> : <ExportIcon className="h-5 w-5 mr-2" />}
                           {isBulkExporting ? 'Exporting...' : `Export Selected (${selectedIds.size})`}
                        </button>
                    )}
                </div>
            </div>
            <div className="flex items-center px-4 sm:px-6 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <input
                    ref={selectAllCheckboxRef}
                    type="checkbox"
                    onChange={onToggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Select all posts"
                />
                 <label htmlFor="select-all" className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Select all
                </label>
            </div>
            <ul role="list" className="divide-y divide-slate-200 dark:divide-slate-700">
                {posts.length > 0 ? (
                    posts.map(post => (
                        <PostItem
                            key={post.id}
                            post={post}
                            status={statuses[post.id] || { status: 'idle' }}
                            onExport={() => onExport(post.id)}
                            isDestinationConnected={isDestinationConnected}
                            isSelected={selectedIds.has(post.id)}
                            onToggleSelection={() => onToggleSelection(post.id)}
                        />
                    ))
                ) : (
                    <li className="p-8 text-center text-slate-500 dark:text-slate-400">
                        {searchTerm ? "No posts match your search." : "No posts found."}
                    </li>
                )}
            </ul>
        </div>
    );
};
