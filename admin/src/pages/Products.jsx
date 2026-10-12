import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { money } from '../format.js';
import Modal from '../components/Modal.jsx';
import ProductForm from '../components/ProductForm.jsx';

export default function Products() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [category, setCategory] = useState('');

  const load = () =>
    api
      .products()
      .then((d) => setProducts(d.products))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => [...new Set((products || []).map((p) => p.category))], [products]);
  const list = (products || []).filter((p) => !category || p.category === category);

  const toggle = async (p) => {
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, isActive: !p.isActive } : x)));
    try {
      await api.updateProduct(p.id, { isActive: !p.isActive });
    } catch (e) {
      alert(e.message);
      load();
    }
  };

  const remove = async (p) => {
    if (!confirm(`"${p.name}" butunlay o'chirilsinmi?\n\nVaqtincha yashirish uchun "Faol" tugmasini o'chiring.`)) return;
    try {
      await api.deleteProduct(p.id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Mahsulotlar</h1>
          <p className="muted">Faolsizlantirilgan mahsulotlar mijozlarga ko'rinmaydi</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
          + Yangi mahsulot
        </button>
      </div>

      <div className="tabs">
        {['', ...categories].map((c) => (
          <button key={c || 'all'} type="button" className={`tab ${category === c ? 'is-active' : ''}`} onClick={() => setCategory(c)}>
            {c || 'Hammasi'}
          </button>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Rasm</th>
              <th>Nomi</th>
              <th>Kategoriya</th>
              <th>Narx</th>
              <th>Holat</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className={p.isActive ? '' : 'row--inactive'}>
                <td>
                  <div className="thumb">{p.imageUrl ? <img src={p.imageUrl} alt="" /> : '🍣'}</div>
                </td>
                <td>
                  <div className="strong">{p.name}</div>
                  <div className="muted small clamp">{p.description}</div>
                </td>
                <td>
                  <span className="tag">{p.category}</span>
                </td>
                <td className="nowrap">
                  <div className="strong text-red">{money(p.price)}</div>
                  {p.oldPrice && <div className="muted small strike">{money(p.oldPrice)}</div>}
                </td>
                <td>
                  <button type="button" className={`toggle ${p.isActive ? 'is-on' : ''}`} onClick={() => toggle(p)}>
                    <span className="toggle__knob" />
                    {p.isActive ? 'Faol' : 'Nofaol'}
                  </button>
                </td>
                <td className="nowrap actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(p)}>
                    ✎ Tahrirlash
                  </button>
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(p)}>
                    O'chirish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products && !list.length && <div className="empty">Mahsulotlar yo'q</div>}
        {!products && !error && <div className="empty">Yuklanmoqda...</div>}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Yangi mahsulot' : 'Mahsulotni tahrirlash'} onClose={() => setEditing(null)}>
          <ProductForm
            product={editing === 'new' ? null : editing}
            categories={categories}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              load();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
