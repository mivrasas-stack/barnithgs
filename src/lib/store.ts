
"use client";

import { useState, useEffect } from 'react';

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  audioUrl?: string; 
  youtubeUrl?: string;
  spotifyUrl?: string; // Nuevo: Soporte para Spotify
  startTime?: number; // Segundo de inicio para el audio
};

export type CartItem = Product & {
  quantity: number;
};

let globalCart: CartItem[] = [];
let cartListeners: ((cart: CartItem[]) => void)[] = [];

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('partyflow_cart');
  if (saved) {
    try {
      globalCart = JSON.parse(saved);
    } catch (e) {}
  }
}

function notifyCartListeners() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('partyflow_cart', JSON.stringify(globalCart));
  }
  cartListeners.forEach(listener => listener(globalCart));
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const listener = (newCart: CartItem[]) => setCart(newCart);
    cartListeners.push(listener);
    setCart(globalCart);
    setIsInitialized(true);
    return () => {
      cartListeners = cartListeners.filter(l => l !== listener);
    };
  }, []);

  const addToCart = (product: Product) => {
    const existing = globalCart.find(item => item.id === product.id);
    if (existing) {
      globalCart = globalCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
    } else {
      globalCart = [...globalCart, { ...product, quantity: 1 }];
    }
    notifyCartListeners();
  };

  const removeFromCart = (id: string) => {
    globalCart = globalCart.filter(item => item.id !== id);
    notifyCartListeners();
  };

  const clearCart = () => {
    globalCart = [];
    notifyCartListeners();
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  return { cart, addToCart, removeFromCart, clearCart, total };
}

export type Role = 'client' | 'admin' | 'driver' | 'warehouse';

import { createClient } from '@/lib/supabase/client';

export function useUserRole() {
  const [role, setRole] = useState<Role>('client');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setRole(session.user.user_metadata.role || 'client');
      }
      setIsInitialized(true);
    }
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setRole(session.user.user_metadata.role || 'client');
      } else {
        setIsLoggedIn(false);
        setRole('client');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return { role, isLoggedIn, isInitialized, logout };
}
