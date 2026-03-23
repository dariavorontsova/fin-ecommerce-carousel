import { motion, AnimatePresence } from 'framer-motion';
import { usePinning } from '../../contexts/PinningContext';
import { useCart } from '../../contexts/CartContext';
import { Product } from '../../types/product';

export function PinnedZone() {
  const { isCartPinned, isProductPinned, focusedProduct } = usePinning();
  const { totalItems, totalPrice } = useCart();

  const hasCart = totalItems > 0;
  const showCart = isCartPinned && hasCart;
  // Product context only shows when there's NO cart to pin — cart always takes priority
  const showProduct = isProductPinned && focusedProduct != null && !hasCart;

  return (
    <AnimatePresence>
      {(showCart || showProduct) && (
        <motion.div
          key="pinned-zone"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="flex-shrink-0 overflow-hidden"
          style={{
            borderBottom: '1px solid rgba(9, 14, 21, 0.08)',
          }}
        >
          {showCart && (
            <PinnedCartCTA totalItems={totalItems} totalPrice={totalPrice} />
          )}

          {showProduct && (
            <PinnedProductContext product={focusedProduct!} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Compact cart summary: item count + total + checkout button */
function PinnedCartCTA({ totalItems, totalPrice }: { totalItems: number; totalPrice: number }) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);

  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: '10px 16px' }}
    >
      <div>
        <p style={{ fontSize: '14px', fontWeight: 400, lineHeight: '1.4', color: '#000' }}>
          {totalItems} {totalItems === 1 ? 'item' : 'items'} in cart
        </p>
        <p style={{ fontSize: '13px', fontWeight: 400, lineHeight: '1.4', color: '#a0a2a6' }}>
          Total: {formatPrice(totalPrice)}
        </p>
      </div>

      <button
        className="cursor-pointer"
        style={{
          height: '32px',
          padding: '6px 14px',
          borderRadius: '9999px',
          backgroundColor: '#090e15',
          color: '#fafafa',
          fontSize: '13px',
          fontWeight: 600,
          lineHeight: '1.4',
          border: 'none',
          outline: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Checkout
      </button>
    </div>
  );
}

/** Compact product context: thumbnail + name + price + add to cart */
function PinnedProductContext({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency || 'USD',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);

  return (
    <div
      className="flex items-center gap-3"
      style={{ padding: '10px 16px' }}
    >
      {/* Thumbnail — 40x40 */}
      <div
        className="overflow-hidden flex-shrink-0"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: '#f5f2ed',
          border: '1px solid rgba(9, 14, 21, 0.1)',
        }}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p
          className="truncate"
          style={{ fontSize: '14px', fontWeight: 400, lineHeight: '1.4', color: '#000' }}
        >
          {product.name}
        </p>
        <p style={{ fontSize: '13px', fontWeight: 600, lineHeight: '1.4', color: '#14161a' }}>
          {formatPrice(product.price)}
        </p>
      </div>

      {/* Compact add-to-cart icon button */}
      <button
        className="flex-shrink-0 cursor-pointer flex items-center justify-center"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '9999px',
          backgroundColor: 'white',
          boxShadow: '0px 1px 3px 0px rgba(9, 14, 21, 0.2)',
          border: 'none',
          outline: 'none',
        }}
        onClick={(e) => {
          e.stopPropagation();
          addToCart(product);
          window.dispatchEvent(new CustomEvent('cart-item-added', { detail: { product } }));
        }}
      >
        <img src="/icons/add-to-card.svg" alt="Add to cart" width="18" height="18" />
      </button>
    </div>
  );
}
