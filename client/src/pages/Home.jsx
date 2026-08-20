import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Carousel from "../components/Carousel";


const Home = () => {
  const navigate = useNavigate();
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
          <button type="button" onClick={() => navigate("/dashboard")}>
              Dashboard
          </button>
          <button type="button" onClick={() => navigate("/")}>
            Log out
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