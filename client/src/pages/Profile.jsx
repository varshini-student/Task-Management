import { useAuth } from "../hooks/useAuth.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { initials } from "../utils/format.js";

export default function Profile() {
  useDocumentTitle("Profile");
  const { user } = useAuth();
  const role = user?.role === "ADMIN" ? "Administrator" : "Employee";

  return (
    <div className="stack profile-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">ACCOUNT</p>
          <h1>Profile</h1>
          <p className="page__subtitle">Your account information and access level.</p>
        </div>
      </div>
      <section className="card profile-card">
        <div className="profile-card__hero">
          <span className="avatar avatar--large">{initials(user?.name || "")}</span>
          <div>
            <h2>{user?.name || "Account"}</h2>
            <p className="page__subtitle">{role}</p>
          </div>
        </div>
        <div className="detail-list profile-card__details">
          <div className="detail-list__item"><span className="detail-list__label">Full name</span><strong>{user?.name || "-"}</strong></div>
          <div className="detail-list__item"><span className="detail-list__label">Email</span><strong>{user?.email || "-"}</strong></div>
          <div className="detail-list__item"><span className="detail-list__label">Role</span><strong>{role}</strong></div>
        </div>
      </section>
    </div>
  );
}
