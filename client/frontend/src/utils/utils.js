const checkIfLoggedIn = async () => {
        const api_response = await fetch("/api/auth/me", {
            credentials: 'include'
        })

        // for testing purposes only
        if (!api_response.ok) {
            const api_response_error = new Error(`${api_response.statusText}`)
            api_response_error.status = api_response.status
            throw api_response_error
        }

        return {"message": "success"}
}

export {checkIfLoggedIn}