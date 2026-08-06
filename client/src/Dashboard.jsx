import "./Dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <button className="sidebar-menu-button" type="button">
          ☰
        </button>

        <nav className="sidebar-navigation">
          <a className="sidebar-link" href="#home">
            <span className="sidebar-icon">★</span>
            <span>Home</span>
          </a>

          <a className="sidebar-link" href="#just-sing">
            <span className="sidebar-icon">★</span>
            <span>Just sing</span>
          </a>

          <a className="sidebar-link active" href="#dashboard">
            <span className="sidebar-icon">★</span>
            <span>Dashboard</span>
          </a>
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-title">
            <button className="back-button" type="button">
              ←
            </button>

            <h1>Dashboard</h1>
          </div>

          <button className="more-button" type="button">
            ⋮
          </button>
        </header>

        <section className="profile-section">
          <div className="user-profile">
            <div className="profile-avatar">
              <span>US</span>
            </div>

            <div className="profile-details">
              <h2>User Name</h2>
              <p>joined 2026-07-20</p>

              <div className="profile-badges">
                <span>Rock Star</span>
                <span>Scale master</span>
              </div>
            </div>
          </div>

          <article className="active-days-card">
            <div className="calendar-icon">▣</div>
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
            <div className="summary-icon">♫</div>
            <strong>G-MAJOR</strong>
            <span>Favourite exercise</span>
          </article>

          <article className="summary-card">
            <div className="summary-icon">◷</div>
            <strong>16 minutes</strong>
            <span>Total practice time</span>
          </article>

          <article className="summary-card">
            <div className="summary-icon">♙</div>
            <strong>2</strong>
            <span>Achievements</span>
          </article>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;