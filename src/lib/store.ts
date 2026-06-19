
"use client";

import { useState, useEffect } from 'react';

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  audioUrl?: string; 
  youtubeUrl?: string; // Nueva propiedad para enlaces de YouTube
};

export type CartItem = Product & {
  quantity: number;
};

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('partyflow_cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('partyflow_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  return { cart, addToCart, removeFromCart, clearCart, total };
}

export type Role = 'client' | 'admin' | 'driver' | 'warehouse';

const MOCK_CREDENTIALS: Record<string, string> = {
  admin: '1111',
  driver: '2222',
  warehouse: '3333',
};

export function useUserRole() {
  const [role, setRole] = useState<Role>('client');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('partyflow_role') as Role;
    const authStatus = localStorage.getItem('partyflow_logged_in') === 'true';
    if (savedRole) setRole(savedRole);
    setIsLoggedIn(authStatus);
    setIsInitialized(true);
  }, []);

  const changeRole = (newRole: Role) => {
    setRole(newRole);
    localStorage.setItem('partyflow_role', newRole);
  };

  const login = (selectedRole: Role, pin: string) => {
    if (MOCK_CREDENTIALS[selectedRole] === pin) {
      setRole(selectedRole);
      setIsLoggedIn(true);
      localStorage.setItem('partyflow_logged_in', 'true');
      localStorage.setItem('partyflow_role', selectedRole);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setRole('client');
    localStorage.setItem('partyflow_logged_in', 'false');
    localStorage.setItem('partyflow_role', 'client');
  };

  return { role, changeRole, isLoggedIn, isInitialized, login, logout, mockCredentials: MOCK_CREDENTIALS };
}
