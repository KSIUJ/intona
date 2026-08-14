import "./Dashboard.css";
import { Link } from "react-router-dom";


function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10.5V20h14v-9.5" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function SingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 18V5l10-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      <path d="M8 14h2M14 14h2M8 17h2M14 17h2" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 18V5l10-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function AchievementIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="5" />
      <path d="m8.5 12-1 9 4.5-3 4.5 3-1-9" />
    </svg>
  );
}

function Dashboard() {
  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <button
          className="sidebar-menu-button"
          type="button"
          aria-label="Open menu"
        >
          ☰
        </button>

        <nav className="sidebar-navigation">
          <Link className="sidebar-link" to="/home">
            <span className="sidebar-icon">
              <HomeIcon />
            </span>
            <span>Home</span>
          </Link>

          <Link className="sidebar-link" to="/just-sing">
            <span className="sidebar-icon">
              <SingIcon />
            </span>
            <span>Just sing</span>
          </Link>

          <Link className="sidebar-link active" to="/dashboard">
            <span className="sidebar-icon">
              <DashboardIcon />
            </span>
            <span>Dashboard</span>
          </Link>
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-title">
            <button
              className="back-button"
              type="button"
              aria-label="Go back"
            >
              ←
            </button>

            <h1>Dashboard</h1>
          </div>

          <button
            className="more-button"
            type="button"
            aria-label="More options"
          >
            ⋮
          </button>
        </header>

        <section className="profile-section">
          <div className="user-profile">
            <div className="profile-avatar">
              <span>Us</span>
            </div>

            <div className="profile-details">
              <h2>User</h2>
              <p>joined 2026-07-20</p>

              <div className="profile-badges">
                <span>Rock Star</span>
                <span>Scale master</span>
              </div>
            </div>
          </div>

          <article className="active-days-card">
            <div className="calendar-icon">
              <CalendarIcon />
            </div>

            <strong>3</strong>
            <span>days active</span>
          </article>
        </section>

        <section className="progress-section">
          <article className="progress-item">
            <div className="progress-circle progress-40">
              <div className="progress-circle-inner">
                <strong>40%</strong>
              </div>
            </div>

            <h3>EXERCISES MASTERED</h3>
          </article>

          <article className="progress-item">
            <div className="progress-circle progress-70">
              <div className="progress-circle-inner">
                <strong>70%</strong>
              </div>
            </div>

            <h3>AVERAGE INTONA SCORE</h3>
          </article>

          <article className="progress-item">
            <div className="progress-circle progress-100">
              <div className="progress-circle-inner">
                <strong>100%</strong>
              </div>
            </div>

            <h3>DAYS ACTIVE</h3>
          </article>
        </section>

        <section className="summary-section">
          <article className="summary-card">
            <div className="summary-icon">
              <MusicIcon />
            </div>

            <strong>G-MAJOR</strong>
            <span>Favourite exercise</span>
          </article>

          <article className="summary-card">
            <div className="summary-icon">
              <ClockIcon />
            </div>

            <strong>16 minutes</strong>
            <span>Total practice time</span>
          </article>

          <article className="summary-card">
            <div className="summary-icon">
              <AchievementIcon />
            </div>

            <strong>2</strong>
            <span>Achievements</span>
          </article>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;