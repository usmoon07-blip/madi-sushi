import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatDate } from '../format.js';

export default function Reviews() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .reviews()
      .then((d) => setList(d.reviews))
      .catch((e) => setError(e.message));
  }, []);

  const avg = list?.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : null;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Otzivlar</h1>
          <p className="muted">Mijozlar Mini App → Profil → «Otziv qoldirish» orqali yozadi. Yangi otziv Telegramga ham keladi</p>
        </div>
        {avg && (
          <div className="stat stat--accent">
            <span className="stat__label">O'rtacha baho ({list.length} ta)</span>
            <span className="stat__value">⭐ {avg}</span>
          </div>
        )}
      </div>
      {error && <div className="error">{error}</div>}
      <div className="reviews">
        {list?.map((r) => (
          <div key={r.id} className="box review-item">
            <div className="row-between">
              <div>
                <div className="strong">
                  {[r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ')}
                  {r.user?.username && (
                    <a className="muted small" href={`https://t.me/${r.user.username}`} target="_blank" rel="noreferrer">
                      {' '}
                      @{r.user.username}
                    </a>
                  )}
                </div>
                <div className="muted small">
                  {formatDate(r.createdAt)}
                  {r.user?.phone ? ` · ${r.user.phone}` : ''}
                </div>
              </div>
              <div className="review-stars">{'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}</div>
            </div>
            {r.text && <p className="review-text">{r.text}</p>}
          </div>
        ))}
        {list && !list.length && <div className="empty">Hali otzivlar yo'q</div>}
        {!list && !error && <div className="empty">Yuklanmoqda...</div>}
      </div>
    </div>
  );
}
