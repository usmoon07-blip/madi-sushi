import { useEffect } from 'react';
import { CheckIcon } from '../components/Icons.jsx';
import { closeApp, isTelegram } from '../telegram.js';
import { useT } from '../i18n.jsx';

export default function Success({ order, onDone }) {
  const { t, money } = useT();
  useEffect(() => {
    if (!isTelegram) return undefined;
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
      <button type="button" className="btn btn--ghost" onClick={isTelegram ? closeApp : onDone}>
        {isTelegram ? t('close') : t('backToMenu')}
      </button>
    </div>
  );
}
