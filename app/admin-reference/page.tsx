import styles from "./page.module.css";

export default function AdminReferencePreviewPage() {
  return (
    <main className={styles.screen}>
      <iframe
        className={styles.frame}
        src="/admin-static/index.html"
        title="SHOW OFF Admin reference preview"
      />
    </main>
  );
}
