import {Link} from "react-router-dom";
import {useNavigate} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {checkIfLoggedIn} from "../utils/utils.js";
import {useEffect} from "react";

const SignUp = () => {

    const navigate = useNavigate()
    useQueryClient();
    const {isSuccess, isLoading} = useQuery({
        queryKey: ["check"], queryFn: checkIfLoggedIn, retry: false,
        staleTime: 1000 * 60 * 60, // 1 hour in ms
        cacheTime: 1000 * 60 * 60, // 1 hour in ms
        refetchOnWindowFocus: false,
    })

    const {mutate} = useMutation({
        mutationFn: (formData) => handleRegistering(formData),
        onSuccess(data) {
            // someone will need to show popups that indicate register success (someone with more taste than me)
            console.log(`successful registering: ${data}`)
            navigate("/login")
        },
        onError(error) {
            console.log(`${error.status} ${error.message}`)
        }
    })


    const handleRegistering = async (formData) => {
        console.log(Object.fromEntries(formData.entries()));
        const api_response = await fetch('/api/public/auth/register', {
            method: 'POST',
            body: formData
        })

        if (!api_response.ok) {
            const errorText = await api_response.text();
            console.error("error message:", errorText);

            const api_response_error = new Error(errorText);
            api_response_error.status = api_response.status;
            throw api_response_error;
        }

        const api_response_json = await api_response.json()
        return api_response_json


    }

    const handleSubmit = (event) => {
        event.preventDefault()
        mutate(new FormData(event.target))
    }

    useEffect(() => {
        if (isSuccess) {
            navigate("/dashboard")
        }
    }, [isSuccess]);

    if (isLoading) {
        return <>LOADING</>
    }

    return (
        <div className="app">
            <header className="site-header">
                <Link to={"/"} className="brand">
                    <span className="brand-icon"></span>
                    <span>INTONA</span>
                </Link>

                <nav className="main-nav">
                    <Link to="/"> Home</Link>
                    <Link to="/about">About us</Link>
                    <Link to="/contact">Contact</Link>
                </nav>

                <div className="auth-nav">
                    <Link to={"/login"} className="login-link" type="button">
                        Log in
                    </Link>

                    <Link to={"/sign_up"} className="signup-button" type="button">
                        Sign up
                    </Link>
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

                    {/*later when everything is done i will change it to useMutation and mutate, but for now i don't exactly know
        what to do with formData and mutate*/}
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">username</label>

                            <input
                                id="username"
                                name="username"
                                type="username"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

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
                                <input type="checkbox" name="remember"/>
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
export default SignUp;