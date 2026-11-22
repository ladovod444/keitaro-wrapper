import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    group_id: 1,
    domain_id: 1,
    traffic_source_id: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/settings');
      setSettings({
        group_id: response.data.group_id,
        domain_id: response.data.domain_id,
        traffic_source_id: response.data.traffic_source_id
      });
    } catch (err) {
      setError('Не удалось загрузить настройки');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.put('http://localhost:8000/api/settings', settings);
      setSuccess('Настройки успешно сохранены!');
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError('Не удалось сохранить настройки');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-800">Настройки</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group ID
              </label>
              <input
                type="number"
                value={settings.group_id}
                onChange={e => setSettings({...settings, group_id: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 mt-1">ID группы, к которой принадлежат ваши кампании</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain ID
              </label>
              <input
                type="number"
                value={settings.domain_id}
                onChange={e => setSettings({...settings, domain_id: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 mt-1">ID домена по умолчанию для новых кампаний</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Traffic Source ID
              </label>
              <input
                type="number"
                value={settings.traffic_source_id}
                onChange={e => setSettings({...settings, traffic_source_id: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 mt-1">ID источника трафика по умолчанию</p>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}