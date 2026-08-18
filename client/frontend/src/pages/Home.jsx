import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Carousel from "../components/Carousel";
import {useMutation, useQuery} from "@tanstack/react-query";


const Home = () => {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false);

    const fetchExerciseTypes = async () => {
        const api_response = await fetch(`/api/exercises/types`)
        if (!api_response.ok) {
            console.log("Error from loading types")
            throw new Error("Error from loading types")
        }
        const response_json = await api_response.json()
        console.log(response_json)
        return response_json
    }

    const Logout = async () => {
        const response = await fetch(`/api/auth/logout`, {
            credentials: 'include',
            method: 'POST'
        })
        if (!response.ok) {
            console.log(`${response.status} ${response.statusText}`)
        }
    }

    const {mutate} = useMutation({
        mutationFn: Logout,
        onSuccess() {
            console.log("successfully logged out")
            navigate("/login")
        },
        onError() {
            console.log("there was an error in logging out")
            navigate("/login")
        }
    })

    const {data: exercise_types} = useQuery({
        queryKey: ["exercises"],
        queryFn: fetchExerciseTypes,
        staleTime: Infinity
    })


    return (
        <div className="app">
            <header className="site-header-home">
                <Link to={"/"} className="brand">
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
                            <button type="button" onClick={mutate}>
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main>
                {exercise_types?.map((exercise_type) => {
                    return <section>
                        <Carousel type={exercise_type.type}/>
                    </section>
                })}
            </main>
        </div>
    );
};

export default Home;