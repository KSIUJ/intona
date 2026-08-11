import '../App.css'

export default function LoginPage() {

    const getToken = async (formData) => {
        try {
            const response = await fetch("/api/auth/token", {
                method: "POST",
                body: formData, // FormData jest wysyłana bezpośrednio jako body
            });

            if (!response.ok) {
                throw new Error(`Błąd logowania: ${response.status}`);
            }

        } catch (error) {
            console.error("Wystąpił błąd:", error.message);
        }
    }


    return <div className="app">
        <header className="site-header">
            <a className="brand" href="#home">
                <span className="brand-icon"></span>
                <span>INTONA</span>
            </a>

            <nav className="main-nav">
                <a href="#home">Home</a>
                <a href="#about">About us</a>
                <a href="#contact">Contact</a>
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
}