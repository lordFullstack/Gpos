// ═══════════════════════════════════════
//  GASTRO POS — modules/pos.js
//  Módulo POS: catálogo + carrito
// ═══════════════════════════════════════

// ─── POS MODULE ───────────────────────
function POSModule({ addToCart, showToast }) {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat,  setActiveCat]  = useState('Todos');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCatModal,     setShowCatModal]     = useState(false);
  const [editProduct,      setEditProduct]      = useState(null);

  // Cargar datos
  useEffect(() => {
    dbGetAll('products').then(setProducts);
    dbGetAll('categories').then(cats => {
      if (cats.length === 0) {
        const defaults = ['Proteínas','Carbohidratos','Ensaladas','Bebidas'];
        Promise.all(defaults.map(n => dbPut('categories', { name: n })))
          .then(() => dbGetAll('categories').then(setCategories));
      } else {
        setCategories(cats);
      }
    });
  }, []);

  const reloadProducts   = () => dbGetAll('products').then(setProducts);
  const reloadCategories = () => dbGetAll('categories').then(setCategories);

  const handleAddToCart = (product, size) => {
    addToCart(product, size);
    showToast(`${product.name} agregado 🛒`);
  };

  const saveProduct = async p => {
    await dbPut('products', p);
    await reloadProducts();
    setShowProductModal(false);
    setEditProduct(null);
    showToast(p.id ? 'Producto actualizado ✓' : 'Producto creado ✓');
  };

  const deleteProduct = async id => {
    await dbDelete('products', id);
    await reloadProducts();
    setShowProductModal(false);
    setEditProduct(null);
    showToast('Producto eliminado');
  };

  const allCats  = ['Todos', ...categories.map(c => c.name)];
  const filtered = activeCat === 'Todos'
    ? products
    : products.filter(p => p.category === activeCat);

  return (
    <>
      {/* CATEGORÍAS */}
      <div className="cats">
        {allCats.map(c => (
          <button
            key={c}
            className={`cat-chip${activeCat === c ? ' active' : ''}`}
            onClick={() => setActiveCat(c)}
          >{c}</button>
        ))}
        <button
          className="cat-chip"
          style={{marginLeft:'auto',borderStyle:'dashed'}}
          onClick={() => setShowCatModal(true)}
        >⚙️</button>
      </div>

      {/* GRID DE PRODUCTOS */}
      <div className="scroll-content">
        <div className="grid">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={handleAddToCart}
              onEdit={() => { setEditProduct(p); setShowProductModal(true); }}
            />
          ))}

          {/* Botón agregar producto */}
          <button
            onClick={() => { setEditProduct(null); setShowProductModal(true); }}
            style={{
              background:'#fff',
              border:'2px dashed #d4b89a',
              borderRadius:'var(--radius)',
              minHeight:'180px',
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              justifyContent:'center',
              cursor:'pointer',
              color:'#BF6A39',
              gap:'6px',
              fontSize:'.82rem',
              fontWeight:600,
            }}
          >
            <span style={{fontSize:'2rem'}}>➕</span>
            Nuevo producto
          </button>

          {filtered.length === 0 && activeCat !== 'Todos' && (
            <div className="empty-state">
              <div className="icon">🍴</div>
              <strong>Sin productos en "{activeCat}"</strong>
              <p>Agrega uno con el botón ➕</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PRODUCTO */}
      {showProductModal && (
        <ProductModal
          product={editProduct}
          categories={categories}
          onSave={saveProduct}
          onDelete={deleteProduct}
          onClose={() => { setShowProductModal(false); setEditProduct(null); }}
        />
      )}

      {/* MODAL CATEGORÍAS */}
      {showCatModal && (
        <CatModal
          categories={categories}
          onSave={async name => {
            await dbPut('categories', { name });
            await reloadCategories();
          }}
          onDelete={async id => {
            await dbDelete('categories', id);
            await reloadCategories();
          }}
          onClose={() => setShowCatModal(false)}
        />
      )}
    </>
  );
}

// ─── PRODUCT CARD ─────────────────────
function ProductCard({ product, onAddToCart, onEdit }) {
  const hasBoth = product.pricePequeno && product.priceGrande;
  const [size, setSize] = useState(hasBoth ? 'Pequeño' : 'Grande');
  const price = size === 'Grande' ? product.priceGrande : product.pricePequeno;

  return (
    <div className="card">
      <div className="card-img-wrap">
        {product.image
          ? <img src={product.image} alt={product.name}/>
          : <div className="card-img-placeholder">🍽</div>
        }
        <button className="add-cart-btn" onClick={() => onAddToCart(product, size)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"
            strokeLinecap="round" style={{width:14,height:14}}>
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
      <div className="card-body">
        <div className="card-title-row">
          <span className="card-name">{product.name}</span>
          <span className="card-price">${Number(price || 0).toLocaleString()}</span>
        </div>
        <div className="card-cat">{product.category}</div>
        {hasBoth && (
          <div className="sizes">
            <button className={`size-btn${size==='Pequeño'?' selected':''}`} onClick={() => setSize('Pequeño')}>Pequeño</button>
            <button className={`size-btn${size==='Grande' ?' selected':''}`} onClick={() => setSize('Grande')}>Grande</button>
          </div>
        )}
        <button className="card-edit-btn" onClick={onEdit}>✏️ editar</button>
      </div>
    </div>
  );
}

// ─── PRODUCT MODAL ────────────────────
function ProductModal({ product, categories, onSave, onDelete, onClose }) {
  const [name,         setName]         = useState(product?.name         || '');
  const [category,     setCategory]     = useState(product?.category     || categories[0]?.name || '');
  const [pricePequeno, setPricePequeno] = useState(product?.pricePequeno || '');
  const [priceGrande,  setPriceGrande]  = useState(product?.priceGrande  || '');
  const [image,        setImage]        = useState(product?.image        || '');
  const fileRef = React.useRef();

  const handleImage = e => {
    const file = e.target.files[0];
    if (!file) return;
    // Redimensionar imagen antes de guardar
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 600;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setImage(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim())                    { alert('Ingresa el nombre del producto'); return; }
    if (!priceGrande && !pricePequeno)   { alert('Ingresa al menos un precio');     return; }
    onSave({
      ...(product || {}),
      name:         name.trim(),
      category,
      pricePequeno: pricePequeno ? Number(pricePequeno) : null,
      priceGrande:  priceGrande  ? Number(priceGrande)  : null,
      image,
    });
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <h2>{product ? '✏️ Editar producto' : '🆕 Nuevo producto'}</h2>

        {/* FOTO */}
        <div className="form-group">
          <label>Foto</label>
          <div className="img-upload" onClick={() => fileRef.current.click()}>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImage}/>
            {image
              ? <img src={image} alt="preview"/>
              : <div className="placeholder"><span className="icon">📷</span>Toca para foto o galería</div>
            }
          </div>
        </div>

        {/* NOMBRE */}
        <div className="form-group">
          <label>Nombre</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Bandeja Paisa"/>
        </div>

        {/* CATEGORÍA */}
        <div className="form-group">
          <label>Categoría</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        {/* PRECIOS */}
        <div className="form-group">
          <label>Precios (deja vacío si no aplica)</label>
          <div className="price-row">
            <input type="number" value={pricePequeno} onChange={e => setPricePequeno(e.target.value)} placeholder="Pequeño $"/>
            <input type="number" value={priceGrande}  onChange={e => setPriceGrande(e.target.value)}  placeholder="Grande $"/>
          </div>
        </div>

        <button className="btn-primary"   onClick={handleSave}>💾 Guardar</button>
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        {product && (
          <button className="btn-danger" onClick={() => onDelete(product.id)}>🗑 Eliminar producto</button>
        )}
      </div>
    </div>
  );
}

// ─── CATEGORY MODAL ───────────────────
function CatModal({ categories, onSave, onDelete, onClose }) {
  const [newCat, setNewCat] = useState('');

  const handleAdd = () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setNewCat('');
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle"/>
        <h2>🏷 Categorías</h2>

        <div className="cat-list">
          {categories.map(c => (
            <div key={c.id} className="cat-tag">
              {c.name}
              <button onClick={() => onDelete(c.id)}>✕</button>
            </div>
          ))}
        </div>

        <div style={{display:'flex', gap:'8px', marginBottom:'8px'}}>
          <input
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Nueva categoría"
            style={{
              flex:1, padding:'10px 12px',
              border:'1.5px solid #d4b89a',
              borderRadius:'10px', fontSize:'.9rem', outline:'none'
            }}
          />
          <button className="btn-primary" style={{width:'auto',padding:'10px 18px',marginTop:0}} onClick={handleAdd}>
            +
          </button>
        </div>

        <button className="btn-secondary" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}