import React from 'react';
import { WordPressConnector } from '../components/WordPressConnector';
import type { SiteConfig, SavedConnection } from '../types';
import { LoadIcon, TrashIcon } from '../components/icons';

interface SettingsPageProps {
    sourceConfig: SiteConfig | null;
    destConfig: SiteConfig | null;
    savedConnections: SavedConnection[];
    onSetSource: (config: SiteConfig) => void;
    onSetDest: (config: SiteConfig) => void;
    onAddConnection: (connection: Omit<SavedConnection, 'id'>) => void;
    onDeleteConnection: (id: string) => void;
    onDisconnectSource: () => void;
    onDisconnectDest: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
    sourceConfig,
    destConfig,
    savedConnections,
    onSetSource,
    onSetDest,
    onAddConnection,
    onDeleteConnection,
    onDisconnectSource,
    onDisconnectDest,
}) => {

    const handleSourceConnect = (connection: Omit<SavedConnection, 'id'>) => {
        onAddConnection(connection);
        onSetSource(connection);
    };

    const handleDestConnect = (connection: Omit<SavedConnection, 'id'>) => {
        onAddConnection(connection);
        onSetDest(connection);
    };

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <WordPressConnector
                    siteType="Source"
                    onConnect={handleSourceConnect}
                    onDisconnect={onDisconnectSource}
                    config={sourceConfig}
                />
                <WordPressConnector
                    siteType="Destination"
                    onConnect={handleDestConnect}
                    onDisconnect={onDisconnectDest}
                    config={destConfig}
                />
            </div>

            <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700/50">
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold leading-6 text-slate-900 dark:text-white">Saved Connections</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Load a saved connection as a source or destination.</p>
                </div>
                {savedConnections.length > 0 ? (
                    <ul role="list" className="divide-y divide-slate-200 dark:divide-slate-700">
                        {savedConnections.map(conn => (
                            <li key={conn.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{conn.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{conn.url}</p>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                                     <button
                                        type="button"
                                        onClick={() => onSetSource(conn)}
                                        title="Load as Source"
                                        className="inline-flex items-center px-3 py-1.5 border border-blue-300 dark:border-blue-700 text-xs font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800"
                                    >
                                        <LoadIcon className="h-4 w-4 mr-1.5"/>
                                        Source
                                    </button>
                                     <button
                                        type="button"
                                        onClick={() => onSetDest(conn)}
                                        title="Load as Destination"
                                        className="inline-flex items-center px-3 py-1.5 border border-green-300 dark:border-green-700 text-xs font-medium rounded-md text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/40 hover:bg-green-100 dark:hover:bg-green-900/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-800"
                                    >
                                        <LoadIcon className="h-4 w-4 mr-1.5"/>
                                        Destination
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDeleteConnection(conn.id)}
                                        title="Delete Connection"
                                        className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <TrashIcon className="h-5 w-5"/>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-8 text-center text-slate-500 dark:text-slate-400">
                        You have no saved connections. Create one above to get started.
                    </p>
                )}
            </div>
        </div>
    );
};
