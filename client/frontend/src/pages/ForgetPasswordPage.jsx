import {Link, useNavigate, useSearchParams} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import {useMutation} from "@tanstack/react-query";
import "./ForgetPassword.css"

const ForgetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams()
    const [email_value, setEmailValue] = useState(searchParams.get("email") || '')
    const [digits_arr, setDigitsArr] = useState([])
    const [is_resetting, setIsResetting] = useState(false)
    const [confirm_password_value, setConfirmPasswordValue] = useState('')
    const [new_password_value, setNewPasswordValue] = useState('')
    const [token_payload, setPayload] = useState('')
    const isFocused = useRef(false)

    const mutate_send_request = useMutation({
        mutationFn: (data) => sendRequest(data),
        onSuccess() {
            setIsResetting(true)
        },
        onError(error) {
            console.log(error.message)
        }
    })

    const mutate_handle_verify = useMutation({
        mutationFn: (data) => verifyCode(data),
        onSuccess(data) {
            console.log("Correct Code was typed in")
            setPayload(data.payload)
        },
        onError() {
            console.log("Wrong code was typed in")
        }
    })

    const mutate_handle_password_change = useMutation({
        mutationFn: (data) => resetPassword(data),
        onSuccess() {
            console.log("Password was correctly changed")
            navigate("/login")
        },
        onError() {
            console.log("Token wasn't correct or is expired")
            navigate("/login")
        }
    })

    const handleRequest = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = Object.fromEntries(formData.entries())
        console.log(`${JSON.stringify(data)} 1`)
        mutate_send_request.mutate(data)
    }

    const handleVerification = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        let payload = Array.from(formData.values()).join('')
        console.log(`${payload}!!!`)
        let data = Object.fromEntries(formData)
        data.payload = payload
        data.email = email_value
        console.log(`${JSON.stringify(data)} 2`)
        mutate_handle_verify.mutate(data)
    }

    const handlePasswordChange = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        let data = Object.fromEntries(formData.entries())
        data.email = email_value
        data.payload = token_payload
        // later we will check new password and old password equality
        data.new_password = new_password_value
        console.log(`${JSON.stringify(data)} 3`)
        mutate_handle_password_change.mutate(data)
    }
    const sendRequest = async (data) => {
        const api_response = await fetch(`/api/public/email/request_reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

        if (!api_response.ok) {
            const api_error_text = await api_response.text()
            const api_error = new Error(api_error_text)
            api_error.status = api_response.status
            throw api_error
        }

        const api_response_json = await api_response.json()
        return api_response_json
    }

    const verifyCode = async (data) => {
        const api_response = await fetch(`/api/public/email/verify_code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

        if (!api_response.ok) {
            const api_error_text = await api_response.text()
            const api_error = new Error(api_error_text)
            api_error.status = api_response.status
            throw api_error
        }

        const api_response_json = await api_response.json()
        return api_response_json
    }

    const resetPassword = async (data) => {
        const api_response = await fetch(`/api/public/email/reset_password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

        if (!api_response.ok) {
            const api_error_text = await api_response.text()
            const api_error = new Error(api_error_text)
            api_error.status = api_response.status
            throw api_error
        }

        const api_response_json = await api_response.json()
        return api_response_json
    }


    const handleKeyDownEvent = (e) => {
        try {
            let key = e.key
            if (key === 'Backspace') {
                setDigitsArr((prev_arr) =>
                    prev_arr.slice(0, prev_arr.length - 1)
                )
            } else {
                key = parseInt(key)
                if (Number.isInteger(key)) {
                    setDigitsArr((prev_arr) => {
                            if (prev_arr.length >= 6) {
                                return prev_arr
                            }
                            return [
                                ...prev_arr,
                                key
                            ]
                        }
                    )
                }
            }
        } catch (e) {
            throw e
        }
    }

    const handlePasteEvent = (e) => {
        e.preventDefault()
        let paste = (e.clipboardData || window.clipboardData).getData("text");
        console.log("test")

        console.log(isFocused.current)
        console.log(paste.length)
        if (isFocused.current === true && paste.length === 6) {
            for (let i = 0; i < 6; i++) {
                console.log(parseInt(paste[i]))
                if (!Number.isInteger(parseInt(paste[i]))) {
                    return
                }
            }
            console.log(Array.from(paste).map((e) => parseInt(e)))
            setDigitsArr(Array.from(paste).map((e) => parseInt(e)))

        }
    }


    useEffect(() => {
        if (is_resetting) {
            window.addEventListener('keydown', handleKeyDownEvent)
            window.addEventListener('paste', handlePasteEvent)
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDownEvent)
            window.removeEventListener('paste', handlePasteEvent)
        }
    }, [is_resetting])

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
                    {((mutate_send_request.isIdle || mutate_send_request.isError || mutate_send_request.isPending)) &&
                        <>
                            <header className="login-header">
                                <h1>Password reset</h1>
                                <p>Please write your log in email</p>
                            </header>

                            {/*later when everything is done i will change it to useMutation and mutate, but for now i don't exactly know
        what to do with formData and mutate*/}

                            <form className="login-form" onSubmit={handleRequest}>
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        required
                                        value={email_value}
                                        onChange={(e) => setEmailValue(e.target.value)}
                                    />
                                </div>

                                <button className="sign-in-button" type="submit">
                                    Send reset code
                                </button>
                            </form>
                        </>}
                    {(mutate_send_request.isSuccess && (mutate_handle_verify.isIdle || mutate_handle_verify.isError || mutate_handle_verify.isPending)) && <>
                            <h1 style={{textAlign: "center"}}>Password reset send for {email_value}</h1>
                            <form onSubmit={handleVerification} className="verification-card">
                                <p className="verification-title">Write verification code below</p>
                                <div className="code-inputs-wrapper">
                                    {Array.from(Array(6)).map((_, index) => {
                                        // someone with more taste than me can set styles to it
                                        return <input key={index} id={index.toString()}
                                                      className={"code-input"}
                                                      name={"payload"}
                                                      type={"text"}
                                                      inputMode="numeric"
                                                      value={Number.isInteger(digits_arr?.[index]) ? digits_arr?.[index] : ''}
                                                      required={true}
                                                      onBlur={() => isFocused.current = false}
                                                      onFocus={() => isFocused.current = true}
                                        />
                                    })}
                                </div>


                                <button className="verify-btn" type="submit">
                                    Verify
                                </button>
                            </form>


                    </>}
                    {mutate_handle_verify.isSuccess && <>
                        <form className="login-form" onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label htmlFor="email">Old password</label>

                                <input
                                    id="old_password"
                                    name="old_password"
                                    type="old_password"
                                    placeholder="Enter your new_password"
                                    required
                                    value={new_password_value}
                                    onChange={(e) => setNewPasswordValue(e.target.value)}
                                />

                                <label htmlFor="email">New password</label>
                                <input
                                    id="new_password"
                                    name="new_password"
                                    type="new_password"
                                    placeholder="Confirm your new password"
                                    required
                                    value={confirm_password_value}
                                    onChange={(e) => setConfirmPasswordValue(e.target.value)}
                                />
                            </div>

                            <button className="sign-in-button" type="submit">
                                Send reset code
                            </button>
                        </form>
                    </>}
                </section>
            </main>
        </div>
    )
        ;
}

export default ForgetPasswordPage