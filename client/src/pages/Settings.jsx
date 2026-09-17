import { useAuth } from "../hooks/useAuth.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function Settings() {
  useDocumentTitle("Settings");
  const { user } = useAuth();
  const role = user?.role === "ADMIN" ? "Administrator" : "Employee";

  return (
    <div className="stack settings-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">WORKSPACE</p>
          <h1>Settings</h1>
          <p className="page__subtitle">Review your workspace account settings.</p>
        </div>
      </div>
      <section className="card settings-section">
        <div className="card__header"><div><h2>Profile</h2><p className="panel__text">Managed by your account administrator.</p></div></div>
        <div className="card__body detail-list">
          <div className="detail-list__item"><span className="detail-list__label">Name</span><strong>{user?.name || "-"}</strong></div>
          <div className="detail-list__item"><span className="detail-list__label">Email</span><strong>{user?.email || "-"}</strong></div>
          <div className="detail-list__item"><span className="detail-list__label">Role</span><strong>{role}</strong></div>
        </div>
      </section>
      <section className="card settings-section">
        <div className="card__header"><div><h2>Security</h2><p className="panel__text">Password and authentication are managed by the existing sign-in flow.</p></div></div>
        <div className="card__body"><p className="inline-note">No additional security actions are available for this account.</p></div>
      </section>
    </div>
  );
}
