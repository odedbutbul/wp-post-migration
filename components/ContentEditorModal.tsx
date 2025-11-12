import React, { useState, useEffect, useMemo } from 'react';
import type { WpContent } from '../types';
import { ExportIcon, SpinnerIcon } from './icons';

interface ContentEditorModalProps {
    item: WpContent;
    onClose: () => void;
    onExport: (editedItem: WpContent) => Promise<void>;
}

export const ContentEditorModal: React.FC<ContentEditorModalProps> = ({ item, onClose, onExport }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<'idle' | 'exporting' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const decodeHtml = (html: string) => {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }

    useEffect(() => {
        setTitle(decodeHtml(item.title.rendered));
        setContent(item.content.rendered);
    }, [item]);

    const handleExport = async () => {
        setStatus('exporting');
        setError(null);
        try {
            const editedItem: WpContent = {
                ...item,
                title: { rendered: title },
                content: { ...item.content, rendered: content },
            };
            await onExport(editedItem);
            // On success, the parent component will close the modal.
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            setStatus('error');
        }
    };

    const isPristine = useMemo(() => {
        return decodeHtml(item.title.rendered) === title && item.content.rendered === content;
    }, [item, title, content]);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="fixed inset-0"
                aria-hidden="true"
                onClick={onClose}
            ></div>
            
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-lg shadow-xl flex flex-col">
                <div className="flex items-start justify-between p-4 border-b rounded-t dark:border-slate-600">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white" id="modal-title">
                        Edit Content
                    </h3>
                    <button 
                        type="button" 
                        className="text-slate-400 bg-transparent hover:bg-slate-200 hover:text-slate-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-slate-600 dark:hover:text-white"
                        onClick={onClose}
                    >
                        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                        </svg>
                        <span className="sr-only">Close modal</span>
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="edit-title" className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">Title</label>
                        <input 
                            type="text" 
                            id="edit-title" 
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-content" className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">Content</label>
                        <textarea 
                            id="edit-content" 
                            rows={15} 
                            className="block p-2.5 w-full text-sm text-slate-900 bg-slate-50 rounded-lg border border-slate-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 font-mono"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        ></textarea>
                    </div>
                    {error && (
                        <div className="text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-3 rounded-md border border-red-300 dark:border-red-600/50 whitespace-pre-wrap">
                            <p className="font-bold">Export Failed</p>
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end p-4 space-x-2 border-t border-slate-200 rounded-b dark:border-slate-600">
                    <button 
                        onClick={onClose} 
                        type="button" 
                        className="text-slate-500 bg-white hover:bg-slate-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-slate-200 text-sm font-medium px-5 py-2.5 hover:text-slate-900 focus:z-10 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:text-white dark:hover:bg-slate-600 dark:focus:ring-slate-600"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleExport} 
                        type="button" 
                        disabled={status === 'exporting'}
                        className="inline-flex items-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'exporting' ? (
                            <>
                                <SpinnerIcon className="h-5 w-5 mr-2" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <ExportIcon className="h-5 w-5 mr-2" />
                                {status === 'error' ? 'Retry Export' : 'Export Edited Content'}
                            </>
                        )}
                        
                    </button>
                </div>
                 {isPristine && (
                    <div className="px-6 pb-2 text-xs text-center text-slate-400">
                        Content has not been changed from the original.
                    </div>
                )}
            </div>
        </div>
    );
};
