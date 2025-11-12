import React, { useState } from 'react';
import type { SiteConfig, SavedConnection } from '../types';
import { ConnectIcon, ConnectedIcon, DisconnectIcon } from './icons';
import { validateConnection } from '../services/wordpressService';

interface WordPressConnectorProps {
    siteType: 'Source' | 'Destination';
    onConnect: (connection: Omit<SavedConnection, 'id'>) => void;
    onDisconnect: () => void;
    config: SiteConfig | null;
}

export const WordPressConnector: React.FC<WordPressConnectorProps> = ({ 
    siteType, 
    onConnect, 
    onDisconnect, 
    config,
}) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [proxyUrl, setProxyUrl] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!name || !url || !username || !appPassword) {
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

            onConnect({ name, ...configToTest, username });
            setName('');
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
    
    const bgColor = siteType === 'Source' ? 'bg-blue-50 dark:bg-slate-800/30' : 'bg-green-50 dark:bg-slate-800/30';
    const borderColor = siteType === 'Source' ? 'border-blue-200 dark:border-blue-900/50' : 'border-green-200 dark:border-green-900/50';
    const ringColor = siteType === 'Source' ? 'focus:ring-blue-500' : 'focus:ring-green-500';
    const buttonColor = siteType === 'Source' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500';

    return (
        <div className={`p-6 rounded-lg shadow-sm border ${bgColor} ${borderColor} flex flex-col bg-white dark:bg-slate-800/50`}>
            {config ? (
                <>
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        {siteType} Site
                        <ConnectedIcon className="h-5 w-5 ml-2 text-green-500" />
                    </h2>
                    <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md text-sm flex-grow border border-slate-200 dark:border-slate-700/50">
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
                        className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-900"
                    >
                       <DisconnectIcon className="h-5 w-5 mr-2" />
                       Disconnect
                    </button>
                </>
            ) : (
                <>
                    <h2 className="text-xl font-bold mb-4">Connect {siteType} Site</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                         <div>
                            <label htmlFor={`${siteType}-name`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">Connection Name</label>
                            <input
                                type="text"
                                id={`${siteType}-name`}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 ${ringColor} sm:text-sm`}
                                placeholder="e.g., My Staging Site"
                            />
                        </div>
                        <div>
                            <label htmlFor={`${siteType}-url`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">WordPress Site URL</label>
                            <input
                                type="text"
                                id={`${siteType}-url`}
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 ${ringColor} sm:text-sm`}
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
                                className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 ${ringColor} sm:text-sm`}
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
                                className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 ${ringColor} sm:text-sm`}
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
                                className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 ${ringColor} sm:text-sm`}
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
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <ConnectIcon className="h-5 w-5 mr-2" />
                                )}
                                {isConnecting ? 'Connecting...' : 'Connect & Save'}
                            </button>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 pt-1">
                            <p>
                                Use an <a href="https://wordpress.org/documentation/article/application-passwords/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Application Password</a>, not your regular password.
                            </p>
                            <p>
                                A successful connection will be automatically saved for future use.
                            </p>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};