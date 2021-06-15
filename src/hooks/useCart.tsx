import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId);

      if (productIndex > -1) {
        updateProductAmount({
          productId: cart[productIndex].id,
          amount: cart[productIndex].amount + 1
        });
      } else {
        const { data } = await api.get(`/products/${productId}`);
        setCart(prevState => {
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...prevState, {...data, amount: 1}]));
          return [...prevState, {...data, amount: 1}];
        });
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId);

      if (productIndex > -1) {
        setCart(prevState => {
          const filteredCart = prevState.filter(product => product.id !== productId);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredCart));
          return [...filteredCart];
        });
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount < 1) return;
    try {
      const productIndex = cart.findIndex(product => product.id === productId);

      const { data } = await api.get(`/stock/${productId}`);
      if (amount > data.amount) return toast.error('Quantidade solicitada fora de estoque');

      if (productIndex > -1) {
        setCart(prevState => {
          prevState[productIndex].amount = amount;
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(prevState));
          return [...prevState];
        });
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
