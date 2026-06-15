export default function AdminSettingsPage() {
  return (
    <main className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span>Backoffice</span>
          <h1>Settings</h1>
        </div>
        <p>Manage shop details, bank account, minimum stock, and admin configuration.</p>
      </div>
      <section className="admin-panel">
        <div className="admin-empty-state">
          <strong>Settings are owner-only</strong>
          <p>These controls will be connected after the admin role model is confirmed.</p>
        </div>
      </section>
    </main>
  );
}
