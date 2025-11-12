import React from 'react';
import type { WpContent, ItemStatus } from '../types';
import { ExportIcon, SpinnerIcon, CheckCircleIcon, ExclamationCircleIcon, EditIcon } from './icons';

interface PostItemProps {
    post: WpContent;
    status: ItemStatus;
    onExport: () => void;
    onEdit: () => void;
    isDestinationConnected: boolean;
    isSelected: boolean;
    onToggleSelection: () => void;
}

const StatusButton: React.FC<{ status: ItemStatus; onExport: () => void; isDestinationConnected: boolean; }> = ({ status, onExport, isDestinationConnected }) => {
    const baseClasses = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 whitespace-nowrap";
    const disabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed";

    switch (status.status) {
        case 'exporting':
            return (
                <button type="button" className={`${baseClasses} bg-yellow-500 ${disabledClasses}`} disabled>
                    <SpinnerIcon className="h-5 w-5 mr-2" />
                    Exporting...
                </button>
            );
        case 'success':
            return (
                <button type="button" className={`${baseClasses} bg-green-500 ${disabledClasses}`} disabled>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Exported
                </button>
            );
        case 'error':
            return (
                <div className="flex items-center space-x-2 relative group">
                    <button type="button" className={`${baseClasses} bg-red-500 hover:bg-red-600 focus:ring-red-400`} onClick={onExport}>
                        <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                        Retry
                    </button>
                    <span className="text-red-500 text-xs cursor-help">Failed</span>
                        <div className="absolute hidden group-hover:block bottom-full mb-2 right-0 w-96 bg-slate-800 text-slate-100 text-xs rounded-lg p-3 z-20 shadow-lg whitespace-pre-wrap border border-slate-700">
                        <p className="font-bold text-red-400 mb-2">Export Error</p>
                        {status.message}
                    </div>
                </div>
            );
        case 'idle':
        default:
            return (
                <button
                    type="button"
                    onClick={onExport}
                    disabled={!isDestinationConnected}
                    className={`${baseClasses} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 ${disabledClasses}`}
                    title={!isDestinationConnected ? "Connect to a destination site to enable export" : ""}
                >
                    <ExportIcon className="h-5 w-5 mr-2" />
                    Export
                </button>
            );
    }
};


export const PostItem: React.FC<PostItemProps> = ({ post, status, onExport, onEdit, isDestinationConnected, isSelected, onToggleSelection }) => {
    const author = post._embedded?.author?.[0]?.name || 'Unknown Author';
    const featuredImageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;

    const handleItemClick = (e: React.MouseEvent<HTMLLIElement>) => {
        // Prevent toggling selection when the button or a link inside is clicked
        if ((e.target as HTMLElement).closest('button, a')) {
            return;
        }
        onToggleSelection();
    };

    const selectedClasses = isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50';

    return (
        <li className={`p-4 sm:px-6 transition-colors duration-150 cursor-pointer ${selectedClasses}`} onClick={handleItemClick}>
            <div className="flex items-center space-x-4">
                 <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelection}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-labelledby={`post-title-${post.id}`}
                    />
                </div>
                {featuredImageUrl ? (
                    <img className="h-16 w-16 rounded-md object-cover flex-shrink-0" src={featuredImageUrl} alt="" />
                ) : (
                    <div className="h-16 w-16 rounded-md bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center">
                        <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p id={`post-title-${post.id}`} className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate" dangerouslySetInnerHTML={{ __html: post.title.rendered }}></p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        By {author} on {new Date(post.date).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex-shrink-0 flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={onEdit}
                        disabled={!isDestinationConnected}
                        className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!isDestinationConnected ? "Connect destination to edit" : "Edit before exporting"}
                    >
                       <EditIcon className="h-5 w-5" />
                    </button>
                    <StatusButton 
                        status={status}
                        onExport={onExport}
                        isDestinationConnected={isDestinationConnected}
                    />
                </div>
            </div>
        </li>
    );
};