import React, { useState, useEffect } from 'react';
import type { SiteConfig, SavedConnection } from './types';
import { LogoIcon, MigrationIcon, SettingsIcon } from './components/icons';
import { MigrationPage } from './pages/MigrationPage';
import { SettingsPage } from './pages/SettingsPage';

const App: React.FC = () => {
    const [page, setPage] = useState<'migration' | 'settings'>('migration');
    
    // Active configurations
    const [sourceConfig, setSourceConfig] = useState<SiteConfig | null>(() => JSON.parse(localStorage.getItem('wpMigrator-sourceConfig') || 'null'));
    const [destConfig, setDestConfig] = useState<SiteConfig | null>(() => JSON.parse(localStorage.getItem('wpMigrator-destConfig') || 'null'));

    // All saved connections
    const [savedConnections, setSavedConnections] = useState<SavedConnection[]>(() => JSON.parse(localStorage.getItem('wpMigrator-savedConnections') || '[]'));

    // --- LocalStorage Effects ---
    useEffect(() => { localStorage.setItem('wpMigrator-sourceConfig', JSON.stringify(sourceConfig)); }, [sourceConfig]);
    useEffect(() => { localStorage.setItem('wpMigrator-destConfig', JSON.stringify(destConfig)); }, [destConfig]);
    useEffect(() => { localStorage.setItem('wpMigrator-savedConnections', JSON.stringify(savedConnections)); }, [savedConnections]);

    const handleAddConnection = (newConnectionData: Omit<SavedConnection, 'id'>) => {
        setSavedConnections(prev => {
            const existing = prev.find(c => c.url === newConnectionData.url && c.username === newConnectionData.username);
            if (existing) {
                 // Update existing connection with new details (e.g., new token or proxy)
                return prev.map(c => c.id === existing.id ? { ...existing, ...newConnectionData } : c);
            }
            const newConnection: SavedConnection = {
                ...newConnectionData,
                id: Date.now().toString(),
            };
            return [newConnection, ...prev];
        });
    };

    const handleDeleteConnection = (connectionId: string) => {
        setSavedConnections(prev => prev.filter(c => c.id !== connectionId));
    };

    const navItemClasses = (navPage: typeof page) => 
        `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        page === navPage
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
            : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
        }`;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <LogoIcon className="h-8 w-8 text-blue-500" />
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">WordPress Post Migrator</h1>
                        </div>
                         <nav className="flex items-center space-x-2">
                            <button className={navItemClasses('migration')} onClick={() => setPage('migration')}>
                                <MigrationIcon className="h-5 w-5 mr-2" />
                                Migration
                            </button>
                            <button className={navItemClasses('settings')} onClick={() => setPage('settings')}>
                                <SettingsIcon className="h-5 w-5 mr-2" />
                                Settings
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
                {page === 'migration' ? (
                    <MigrationPage 
                        sourceConfig={sourceConfig} 
                        destConfig={destConfig}
                        onNavigateToSettings={() => setPage('settings')}
                    />
                ) : (
                    <SettingsPage
                        sourceConfig={sourceConfig}
                        destConfig={destConfig}
                        savedConnections={savedConnections}
                        onSetSource={setSourceConfig}
                        onSetDest={setDestConfig}
                        onAddConnection={handleAddConnection}
                        onDeleteConnection={handleDeleteConnection}
                        onDisconnectSource={() => setSourceConfig(null)}
                        onDisconnectDest={() => setDestConfig(null)}
                    />
                )}
            </main>
        </div>
    );
};

export default App;
