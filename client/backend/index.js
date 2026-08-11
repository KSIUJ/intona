import express from 'express'
import multer from 'multer'
import cookieParser from 'cookie-parser'
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const upload = multer();

app.use(cookieParser());

const apiProxy = createProxyMiddleware({
    target: process.env.API_URL,
    changeOrigin: true,
    on: {
        proxyReq: (proxyReq, req, res) => {
            const token = req.cookies?.token;
            if (token) {
                proxyReq.setHeader('Authorization', `Bearer ${token}`);
            }
        },
    }
});

app.post("/api/auth/token", upload.none(), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append("username", req.body.email);
        formData.append("password", req.body.password);

        const token_response = await fetch(`${process.env.API_URL}/api/auth/token`, {
            method: "POST",
            body: formData,
        });

        if (!token_response.ok) {
            const apiError = new Error(`Błąd z zewnętrznego API: ${token_response.status}`);
            apiError.status = token_response.status;

            throw apiError;
        }

        const token_json = await token_response.json();

        res.cookie('token', token_json.access_token, {
            maxAge: 1000 * 60 * 60 * 2,
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/'
        });

        return res.status(200).send({ token: token_json });
    } catch (error) {
        console.error("Krytyczny błąd logowania:", error.message);

        if (error.status == undefined) {
            error.status = 500;
        }

        return res.status(error.status).send({ error: error.message });
    }
});

app.use(apiProxy)

export default app;