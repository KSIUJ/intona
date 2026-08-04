import "./App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";

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

function Home() {
 
  const exercises = [
    "G-major scale",
    "Intervals 2-3",
    "Intervals 4-5",
    "Intervals 6-7",
    "Intervals 1-8",
    "C-major scale",
    "F-major scale",
  ]
  const songs = [
    "Song 1",
    "Song 2",
    "Song 3",
    "Song 4",
  ]
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

      <div className="auth-nav">
        <button className="login-link" type="button">
          <Link to="/"> Log in</Link>
        </button>

        <button className="signup-button" type="button">
          Sign up
        </button>
      </div>
    </header>
   <main className="home-page">
    <h1 className="home-header">Welcome to Intona!</h1>
    <div className="selection-boxes">
    <section className="selection-box">
      <h2 className="selection-title"><Link to="/exercises"> Exercises</Link></h2>
      <ul>
        {exercises.map((exercise) => (
          <li key={exercise}>
            {exercise}
          </li>
        ))}
      </ul>
    </section>
    <section className="selection-box">
    <h2 className="selection-title"><Link to="/songs"> Songs</Link></h2>
        <ul>{songs.map((song) => (
          <li key={song}>
            {song}
          </li>
))}
        </ul>
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

function Exercises(){
  return (
    <h1>Exercises</h1>
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
      <Route path="/exercises" element={<Exercises />} />
      <Route path="/songs" element={<Songs />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;