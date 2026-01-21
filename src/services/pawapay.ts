/**
 * Service PawaPay pour GOMACASCADE
 * Gère les paiements Mobile Money et Cartes Bancaires
 */

const PAWAPAY_API_URL = 'https://api.pawapay.io/v1';
const PAWAPAY_TOKEN = 'eyJraWQiOiIxIiwiYWxnIjoiRVMyNTYifQ.eyJ0dCI6IkFBVCIsInN1YiI6IjE1MzAxIiwibWF2IjoiMSIsImV4cCI6MjA4Mzk5MTQ0MSwiaWF0IjoxNzY4NDU4NjQxLCJwbSI6IkRBRixQQUYiLCJqdGkiOiI5MDVmMTA5Mi0zNDZlLTQwZTEtYTA3MC03MWI4ZDc4M2M2NjUifQ.EVB2IV4lA3h2moe0bFeC5yibJuoeDWwsYvUothJGTfDBx9Rcl9Z-WjnJsy1pLZDO-oZ9Rsuc-4dXq2ufpUR9uA';

export const pawapayService = {
  /**
   * Initie un paiement Mobile Money
   */
  initiatePayment: async (amount: number, phoneNumber: string, description: string) => {
    console.log(`Initiation du paiement PawaPay: ${amount}$ pour ${phoneNumber}`);

    try {
      const response = await fetch(`${PAWAPAY_API_URL}/deposits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAWAPAY_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          depositId: Math.random().toString(36).substring(7),
          amount: amount.toString(),
          currency: 'USD',
          country: 'CD',
          correspondent: phoneNumber.startsWith('081') || phoneNumber.startsWith('082') ? 'VODACOM_CD' : 'AIRTEL_CD',
          payer: {
            type: 'MSISDN',
            address: {
              value: phoneNumber
            }
          },
          customerTimestamp: new Date().toISOString(),
          statementDescription: description || "Achat GOMA-CONNECT"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur PawaPay');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur PawaPay:', error);
      throw error;
    }
  },

  /**
   * Vérifie le statut d'un paiement
   */
  checkStatus: async (depositId: string) => {
    try {
      const response = await fetch(`${PAWAPAY_API_URL}/deposits/${depositId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAWAPAY_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error('Impossible de vérifier le statut');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur vérification PawaPay:', error);
      throw error;
    }
  }
};
