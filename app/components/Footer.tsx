import type { Dictionary, Locale } from "../lib/i18n";

function PhoneIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M7.5 4.5 10 9l-1.7 1.7c1.1 2.1 2.8 3.8 5 5l1.8-1.7 4.4 2.5-1.2 3c-.3.7-.9 1-1.6.9C9.6 19.6 4.4 14.4 3.6 7.3c-.1-.7.2-1.3.9-1.6l3-1.2Z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M4.5 5.5h15v10h-8L7 19v-3.5H4.5v-10Z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M14 8.5h2V5h-2.7C10.8 5 9.5 6.5 9.5 8.8V11H7v3.4h2.5V20H13v-5.6h2.5L16 11h-3V9.2c0-.5.3-.7 1-.7Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M14 4c.4 2.7 1.8 4.2 4.5 4.5v3.1c-1.7 0-3.2-.5-4.5-1.4v5.1c0 3-2 4.9-5 4.9-2.5 0-4.5-1.8-4.5-4.3s2-4.3 4.7-4.3c.4 0 .8 0 1.1.1v3.2c-.3-.1-.6-.2-1-.2-1 0-1.6.5-1.6 1.3s.6 1.3 1.5 1.3c1 0 1.5-.7 1.5-1.8V4H14Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M4.5 6.5h15v11h-15v-11Z" />
      <path d="m5 7 7 6 7-6" />
    </svg>
  );
}

const contacts = [
  { label: "Call", value: "+8562056320988", href: "tel:+8562056320988", icon: <PhoneIcon /> },
  { label: "WhatsApp", value: "+8562056320988", href: "https://wa.me/8562056320988", icon: <ChatIcon /> },
  { label: "Facebook", value: "SHOW OFF", href: "https://www.facebook.com/profile.php?id=100089116444087", icon: <FacebookIcon /> },
  { label: "TikTok", value: "@show_off1", href: "https://www.tiktok.com/@show_off1?lang=en", icon: <TikTokIcon /> },
  { label: "Gmail", value: "showoff.official@gmail.com", href: "mailto:showoff.official@gmail.com", icon: <MailIcon /> },
];

export function Footer({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  return (
    <footer className="footer" aria-label="SHOW OFF store contact">
      <div className="footer-brand">
        <h2>SHOW OFF</h2>
        <p>{dictionary.footer.description}</p>
      </div>

      <div className="footer-contact">
        <h3>Contact SHOW OFF</h3>
        <div className="footer-contact-grid">
          {contacts.map((contact) => (
            <a href={contact.href} target={contact.href.startsWith("http") ? "_blank" : undefined} rel={contact.href.startsWith("http") ? "noreferrer" : undefined} key={contact.label}>
              <span>{contact.icon}</span>
              <small>{contact.label}</small>
              <strong>{contact.value}</strong>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
