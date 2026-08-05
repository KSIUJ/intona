import "./App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { DataGrid } from '@mui/x-data-grid';
import { ExerciseTable } from "./Selection";
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';

function Login(){
  function handleSubmit(event) {
    event.preventDefault();
  }
  return (
  <div className="app">
    <header className="site-header">
      <a className="brand" href="#home">
        <span className="brand-icon"></span>
        <span>INTONA</span>
      </a>

      <nav className="main-nav">
        <Link to="/home"> Home</Link>
        <Link to="/about">About us</Link>
        <Link to="/contact">Contact</Link>
      </nav>

      <div className="auth-nav">
        <button className="login-link" type="button">
          Log in
        </button>

        <button className="signup-button" type="button">
          Sign up
        </button>
      </div>
    </header>

    <main className="login-page">
      <section className="login-card">
        <div className="login-logo" aria-hidden="true">
          <span className="login-logo-shape"></span>
        </div>
        <header className="login-header">
          <h1>Log in to your account</h1>
          <p>Welcome back! Please enter your details.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>
            <div className="form-options">
              <label className="remember-option">
                <input type="checkbox" name="remember" />
                <span>Remember for 30 days</span>
              </label>

              <button className="forgot-password" type="button">
                Forgot password
              </button>
            </div>

          <button className="sign-in-button" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  </div>
);

}


function ExercisePage() {
  const { exerciseSlug } = useParams();

  return (
    <main>
      <h1>Exercise page</h1>
      <p>Selected exercise: {exerciseSlug}</p>
    </main>
  );
}
function SongsPage() {
  const { songsSlug } = useParams();

  return (
    <main>
      <h1>Songs page</h1>
      <p>Selected song: {songsSlug}</p>
    </main>
  );
}

function Home() {
  
 const exercises = [
  { id:1, title: "G-major scale", slug: "g-major-scale", difficulty: "Easy", rating: "100%" },
  { id:2, title: "C-major scale", slug: "c-major-scale" , difficulty: "Easy", rating: "100%"},
  { id:3, title: "F-major scale", slug: "f-major-scale" , difficulty: "Easy", rating: "100%"},
  { id:4, title: "Intervals 2-3", slug: "intervals-2-3" , difficulty: "Medium", rating: "90%"},
  { id:5, title: "Intervals 4-5", slug: "intervals-4-5" , difficulty: "Medium", rating: "95%"},
  { id:6, title: "Intervals 6-7", slug: "intervals-6-7" , difficulty: "Medium", rating: "97%"},
  { id:7, title: "Intervals 1-8", slug: "intervals-1-8" , difficulty: "Hard", rating: "50%"},
];
const songs = [
  { id: 1, title: "Song 1", slug: "song-1", difficulty: "Easy", rating: "100%" },
  { id: 2, title: "Song 2", slug: "song-2", difficulty: "Easy", rating: "100%" },
  { id: 3, title: "Song 3", slug: "song-3", difficulty: "Easy", rating: "100%" },
  { id: 4, title: "Song 4", slug: "song-4", difficulty: "Medium", rating: "90%" },
  { id: 5, title: "Song 5", slug: "song-5", difficulty: "Medium", rating: "95%" },
  { id: 6, title: "Song 6", slug: "song-6", difficulty: "Medium", rating: "97%" },
  { id: 7, title: "Song 7", slug: "song-7", difficulty: "Hard", rating: "50%" },
];
  
  return (
  <div className="app">
    <header className="site-header">
      <a className="brand" href="#home">
        <span className="brand-icon"></span>
        <span>INTONA</span>
      </a>

      <nav className="main-nav">
        <Link to="/dashboard"> Dashboard</Link>
        <Link to="/exercises"> Exercises</Link>
        <Link to="/songs"> Songs</Link>
      </nav>
      <Avatar className = "avatar" alt="Remy Sharp" src="/static/images/avatar/1.jpg" />

    </header>
   <main className="home-page">
    <div className="home-header">
    <h1 className="signup-button">INTONA</h1>
    <h1 className="home-header">learn to be in tune!</h1>
    </div>
    <div className="selection-boxes">
    <section className="selection-box">
      <h2 className="selection-title"><Link to="/exercises">Exercises</Link></h2>
      <h3><ExerciseTable isSong={false} /></h3>
    </section>
    <section className="selection-box">
    <h2 className="selection-title"><Link to="/songs"> Songs</Link></h2>
    <h3><ExerciseTable isSong={true} /></h3>

</section>
</div>
   </main>
  </div>
  
  );
}

function About() {
  return (
    <h1>About</h1>
  );
}

function Contact(){
  return (
    <h1>Contact</h1>
  );
}

function Dashboard(){
    return (
    <h1>Dashboard</h1>
  );
}



function Songs(){
  return (
    <h1>Songs</h1>
  );
}
function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/exercises" element={<ExercisePage />} />
      <Route path="/exercises/:exerciseSlug" element={<ExercisePage />} />
      <Route path="/songs" element={<Songs />} />
      <Route path="/songs/:songsSlug" element={<SongsPage />} />

    </Routes>
    </BrowserRouter>
  );
}

export default App;