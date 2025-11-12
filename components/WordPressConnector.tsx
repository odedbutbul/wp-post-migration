import React, { useState } from 'react';
import type { SiteConfig, SavedSiteConfig } from '../types';
import { ConnectIcon, ConnectedIcon, DisconnectIcon, LoadIcon, TrashIcon } from './icons';
import { validateConnection } from '../services/wordpressService';

interface WordPressConnectorProps {
    siteType: 'Source' | 'Destination';
    onConnect: (config: SiteConfig) => void;
    onDisconnect: () => void;
    config: SiteConfig | null;
    history: SavedSiteConfig[];
    onHistorySelect: (config: SavedSiteConfig) => void;
    onHistoryDelete: (config: SavedSiteConfig) => void;
}

export const WordPressConnector: React.FC<WordPressConnectorProps> = ({ 
    siteType, 
    onConnect, 
    onDisconnect, 
    config,
    history,
    onHistorySelect,
    onHistoryDelete,
}) => {
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [proxyUrl, setProxyUrl] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    const handleSelectFromHistory = (conn: SavedSiteConfig) => {
        setUrl(conn.url);
        setUsername(conn.username);
        setProxyUrl(conn.proxyUrl || '');
        setAppPassword(''); // Security: never autofill password
        setError('');
        onHistorySelect(conn);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!url || !username || !appPassword) {
            setError("All fields are required.");
            return;
        }

        let formattedUrl = url.trim();
        if (!formattedUrl.startsWith('http')) {
            formattedUrl = 'https://' + formattedUrl;
        }
        formattedUrl = formattedUrl.replace(/\/+$/, "");

        setIsConnecting(true);

        try {
            const token = btoa(`${username}:${appPassword}`);
            const configToTest = { 
                url: formattedUrl, 
                token, 
                proxyUrl: proxyUrl.trim() || undefined 
            };
            
            await validateConnection(configToTest);

            onConnect({ ...configToTest, username });
            setUrl('');
            setUsername('');
            setAppPassword('');
            setProxyUrl('');

        } catch (err: any) {
             setError(err.message || 'Connection failed. Please check details.');
        } finally {
            setIsConnecting(false);
        }
    };
    
    const bgColor = siteType === 'Source' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-green-50 dark:bg-green-900/20';
    const borderColor = siteType === 'Source' ? 'border-blue-200 dark:border-blue-700' : 'border-green-200 dark:border-green-700';
    const ringColor = siteType === 'Source' ? 'focus:ring-blue-500' : 'focus:ring-green-500';
    const buttonColor = siteType === 'Source' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500';

    return (
        <div className={`p-6 rounded-lg shadow-md border ${bgColor} ${borderColor} flex flex-col`}>
            {config ? (
                <>
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        {siteType} Site
                        <ConnectedIcon className="h-5 w-5 ml-2 text-green-500" />
                    </h2>
                    <div className="mt-2 p-3 bg-white/60 dark:bg-slate-800/50 rounded-md text-sm flex-grow">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">URL:</p>
                        <p className="truncate text-slate-600 dark:text-slate-400">{config.url}</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 mt-2">Username:</p>
                        <p className="truncate text-slate-600 dark:text-slate-400">{config.username}</p>
                        {config.proxyUrl && (
                            <>
                                <p className="font-semibold text-slate-700 dark:text-slate-300 mt-2">Proxy:</p>
                                <p className="truncate text-slate-600 dark:text-slate-400">{config.proxyUrl}</p>
                            </>
                        )}
                    </div>
                    <button 
                        onClick={onDisconnect} 
                        className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-900"
                    >
                       <DisconnectIcon className="h-5 w-5 mr-2" />
                       Disconnect
                    </button>
                </>
            ) : (
                <>
                    {history.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Recent Connections</h3>
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                {history.map(conn => (
                                    <div key={`${conn.url}-${conn.username}`} className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/60 p-2 rounded-md">
                                        <div className="text-sm min-w-0">
                                            <p className="font-semibold truncate text-slate-700 dark:text-slate-300">{conn.username}</p>
                                            <p className="text-xs truncate text-slate-500 dark:text-slate-400">{conn.url.replace(/^https?:\/\//, '')}</p>
                                        </div>
                                        <div className="flex items-center space-x-1 flex-shrink-0">
                                            <button type="button" onClick={() => handleSelectFromHistory(conn)} title="Load Connection" className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <LoadIcon className="h-5 w-5"/>
                                            </button>
                                            <button type="button" onClick={() => onHistoryDelete(conn)} title="Remove from History" className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                                                <TrashIcon className="h-5 w-5"/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                             <hr className="my-4 border-slate-200 dark:border-slate-700"/>
                        </div>
                    )}

                    <h2 className="text-xl font-bold mb-4">New {siteType} Connection</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor={`${siteType}-url`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">WordPress Site URL</label>
                            <input
                                type="text"
                                id={`${siteType}-url`}
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 ${ringColor} sm:text-sm`}
                                placeholder="example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor={`${siteType}-username`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                            <input
                                type="text"
                                id={`${siteType}-username`}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 ${ringColor} sm:text-sm`}
                                placeholder="your_username"
                            />
                        </div>
                        <div>
                            <label htmlFor={`${siteType}-password`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">Application Password</label>
                            <input
                                type="password"
                                id={`${siteType}-password`}
                                value={appPassword}
                                onChange={(e) => setAppPassword(e.target.value)}
                                className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 ${ringColor} sm:text-sm`}
                                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                            />
                        </div>
                         <div>
                            <label htmlFor={`${siteType}-proxy`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">CORS Proxy URL (Optional)</label>
                            <input
                                type="text"
                                id={`${siteType}-proxy`}
                                value={proxyUrl}
                                onChange={(e) => setProxyUrl(e.target.value)}
                                className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 ${ringColor} sm:text-sm`}
                                placeholder="https://your-proxy.com"
                            />
                        </div>
                        
                        {error && (
                            <div className="text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-3 rounded-md border border-red-300 dark:border-red-600/50 whitespace-pre-wrap">
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
                             <button 
                                type="submit" 
                                disabled={isConnecting}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isConnecting ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8_0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <ConnectIcon className="h-5 w-5 mr-2" />
                                )}
                                {isConnecting ? 'Connecting...' : 'Connect'}
                            </button>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 pt-1">
                            <p>
                                Use an <a href="https://wordpress.org/documentation/article/application-passwords/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Application Password</a>, not your regular password.
                            </p>
                            <p>
                                If you get a "Network error", your site's CORS policy may be blocking requests. Use the optional proxy field above to fix this.
                            </p>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};
