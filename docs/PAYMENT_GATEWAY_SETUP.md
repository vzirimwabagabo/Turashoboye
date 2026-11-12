# Turashoboye Institutional Payment Gateway Architecture & Setup

## 1. Zero-Exposure Security Model

In institutional e-commerce and banking systems, **no merchant private keys, API secrets, or credit card details are ever exposed to the frontend browser**. 

### Attack Vectors Prevented by this Architecture:
1. **Price Tampering:** A hacker cannot use DevTools to change the order price from `120,000 RWF` to `1 RWF`. The backend reads the order from the database server-side to calculate authoritative totals before contacting the gateway.
2. **Credential Theft:** Merchant private keys (`PAYPACK_CLIENT_SECRET`, `FLUTTERWAVE_SECRET_KEY`) are stored as **Supabase Server Secrets** inside the backend Edge Function runtime. They are inaccessible to browser inspection.
3. **Webhook Spoofing:** The backend verifies cryptographic HMAC signatures (`verif-hash` and `x-paypack-signature`) before releasing any order or updating receipt status.

---

## 2. Gateway Infrastructure

The system includes three backend Supabase Edge Functions:

| Edge Function | Path | Gateway Provider | Functionality |
| :--- | :--- | :--- | :--- |
| **`initiate-momo-push`** | `supabase/functions/initiate-momo-push` | **Paypack Rwanda** / MTN MoMo Open API | Reads authoritative DB order, authenticates with Paypack, triggers real USSD prompt on customer handset. |
| **`initiate-card-payment`** | `supabase/functions/initiate-card-payment` | **Flutterwave East Africa** | Initiates secure 3D-Secure Visa / Mastercard payment session in RWF, settling to Bank of Kigali (BK) or Equity Bank. |
| **`payment-webhook`** | `supabase/functions/payment-webhook` | Paypack & Flutterwave | Cryptographically verifies incoming payment notifications, settles orders in the database, and creates immutable audit logs. |

---

## 3. Registering Credentials

### A. Mobile Money (MTN MoMo & Airtel Money via Paypack Rwanda)
1. Register for an account at [https://paypack.rw](https://paypack.rw).
2. Complete KYC registration for Turashoboye Feed Mills Ltd.
3. In the Paypack Dashboard, navigate to **Developers > API Keys**.
4. Copy:
   - **Application ID** (`PAYPACK_CLIENT_ID`)
   - **Secret Key** (`PAYPACK_CLIENT_SECRET`)
5. Under **Webhooks**, set the callback endpoint to:
   `https://<your-supabase-project-ref>.supabase.co/functions/v1/payment-webhook`

### B. Visa & Mastercard (via Flutterwave East Africa)
1. Register for an account at [https://flutterwave.com](https://flutterwave.com).
2. Set settlement currency to **RWF (Rwandan Franc)** and add your **Bank of Kigali (BK)** or **Equity Bank Rwanda** account.
3. In the Flutterwave Dashboard, go to **Settings > API Keys & Webhooks**.
4. Copy:
   - **Secret Key** (`FLUTTERWAVE_SECRET_KEY`)
   - Define a secret webhook hash, e.g. `TurashoboyeSecureWebhookHash2026!` (`FLUTTERWAVE_SECRET_HASH`).
5. Under **Webhooks**, set the URL to:
   `https://<your-supabase-project-ref>.supabase.co/functions/v1/payment-webhook`

---

## 4. Setting Secrets in Supabase

Run the following commands using the Supabase CLI, or enter them in the **Supabase Dashboard > Project Settings > Edge Functions > Secrets**:

```bash
# Supabase Edge Functions Secrets
supabase secrets set PAYPACK_CLIENT_ID="your_paypack_client_id"
supabase secrets set PAYPACK_CLIENT_SECRET="your_paypack_client_secret"
supabase secrets set PAYPACK_WEBHOOK_SECRET="your_paypack_webhook_secret"

supabase secrets set FLUTTERWAVE_SECRET_KEY="FLWSECK-xxxxxxxxxxxxxxxxxxxx-X"
supabase secrets set FLUTTERWAVE_SECRET_HASH="TurashoboyeSecureWebhookHash2026!"
```

---

## 5. Live Mode vs. Sandbox Mode

- **Sandbox Test Mode (Default):** If the secrets are not yet added to the Supabase backend, the system operates in **Developer Sandbox Mode** (`🧪 DEV SANDBOX`). In this mode, depot staff can test checkout flows, enter test PINs, and verify receipts without deducting real money.
- **Live Gateway Mode:** As soon as valid secrets are stored in Supabase, the system automatically transitions to **Live Gateway Mode** (`🟢 LIVE GATEWAY`), sending actual USSD pushes to customer handsets and 3D-Secure Visa OTPs.
