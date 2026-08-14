// ---------------------------------------------------------------------------
// Market Linkage Page
// Requirements 9.1–9.7: Produce listing, buyer matching, e-NAM link
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { supabase } from '../lib/supabaseClient';
import { BuyerMatchCard } from '../components/BuyerMatchCard';
import { matchListingToBuyers, type ProduceListing, type BuyerRequirement } from '../lib/marketMatching';

export function MarketLinkagePage() {
  const { t } = useTranslation();
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [buyerRequirements, setBuyerRequirements] = useState<BuyerRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [farmerId, setFarmerId] = useState<string | null>(null);

  // Form state
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [qualityGrade, setQualityGrade] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [pickupDelivery, setPickupDelivery] = useState<'pickup' | 'delivery' | 'both'>('pickup');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch farmer profile ID
  useEffect(() => {
    async function getFarmerId() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('farmer_profiles')
          .select('id, state, district')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setFarmerId(profile.id);
        }
      }
    }
    getFarmerId();
  }, []);

  // Fetch listings and buyer requirements
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch farmer's listings
        const { data: listingsData, error: listingsError } = await supabase
          .from('produce_listings')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (listingsError) throw listingsError;

        // Fetch active buyer requirements
        const { data: buyersData, error: buyersError } = await supabase
          .from('buyer_requirements')
          .select('*')
          .eq('status', 'active');

        if (buyersError) throw buyersError;

        setListings(listingsData || []);
        setBuyerRequirements(buyersData || []);
      } catch (err) {
        console.error('Error fetching market data:', err);
        setError(t('error.dataUnavailable'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [t]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!farmerId) {
      setError('Farmer profile not found');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Get farmer's location from profile
      const { data: profile } = await supabase
        .from('farmer_profiles')
        .select('state, district, taluka, latitude, longitude')
        .eq('id', farmerId)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error: insertError } = await supabase
        .from('produce_listings')
        .insert({
          farmer_id: farmerId,
          product,
          quantity: parseFloat(quantity),
          unit,
          quality_grade: qualityGrade || null,
          expected_price: expectedPrice ? parseFloat(expectedPrice) : null,
          available_from: availableFrom,
          state: profile.state,
          district: profile.district,
          taluka: profile.taluka,
          latitude: profile.latitude,
          longitude: profile.longitude,
          pickup_delivery: pickupDelivery,
          status: 'active',
        });

      if (insertError) throw insertError;

      // Reset form
      setProduct('');
      setQuantity('');
      setUnit('kg');
      setQualityGrade('');
      setExpectedPrice('');
      setAvailableFrom('');
      setPickupDelivery('pickup');
      setShowForm(false);

      // Refresh listings
      const { data: updatedListings } = await supabase
        .from('produce_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setListings(updatedListings || []);
    } catch (err) {
      console.error('Error creating listing:', err);
      setError(t('general.error'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">{t('general.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('market.title')}</h1>

      {/* Post listing button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors mb-6"
      >
        {showForm ? t('general.cancel') : t('market.postListing')}
      </button>

      {/* Listing form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-4 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('market.product')} *
            </label>
            <input
              type="text"
              required
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('market.quantity')} *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('market.unit')} *
              </label>
              <select
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="kg">kg</option>
                <option value="quintal">quintal</option>
                <option value="ton">ton</option>
                <option value="piece">piece</option>
                <option value="dozen">dozen</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('market.quality')}
            </label>
            <input
              type="text"
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value)}
              placeholder="A, B, Premium, etc."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('market.expectedPrice')}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={expectedPrice}
              onChange={(e) => setExpectedPrice(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('market.availableFrom')} *
            </label>
            <input
              type="date"
              required
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('market.pickupDelivery')} *
            </label>
            <select
              required
              value={pickupDelivery}
              onChange={(e) => setPickupDelivery(e.target.value as 'pickup' | 'delivery' | 'both')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="pickup">{t('market.pickup')}</option>
              <option value="delivery">{t('market.delivery')}</option>
              <option value="both">{t('market.both')}</option>
            </select>
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-green-700 text-white font-semibold rounded-lg hover:bg-green-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? t('general.loading') : t('market.submit')}
          </button>
        </form>
      )}

      {/* My listings */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('market.myListings')}</h2>
      
      {listings.length === 0 ? (
        <p className="text-gray-600 mb-6">{t('market.noListings')}</p>
      ) : (
        <div className="space-y-4 mb-8">
          {listings.map((listing) => {
            const matches = matchListingToBuyers(listing, buyerRequirements);
            return (
              <div key={listing.id} className="bg-white rounded-lg border p-4 shadow-sm">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{listing.product}</h3>
                <div className="text-sm text-gray-700 space-y-1 mb-3">
                  <p>
                    <strong>{t('market.quantity')}:</strong> {listing.quantity} {listing.unit}
                  </p>
                  {listing.quality_grade && (
                    <p>
                      <strong>{t('market.quality')}:</strong> {listing.quality_grade}
                    </p>
                  )}
                  {listing.expected_price !== null && (
                    <p>
                      <strong>{t('market.expectedPrice')}:</strong> ₹{listing.expected_price}
                    </p>
                  )}
                  <p>
                    <strong>{t('market.availableFrom')}:</strong>{' '}
                    {new Date(listing.available_from).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>{t('market.pickupDelivery')}:</strong>{' '}
                    {listing.pickup_delivery === 'pickup' && t('market.pickup')}
                    {listing.pickup_delivery === 'delivery' && t('market.delivery')}
                    {listing.pickup_delivery === 'both' && t('market.both')}
                  </p>
                </div>

                {/* Buyer matches */}
                <BuyerMatchCard matchCount={matches.length} buyers={matches} />
              </div>
            );
          })}
        </div>
      )}

      {/* e-NAM section - clearly separated */}
      <div className="border-t-4 border-gray-300 pt-6 mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          {t('market.sellViaeNAM')}
        </h2>
        <p className="text-sm text-gray-700 mb-4">
          Electronic National Agriculture Market (e-NAM) provides formal electronic trading platform for agricultural commodities.
        </p>
        <a
          href="https://enam.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors"
        >
          🌐 Visit e-NAM Portal
        </a>
      </div>
    </div>
  );
}
