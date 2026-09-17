import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { HOME_ROUTE } from "../utils/constants.js";

export default function NotFound() {
  const { user } = useAuth();
  const home = user ? HOME_ROUTE[user.role] || "/login" : "/login";

  return (
    <div className="auth-screen">
      <div className="card auth-card" style={{ textAlign: "center" }}>
        <h1>Page not found</h1>
        <p className="page__subtitle" style={{ marginBottom: 18 }}>
          That page does not exist or you do not have access to it.
        </p>
        <Link className="button" to={home}>
          Go back
        </Link>
      </div>
    </div>
  );
}
