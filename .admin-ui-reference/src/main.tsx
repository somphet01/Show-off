import "./styles/index.css";

async function loadAdminData() {
  try {
    const response = await fetch("/api/admin/reference-data", { cache: "no-store" });
    if (!response.ok) {
      applyUrlInitialState();
      return;
    }

    const script = await response.text();
    Function(script)();
  } catch (error) {
    console.warn("Admin live data unavailable, using bundled mock data.", error);
  } finally {
    applyUrlInitialState();
  }
}

function applyUrlInitialState() {
  const params = new URLSearchParams(window.location.search);
  const initialPage = params.get("initialPage");
  const initialSelectedId = params.get("initialSelectedId");

  window.__SHOW_OFF_ADMIN_DATA__ = {
    ...(window.__SHOW_OFF_ADMIN_DATA__ ?? {}),
    ...(initialPage ? { initialPage } : {}),
    initialSelectedId: initialSelectedId || null,
  };
}

async function bootstrap() {
  await loadAdminData();

  const [{ createRoot }, { default: App }] = await Promise.all([
    import("react-dom/client"),
    import("./app/App.tsx"),
  ]);

  createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
