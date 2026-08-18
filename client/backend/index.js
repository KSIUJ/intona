import express from 'express'
import multer from 'multer'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import {createProxyMiddleware, fixRequestBody} from "http-proxy-middleware";
import {jwtDecode} from "jwt-decode";


const app = express();
const upload = multer();

app.use(cookieParser());
app.use(bodyParser.json());

const apiProxy = createProxyMiddleware({
    target: process.env.API_URL,
    changeOrigin: true,
    on: {
        proxyReq: async (proxyReq, req) => {
            let token = req.cookies?.access_token;

            if (token) {
                proxyReq.setHeader('Authorization', `Bearer ${token}`);
            }

            if (req.body) {
                fixRequestBody(proxyReq, req);
            }
        },
    }
});

app.post("/api/auth/token", upload.none(), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append("username", req.body.email);
        formData.append("password", req.body.password);
        formData.append("remember_login", req.body.remember);
        const token_response = await fetch(`${process.env.API_URL}/api/auth/token`, {
            method: "POST",
            body: formData,
        });

        if (!token_response.ok) {
            return res.sendStatus(token_response.status).send(token_response.statusText)
        }

        const token_json = await token_response.json();

        // I will change it to access_token.token later but now access_token.token throw error which I don't want to read
        res.cookie('access_token', token_json.access_token.access_token, {
            maxAge: 1000 * 60 * 10, // 10 minutes
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/'
        });

        res.cookie('refresh_token', token_json.refresh_token, {
            maxAge: req.body.remember ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 2, // is you click remember me for 30 days then it will remember you for 30 days
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/'
        });

        return res.status(200).send("successfully logged in");
    } catch (error) {
        console.error("Krytyczny błąd logowania:", error.message);

        if (error.status === undefined) {
            error.status = 500;
        }

        return res.status(error.status).send({error: error.message});
    }
});

app.post("/api/auth/logout", upload.none(), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append("refresh_token", req.cookies.refresh_token ? req.cookies.refresh_token : "NONE");
        const token_response = await fetch(`${process.env.API_URL}/api/auth/logout`, {
            method: "POST",
            body: formData,
        });

        if (!token_response.ok) {
            return res.sendStatus(token_response.status).send("test")
        }

        res.cookie('access_token', "", {
            maxAge: 0,
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/'
        });

        res.cookie('refresh_token', "", {
            maxAge: 0,
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/'
        });

        return res.status(200).send("successfully logged out");
    } catch (error) {
        console.error("Krytyczny błąd logowania:", error.message);

        return res.status(error.status).send({error: error.message});
    }
})

app.use('/api/public', async (req, res) => {
    const api_response = await fetch(`${process.env.API_URL}/api${req.url}`, {
            method: req.method,
            headers: req.headers,
            body: req.body
        }
    )
    if (!api_response.ok) {

        const api_response_error = new Error(`${api_response.statusText}`)
        api_response_error.status = api_response.status
        throw api_response_error
    }
    const api_response_json = await api_response.json()
    return res.send(api_response_json)
})

app.use('/api', upload.none(), async (req, res, next) => {
    try {
        let token = req.cookies?.access_token;
        let refresh_token = req.cookies?.refresh_token;
        if (refresh_token && (!token || (jwtDecode(token).exp * 1000) < Date.now())) {
            const formData = new FormData();
            formData.append("refresh_token", refresh_token)
            const refresh_response = await fetch(`${process.env.API_URL}/api/auth/refresh`, {
                "method": "POST",
                body: formData
            })

            if (!refresh_response.ok) {
                console.log(`Błąd z zewnętrznego API: ${refresh_response.status}`)
            }

            const refresh_response_json = await refresh_response.json()
            res.cookie('access_token', refresh_response_json.access_token, {
                maxAge: 1000 * 60 * 10, // 10 minutes
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                path: '/'
            });
        }
        next()
    } catch (error) {
        throw error
    }

})


app.get("/api/user/stats", async (req, res, next) => {
    try {
        if (!req.cookies.access_token) {
            res.sendStatus(401).send('Unauthorized access')
        }
        const id = jwtDecode(req.cookies.access_token).sub

        req.url = `/api/users/${id}/stats`;
        next();
    } catch (error) {
        next(error)
    }

})
app.use(apiProxy)

export default app;