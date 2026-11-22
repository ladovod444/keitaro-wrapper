import React, {useEffect, useState} from 'react';
import { createCampaign } from '../api/client';
import axios from 'axios';

export default function CampaignCreator({ onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    geo_code: '',
    offer_id: '',
    domain_id: 1,
    group_id: 1,
    traffic_source_id: 1
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Загружаем настройки при монтировании компонента
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/settings');
      setFormData(prev => ({
        ...prev,
        domain_id: response.data.domain_id,
        group_id: response.data.group_id,
        traffic_source_id: response.data.traffic_source_id
      }));
    } catch (err) {
      console.error('Не удалось загрузить настройки:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await createCampaign(formData);
      setSuccess(`Кампания успешно создана! ID: ${response.data.data.id}`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось создать кампанию');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название кампании *
          </label>
          <input
            type="text"
            placeholder="Введите название"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alias (латиница, без пробелов) *
          </label>
          <input
            type="text"
            placeholder="my-campaign-123"
            value={formData.alias}
            onChange={e => setFormData({...formData, alias: e.target.value})}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Гео-код *
          </label>
          <input
            type="text"
            placeholder="RU, US, DE"
            value={formData.geo_code}
            onChange={e => setFormData({...formData, geo_code: e.target.value})}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID Оффера *
          </label>
          <input
            type="number"
            placeholder="Введите ID оффера"
            value={formData.offer_id}
            onChange={e => setFormData({...formData, offer_id: e.target.value})}
            required
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domain ID
            </label>
            <input
              type="number"
              value={formData.domain_id}
              onChange={e => setFormData({...formData, domain_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group ID
            </label>
            <input
              type="number"
              value={formData.group_id}
              onChange={e => setFormData({...formData, group_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source ID
            </label>
            <input
              type="number"
              value={formData.traffic_source_id}
              onChange={e => setFormData({...formData, traffic_source_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-md"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Создание...
            </span>
          ) : (
            'Создать кампанию'
          )}
        </button>
      </form>
    </div>
  );
}