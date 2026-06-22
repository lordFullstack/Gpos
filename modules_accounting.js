// ═══════════════════════════════════════
//  GASTRO POS — modules/accounting.js
//  Caja diaria · Gastos · Proveedores
// ═══════════════════════════════════════

function AccountingModule({ showToast }) {
  const [tab, setTab] = useState('caja'); // caja | gastos | proveedores

  const tabs = [
    { id:'caja',        label:'💵 Caja'        },
    { id:'gastos',      label:'🧾 Gastos'      },
    { id:'proveedores', label:'🏭 Proveedores' },
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      {/* TABS */}
      <div style={{
        display:'flex',gap:'6px',padding:'10px 14px',
        background:'#fff',borderBottom:'2px solid var(--light)',flexShrink:0
      }}>
        {tabs.map(t => (
          <button key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex:1,padding:'7px 4px',borderRadius:'10px',border:'none',
              background: tab===t.id ? 'var(--teal)' : 'var(--light)',
              color: tab===t.id ? '#fff' : 'var(--dark)',
              fontWeight:600,fontSize:'.72rem',cursor:'pointer'
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* CONTENIDO */}
      <div className="scroll-content" style={{flex:1}}>
        {tab==='caja'        && <CajaTab        showToast={showToast}/>}
        {tab==='gastos'      && <GastosTab      showToast={showToast}/>}
        {tab==='proveedores' && <ProveedoresTab showToast={showToast}/>}
      </div>
    </div>
  );
}

// ─── CAJA DIARIA ──────────────────────
function CajaTab({ showToast }) {
  const [log,        setLog]        = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [apertura,   setApertura]   = useState('');
  const [showModal,  setShowModal]  = useState(false);

  const today = new Date().toISOString().slice(0,10);

  useEffect(() => {
    dbGetAll('cashlog').then(setLog);
    dbGetAll('orders').then(setOrders);
  }, []);

  const todayOrders  = orders.filter(o => o.date?.slice(0,10) === today);
  const totalVentas  = todayOrders.reduce((s,o) => s+o.total, 0);
  const todayLog     = log.find(l => l.date === today);
  const cierre       = todayLog ? (todayLog.apertura + totalVentas) : null;

  const guardarApertura = async () => {
    if (!apertura) return;
    await dbPut('cashlog', { ...(todayLog||{}), date:today, apertura:Number(apertura) });
    dbGetAll('cashlog').then(setLog);
    setShowModal(false);
    showToast('Apertura de caja guardada ✓');
  };

  return (
    <div style={{padding:'14px'}}>
      {/* RESUMEN HOY */}
      <div style={{
        background:'var(--teal)',borderRadius:'14px',padding:'18px',
        color:'#fff',marginBottom:'14px'
      }}>
        <div style={{fontSize:'.78rem',opacity:.8,marginBottom:'4px'}}>Resumen de hoy · {today}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginTop:'8px'}}>
          {[
            { label:'Apertura',  val: todayLog ? `$${Number(todayLog.apertura).toLocaleString()}` : '—' },
            { label:'Ventas',    val: `$${totalVentas.toLocaleString()}` },
            { label:'Órdenes',   val: todayOrders.length },
            { label:'Cierre est.', val: cierre!==null ? `$${cierre.toLocaleString()}` : '—' },
          ].map(s => (
            <div key={s.label}>
              <div style={{fontSize:'.7rem',opacity:.75}}>{s.label}</div>
              <div style={{fontWeight:700,fontSize:'1rem'}}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-orange" onClick={() => setShowModal(true)}>
        💵 {todayLog ? 'Actualizar apertura' : 'Registrar apertura de caja'}
      </button>

      {/* HISTORIAL */}
      <div style={{marginTop:'18px'}}>
        <div style={{fontWeight:700,fontSize:'.9rem',color:'var(--dark)',marginBottom:'8px'}}>Historial</div>
        {log.length === 0 && <div style={{color:'var(--brown)',fontSize:'.82rem'}}>Sin registros aún</div>}
        {[...log].reverse().map(l => (
          <div key={l.id} style={{
            background:'#fff',borderRadius:'10px',padding:'11px 13px',
            marginBottom:'8px',boxShadow:'0 1px 6px rgba(115,41,14,.07)',
            display:'flex',justifyContent:'space-between'
          }}>
            <div>
              <div style={{fontWeight:600,fontSize:'.88rem',color:'var(--dark)'}}>{l.date}</div>
              <div style={{fontSize:'.72rem',color:'var(--brown)'}}>Apertura: ${Number(l.apertura).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-handle"/>
            <h2>💵 Apertura de caja — {today}</h2>
            <div className="form-group">
              <label>Monto de apertura ($)</label>
              <input type="number" value={apertura} onChange={e=>setApertura(e.target.value)}
                placeholder="Ej: 50000" autoFocus/>
            </div>
            <button className="btn-primary"   onClick={guardarApertura}>Guardar</button>
            <button className="btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GASTOS ───────────────────────────
function GastosTab({ showToast }) {
  const [gastos,    setGastos]    = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);

  useEffect(() => { dbGetAll('expenses').then(data => setGastos([...data].reverse())); }, []);
  const reload = () => dbGetAll('expenses').then(data => setGastos([...data].reverse()));

  const saveGasto = async g => {
    await dbPut('expenses', g);
    await reload();
    setShowModal(false);
    setEditing(null);
    showToast(g.id ? 'Gasto actualizado ✓' : 'Gasto registrado ✓');
  };
  const deleteGasto = async id => {
    await dbDelete('expenses', id);
    await reload();
    setShowModal(false);
    setEditing(null);
    showToast('Gasto eliminado');
  };

  const totalMes = gastos
    .filter(g => g.date?.slice(0,7) === new Date().toISOString().slice(0,7))
    .reduce((s,g) => s+Number(g.amount), 0);

  return (
    <div style={{padding:'14px'}}>
      <div style={{
        background:'var(--wine)',borderRadius:'12px',padding:'14px',
        color:'#fff',marginBottom:'14px',display:'flex',justifyContent:'space-between'
      }}>
        <div>
          <div style={{fontSize:'.72rem',opacity:.8}}>Gastos del mes</div>
          <div style={{fontWeight:700,fontSize:'1.2rem'}}>${totalMes.toLocaleString()}</div>
        </div>
        <span style={{fontSize:'2rem'}}>🧾</span>
      </div>

      <button className="btn-primary" onClick={()=>{setEditing(null);setShowModal(true)}} style={{marginBottom:'14px'}}>
        ➕ Registrar gasto
      </button>

      {gastos.map(g => (
        <div key={g.id}
          onClick={()=>{setEditing(g);setShowModal(true)}}
          style={{
            background:'#fff',borderRadius:'10px',padding:'11px 13px',
            marginBottom:'8px',boxShadow:'0 1px 6px rgba(115,41,14,.07)',
            cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'
          }}
        >
          <div>
            <div style={{fontWeight:600,fontSize:'.88rem',color:'var(--dark)'}}>{g.description}</div>
            <div style={{fontSize:'.72rem',color:'var(--brown)'}}>{g.category} · {g.date}</div>
          </div>
          <div style={{fontWeight:700,color:'var(--wine)'}}>${Number(g.amount).toLocaleString()}</div>
        </div>
      ))}

      {showModal && (
        <GastoModal
          gasto={editing}
          onSave={saveGasto}
          onDelete={deleteGasto}
          onClose={()=>{setShowModal(false);setEditing(null)}}
        />
      )}
    </div>
  );
}

function GastoModal({ gasto, onSave, onDelete, onClose }) {
  const [description, setDescription] = useState(gasto?.description || '');
  const [amount,      setAmount]      = useState(gasto?.amount      || '');
  const [category,    setCategory]    = useState(gasto?.category    || 'Insumos');
  const [date,        setDate]        = useState(gasto?.date        || new Date().toISOString().slice(0,10));

  const handleSave = () => {
    if (!description.trim()) { alert('Ingresa la descripción'); return; }
    if (!amount)              { alert('Ingresa el monto');       return; }
    onSave({ ...(gasto||{}), description:description.trim(), amount:Number(amount), category, date });
  };

  const cats = ['Insumos','Servicios','Nómina','Arriendo','Mantenimiento','Otro'];

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <h2>{gasto ? '✏️ Editar gasto' : '🧾 Nuevo gasto'}</h2>
        <div className="form-group">
          <label>Descripción</label>
          <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Ej: Compra de aceite"/>
        </div>
        <div className="form-group">
          <label>Monto ($)</label>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"/>
        </div>
        <div className="form-group">
          <label>Categoría</label>
          <select value={category} onChange={e=>setCategory(e.target.value)}>
            {cats.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Fecha</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
        </div>
        <button className="btn-primary"   onClick={handleSave}>💾 Guardar</button>
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        {gasto && <button className="btn-danger" onClick={()=>onDelete(gasto.id)}>🗑 Eliminar</button>}
      </div>
    </div>
  );
}

// ─── PROVEEDORES ──────────────────────
function ProveedoresTab({ showToast }) {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);

  useEffect(() => { dbGetAll('suppliers').then(setSuppliers); }, []);
  const reload = () => dbGetAll('suppliers').then(setSuppliers);

  const saveSupplier = async s => {
    await dbPut('suppliers', s);
    await reload();
    setShowModal(false);
    setEditing(null);
    showToast(s.id ? 'Proveedor actualizado ✓' : 'Proveedor agregado ✓');
  };
  const deleteSupplier = async id => {
    await dbDelete('suppliers', id);
    await reload();
    setShowModal(false);
    setEditing(null);
    showToast('Proveedor eliminado');
  };

  const totalDeuda = suppliers.reduce((s,p) => s+Number(p.debt||0), 0);

  return (
    <div style={{padding:'14px'}}>
      <div style={{
        background:'var(--brown)',borderRadius:'12px',padding:'14px',
        color:'#fff',marginBottom:'14px',display:'flex',justifyContent:'space-between'
      }}>
        <div>
          <div style={{fontSize:'.72rem',opacity:.8}}>Deuda total proveedores</div>
          <div style={{fontWeight:700,fontSize:'1.2rem'}}>${totalDeuda.toLocaleString()}</div>
        </div>
        <span style={{fontSize:'2rem'}}>🏭</span>
      </div>

      <button className="btn-primary" onClick={()=>{setEditing(null);setShowModal(true)}} style={{marginBottom:'14px'}}>
        ➕ Agregar proveedor
      </button>

      {suppliers.map(s => (
        <div key={s.id}
          onClick={()=>{setEditing(s);setShowModal(true)}}
          style={{
            background:'#fff',borderRadius:'10px',padding:'11px 13px',
            marginBottom:'8px',boxShadow:'0 1px 6px rgba(115,41,14,.07)',
            cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'
          }}
        >
          <div>
            <div style={{fontWeight:600,fontSize:'.88rem',color:'var(--dark)'}}>{s.name}</div>
            <div style={{fontSize:'.72rem',color:'var(--brown)'}}>{s.phone||'Sin teléfono'}</div>
          </div>
          <div style={{
            fontWeight:700,
            color: Number(s.debt)>0 ? 'var(--wine)' : 'var(--teal)'
          }}>
            {Number(s.debt)>0 ? `-$${Number(s.debt).toLocaleString()}` : '✓ Al día'}
          </div>
        </div>
      ))}

      {suppliers.length===0 && (
        <div className="empty-state" style={{paddingTop:'30px'}}>
          <div className="icon">🏭</div>
          <strong>Sin proveedores</strong>
          <p>Agrega tus proveedores y controla deudas</p>
        </div>
      )}

      {showModal && (
        <SupplierModal
          supplier={editing}
          onSave={saveSupplier}
          onDelete={deleteSupplier}
          onClose={()=>{setShowModal(false);setEditing(null)}}
        />
      )}
    </div>
  );
}

function SupplierModal({ supplier, onSave, onDelete, onClose }) {
  const [name,    setName]    = useState(supplier?.name    || '');
  const [phone,   setPhone]   = useState(supplier?.phone   || '');
  const [product, setProduct] = useState(supplier?.product || '');
  const [debt,    setDebt]    = useState(supplier?.debt    ?? '');

  const handleSave = () => {
    if (!name.trim()) { alert('Ingresa el nombre'); return; }
    onSave({ ...(supplier||{}), name:name.trim(), phone, product, debt:Number(debt||0) });
  };

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <h2>{supplier ? '✏️ Editar proveedor' : '🏭 Nuevo proveedor'}</h2>
        <div className="form-group">
          <label>Nombre</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Distribuidora La 14"/>
        </div>
        <div className="form-group">
          <label>Teléfono</label>
          <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="300 000 0000"/>
        </div>
        <div className="form-group">
          <label>Producto/servicio</label>
          <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Ej: Carnes, Lácteos"/>
        </div>
        <div className="form-group">
          <label>Deuda actual ($)</label>
          <input type="number" value={debt} onChange={e=>setDebt(e.target.value)} placeholder="0"/>
        </div>
        <button className="btn-primary"   onClick={handleSave}>💾 Guardar</button>
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        {supplier && <button className="btn-danger" onClick={()=>onDelete(supplier.id)}>🗑 Eliminar</button>}
      </div>
    </div>
  );
}