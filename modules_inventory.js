// ═══════════════════════════════════════
//  GASTRO POS — modules/inventory.js
// ═══════════════════════════════════════

function InventoryModule({ showToast }) {
  const [items,   setItems]   = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);

  useEffect(() => { dbGetAll('inventory').then(setItems); }, []);

  const reload = () => dbGetAll('inventory').then(setItems);

  const saveItem = async item => {
    await dbPut('inventory', item);
    await reload();
    setShowModal(false);
    setEditing(null);
    showToast(item.id ? 'Ítem actualizado ✓' : 'Ítem agregado ✓');
  };

  const deleteItem = async id => {
    await dbDelete('inventory', id);
    await reload();
    setShowModal(false);
    setEditing(null);
    showToast('Ítem eliminado');
  };

  const stockColor = item => {
    if (item.qty <= 0)             return '#e53935';
    if (item.qty <= item.minStock) return '#F28749';
    return '#027373';
  };

  return (
    <div className="scroll-content">
      <div style={{padding:'14px'}}>

        {/* RESUMEN */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'14px'}}>
          {[
            { label:'Total ítems', val: items.length,                             color:'var(--teal)' },
            { label:'Stock bajo',  val: items.filter(i=>i.qty<=i.minStock&&i.qty>0).length, color:'var(--orange)'},
            { label:'Agotados',    val: items.filter(i=>i.qty<=0).length,          color:'var(--wine)' },
          ].map(s => (
            <div key={s.label} style={{
              background:'#fff',borderRadius:'10px',padding:'10px',
              textAlign:'center',boxShadow:'0 1px 6px rgba(115,41,14,.07)'
            }}>
              <div style={{fontSize:'1.3rem',fontWeight:700,color:s.color}}>{s.val}</div>
              <div style={{fontSize:'.65rem',color:'var(--brown)'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* LISTA */}
        {items.length === 0 && (
          <div className="empty-state" style={{paddingTop:'40px'}}>
            <div className="icon">📦</div>
            <strong>Sin ítems</strong>
            <p>Agrega ingredientes o insumos</p>
          </div>
        )}

        {items.map(item => (
          <div key={item.id}
            onClick={() => { setEditing(item); setShowModal(true); }}
            style={{
              background:'#fff',borderRadius:'12px',padding:'12px 14px',
              marginBottom:'10px',boxShadow:'0 2px 8px rgba(115,41,14,.07)',
              cursor:'pointer',display:'flex',alignItems:'center',gap:'10px'
            }}
          >
            <div style={{
              width:'10px',height:'10px',borderRadius:'50%',
              background:stockColor(item),flexShrink:0
            }}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:'.9rem',color:'var(--dark)'}}>{item.name}</div>
              <div style={{fontSize:'.75rem',color:'var(--brown)'}}>{item.category}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontWeight:700,color:stockColor(item)}}>{item.qty} {item.unit}</div>
              <div style={{fontSize:'.7rem',color:'var(--brown)'}}>mín: {item.minStock}</div>
            </div>
          </div>
        ))}

        {/* BOTÓN AGREGAR */}
        <button className="btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}
          style={{marginTop:'8px'}}>
          ➕ Agregar ítem
        </button>
      </div>

      {/* MODAL */}
      {showModal && (
        <InventoryModal
          item={editing}
          onSave={saveItem}
          onDelete={deleteItem}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function InventoryModal({ item, onSave, onDelete, onClose }) {
  const [name,     setName]     = useState(item?.name      || '');
  const [category, setCategory] = useState(item?.category  || '');
  const [qty,      setQty]      = useState(item?.qty       ?? '');
  const [unit,     setUnit]     = useState(item?.unit      || 'und');
  const [minStock, setMinStock] = useState(item?.minStock  ?? 5);

  const handleSave = () => {
    if (!name.trim()) { alert('Ingresa el nombre'); return; }
    onSave({ ...(item||{}), name:name.trim(), category, qty:Number(qty), unit, minStock:Number(minStock) });
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <h2>{item ? '✏️ Editar ítem' : '📦 Nuevo ítem'}</h2>

        <div className="form-group">
          <label>Nombre</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Arroz"/>
        </div>
        <div className="form-group">
          <label>Categoría</label>
          <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Ej: Granos"/>
        </div>
        <div className="form-group">
          <label>Cantidad actual</label>
          <div className="price-row">
            <input type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="0"/>
            <select value={unit} onChange={e=>setUnit(e.target.value)}>
              {['und','kg','g','L','ml','bolsa','caja','paquete'].map(u=>(
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Stock mínimo (alerta)</label>
          <input type="number" value={minStock} onChange={e=>setMinStock(e.target.value)} placeholder="5"/>
        </div>

        <button className="btn-primary"   onClick={handleSave}>💾 Guardar</button>
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        {item && <button className="btn-danger" onClick={() => onDelete(item.id)}>🗑 Eliminar</button>}
      </div>
    </div>
  );
}