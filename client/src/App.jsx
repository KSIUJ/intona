import "./App.css";
import { BrowserRouter, Routes, Route, Link} from "react-router-dom";
import { useParams } from "react-router-dom";
import { useState } from 'react';
import Carousel from "./components/Carousel";
import Avatar from '@mui/material/Avatar';



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
  const [open, setOpen] = useState(false);
  return (
    <div className="app">
      <header className="site-header-home">
        <a className="brand" href="#home">
        <span className="brand-icon"></span>
        <span>INTONA</span>
        
      </a>
      <div className="avatar-menu">
        <button className="avatar-toggle" type="button" onClick={()=> setOpen((prev) => !prev)}>
        <Avatar alt="User avatar" src="/avatar.png" className="avatar"/>
         </button>
          {open && (
          <div className="avatar-dropdown">
            <button type="button"><Link to="/dashboard">Dashboard</Link></button>
            <button type="button"><Link to="/"> Log out</Link></button> 
          </div>

         )}      
      </div>
      </header>

      <main>
        <section>
          <div>
            <Carousel isSong={false} title="Exercises"/>
          </div>
        </section>

        <section>
          <div>
            <Carousel isSong={true} title="Songs"/>
          </div>
        </section>
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