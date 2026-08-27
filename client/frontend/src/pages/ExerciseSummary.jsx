import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./ExerciseSummary.css";

const ENDING_STATUS = {
  STOPPED: "Stopped",
  ENDED: "Ended",
};

function scoreBand(timeInTune) {
  if (timeInTune >= 80) return { label: "Great job!", tone: "great" };
  if (timeInTune >= 50) return { label: "Nice progress", tone: "good" };
  return { label: "Keep practicing", tone: "practice" };
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds ?? 0));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
}

export default function ExerciseSummary() {
  const { id, exercise_slug } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  if (!state) {
    return (
      <main className="page-container">
        <header className="page-header">
          <h1>Summary unavailable</h1>
          <p className="page-subtitle">
            We couldn't find results for this session — it may have expired or the page was reloaded.
          </p>
        </header>

        <div className="summary-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/")}>
            Home
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/exercises/${id}/${exercise_slug}`)}
          >
            Try this exercise
          </button>
        </div>
      </main>
    );
  }

  const {
    time_in_tune = 0,
    average_deviation = 0,
    exercise_duration = 0,
    exercise_end_status,
  } = state;

  const wasStopped = exercise_end_status === ENDING_STATUS.STOPPED;
  const band = scoreBand(time_in_tune);
  const roundedScore = Math.min(100, Math.max(0, Math.round(time_in_tune)));

  return (
    <main className="page-container">
      <header className="page-header">
        <h1>{wasStopped ? "Exercise stopped" : "Exercise complete"}</h1>
        <p className="page-subtitle">
          {wasStopped
            ? "You ended the exercise early — here's how you did up to that point."
            : "Here's how you did."}
        </p>
      </header>

      <section className="app-card summary-hero">
        <div
          className="summary-progress-circle"
          style={{ "--progress-angle": `${(roundedScore / 100) * 360}deg` }}
        >
          <div className="summary-progress-circle-inner">
            <strong>{roundedScore}%</strong>
            <span>in tune</span>
          </div>
        </div>
        <p className={`summary-band summary-band-${band.tone}`}>{band.label}</p>
      </section>

      <section className="summary-stats-grid">
        <article className="app-card summary-stat-tile">
          <span className="summary-stat-label">Average deviation</span>
          <strong className="summary-stat-value">{average_deviation.toFixed(1)} cents</strong>
        </article>

        <article className="app-card summary-stat-tile">
          <span className="summary-stat-label">Duration</span>
          <strong className="summary-stat-value">{formatDuration(exercise_duration)}</strong>
        </article>

        <article className="app-card summary-stat-tile">
          <span className="summary-stat-label">Status</span>
          <strong className="summary-stat-value">{wasStopped ? "Stopped early" : "Completed"}</strong>
        </article>
      </section>

      <div className="summary-actions">
        <button type="button" className="btn btn-secondary" onClick={() => navigate("/")}>
          Home
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/exercises/${id}/${exercise_slug}`)}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
