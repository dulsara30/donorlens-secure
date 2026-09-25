const PAYHERE_CHECKOUT_URL = "https://sandbox.payhere.lk/pay/checkout";

export function PayHereHiddenForm({
  checkout,
  firstName,
  lastName,
  email,
  phone,
  address,
  city,
  formRef,
}) {
  if (!checkout) return null;

  return (
    <form
      ref={formRef}
      method="post"
      action={PAYHERE_CHECKOUT_URL}
      style={{ display: "none" }}
    >
      <input type="hidden" name="merchant_id" value={checkout.merchant_id} />
      <input type="hidden" name="return_url" value={checkout.return_url} />
      <input type="hidden" name="cancel_url" value={checkout.cancel_url} />
      <input type="hidden" name="notify_url" value={checkout.notify_url} />
      <input type="hidden" name="order_id" value={checkout.order_id} />
      <input type="hidden" name="items" value={checkout.items} />
      <input type="hidden" name="currency" value={checkout.currency} />
      <input type="hidden" name="amount" value={checkout.amount} />
      <input type="hidden" name="first_name" value={firstName} />
      <input type="hidden" name="last_name" value={lastName} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="address" value={address} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="country" value="Sri Lanka" />
      <input type="hidden" name="hash" value={checkout.hash} />
    </form>
  );
}
