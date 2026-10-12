import { useEffect } from 'react';
import { CheckIcon } from '../components/Icons.jsx';
import { closeApp, isTelegram } from '../telegram.js';
import { useT } from '../i18n.jsx';

export default function Success({ order, onDone }) {
  const { t, money } = useT();
  const isCard = order.paymentType === 'CARD';
  useEffect(() => {
    // Karta to'lovida mijoz chek haqidagi xabarni o'qishi kerak — avtomatik yopilmaydi
    if (!isTelegram || isCard) return undefined;
    const t = setTimeout(closeApp, 2800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="success">
      <div className="success__ring">
        <CheckIcon width={44} height={44} />
      </div>
      <h2>{t('successTitle')}</h2>
      <p>
        {t('orderNo')} <b>#{order.id}</b> · {money(order.total)}
      </p>
      <p className="muted">{order.deliveryType === 'DELIVERY' ? t('successDelivery') : t('successPickup')}</p>
      {isCard && (
        <div className="receipt-box">
          <div className="receipt-box__title">📸 {t('receiptTitle')}</div>
          <p>{t('receiptText', money(order.total))}</p>
        </div>
      )}
      {isCard && isTelegram ? (
        <button type="button" className="btn btn--primary" onClick={closeApp}>
          {t('receiptBtn')}
        </button>
      ) : (
        <button type="button" className="btn btn--ghost" onClick={isTelegram ? closeApp : onDone}>
          {isTelegram ? t('close') : t('backToMenu')}
        </button>
      )}
    </div>
  );
}
