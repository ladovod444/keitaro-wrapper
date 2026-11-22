import React, { useState, useEffect } from 'react';
import { getCampaign, updateCampaign } from '../api/client';

export default function CampaignEditor({ campaignId, onSuccess, onClose }) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newOffer, setNewOffer] = useState({ offer_id: '', share: 100 });

  // Автоматическая загрузка кампании при открытии модалки
  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  const loadCampaign = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await getCampaign(campaignId);
      setCampaign(response.data);

      const streams = response.data.streams || [];
      const streamIdx = streams.findIndex(s => s.schema === 'landings' || s.schema === 'offers' || (s.offers && s.offers.length > 0));
      if (streamIdx !== -1) {
        const usedShare = streams[streamIdx].offers.reduce((sum, o) => sum + (parseInt(o.share) || 0), 0);
        setNewOffer({ offer_id: '', share: Math.max(0, 100 - usedShare) });
      }
    } catch (err) {
      setError('Не удалось загрузить кампанию.');
      setCampaign(null);
    } finally {
      setLoading(false);
    }
  };

  const getOfferStreamIndex = () => {
    if (!campaign || !campaign.streams) return -1;
    return campaign.streams.findIndex(stream =>
      stream.schema === 'landings' ||
      stream.schema === 'offers' ||
      (stream.offers && stream.offers.length > 0)
    );
  };

  const getTotalUsedShare = () => {
    const streamIdx = getOfferStreamIndex();
    if (streamIdx === -1 || !campaign.streams[streamIdx].offers) return 0;
    return campaign.streams[streamIdx].offers.reduce((sum, offer) => sum + (parseInt(offer.share) || 0), 0);
  };

  const handleAddOffer = () => {
    if (!newOffer.offer_id || newOffer.offer_id.trim() === '') {
      setError('Пожалуйста, введите Offer ID');
      return;
    }

    const offerId = parseInt(newOffer.offer_id);
    if (isNaN(offerId) || offerId <= 0) {
      setError('Offer ID должен быть положительным числом');
      return;
    }

    const streamIdx = getOfferStreamIndex();
    if (streamIdx === -1) {
      setError('Поток с офферами не найден в этой кампании!');
      return;
    }

    const usedShare = getTotalUsedShare();
    const shareToAdd = parseInt(newOffer.share) || 0;

    if (usedShare + shareToAdd > 100) {
      setError(`Сумма share не может превышать 100. Сейчас занято: ${usedShare}%. Доступно: ${100 - usedShare}%`);
      return;
    }

    const updatedCampaign = { ...campaign };
    const stream = updatedCampaign.streams[streamIdx];

    if (!stream.offers) stream.offers = [];

    stream.offers.push({
      offer_id: offerId,
      share: shareToAdd,
      state: "active"
    });

    setCampaign(updatedCampaign);
    setError('');

    const nextAvailableShare = Math.max(0, 100 - (usedShare + shareToAdd));
    setNewOffer({ offer_id: '', share: nextAvailableShare });
  };

  const handleRemoveOffer = (offerIndex) => {
    const updatedCampaign = { ...campaign };
    const streamIdx = getOfferStreamIndex();

    updatedCampaign.streams[streamIdx].offers.splice(offerIndex, 1);
    setCampaign(updatedCampaign);

    const newUsedShare = updatedCampaign.streams[streamIdx].offers.reduce((sum, o) => sum + (parseInt(o.share) || 0), 0);
    setNewOffer(prev => ({ ...prev, share: Math.max(0, 100 - newUsedShare) }));
  };

  const handleSave = async () => {
    const usedShare = getTotalUsedShare();
    if (usedShare !== 100) {
      const confirmSave = window.confirm(`Внимание: сумма share равна ${usedShare}%, а должна быть ровно 100%. Keitaro может выдать ошибку. Всё равно сохранить?`);
      if (!confirmSave) return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const updatePayload = { streams: campaign.streams };
      await updateCampaign(campaign.id, updatePayload);
      setSuccess('Кампания успешно обновлена!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(`Ошибка сохранения: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Загрузка кампании...</p>
      </div>
    );
  }

  const streamIdx = campaign ? getOfferStreamIndex() : -1;
  const offers = (campaign && streamIdx !== -1) ? campaign.streams[streamIdx].offers || [] : [];
  const totalUsedShare = getTotalUsedShare();

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

      {campaign && (
        <div>
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800">{campaign.name}</h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
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

          {streamIdx === -1 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">⚠️ В этой кампании не найден поток с офферами.</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Список офферов</h4>
                {offers.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Офферов пока нет.</p>
                ) : (
                  <div className="space-y-2">
                    {offers.map((offer, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">Offer ID:</span>
                            <span className="text-base font-semibold text-gray-800">{offer.offer_id}</span>
                          </div>
                          <div className="h-4 w-px bg-gray-300"></div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">Share:</span>
                            <span className="text-base font-semibold text-blue-600">{offer.share}%</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveOffer(idx)}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition duration-200"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-gray-800">Добавить оффер</h4>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    totalUsedShare >= 100 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    Занято: {totalUsedShare}% / 100%
                  </span>
                </div>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Offer ID *"
                    value={newOffer.offer_id}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setNewOffer({...newOffer, offer_id: value});
                    }}
                    onKeyDown={e => {
                      if (['-', '+', '.', 'e', 'E', ',', ' '].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    required
                    min="1"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100"
                    disabled={totalUsedShare >= 100}
                  />
                  <input
                    type="number"
                    placeholder="Share (%)"
                    value={newOffer.share}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      const numValue = parseInt(value) || 0;
                      setNewOffer({...newOffer, share: numValue > 100 ? '100' : value});
                    }}
                    onKeyDown={e => {
                      if (['-', '+', '.', 'e', 'E', ',', ' '].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    required
                    min="1"
                    max="100"
                    className="w-28 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100"
                    disabled={totalUsedShare >= 100}
                  />
                  <button
                    onClick={handleAddOffer}
                    disabled={totalUsedShare >= 100}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Добавить
                  </button>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Сохранение...
                  </span>
                ) : (
                  '💾 Сохранить изменения в Keitaro'
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}