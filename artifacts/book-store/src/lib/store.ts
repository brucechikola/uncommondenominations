import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type OrderInputProductType = 'paperback' | 'hardcover';

interface BuyerDetails {
  fullName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  city: string;
}

export interface CartState {
  productType: OrderInputProductType | null;
  quantity: number;
  buyerDetails: BuyerDetails | null;
  currentOrderId: number | null;
  currentPaymentId: number | null;
  setProductType: (type: OrderInputProductType) => void;
  setQuantity: (quantity: number) => void;
  setBuyerDetails: (details: BuyerDetails) => void;
  setCurrentOrderId: (id: number | null) => void;
  setCurrentPaymentId: (id: number | null) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      productType: null,
      quantity: 1,
      buyerDetails: null,
      currentOrderId: null,
      currentPaymentId: null,
      setProductType: (type: OrderInputProductType) => set({ productType: type }),
      setQuantity: (quantity: number) => set({ quantity }),
      setBuyerDetails: (details: BuyerDetails) => set({ buyerDetails: details }),
      setCurrentOrderId: (id: number | null) => set({ currentOrderId: id }),
      setCurrentPaymentId: (id: number | null) => set({ currentPaymentId: id }),
      clearCart: () => set({ productType: null, quantity: 1, buyerDetails: null, currentOrderId: null, currentPaymentId: null }),
    }),
    { name: 'cart-storage' }
  )
);

interface AdminAuthState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      setToken: (token: string | null) => set({ token, isAuthenticated: !!token }),
      logout: () => set({ token: null, isAuthenticated: false }),
    }),
    { name: 'admin-auth-storage' }
  )
);
