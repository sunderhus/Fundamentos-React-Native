import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem('@Gomarketplace');
      if (storageProducts) {
        setProducts([...JSON.parse(storageProducts)]);
      }
    }
    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(newProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id && product.quantity >= 1
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );
      const filtredProducts = newProducts.filter(
        product => product.quantity > 0,
      );

      setProducts(filtredProducts);
      await AsyncStorage.setItem(
        '@Gomarketplace',
        JSON.stringify(filtredProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const productExists = products.some(p => p.id === product.id);
      if (productExists) {
        increment(product.id);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }
      await AsyncStorage.setItem('@Gomarketplace', JSON.stringify(products));
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
