import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CampaignList({ onEdit, onCreateNew }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterGroupId, setFilterGroupId] = useState('');

  useEffect(() => {
    loadSettings();
    loadCampaigns();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/settings');
      setFilterGroupId(response.data.group_id.toString());
    } catch (err) {
      console.error('Не удалось загрузить настройки:', err);
    }
  };

  const loadCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:8000/api/campaigns');
      setCampaigns(response.data);
    } catch (err) {
      setError('Не удалось загрузить список кампаний');
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = filterGroupId
    ? campaigns.filter(c => c.group_id === parseInt(filterGroupId))
    : campaigns;

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Список кампаний</h2>
          <p className="text-sm text-gray-500 mt-1">Управление рекламными кампаниями</p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition duration-200 shadow-md"
        >
          + Добавить Кампанию
        </button>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ваша группа (Group ID)
        </label>
        <input
          type="number"
          value={filterGroupId}
          onChange={e => setFilterGroupId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        <p className="text-xs text-gray-500 mt-2">
          Показаны кампании из группы {filterGroupId || 'не указана'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Загрузка кампаний...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-gray-600">
            {filterGroupId ? `Кампании в группе ${filterGroupId} не найдены` : 'Кампании пока не созданы'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCampaigns.map(campaign => (
            <div
              key={campaign.id}
              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition border border-gray-200"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{campaign.name}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span>ID: {campaign.id}</span>
                  <span className="h-4 w-px bg-gray-300"></span>
                  <span>Alias: {campaign.alias}</span>
                  <span className="h-4 w-px bg-gray-300"></span>
                  <span>Group: {campaign.group_id || 'Не указана'}</span>
                  <span className="h-4 w-px bg-gray-300"></span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    campaign.state === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {campaign.state}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onEdit(campaign.id)}
                className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition duration-200"
              >
                Редактировать
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}