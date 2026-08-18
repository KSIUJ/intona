import {Link} from "react-router-dom";
import {useNavigate} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";

const Login = () => {
    const navigate = useNavigate()

    const getToken = async (formData) => {
        try {
            const response = await fetch("/api/auth/token", {
                method: "POST",
                body: formData, // FormData jest wysyłana bezpośrednio jako body
            });

            if (!response.ok) {
                throw new Error(`Błąd logowania: ${response.status}`);
            }
            navigate("/dashboard")

        } catch (error) {
            console.error("Wystąpił błąd:", error.message);
        }
    }

    const checkIfLoggedIn = async () => {
        try {
            const api_response = await fetch("/api/auth/me", {
                credentials: 'include'
            })

            // for testing purposes only
            if (!api_response.ok) {
                const api_response_error = new Error(`${api_response.statusText}`)
                api_response_error.status = api_response.status
                return api_response_error;
            }

            navigate("/dashboard")
        } catch (error) {
            console.log(`${error.status} ${error.statusText}`)
            throw error;
        }
    }

    const {isLoading} = useQuery({queryKey: ["check"], queryFn: checkIfLoggedIn})


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

                    {/*later when everything is done i will change it to useMutation and mutate, but for now i don't exactly know
        what to do with formData and mutate*/}
                    <form className="login-form" action={getToken}>
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
export default Login;