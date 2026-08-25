import {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import Avatar from "@mui/material/Avatar";

import {checkIfLoggedIn} from "../utils/utils.js";
import Carousel from "../components/Carousel";
import CarouselSkeleton from "../components/CarouselSkeleton.jsx";
import FormDialog from "../components/FormDialog.jsx";


function AddButton() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12 5V19M5 12H19"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

const generateTemplate = (type) => {
        return {
            "id": crypto.randomUUID(),
            "type": type,
            "exercise_name": "",
            "filter": {"name": "", "difficulties": {"Easy": true, "Medium": true, "Hard": true}, "rating": [0, 100]}
        }
    }

const Home = () => {

    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [carouselAddingSettings, setCarouselAddingSettings] = useState(() => {
            const array = JSON.parse(localStorage.getItem("carousel_settings"))
            return array ? array : {
                "selected_carousels": [
                    generateTemplate("Song"), generateTemplate("Exercise")
                ]
            }
        }
    )



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

    useEffect(() => {
        console.log(JSON.stringify(carouselAddingSettings))
        localStorage.setItem("carousel_settings", JSON.stringify(carouselAddingSettings))
    }, [carouselAddingSettings])

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
                {(isLoading) && Array.from(Array(carouselAddingSettings.selected_carousels.length)).map((_, index) => {
                    return <section>
                        <CarouselSkeleton/>
                    </section>
                })}

                {(!isLoading || isSuccess) && carouselAddingSettings.selected_carousels?.map((exercise_info, index) => {
                    return <section key={exercise_info.id}>
                        <Carousel info={exercise_info} setCarouselAddingSettings={setCarouselAddingSettings}/>
                    </section>
                })}
                <button className="add-button" onClick={(e) => {
                    e.currentTarget.blur();
                    setOpenDialog(true);
                }}>
                    <AddButton/>
                </button>
                <FormDialog open={openDialog} setOpen={setOpenDialog} setSettingsObject={setCarouselAddingSettings}
                            typesAvailable={exercise_types}/>
            </main>
        </div>
    );
};

export default Home;