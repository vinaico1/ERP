import { createContext, useContext, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [customer, setCustomer] = useState(null)
  const [discount, setDiscount] = useState(0)

  const addItem = useCallback((product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + qty, total: (i.quantity + qty) * i.unitPrice }
            : i
        )
      }
      return [...prev, {
        product,
        quantity: qty,
        unitPrice: product.price,
        discount: 0,
        total: product.price * qty
      }]
    })
  }, [])

  const removeItem = useCallback((productId) => {
    setItems(prev => prev.filter(i => i.product.id !== productId))
  }, [])

  const updateQty = useCallback((productId, qty) => {
    if (qty <= 0) {
      removeItem(productId)
      return
    }
    setItems(prev =>
      prev.map(i =>
        i.product.id === productId
          ? { ...i, quantity: qty, total: qty * i.unitPrice }
          : i
      )
    )
  }, [removeItem])

  const updateItemDiscount = useCallback((productId, itemDiscount) => {
    setItems(prev =>
      prev.map(i => {
        if (i.product.id !== productId) return i
        const disc = Math.max(0, Math.min(itemDiscount, 100))
        const unitPrice = i.unitPrice * (1 - disc / 100)
        return { ...i, discount: disc, total: unitPrice * i.quantity }
      })
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setCustomer(null)
    setDiscount(0)
  }, [])

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const itemsDiscount = items.reduce((sum, i) => sum + (i.product.price * i.quantity - i.total), 0)
  const afterItemsDiscount = subtotal - itemsDiscount
  const globalDiscountValue = afterItemsDiscount * (discount / 100)
  const total = afterItemsDiscount - globalDiscountValue

  return (
    <CartContext.Provider value={{
      items,
      customer,
      setCustomer,
      discount,
      setDiscount,
      addItem,
      removeItem,
      updateQty,
      updateItemDiscount,
      clearCart,
      subtotal,
      itemsDiscount,
      globalDiscountValue,
      total,
      isEmpty: items.length === 0
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
