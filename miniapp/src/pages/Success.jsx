import { useEffect } from 'react';
import { CheckIcon } from '../components/Icons.jsx';
import { closeApp, isTelegram } from '../telegram.js';
import { money } from '../format.js';

export default function Success({ order, onDone }) {
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
      <h2>Buyurtma qabul qilindi!</h2>
      <p>
        Buyurtma raqami <b>#{order.id}</b> · {money(order.total)}
      </p>
      <p className="muted">
        {order.deliveryType === 'DELIVERY'
          ? "Kuryerimiz tez orada siz bilan bog'lanadi. Tafsilotlar botga yuborildi."
          : "Buyurtma tayyor bo'lganda botga xabar keladi."}
      </p>
      <button type="button" className="btn btn--ghost" onClick={isTelegram ? closeApp : onDone}>
        {isTelegram ? 'Yopish' : 'Menyuga qaytish'}
      </button>
    </div>
  );
}
