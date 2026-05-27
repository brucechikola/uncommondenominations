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

interface AgentProfile {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface AgentAuthState {
  token: string | null;
  agent: AgentProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string, agent: AgentProfile) => void;
  logout: () => void;
}

export const useAgentAuthStore = create<AgentAuthState>()(
  persist(
    (set) => ({
      token: null,
      agent: null,
      isAuthenticated: false,
      setAuth: (token, agent) => set({ token, agent, isAuthenticated: true }),
      logout: () => set({ token: null, agent: null, isAuthenticated: false }),
    }),
    { name: 'agent-auth-storage' }
  )
);

interface CourierProfile {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  vehicleInfo?: string | null;
}

interface CourierAuthState {
  token: string | null;
  courier: CourierProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string, courier: CourierProfile) => void;
  logout: () => void;
}

export const useCourierAuthStore = create<CourierAuthState>()(
  persist(
    (set) => ({
      token: null,
      courier: null,
      isAuthenticated: false,
      setAuth: (token, courier) => set({ token, courier, isAuthenticated: true }),
      logout: () => set({ token: null, courier: null, isAuthenticated: false }),
    }),
    { name: 'courier-auth-storage' }
  )
);
