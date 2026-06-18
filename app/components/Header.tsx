"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import type { Dictionary, Locale } from "../lib/i18n";
import { shopCategories, slugify } from "../lib/shop";
import { createSupabaseBrowserClient } from "../lib/supabase/client";
import type { SavedItem } from "./SaveProductButton";

type MenuItemStyle = CSSProperties & { "--item-index": number };
const cartStorageKey = "show-off-cart";
const savedStorageKey = "show-off-saved";
const customerStorageKey = "show-off-customer";
const orderRefsStorageKey = "show-off-order-refs";

type CartItem = {
  slug: string;
  name: string;
  color: string;
  size: string;
  price: string;
  image: string;
  quantity: number;
};

type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

type AccountOrder = {
  id: string;
  order_no: string;
  final_amount: number;
  total_amount: number;
  created_at: string;
  shipping_status: string | null;
  fulfillment_status: string | null;
  order_items: Array<{
    id: string;
    product_name_snapshot: string;
    variant_label_snapshot: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
};

function BellIcon() {
  return (
    <svg aria-hidden="true" className="bell-icon" fill="none" viewBox="0 0 24 24">
      <path d="M18 16.5H6c1.2-1.2 1.5-2.8 1.5-5.1 0-2.8 1.8-5.1 4.5-5.1s4.5 2.3 4.5 5.1c0 2.3.3 3.9 1.5 5.1Z" />
      <path d="M10 19c.4.6 1.1 1 2 1s1.6-.4 2-1" />
      <path d="M12 4.5V3.4" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg aria-hidden="true" className="bookmark-icon" fill="none" viewBox="0 0 24 24">
      <path d="M7.5 4.5h9v15L12 16.75 7.5 19.5v-15Z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m4.5 16.8-.7 3.4 3.4-.7L18.7 8 16 5.3 4.5 16.8Z" />
      <path d="m14.5 6.8 2.7 2.7" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.1" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M7 4.5h10l2 3.5v11.5H5V8l2-3.5Z" />
      <path d="M5.5 8h13M9 11.5h6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M10 5H5.5v14H10" />
      <path d="M13 8.5 16.5 12 13 15.5" />
      <path d="M8.5 12h8" />
    </svg>
  );
}

function readCartItems() {
  try {
    const stored = window.localStorage.getItem(cartStorageKey);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function readSavedItems() {
  try {
    const stored = window.localStorage.getItem(savedStorageKey);
    return stored ? (JSON.parse(stored) as SavedItem[]) : [];
  } catch {
    return [];
  }
}

function readCustomerProfile() {
  try {
    const stored = window.localStorage.getItem(customerStorageKey);
    return stored ? (JSON.parse(stored) as CustomerProfile) : null;
  } catch {
    return null;
  }
}

function readOrderIds() {
  try {
    const stored = window.localStorage.getItem(orderRefsStorageKey);
    const refs = stored ? (JSON.parse(stored) as Array<{ id?: unknown }>) : [];
    return refs.flatMap((item) => (typeof item.id === "string" ? [item.id] : []));
  } catch {
    return [];
  }
}

function formatAccountPrice(value: number) {
  return `฿${Math.round(value).toLocaleString("en-US")}`;
}

export function Header({ dictionary, locale, tone = "overlay" }: { dictionary: Dictionary; locale: Locale; tone?: "overlay" | "solid" | "clear" }) {
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);
  const transitionRef = useRef<number | null>(null);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"account" | "cart" | "saved" | null>(null);
  const [accountMode, setAccountMode] = useState<"login" | "register" | "profile">("login");
  const [openCategory, setOpenCategory] = useState("Clothing");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [accountDraft, setAccountDraft] = useState<CustomerProfile>({ name: "", email: "", phone: "", address: "" });
  const [profileEditing, setProfileEditing] = useState(false);
  const [accountOrders, setAccountOrders] = useState<AccountOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const nextLocale = locale === "en" ? "lo" : "en";
  const overlayOpen = menuOpen || activePanel !== null;
  const cartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  const savedQuantity = savedItems.length;

  useEffect(() => {
    lastYRef.current = window.scrollY;

    const updateHeader = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastYRef.current;

      if (currentY < 24) {
        setHidden(false);
      } else if (delta > 8) {
        setHidden(true);
      } else if (delta < -8) {
        setHidden(false);
      }

      lastYRef.current = currentY;
      tickingRef.current = false;
    };

    const onScroll = () => {
      if (!tickingRef.current) {
        window.requestAnimationFrame(updateHeader);
        tickingRef.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-lock", overlayOpen);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setActivePanel(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("menu-lock");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [overlayOpen]);

  useEffect(() => {
    document.body.classList.remove("route-exit");

    return () => {
      if (transitionRef.current) {
        window.clearTimeout(transitionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCartItems(readCartItems());

    const onCartUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<CartItem[]>;
      setCartItems(Array.isArray(customEvent.detail) ? customEvent.detail : readCartItems());
    };

    const onCartOpen = () => {
      setMenuOpen(false);
      setActivePanel("cart");
    };

    const onStorage = () => setCartItems(readCartItems());

    window.addEventListener("showoff-cart-updated", onCartUpdated);
    window.addEventListener("showoff-cart-open", onCartOpen);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("showoff-cart-updated", onCartUpdated);
      window.removeEventListener("showoff-cart-open", onCartOpen);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const syncCustomer = () => {
      const profile = readCustomerProfile();
      setCustomer(profile);
      if (profile) {
        setAccountDraft(profile);
        setAccountMode((mode) => (mode === "login" ? "profile" : mode));
        setProfileEditing(false);
      }
    };

    const openAccount = () => {
      setMenuOpen(false);
      setAccountMode("register");
      setActivePanel("account");
    };

    syncCustomer();
    window.addEventListener("showoff-account-updated", syncCustomer);
    window.addEventListener("showoff-account-open", openAccount);
    window.addEventListener("storage", syncCustomer);

    return () => {
      window.removeEventListener("showoff-account-updated", syncCustomer);
      window.removeEventListener("showoff-account-open", openAccount);
      window.removeEventListener("storage", syncCustomer);
    };
  }, []);

  useEffect(() => {
    setSavedItems(readSavedItems());

    const onSavedUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<SavedItem[]>;
      setSavedItems(Array.isArray(customEvent.detail) ? customEvent.detail : readSavedItems());
    };

    const onSavedOpen = () => {
      setMenuOpen(false);
      setActivePanel("saved");
    };

    const onStorage = () => setSavedItems(readSavedItems());

    window.addEventListener("showoff-saved-updated", onSavedUpdated);
    window.addEventListener("showoff-saved-open", onSavedOpen);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("showoff-saved-updated", onSavedUpdated);
      window.removeEventListener("showoff-saved-open", onSavedOpen);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!customer || activePanel !== "account" || accountMode !== "profile") {
      return;
    }

    let active = true;

    const loadOrders = async () => {
      const orderIds = readOrderIds();
      if (orderIds.length === 0) {
        setAccountOrders([]);
        return;
      }

      setOrdersLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.rpc("get_storefront_order_history", { target_order_ids: orderIds });
        if (error) {
          throw error;
        }
        if (active) {
          setAccountOrders(Array.isArray(data) ? (data as AccountOrder[]) : []);
        }
      } catch {
        if (active) {
          setAccountOrders([]);
        }
      } finally {
        if (active) {
          setOrdersLoading(false);
        }
      }
    };

    void loadOrders();
    window.addEventListener("showoff-orders-updated", loadOrders);

    return () => {
      active = false;
      window.removeEventListener("showoff-orders-updated", loadOrders);
    };
  }, [accountMode, activePanel, customer]);

  const visitCollection = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setMenuOpen(false);
    document.body.classList.remove("menu-lock");
    document.body.classList.add("route-exit");

    transitionRef.current = window.setTimeout(() => {
      window.location.href = href;
    }, 420);
  };

  const openPanel = (panel: "account" | "cart" | "saved") => {
    setMenuOpen(false);
    if (panel === "account") {
      setAccountMode(customer ? "profile" : "login");
    }
    setActivePanel(panel);
  };

  const goToCheckout = () => {
    if (!customer) {
      setMenuOpen(false);
      setAccountMode("register");
      setActivePanel("account");
      return;
    }

    setActivePanel(null);
    document.body.classList.remove("menu-lock");
    document.body.classList.add("route-exit");

    transitionRef.current = window.setTimeout(() => {
      window.location.href = `/${locale}/checkout`;
    }, 420);
  };

  const closeOverlays = () => {
    setMenuOpen(false);
    setActivePanel(null);
  };

  const saveCartItems = (items: CartItem[]) => {
    if (items.length === 0) {
      window.localStorage.removeItem(cartStorageKey);
    } else {
      window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
    }

    setCartItems(items);
  };

  const updateCartQuantity = (targetItem: CartItem, nextQuantity: number) => {
    const safeQuantity = Number.isFinite(nextQuantity) ? Math.max(0, Math.min(99, Math.floor(nextQuantity))) : targetItem.quantity;
    const nextItems =
      safeQuantity === 0
        ? cartItems.filter((item) => !(item.slug === targetItem.slug && item.size === targetItem.size && item.color === targetItem.color))
        : cartItems.map((item) => (item.slug === targetItem.slug && item.size === targetItem.size && item.color === targetItem.color ? { ...item, quantity: safeQuantity } : item));

    saveCartItems(nextItems);
  };

  const removeCartItem = (targetItem: CartItem) => {
    saveCartItems(cartItems.filter((item) => !(item.slug === targetItem.slug && item.size === targetItem.size && item.color === targetItem.color)));
  };

  const clearCart = () => {
    saveCartItems([]);
  };

  const saveCustomerProfile = () => {
    const nextProfile = {
      name: accountDraft.name.trim(),
      email: accountDraft.email.trim(),
      phone: accountDraft.phone.trim(),
      address: accountDraft.address.trim(),
    };

    if (!nextProfile.name || !nextProfile.phone || !nextProfile.address) {
      return;
    }

    window.localStorage.setItem(customerStorageKey, JSON.stringify(nextProfile));
    setCustomer(nextProfile);
    setAccountMode("profile");
    setProfileEditing(false);
    window.dispatchEvent(new CustomEvent("showoff-account-updated", { detail: nextProfile }));
  };

  const logoutCustomer = () => {
    window.localStorage.removeItem(customerStorageKey);
    setCustomer(null);
    setAccountDraft({ name: "", email: "", phone: "", address: "" });
    setAccountMode("login");
    setProfileEditing(false);
    window.dispatchEvent(new CustomEvent("showoff-account-updated", { detail: null }));
  };

  const switchLanguage = () => {
    document.body.classList.remove("menu-lock");
    document.body.classList.add("route-exit");

    transitionRef.current = window.setTimeout(() => {
      const nextPath = window.location.pathname.replace(/^\/(en|lo)(?=\/|$)/, `/${nextLocale}`);
      window.location.href = nextPath + window.location.search + window.location.hash;
    }, 420);
  };

  const saveSavedItems = (items: SavedItem[]) => {
    if (items.length === 0) {
      window.localStorage.removeItem(savedStorageKey);
    } else {
      window.localStorage.setItem(savedStorageKey, JSON.stringify(items));
    }

    setSavedItems(items);
    window.dispatchEvent(new CustomEvent("showoff-saved-updated", { detail: items }));
  };

  const removeSavedItem = (targetItem: SavedItem) => {
    saveSavedItems(savedItems.filter((item) => item.slug !== targetItem.slug));
  };

  return (
    <>
      <header className={`topbar topbar-${tone}${hidden && !overlayOpen ? " is-hidden" : ""}`}>
        <div className="navline">
          <div className="nav-left">
            <button className="hamburger" type="button" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen(true)}>
              <span />
              <span />
              {savedQuantity > 0 ? <b className="menu-count">{savedQuantity}</b> : null}
            </button>
            <a className="icon-link alerts nav-alerts" href="#alerts" aria-label="Alerts">
              <BellIcon />
            </a>
          </div>
          <a className="logo logo-mark" href={`/${locale}`} aria-label="Represent home">
            <span className="logo-r">R</span>
            <span className="logo-full">REPRESENT</span>
          </a>
          <div className="header-actions" aria-label="Shop actions">
            <button className="icon-link account" type="button" aria-label="Open account" aria-expanded={activePanel === "account"} onClick={() => openPanel("account")} />
            <button className="icon-link bag" type="button" aria-label="Open cart" aria-expanded={activePanel === "cart"} onClick={() => openPanel("cart")}>
              {cartQuantity > 0 ? <span className="cart-count">{cartQuantity}</span> : null}
            </button>
          </div>
        </div>
      </header>

      <div className={`menu-scrim${overlayOpen ? " is-open" : ""}`} onClick={closeOverlays} aria-hidden="true" />
      <aside className={`site-menu${menuOpen ? " is-open" : ""}`} id="site-menu" aria-hidden={!menuOpen} aria-label="Shop menu">
        <div className="menu-shell">
          <div className="menu-top">
            <button className="menu-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <span aria-hidden="true">{"<-"}</span>
              Close
            </button>
            <div className="menu-icons" aria-label="Menu shortcuts">
              <button className="icon-link bookmark" type="button" aria-label="Open saved items" onClick={() => openPanel("saved")}>
                <BookmarkIcon />
                {savedQuantity > 0 ? <span className="saved-count">{savedQuantity}</span> : null}
              </button>
            </div>
          </div>

          <label className="menu-search">
            <span aria-hidden="true" />
            <input type="search" placeholder="Search for..." />
          </label>

          <div className="menu-categories">
            <p>Shop Categories</p>
            {shopCategories.map((category, index) => {
              const isOpen = openCategory === category.title;

              return (
                <section className={`category-group${isOpen ? " is-open" : ""}`} key={category.title} style={{ "--item-index": index } as MenuItemStyle}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`category-${category.title.replaceAll(" ", "-").toLowerCase()}`}
                    onClick={() => setOpenCategory(isOpen ? "" : category.title)}
                  >
                    <span>{category.title}</span>
                    <i aria-hidden="true" />
                  </button>
                  <div className="category-panel" id={`category-${category.title.replaceAll(" ", "-").toLowerCase()}`}>
                    <a href={`/${locale}/collections/${slugify(category.title)}`} onClick={visitCollection(`/${locale}/collections/${slugify(category.title)}`)}>
                      View All
                    </a>
                    {category.items.map((item) => (
                      <a href={`/${locale}/collections/${slugify(item)}`} key={item} onClick={visitCollection(`/${locale}/collections/${slugify(item)}`)}>
                        {item}
                      </a>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </aside>

      <aside className={`action-panel${activePanel === "account" ? " is-open" : ""}`} aria-hidden={activePanel !== "account"} aria-label="Account">
        <div className="action-panel-top">
          <p>Account</p>
          <button type="button" onClick={() => setActivePanel(null)}>
            Close
          </button>
        </div>
        <div className="account-panel-body">
          {customer && accountMode === "profile" ? (
            <>
              <div className="profile-head">
                <div>
                  <span>Signed in</span>
                </div>
                <h2>{customer.name || "SHOW OFF Member"}</h2>
                <p>{customer.email || customer.phone}</p>
              </div>

              <div className="profile-actions" hidden>
                <button type="button" onClick={switchLanguage}>
                  <span>Language</span>
                  <strong>{`${locale === "en" ? "English" : "ລາວ"} -> ${nextLocale === "en" ? "English" : "ລາວ"}`}</strong>
                </button>
                <button type="button" onClick={() => setActivePanel("saved")}>
                  <span>Saved pieces</span>
                  <strong>{savedQuantity} item{savedQuantity === 1 ? "" : "s"}</strong>
                </button>
              </div>

              <div className="profile-summary" aria-label="Profile details" hidden>
                <dl>
                  <div>
                    <dt>Full name</dt>
                    <dd>{customer.name || "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{customer.email || "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Phone number</dt>
                    <dd>{customer.phone || "Add phone number"}</dd>
                  </div>
                  <div>
                    <dt>Delivery address</dt>
                    <dd>{customer.address || "Add delivery address"}</dd>
                  </div>
                </dl>
              </div>

              <form className="account-form profile-form" hidden>
                <label>
                  Phone number
                  <input type="tel" autoComplete="tel" placeholder="020..." value={accountDraft.phone} onChange={(event) => setAccountDraft({ ...accountDraft, phone: event.target.value })} />
                </label>
                <label>
                  Delivery address
                  <input type="text" autoComplete="street-address" placeholder="Village, district, province" value={accountDraft.address} onChange={(event) => setAccountDraft({ ...accountDraft, address: event.target.value })} />
                </label>
                <button type="button" onClick={saveCustomerProfile}>
                  Save delivery profile
                </button>
              </form>

              <section className="account-profile-section account-address-section" aria-labelledby="delivery-address-title">
                <div className="account-profile-section-head">
                  <span className="account-profile-section-icon"><LocationIcon /></span>
                  <div>
                    <h3 id="delivery-address-title">Delivery address</h3>
                    <p>Used for every checkout</p>
                  </div>
                  <button className="profile-edit-button" type="button" aria-expanded={profileEditing} onClick={() => setProfileEditing((editing) => !editing)}>
                    <EditIcon />
                    {profileEditing ? "Cancel" : "Edit"}
                  </button>
                </div>

                <div className="account-address-preview" hidden={profileEditing}>
                  <strong>{customer.address || "Add delivery address"}</strong>
                  <span>{customer.phone || "Add phone number"}</span>
                </div>

                <form className={`account-form profile-form${profileEditing ? " is-open" : ""}`} aria-hidden={!profileEditing}>
                  <label>
                    Phone number
                    <input type="tel" autoComplete="tel" placeholder="020..." value={accountDraft.phone} onChange={(event) => setAccountDraft({ ...accountDraft, phone: event.target.value })} />
                  </label>
                  <label>
                    Delivery address
                    <textarea autoComplete="street-address" placeholder="Village, district, province" rows={3} value={accountDraft.address} onChange={(event) => setAccountDraft({ ...accountDraft, address: event.target.value })} />
                  </label>
                  <button type="button" onClick={saveCustomerProfile}>Save address</button>
                </form>
              </section>

              <section className="account-profile-section account-orders-section" aria-labelledby="order-history-title">
                <div className="account-profile-section-head">
                  <span className="account-profile-section-icon"><OrderIcon /></span>
                  <div>
                    <h3 id="order-history-title">Order history</h3>
                    <p>Approved payments only</p>
                  </div>
                  <span className="account-orders-count">{accountOrders.length}</span>
                </div>

                {ordersLoading ? (
                  <div className="account-orders-loading" aria-live="polite"><span /><span /></div>
                ) : accountOrders.length > 0 ? (
                  <div className="account-order-list">
                    {accountOrders.map((order) => (
                      <article className="account-order-item" key={order.id}>
                        <div className="account-order-meta">
                          <div>
                            <strong>{order.order_no}</strong>
                            <time dateTime={order.created_at}>{new Intl.DateTimeFormat(locale === "lo" ? "lo-LA" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(order.created_at))}</time>
                          </div>
                          <span>Approved</span>
                        </div>
                        <ul>
                          {order.order_items.map((item) => (
                            <li key={item.id}>
                              <div><strong>{item.product_name_snapshot}</strong><span>{item.variant_label_snapshot || "Standard"}</span></div>
                              <span>Qty {item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="account-order-total"><span>Total</span><strong>{formatAccountPrice(order.final_amount || order.total_amount)}</strong></div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="account-orders-empty">
                    <strong>No approved orders yet</strong>
                    <p>Orders appear here after the store approves your payment slip.</p>
                  </div>
                )}
              </section>

              <div className="profile-foot">
                <button className="profile-logout-button" type="button" onClick={logoutCustomer}>
                  <LogoutIcon />
                  Log out
                </button>
              </div>
            </>
          ) : accountMode === "login" ? (
            <>
              <h2>Sign in</h2>
              <p>Access orders, saved pieces, and private drops with your email or phone number.</p>
              <form className="account-form">
                <label>
                  Email or phone number
                  <input type="text" autoComplete="username" placeholder="name@email.com" value={accountDraft.email || accountDraft.phone} onChange={(event) => setAccountDraft({ ...accountDraft, email: event.target.value })} />
                </label>
                <label>
                  Password
                  <input type="password" autoComplete="current-password" placeholder="Password" />
                </label>
                <button type="button" onClick={saveCustomerProfile}>
                  Sign in
                </button>
              </form>
              {customer ? <p className="account-saved-note">Delivery profile saved for checkout.</p> : null}
              <div className="account-switch">
                <button type="button">Forgot password?</button>
                <button type="button" onClick={() => setAccountMode("register")}>
                  Create account
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>Create account</h2>
              <p>Start with the essentials. Shipping details can be added when you checkout.</p>
              <form className="account-form">
                <label>
                  Full name
                  <input type="text" autoComplete="name" placeholder="Your name" value={accountDraft.name} onChange={(event) => setAccountDraft({ ...accountDraft, name: event.target.value })} />
                </label>
                <label>
                  Email
                  <input type="email" autoComplete="email" placeholder="name@email.com" value={accountDraft.email} onChange={(event) => setAccountDraft({ ...accountDraft, email: event.target.value })} />
                </label>
                <label>
                  Password
                  <input type="password" autoComplete="new-password" placeholder="Create password" />
                </label>
                <label>
                  Phone number
                  <input type="tel" autoComplete="tel" placeholder="020..." value={accountDraft.phone} onChange={(event) => setAccountDraft({ ...accountDraft, phone: event.target.value })} />
                </label>
                <label>
                  Delivery address
                  <input type="text" autoComplete="street-address" placeholder="Village, district, province" value={accountDraft.address} onChange={(event) => setAccountDraft({ ...accountDraft, address: event.target.value })} />
                </label>
                <button type="button" onClick={saveCustomerProfile}>
                  Create account
                </button>
              </form>
              <div className="account-switch">
                <span>Already have an account?</span>
                <button type="button" onClick={() => setAccountMode("login")}>
                  Sign in
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      <aside className={`action-panel cart-panel${activePanel === "cart" ? " is-open" : ""}`} aria-hidden={activePanel !== "cart"} aria-label="Shopping cart">
        <div className="action-panel-top">
          <p>Cart</p>
          <button type="button" onClick={() => setActivePanel(null)}>
            Close
          </button>
        </div>
        <div className="cart-panel-body">
          {cartItems.length > 0 ? (
            <>
              <div className="cart-summary">
                <h2>Your cart</h2>
                <p>{cartQuantity} item{cartQuantity === 1 ? "" : "s"} ready for checkout.</p>
              </div>
              <div className="cart-items" aria-label="Cart items">
                {cartItems.map((item) => (
                  <div className="cart-line-item" key={`${item.slug}-${item.size}-${item.color}`}>
                    <img src={item.image} alt={item.name} />
                    <div className="cart-line-copy">
                      <strong>{item.name}</strong>
                      <span>
                        {item.size} / {item.color}
                      </span>
                      <div className="cart-quantity" aria-label={`Quantity for ${item.name}`}>
                        <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateCartQuantity(item, item.quantity - 1)}>
                          -
                        </button>
                        <input
                          aria-label={`Quantity for ${item.name}`}
                          inputMode="numeric"
                          min="1"
                          max="99"
                          type="number"
                          value={item.quantity}
                          onChange={(event) => updateCartQuantity(item, Number(event.target.value))}
                        />
                        <button type="button" aria-label={`Add one ${item.name}`} onClick={() => updateCartQuantity(item, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                    </div>
                    <div className="cart-line-side">
                      <em>{item.price}</em>
                      <div className="cart-line-actions" aria-label={`Actions for ${item.name}`}>
                        <button className="cart-save" type="button" aria-label={`Save ${item.name} for later`} />
                        <button className="cart-remove" type="button" aria-label={`Remove ${item.name}`} onClick={() => removeCartItem(item)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-actions">
                <button type="button" onClick={goToCheckout}>
                  Checkout
                </button>
                <button type="button" onClick={clearCart}>
                  Clear cart
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="cart-empty-mark" aria-hidden="true">
                <span />
              </div>
              <h2>Your cart is empty</h2>
              <p>Add a piece from the latest collection and it will wait here.</p>
              <a href={`/${locale}/collections/hoodies`} onClick={visitCollection(`/${locale}/collections/hoodies`)}>
                Shop hoodies
              </a>
            </>
          )}
        </div>
      </aside>

      <aside className={`action-panel saved-panel${activePanel === "saved" ? " is-open" : ""}`} aria-hidden={activePanel !== "saved"} aria-label="Saved items">
        <div className="action-panel-top">
          <p>Saved</p>
          <button type="button" onClick={() => setActivePanel(null)}>
            Close
          </button>
        </div>
        <div className="saved-panel-body">
          {savedItems.length > 0 ? (
            <>
              <div className="cart-summary">
                <h2>Saved pieces</h2>
                <p>{savedItems.length} item{savedItems.length === 1 ? "" : "s"} kept for later.</p>
              </div>
              <div className="saved-items" aria-label="Saved items">
                {savedItems.map((item) => (
                  <div className="saved-line-item" key={item.slug}>
                    <a href={`/${locale}/products/${item.slug}`} onClick={visitCollection(`/${locale}/products/${item.slug}`)}>
                      <img src={item.image} alt={item.name} />
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.color}</small>
                      </span>
                    </a>
                    <em>{item.price}</em>
                    <button type="button" aria-label={`Remove ${item.name} from saved items`} onClick={() => removeSavedItem(item)} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2>No saved pieces</h2>
              <p>Tap the bookmark on a product and it will wait here.</p>
              <a className="saved-empty-link" href={`/${locale}/collections/t-shirts`} onClick={visitCollection(`/${locale}/collections/t-shirts`)}>
                Shop T-Shirts
              </a>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
