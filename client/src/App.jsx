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
  const navItems = ["Home", "Dashboard"];

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
  <div className="min-h-screen">
   <nav >
      <ul className="mx-auto flex max-w-6xl items-center gap-12 h-18">
        {navItems.map((item) => (
          <li key={item}>
            {item}
          </li>
        ))}
      </ul>
   </nav>
   <main>
    <h1>Welcome to Intona!</h1>
    <div className="grid grid-cols-2 gap-8">
    <section>
      <h2>Exercises</h2>

      <ul>
        {exercises.map((exercise) => (
          <li key={exercise}>
            {exercise}
          </li>
        ))}
      </ul>
    </section>
    <section>
    <h2>Songs</h2>
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
function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;