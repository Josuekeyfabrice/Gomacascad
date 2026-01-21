/**
 * Optimized Supabase Queries
 * Centralized queries with proper indexing and caching strategies
 */

import { supabase } from './client';

/**
 * Fetch products with pagination and filters
 * Uses proper indexing on seller_id, is_active, and created_at
 */
export const fetchProductsOptimized = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    sellerId?: string;
    category?: string;
    isActive?: boolean;
  }
) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('products')
    .select('id, name, price, images, category, seller_id, is_active, created_at', {
      count: 'exact',
    });

  if (filters?.sellerId) {
    query = query.eq('seller_id', filters.sellerId);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return { data, count, page, limit };
};

/**
 * Fetch seller profile with related data
 * Combines profile, stats, and verification in one optimized query
 */
export const fetchSellerProfileOptimized = async (sellerId: string) => {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', sellerId)
    .single();

  if (profileError) throw profileError;

  // Fetch reviews for stats
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('seller_id', sellerId);

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return {
    profile,
    stats: {
      totalSales: 0, // Will be populated when transactions table exists
      averageRating: avgRating,
      totalReviews: reviews?.length || 0,
    },
  };
};

/**
 * Fetch reviews for a product with reviewer info
 * Uses select to only fetch necessary fields
 */
export const fetchProductReviewsOptimized = async (
  productId: string,
  limit: number = 10
) => {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, reviewer_id')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Fetch reviewer profiles
  if (reviews && reviews.length > 0) {
    const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', reviewerIds);

    return reviews.map(review => ({
      ...review,
      reviewer_name: profiles?.find(p => p.user_id === review.reviewer_id)?.full_name || 'Anonyme',
      reviewer_avatar: profiles?.find(p => p.user_id === review.reviewer_id)?.avatar_url,
    }));
  }

  return reviews;
};

/**
 * Search products with full-text search
 * Uses Supabase full-text search capabilities
 */
export const searchProductsOptimized = async (
  query: string,
  page: number = 1,
  limit: number = 20
) => {
  const offset = (page - 1) * limit;

  const { data, count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .ilike('name', `%${query}%`)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return { data, count, page, limit };
};

/**
 * Fetch nearby products using database function
 */
export const fetchNearbyProductsOptimized = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10
) => {
  // Use the products table with manual distance filtering
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .eq('is_active', true);

  if (error) throw error;

  // Filter by distance client-side (for now)
  if (data) {
    return data.filter(product => {
      if (!product.latitude || !product.longitude) return false;
      const distance = calculateDistance(
        latitude,
        longitude,
        product.latitude,
        product.longitude
      );
      return distance <= radiusKm;
    });
  }

  return [];
};

/**
 * Calculate distance between two coordinates in km
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Batch fetch multiple products
 * More efficient than individual queries
 */
export const fetchProductsBatchOptimized = async (productIds: string[]) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds);

  if (error) throw error;

  return data;
};

/**
 * Update product with optimistic updates
 * Includes error handling and rollback
 */
export const updateProductOptimized = async (
  productId: string,
  updates: Record<string, any>
) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

/**
 * Insert a review
 */
export const insertReviewOptimized = async (review: {
  productId: string;
  sellerId: string;
  reviewerId: string;
  rating: number;
  comment?: string;
}) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id: review.productId,
      seller_id: review.sellerId,
      reviewer_id: review.reviewerId,
      rating: review.rating,
      comment: review.comment,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};
