import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const navigate = useNavigate();

    const getToken = async (formData) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/token`, {
            method: "POST",
            body: formData,
        })
        if (!response.ok) {
            throw new Error("Data is not correct");
        }
        const data = await response.json();
        localStorage.setItem("token", `${data.token_type} ${data.access_token}`)
        console.log(`${data.token_type} ${data.access_token}`)
        navigate(``)
    }


    return (
        <form action={getToken}>
            <input type="text" name="username" placeholder="username"></input>
            <input type="password" name="password" placeholder="password"></input>
            <button type="submit">Login</button>
        </form>
    )
}