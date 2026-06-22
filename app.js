// ═══════════════════════════════════════
//  GASTRO POS — app.js
//  Layout principal + navegación sidebar
// ═══════════════════════════════════════

const { useState, useEffect, useCallback } = React;

// ─── ÍCONOS SVG ──────────────────────
const CartSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.72l1.18-9.28H6"/>
  </svg>
);

// ─── NAVEGACIÓN ──────────────────────
const NAV = [
  { id: 'pos',        icon: '🍽',  label: 'POS'    },
  { id: 'orders',     icon: '📋',  label: 'Órdenes'},
  { id: 'inventory',  icon: '📦',  label: 'Inv.'   },
  { id: 'accounting', icon: '💰',  label: 'Contab.'},
  { id: 'reports',    icon: '📊',  label: 'Report.'},
];

// ─── CART CONTEXT (estado global) ────
function useCart() {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((product, size) => {
    const price = size === 'Grande' ? product.priceGrande : product.pricePequeno;
    const key   = `${product.id}-${size}`;
    setCart(prev => {
      const ex = prev.find(i => i.key === key);
      if (ex) return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { key, product, size, price, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((key, delta) => {
    setCart(prev =>
      prev.map(i => i.key === key ? { ...i, qty: i.qty + delta } : i)
          .filter(i => i.qty > 0)
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return { cart, addToCart, updateQty, clearCart, cartCount, cartTotal };
}

// ─── TOAST HOOK ───────────────────────
function useToast() {
  const [toast, setToast]   = useState('');
  const [toastKey, setKey]  = useState(0);

  const showToast = useCallback(msg => {
    setToast(msg);
    setKey(k => k + 1);
    setTimeout(() => setToast(''), 2200);
  }, []);

  return { toast, toastKey, showToast };
}

// ─── APP PRINCIPAL ────────────────────
function App() {
  const [activeModule, setActiveModule] = useState('pos');
  const { cart, addToCart, updateQty, clearCart, cartCount, cartTotal } = useCart();
  const { toast, toastKey, showToast } = useToast();
  const [showCart, setShowCart] = useState(false);

  // Título del módulo activo
  const moduleTitle = NAV.find(n => n.id === activeModule)?.label || 'Gastro POS';

  // Renderiza el módulo activo
  const renderModule = () => {
    switch (activeModule) {
      case 'pos':
        return (
          <POSModule
            addToCart={addToCart}
            showToast={showToast}
          />
        );
      case 'orders':
        return <OrdersModule showToast={showToast}/>;
      case 'inventory':
        return <InventoryModule showToast={showToast}/>;
      case 'accounting':
        return <AccountingModule showToast={showToast}/>;
      case 'reports':
        return <ReportsModule/>;
      default:
        return null;
    }
  };

  return (
    <div className="app-layout">

      {/* SIDEBAR */}
      <nav className="sidebar">
        <div className="sidebar-logo">🍴</div>
        {NAV.map(item => (
          <button
            key={item.id}
            className={`nav-item${activeModule === item.id ? ' active' : ''}`}
            onClick={() => setActiveModule(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <div className="main">

        {/* TOPBAR */}
        <div className="topbar">
          <span className="topbar-title">{moduleTitle}</span>
          <div className="topbar-actions">
            {activeModule === 'pos' && (
              <button className="cart-btn" onClick={() => setShowCart(true)}>
                <CartSVG/>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
            )}
          </div>
        </div>

        {/* MÓDULO ACTIVO */}
        {renderModule()}

      </div>

      {/* PANEL CARRITO */}
      {showCart && (
        <CartPanel
          cart={cart}
          total={cartTotal}
          onUpdateQty={updateQty}
          onClose={() => setShowCart(false)}
          onCheckout={async () => {
            if (cart.length === 0) return;
            // Guardar orden en IndexedDB
            await dbPut('orders', {
              items: cart,
              total: cartTotal,
              date: new Date().toISOString(),
              status: 'completed',
            });
            clearCart();
            setShowCart(false);
            showToast('¡Venta registrada! 🎉');
          }}
        />
      )}

      {/* TOAST */}
      {toast && <div key={toastKey} className="toast">{toast}</div>}
    </div>
  );
}

// ─── CART PANEL ───────────────────────
function CartPanel({ cart, total, onUpdateQty, onClose, onCheckout }) {
  return (
    <div className="cart-panel" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cart-sheet">
        <div className="modal-handle"/>
        <h2>🛒 Orden actual</h2>

        <div className="cart-items">
          {cart.length === 0 && (
            <div className="empty-cart">El carrito está vacío</div>
          )}
          {cart.map(item => (
            <div key={item.key} className="cart-item">
              {item.product.image
                ? <img src={item.product.image} alt={item.product.name}/>
                : <div className="cart-item-emoji">🍽</div>
              }
              <div className="cart-item-info">
                <div className="cart-item-name">{item.product.name}</div>
                <div className="cart-item-sub">{item.size} · ${Number(item.price).toLocaleString()} c/u</div>
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => onUpdateQty(item.key, -1)}>−</button>
                  <span style={{fontSize:'.9rem',fontWeight:700,color:'#73290E'}}>{item.qty}</span>
                  <button className="qty-btn" onClick={() => onUpdateQty(item.key,  1)}>+</button>
                </div>
              </div>
              <div className="cart-item-price">${(item.price * item.qty).toLocaleString()}</div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="cart-total">
            <div className="cart-total-row">
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>
            <button className="btn-orange" onClick={onCheckout}>
              ✅ Cobrar ${total.toLocaleString()}
            </button>
          </div>
        )}
        <button className="btn-secondary" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}