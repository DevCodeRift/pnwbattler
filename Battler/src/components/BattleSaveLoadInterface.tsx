'use client';

import React, { useState, useEffect } from 'react';
import { BattleSession } from '@/types/simulation';
import { BattleSaveManager } from '@/lib/battle-save-manager';

interface BattleSaveLoadInterfaceProps {
  currentSession?: BattleSession;
  onLoadBattle: (session: BattleSession) => void;
  onSaveBattle?: (session: BattleSession, saveName: string) => void;
}

interface SaveMetadata {
  id: string;
  name: string;
  timestamp: string;
  participants: string[];
  currentTurn: number;
  isActive: boolean;
}

export default function BattleSaveLoadInterface({ 
  currentSession, 
  onLoadBattle, 
  onSaveBattle 
}: BattleSaveLoadInterfaceProps) {
  const [saves, setSaves] = useState<SaveMetadata[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [selectedSave, setSelectedSave] = useState<string | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importData, setImportData] = useState('');

  useEffect(() => {
    loadSavesList();
  }, []);

  const loadSavesList = () => {
    const savesList = BattleSaveManager.getSaveList();
    setSaves(savesList);
  };

  const handleSave = () => {
    if (!currentSession || !saveName.trim()) return;

    const success = BattleSaveManager.saveBattle(currentSession, saveName.trim());
    if (success) {
      if (onSaveBattle) {
        onSaveBattle(currentSession, saveName.trim());
      }
      setShowSaveDialog(false);
      setSaveName('');
      loadSavesList();
    } else {
      alert('Failed to save battle. Please try again.');
    }
  };

  const handleLoad = () => {
    if (!selectedSave) return;

    const session = BattleSaveManager.loadBattle(selectedSave);
    if (session) {
      onLoadBattle(session);
      setSelectedSave(null);
    } else {
      alert('Failed to load battle. The save file may be corrupted or incompatible.');
    }
  };

  const handleDelete = (saveId: string) => {
    if (confirm('Are you sure you want to delete this save?')) {
      const success = BattleSaveManager.deleteSave(saveId);
      if (success) {
        loadSavesList();
        if (selectedSave === saveId) {
          setSelectedSave(null);
        }
      } else {
        alert('Failed to delete save.');
      }
    }
  };

  const handleExport = () => {
    const exportData = BattleSaveManager.exportSaves();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pnw_battle_saves_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importData.trim()) return;

    try {
      const success = BattleSaveManager.importSaves(importData);
      if (success) {
        loadSavesList();
        setImportData('');
        setShowImportExport(false);
        alert('Saves imported successfully!');
      } else {
        alert('Failed to import saves. Please check the file format.');
      }
    } catch (error) {
      alert('Invalid import data. Please check the file format.');
    }
  };

  const storageInfo = BattleSaveManager.getStorageInfo();

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Save & Load Battles</h2>
        <div className="flex space-x-2">
          {currentSession && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Save Current Battle
            </button>
          )}
          <button
            onClick={() => setShowImportExport(!showImportExport)}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Import/Export
          </button>
        </div>
      </div>

      {/* Storage Info */}
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <div className="flex justify-between items-center text-sm text-gray-300">
          <span>Saved Battles: {storageInfo.totalSaves}</span>
          <span>Storage Used: {(storageInfo.storageUsed / 1024).toFixed(1)} KB</span>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-white mb-4">Save Battle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Save Name
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter save name..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import/Export Dialog */}
      {showImportExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">Import/Export Saves</h3>
            <div className="space-y-4">
              <div>
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Export All Saves
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Import Saves (JSON)
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste exported save data here..."
                  rows={6}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowImportExport(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importData.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saves List */}
      <div className="space-y-3">
        {saves.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No saved battles found
          </div>
        ) : (
          saves.map((save) => (
            <div
              key={save.id}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                selectedSave === save.id
                  ? 'bg-blue-600 border-blue-500'
                  : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
              } border`}
              onClick={() => setSelectedSave(save.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-white">{save.name}</h3>
                  <p className="text-sm text-gray-300">
                    {save.participants.join(' vs ')}
                  </p>
                  <p className="text-xs text-gray-400">
                    Turn {save.currentTurn} • {new Date(save.timestamp).toLocaleString()}
                  </p>
                  {save.isActive && (
                    <span className="inline-block mt-1 px-2 py-1 bg-green-600 text-green-100 text-xs rounded">
                      Active
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(save.id);
                  }}
                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  title="Delete save"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load Button */}
      {selectedSave && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <button
            onClick={handleLoad}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Load Selected Battle
          </button>
        </div>
      )}
    </div>
  );
}
