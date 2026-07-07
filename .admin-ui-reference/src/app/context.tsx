import { createContext, useContext, useState, ReactNode } from "react";
import type { PageKey, AdminUser, Order, Product, StockMovement } from "./types";
import { currentUser } from "./mockData";
import { liveValue } from "./liveData";

interface AppContextValue {
  currentPage: PageKey;
  selectedId: string | null;
  navigate: (page: PageKey, id?: string) => void;
  user: AdminUser | null;
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  unreadCount: number;
  orders: Order[];
  products: Product[];
  stockMovements: StockMovement[];
  upsertOrder: (order: Order) => void;
  upsertProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  addStockMovement: (movement: StockMovement) => void;
}

const AppContext = createContext<AppContextValue>({} as AppContextValue);

function isSystemProduct(product: Product) {
  return /^SO-[A-Z]+-\d{4}$/i.test(product.sku) && product.variants.length > 0;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const initialPage = liveValue<PageKey>("initialPage", "dashboard");
  const initialSelectedId = liveValue<string | null>("initialSelectedId", null);
  const liveUser = liveValue<AdminUser | null>("currentUser", currentUser);
  const [isLoggedIn, setIsLoggedIn] = useState(initialPage !== "login");
  const [currentPage, setCurrentPage] = useState<PageKey>(initialPage === "login" ? "login" : initialPage);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [unreadCount] = useState(3);
  const [orders, setOrders] = useState<Order[]>(liveValue<Order[]>("orders", []));
  const [products, setProducts] = useState<Product[]>(() => liveValue<Product[]>("products", []).filter(isSystemProduct));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(liveValue<StockMovement[]>("stockMovements", []));

  const navigate = (page: PageKey, id?: string) => {
    setCurrentPage(page);
    setSelectedId(id ?? null);
    window.scrollTo(0, 0);
  };

  const login = () => {
    setIsLoggedIn(true);
    setCurrentPage(initialPage === "login" ? "dashboard" : initialPage);
    setSelectedId(initialSelectedId);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentPage("login");
  };

  const upsertProduct = (product: Product) => {
    if (!isSystemProduct(product)) return;
    setProducts((items) => {
      const exists = items.some((item) => item.id === product.id);
      if (exists) {
        return items.map((item) => (item.id === product.id ? product : item));
      }
      return [product, ...items];
    });
  };

  const upsertOrder = (order: Order) => {
    setOrders((items) => {
      const exists = items.some((item) => item.id === order.id);
      if (exists) {
        return items.map((item) => (item.id === order.id ? order : item));
      }
      return [order, ...items];
    });
  };

  const removeProduct = (id: string) => {
    setProducts((items) => items.filter((item) => item.id !== id));
  };

  const addStockMovement = (movement: StockMovement) => {
    setStockMovements((items) => [movement, ...items]);
  };

  return (
    <AppContext.Provider value={{ currentPage, selectedId, navigate, user: isLoggedIn ? liveUser : null, isLoggedIn, login, logout, unreadCount, orders, products, stockMovements, upsertOrder, upsertProduct, removeProduct, addStockMovement }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
