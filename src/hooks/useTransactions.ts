import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface Transaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
  payment_method: string | null;
  escrow_status: 'waiting' | 'held' | 'released' | 'refunded';
  created_at: string;
  updated_at: string;
}

export const useTransactions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTransaction = useCallback(async (
    buyerId: string,
    sellerId: string,
    productId: string,
    amount: number,
    paymentMethod: string = 'Mobile Money'
  ): Promise<Transaction | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            buyer_id: buyerId,
            seller_id: sellerId,
            product_id: productId,
            amount,
            payment_method: paymentMethod,
            status: 'pending',
            escrow_status: 'waiting'
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data as Transaction;
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmPayment = useCallback(async (transactionId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'paid',
          escrow_status: 'held'
        })
        .eq('id', transactionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error confirming payment:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmDelivery = useCallback(async (transactionId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          escrow_status: 'released'
        })
        .eq('id', transactionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error confirming delivery:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelTransaction = useCallback(async (transactionId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'cancelled',
          escrow_status: 'refunded'
        })
        .eq('id', transactionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error cancelling transaction:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const disputeTransaction = useCallback(async (transactionId: string, reason: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'disputed'
        })
        .eq('id', transactionId);

      if (error) throw error;

      // Optionnel: Créer un rapport de litige
      await supabase.from('reports').insert([{
        reporter_id: (await supabase.auth.getUser()).data.user?.id,
        reason: 'Transaction Dispute',
        description: `Dispute for transaction ${transactionId}: ${reason}`,
        status: 'pending'
      }]);

      return true;
    } catch (err: any) {
      console.error('Error disputing transaction:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactions = useCallback(async (userId: string): Promise<Transaction[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          product:products(*)
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Transaction & { product: any })[];
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createTransaction,
    confirmPayment,
    confirmDelivery,
    cancelTransaction,
    disputeTransaction,
    getTransactions,
  };
};
