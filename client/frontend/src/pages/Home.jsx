import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import Avatar from "@mui/material/Avatar";

import {checkIfLoggedIn} from "../utils/utils.js";
import Carousel from "../components/Carousel";
import CarouselSkeleton from "../components/CarouselSkeleton.jsx";




const Home = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false);

    const fetchExerciseTypes = async () => {
        const api_response = await fetch(`/api/public/exercises/types`)
        if (!api_response.ok) {
            const errorText = await response.text();
            console.error("error message:", errorText);

            const api_response_error = new Error(errorText);
            api_response_error.status = response.status;
            throw api_response_error;
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
            const errorText = await response.text();
            console.error("error message:", errorText);

            console.log(errorText)
        }
    }

    const {data: exercise_types} = useQuery({
        queryKey: ["exercise_types"],
        queryFn: fetchExerciseTypes,
        staleTime: Infinity,
        refetchOnWindowFocus: false
    })

    const {isSuccess, isLoading, isError} = useQuery({
        queryKey: ["logged_check"],
        queryFn: checkIfLoggedIn,
        retry: false,
        refetchOnWindowFocus: (query) => {
            return query.state.status !== 'error';
        }
    })

    const {mutate} = useMutation({
        mutationFn: Logout,
        onSuccess() {
            console.log("successfully logged out")
            queryClient.invalidateQueries({queryKey: ["logged_check"]})
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

                {isSuccess &&
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

                                <>
                                    <button type="button">
                                        <Link to="/dashboard">Dashboard</Link>
                                    </button>

                                    <button type="button" onClick={mutate}>
                                        Sign out
                                    </button>
                                </>
                            </div>)}
                    </div>}
                {isError && <div className="auth-nav">
                    <Link to={"/login"} className="login-link" type="button">
                        Log in
                    </Link>

                    <Link to={"/sign_up"} className="signup-button" type="button">
                        Sign up
                    </Link>
                </div>}
            </header>

            <main>
                {isLoading && Array.from(Array(2)).map((_, index) => {
                    return <section>
                        <CarouselSkeleton/>
                    </section>
                })}

                {!isLoading && exercise_types?.map((exercise_type) => {
                    return <section>
                        <Carousel type={exercise_type.type}/>
                    </section>
                })}
            </main>
        </div>
    );
};

export default Home;