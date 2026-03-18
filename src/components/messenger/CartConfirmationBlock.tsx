import { motion } from 'framer-motion';
import { CartMessage } from '../../types/message';
import { useCart, CartItem } from '../../contexts/CartContext';

interface CartConfirmationBlockProps {
  message: CartMessage;
}

export function CartConfirmationBlock({ message }: CartConfirmationBlockProps) {
  const { items, totalItems, totalPrice } = useCart();

  // Use cart items if available, otherwise fall back to the single message product
  const cartItems: CartItem[] = items.length > 0
    ? items
    : [{ product: message.product, quantity: 1 }];

  const hasMultipleItems = totalItems > 1;

  // Format price using the first available currency
  const currency = cartItems[0]?.product.currency || 'USD';
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        borderRadius: '20px',
        border: '1px solid rgba(9, 14, 21, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        overflow: 'hidden',
      }}
    >
      {/* Item rows */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {cartItems.map((item) => (
          <CartItemRow
            key={item.product.id}
            item={item}
            formatPrice={formatPrice}
          />
        ))}
      </div>

      {/* Divider */}
      <div style={{ margin: '0 16px', height: '1px', backgroundColor: 'rgba(9, 14, 21, 0.1)', borderRadius: '8px' }} />

      {/* Cart summary + CTA */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '16px' }}
      >
        <div>
          <p style={{ fontSize: '14px', fontWeight: 400, lineHeight: '1.5', color: '#000' }}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in cart
          </p>
          {hasMultipleItems && (
            <p style={{ fontSize: '13px', fontWeight: 400, lineHeight: '1.5', color: '#a0a2a6' }}>
              Subtotal: {formatPrice(totalPrice)}
            </p>
          )}
        </div>

        <button
          className="cursor-pointer"
          style={{
            height: '36px',
            padding: '8px 16px',
            borderRadius: '9999px',
            backgroundColor: '#090e15',
            color: '#fafafa',
            fontSize: '14px',
            fontWeight: 600,
            lineHeight: '1.5',
            border: 'none',
            outline: 'none',
            whiteSpace: 'nowrap',
          }}
          onClick={() => {
            // Placeholder — will wire to checkout flow later
          }}
        >
          Continue to checkout
        </button>
      </div>
    </motion.div>
  );
}

/** Build subtitle from subcategory + first variant */
function buildSubtitle(product: CartItem['product']): string {
  const parts: string[] = [];

  // Capitalize subcategory
  if (product.subcategory) {
    const sub = product.subcategory;
    parts.push(sub.charAt(0).toUpperCase() + sub.slice(1));
  }

  // First variant option (e.g. "Size M", "Black")
  if (product.variants && product.variants.length > 0) {
    const v = product.variants[0];
    const label = v.type.charAt(0).toUpperCase() + v.type.slice(1);
    parts.push(`${label}: ${v.options[0]}`);
  }

  return parts.join(' \u00B7 ') || product.brand;
}

/** Single item row within the cart block */
function CartItemRow({ item, formatPrice }: { item: CartItem; formatPrice: (p: number) => string }) {
  const { product, quantity } = item;

  return (
    <div className="flex items-center gap-3">
      {/* Thumbnail — 48x48 with quantity badge */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          className="overflow-hidden"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
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

        {/* Quantity badge — only shown when quantity > 1 */}
        {quantity > 1 && (
          <div
            className="flex items-center justify-center"
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              width: '16px',
              height: '16px',
              borderRadius: '9999px',
              backgroundColor: '#090e15',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              lineHeight: '16px',
              textAlign: 'center',
              pointerEvents: 'none',
              boxShadow: '0 0 0 2px white',
            }}
          >
            {quantity}
          </div>
        )}
      </div>

      {/* Item details + price */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p
            className="truncate"
            style={{ fontSize: '14px', fontWeight: 400, lineHeight: '1.5', color: '#000' }}
          >
            {product.name}
          </p>
          <p style={{
            fontSize: '14px',
            fontWeight: 600,
            lineHeight: '1.5',
            color: '#14161a',
            textAlign: 'right',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            marginLeft: '8px',
          }}>
            {formatPrice(product.price * quantity)}
          </p>
        </div>
        {/* Subcategory · Variant */}
        <p style={{ fontSize: '13px', fontWeight: 400, lineHeight: '1.5', color: '#a0a2a6' }}>
          {buildSubtitle(product)}
        </p>
      </div>
    </div>
  );
}
