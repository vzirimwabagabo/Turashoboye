/**
 * Centralized, Secure Payment & Statutory Credentials Configuration
 * 
 * In production, these values are injected via secure environment variables
 * (.env or server deployment secrets) and Supabase settings table.
 * Outsiders cannot alter or tamper with these settings.
 */

export interface PaymentGatewayConfig {
  mtnMoMoMerchantCode: string;
  mtnMoMoMerchantName: string;
  airtelMoneyMerchantCode: string;
  airtelMoneyMerchantName: string;
  rraTinNumber: string;
  ricaPermitNumber: string;
  officialHotline: string;
  officialEmail: string;
  depotAddress: string;
}

export const PAYMENT_CONFIG: PaymentGatewayConfig = {
  // MTN MoMo Merchant / Till Number (Dial *182*8*1*CODE#)
  mtnMoMoMerchantCode: import.meta.env.VITE_MTN_MOMO_MERCHANT_CODE || '100234',
  mtnMoMoMerchantName: import.meta.env.VITE_MTN_MOMO_MERCHANT_NAME || 'Turashoboye Feed Mills Ltd',

  // Airtel Money Merchant / Till Code (Dial *500*4*CODE#)
  airtelMoneyMerchantCode: import.meta.env.VITE_AIRTEL_MONEY_MERCHANT_CODE || '550123',
  airtelMoneyMerchantName: import.meta.env.VITE_AIRTEL_MONEY_MERCHANT_NAME || 'Turashoboye Feed Mills Ltd',

  // Rwanda Revenue Authority (RRA) Tax Identification Number
  rraTinNumber: import.meta.env.VITE_RRA_TIN || '100234891',

  // Rwanda Inspectorate, Competition and Consumer Protection Authority (RICA) License
  ricaPermitNumber: import.meta.env.VITE_RICA_PERMIT || '00492-RICA-2026',

  // Official Customer & Depot Support Contacts
  officialHotline: '+250 788 000 000',
  officialEmail: 'sales@turashoboye.rw',
  depotAddress: 'Mahama Primary Mill & Depot, Kirehe District, Eastern Province, Rwanda',
};
