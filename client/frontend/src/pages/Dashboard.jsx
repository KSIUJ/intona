import "./Dashboard.css";
import {Link, useNavigate} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";




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
            <path d="M3 11.5 12 4l9 7.5"/>
            <path d="M5 10.5V20h14v-9.5"/>
            <path d="M9 20v-6h6v6"/>
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
            <path d="M9 18V5l10-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="16" cy="16" r="3"/>
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
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
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
            <rect x="3" y="5" width="18" height="16" rx="2"/>
            <path d="M8 3v4M16 3v4M3 10h18"/>
            <path d="M8 14h2M14 14h2M8 17h2M14 17h2"/>
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
            <path d="M9 18V5l10-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="16" cy="16" r="3"/>
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
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 7v5l3 2"/>
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
            <circle cx="12" cy="8" r="5"/>
            <path d="m8.5 12-1 9 4.5-3 4.5 3-1-9"/>
        </svg>
    );
}

function Dashboard() {
    const fetchUserStats = async () => {
        const api_response = await fetch(`/api/user/stats`, {
            credentials: 'include'
        })

        if (!api_response.ok) {
            const errorText = await api_response.text();
            console.error("error message:", errorText);

            const api_response_error = new Error(errorText);
            api_response_error.status = api_response.status;
            throw api_response_error;
        }

        const api_response_json = await api_response.json()

        const joining_date = new Date(api_response_json.user.joined_at)
        const current_date = new Date;
        const diffTime = Math.abs(current_date - joining_date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let active_days_percentage;
        if (diffDays === 0) {
            active_days_percentage = 100
        } else {
            active_days_percentage = (api_response_json.days_active / diffDays) * 100
        }


        let total_seconds = parseInt(api_response_json.total_practice_time);

        let years = Math.floor(total_seconds / (60 * 60 * 24 * 30 * 365))
        total_seconds -= years * (60 * 60 * 24 * 30 * 365)
        let months = Math.floor(total_seconds / (60 * 60 * 24 * 30))
        total_seconds -= months * (60 * 60 * 24 * 30)
        let days = Math.floor(total_seconds / (60 * 60 * 24))
        total_seconds -= days * (60 * 60 * 24)
        let hours = Math.floor(total_seconds / (60 * 60))
        total_seconds -= hours * (60 * 60)
        let minutes = Math.floor(total_seconds / (60))
        total_seconds -= minutes * (60)
        let seconds = total_seconds

        // i can also use array to iterate between strings
        api_response_json.time_string = `${years !== 0 ? years : ""}${years !== 0 ? " years " : ""}
        ${months !== 0 ? months : ""}${months !== 0 ? " months " : ""}
        ${hours !== 0 ? hours : ""}${hours !== 0 ? " hours " : ""}
        ${minutes !== 0 ? minutes : ""}${minutes !== 0 ? " minutes " : ""}
        ${seconds !== 0 ? seconds : ""}${seconds !== 0 ? " seconds" : ""}`

        api_response_json.user.joined_at = new Date(api_response_json.user.joined_at).toLocaleDateString()
        api_response_json.active_days_percentage = active_days_percentage.toFixed(2)


        return api_response_json

    }


    const {data: stats, isError, isLoading} = useQuery({queryKey: ["dashboard"], queryFn: fetchUserStats})

    if (isError) {
        return <>ERROR</>
    }

    if (isLoading) {
        return <></>
    }

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
                    <Link className="sidebar-link" to="/">
            <span className="sidebar-icon">
              <HomeIcon/>
            </span>
                        <span>Home</span>
                    </Link>

                    <Link className="sidebar-link" to="/just-sing">
            <span className="sidebar-icon">
              <SingIcon/>
            </span>
                        <span>Just sing</span>
                    </Link>

                    <Link className="sidebar-link active" to="/dashboard">
            <span className="sidebar-icon">
              <DashboardIcon/>
            </span>
                        <span>Dashboard</span>
                    </Link>
                </nav>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-topbar">
                    <div className="dashboard-title">
                        <Link to={"/"}>
                            <button
                                className="back-button"
                                type="button"
                                aria-label="Go back"
                            >
                                ←
                            </button>
                        </Link>


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
                            <h2>{stats.user.username}</h2>
                            <p>joined {stats.user.joined_at}</p>

                            <div className="profile-badges">
                                <span>Rock Star</span>
                                <span>Scale master</span>
                            </div>
                        </div>
                    </div>

                    <article className="active-days-card">
                        <div className="calendar-icon">
                            <CalendarIcon/>
                        </div>

                        <strong>{stats.days_active}</strong>
                        <span>days active</span>
                    </article>
                </section>

                <section className="progress-section">
                    <article className="progress-item">
                        <div className="progress-circle progress" style={{ "--progress": `${stats.mastered_percentage * 3.6}deg` }}>
                            <div className="progress-circle-inner">
                                <strong>{stats.mastered_percentage.toFixed(2)}%</strong>
                            </div>
                        </div>

                        <h3>EXERCISES MASTERED</h3>
                    </article>

                    <article className="progress-item">
                        <div className="progress-circle progress" style={{ "--progress": `${stats.average_score * 3.6}deg` }}>
                            <div className="progress-circle-inner">
                                <strong>{stats.average_score.toFixed(2)}%</strong>
                            </div>
                        </div>

                        <h3>AVERAGE INTONA SCORE</h3>
                    </article>

                    <article className="progress-item">
                        <div className="progress-circle progress" style={{ "--progress": `${stats.active_days_percentage * 3.6}deg` }}>
                            <div className="progress-circle-inner">
                                <strong>{stats.active_days_percentage}%</strong>
                            </div>
                        </div>

                        <h3>DAYS ACTIVE</h3>
                    </article>
                </section>

                <section className="summary-section">
                    {stats.exercise &&
                        <article className="summary-card">
                            <div className="summary-icon">
                                <MusicIcon/>
                            </div>

                            <strong>{stats.exercise?.exercise_name}</strong>
                            <span>Favourite exercise</span>
                        </article>
                    }
                    <article className="summary-card">
                        <div className="summary-icon">
                            <ClockIcon/>
                        </div>

                        <strong>{stats.time_string}</strong>
                        <span>Total practice time</span>
                    </article>

                    <article className="summary-card">
                        <div className="summary-icon">
                            <AchievementIcon/>
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