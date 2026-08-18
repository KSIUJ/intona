import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import Avatar from "@mui/material/Avatar";

import {checkIfLoggedIn} from "../utils/utils.js";
import Carousel from "../components/Carousel";


const Home = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false);

    const fetchExerciseTypes = async () => {
        const api_response = await fetch(`/api/public/exercises/types`)
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

    const {data: exercise_types} = useQuery({
        queryKey: ["exercises"],
        queryFn: fetchExerciseTypes,
    })

    const {isSuccess, isError} = useQuery({
        queryKey: ["logged_check"],
        queryFn: checkIfLoggedIn,
        retry: false
    })

    const {mutate} = useMutation({
        mutationFn: Logout,
        onSuccess() {
            console.log("successfully logged out")
            queryClient.invalidateQueries({ queryKey: ["logged_check"] })
            navigate("/login")
        },
        onError() {
            console.log("there was an error in logging out")
            navigate("/login")
        }
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
                            {isSuccess &&
                                <>
                                    <button type="button">
                                        <Link to="/dashboard">Dashboard</Link>
                                    </button>

                                    <button type="button" onClick={mutate}>
                                        Sign out
                                    </button>
                                </>}
                            {isError && <button type="button" onClick={() => navigate("/login")}>
                                Sign in
                            </button>}
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