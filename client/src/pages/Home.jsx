import { useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Carousel from "../components/Carousel";


const Home = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="app">
      <header className="site-header-home">
        <a className="brand" href="#home">
          <span className="brand-icon"></span>
          <span>INTONA</span>
        </a>

        <div className="avatar-menu">
          <button
            className="avatar-toggle"
            type="button"
            onClick={() => setOpen((prev) => !prev)}
          >
            <Avatar alt="User avatar" src="avatar.png" className="avatar" />
          </button>

          {open && (
            <div className="avatar-dropdown">
              <button type="button">
                <Link to="/dashboard">Dashboard</Link>
              </button>
              <button type="button">
                <Link to="/">Log out</Link>
              </button>
            </div>
          )}
        </div>
      </header>

      <main>
        <section>
          <Carousel isSong={false} title="Exercises" />
        </section>

        <section>
          <Carousel isSong={true} title="Songs" />
        </section>
      </main>
    </div>
  );
};

export default Home;