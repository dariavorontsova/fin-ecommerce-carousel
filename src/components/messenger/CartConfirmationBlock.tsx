import { motion } from 'framer-motion';
import { CartMessage } from '../../types/message';
import { useCart } from '../../contexts/CartContext';

interface CartConfirmationBlockProps {
  message: CartMessage;
}

export function CartConfirmationBlock({ message }: CartConfirmationBlockProps) {
  const { totalItems, totalPrice } = useCart();
  const { product } = message;

  // Format price
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency,
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
        border: '1px solid rgba(9, 14, 21, 0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Added item row */}
      <div
        className="flex items-center gap-3"
        style={{ padding: '12px 16px', backgroundColor: '#fafafa' }}
      >
        {/* Thumbnail */}
        <div
          className="shrink-0 overflow-hidden"
          style={{ width: '40px', height: '40px', borderRadius: '10px' }}
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Item info */}
        <div className="flex-1 min-w-0">
          <p
            className="truncate"
            style={{ fontSize: '13px', fontWeight: 600, lineHeight: '1.4', color: '#14161a' }}
          >
            {product.name}
          </p>
          <p style={{ fontSize: '12px', fontWeight: 400, lineHeight: '1.4', color: '#6c6f74' }}>
            {formatPrice(product.price)} &middot; Added to cart
          </p>
        </div>

        {/* Checkmark */}
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '9999px',
            backgroundColor: '#090e15',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3.5 7L6 9.5L10.5 4.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Cart summary + CTA */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(9, 14, 21, 0.06)',
        }}
      >
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, lineHeight: '1.4', color: '#14161a' }}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in cart
          </p>
          <p style={{ fontSize: '12px', fontWeight: 400, lineHeight: '1.4', color: '#6c6f74' }}>
            Total: {formatPrice(totalPrice)}
          </p>
        </div>

        <button
          className="cursor-pointer"
          style={{
            padding: '8px 20px',
            borderRadius: '9999px',
            backgroundColor: '#090e15',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
            lineHeight: '1.4',
            border: 'none',
            outline: 'none',
          }}
          onClick={() => {
            // Placeholder — will wire to checkout flow later
          }}
        >
          Checkout
        </button>
      </div>
    </motion.div>
  );
}
