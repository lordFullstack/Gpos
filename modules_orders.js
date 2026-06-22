// ═══════════════════════════════════════
//  GASTRO POS — modules/orders.js
// ═══════════════════════════════════════

function OrdersModule({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    dbGetAll('orders').then(data => {
      setOrders([...data].reverse()); // más recientes primero
    });
  }, []);

  const deleteOrder = async id => {
    await dbDelete('orders', id);
    setOrders(prev => prev.filter(o => o.id !== id));
    setSelected(null);
    showToast('Orden eliminada');
  };

  const fmt = iso => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })
      + ' ' + d.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
  };

  return (
    <div className="scroll-content">
      <div style={{padding:'14px'}}>

        {orders.length === 0 && (
          <div className="empty-state" style={{paddingTop:'60px'}}>
            <div className="icon">📋</div>
            <strong>Sin órdenes aún</strong>
            <p>Las ventas registradas aparecerán aquí</p>
          </div>
        )}

        {orders.map(o => (
          <div key={o.id}
            onClick={() => setSelected(o)}
            style={{
              background:'#fff',
              borderRadius:'12px',
              padding:'12px 14px',
              marginBottom:'10px',
              boxShadow:'0 2px 8px rgba(115,41,14,.07)',
              cursor:'pointer',
              borderLeft:'4px solid var(--teal)',
            }}
          >
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontWeight:700,fontSize:'.9rem',color:'var(--dark)'}}>
                Orden #{o.id}
              </span>
              <span style={{fontWeight:700,color:'var(--teal)'}}>
                ${Number(o.total).toLocaleString()}
              </span>
            </div>
            <div style={{fontSize:'.75rem',color:'var(--brown)',marginTop:'3px'}}>
              {fmt(o.date)} · {o.items.length} item(s)
            </div>
          </div>
        ))}
      </div>

      {/* DETALLE ORDEN */}
      {selected && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <div className="modal-handle"/>
            <h2>📋 Orden #{selected.id}</h2>
            <div style={{fontSize:'.78rem',color:'var(--brown)',marginBottom:'12px'}}>{fmt(selected.date)}</div>

            {selected.items.map(item => (
              <div key={item.key} style={{
                display:'flex',justifyContent:'space-between',
                padding:'8px 0',borderBottom:'1px solid var(--light)',
                fontSize:'.88rem',color:'var(--dark)'
              }}>
                <span>{item.product.name} <span style={{color:'var(--brown)'}}>({item.size})</span> x{item.qty}</span>
                <span style={{fontWeight:700}}>${(item.price*item.qty).toLocaleString()}</span>
              </div>
            ))}

            <div style={{
              display:'flex',justifyContent:'space-between',
              padding:'12px 0 4px',fontWeight:700,fontSize:'1rem',color:'var(--dark)'
            }}>
              <span>Total</span>
              <span style={{color:'var(--teal)'}}>${Number(selected.total).toLocaleString()}</span>
            </div>

            <button className="btn-secondary" onClick={() => setSelected(null)}>Cerrar</button>
            <button className="btn-danger"    onClick={() => deleteOrder(selected.id)}>🗑 Eliminar orden</button>
          </div>
        </div>
      )}
    </div>
  );
}