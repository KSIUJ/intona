import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Carousel from "../components/Carousel";


const Home = () => {
    const navigate = useNavigate()
    const Logout = async () => {
        const response = await fetch(`/api/auth/logout`, {
            credentials: 'include',
            method: 'POST'
        })
        if (!response.ok) {
            console.log(`${response.status} ${response.statusText}`)
        }
        navigate("/")
    }

    const [open, setOpen] = useState(false);

    return (
        <div className="app">
            <header className="site-header-home">
                <Link to={"/home"} className="brand">
                    <span className="brand-icon"></span>
                    <span>INTONA</span>
                </Link>

                <div className="avatar-menu">
                    <button
                        className="avatar-toggle"
                        type="button"
                        onClick={() => setOpen((prev) => !prev)}
                    >
                        <Avatar alt="User avatar" src="avatar.png" className="avatar"/>
                    </button>

                    {open && (
                        <div className="avatar-dropdown">
                            <button type="button">
                                <Link to="/dashboard">Dashboard</Link>
                            </button>
                            <button type="button" onClick={Logout}>
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