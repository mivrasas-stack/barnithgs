
"use client";

import { useState, useEffect } from 'react';

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
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

export function useUserRole() {
  const [role, setRole] = useState<Role>('client');

  useEffect(() => {
    const saved = localStorage.getItem('partyflow_role') as Role;
    if (saved) setRole(saved);
  }, []);

  const changeRole = (newRole: Role) => {
    setRole(newRole);
    localStorage.setItem('partyflow_role', newRole);
  };

  return { role, changeRole };
}
