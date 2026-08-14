import "./App.css";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ExercisePage from "./pages/ExercisePage";
import SongsPage from "./pages/SongsPage";

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Login/>}/>
                    <Route path="/home" element={<Home/>}/>
                    <Route path="/dashboard" element={<Dashboard/>}/>
                    <Route path="/exercises" element={<ExercisePage/>}/>
                    <Route path="/exercises/:exerciseSlug" element={<ExercisePage/>}/>
                    <Route path="/songs/:songsSlug" element={<SongsPage/>}/>

                </Routes>
            </BrowserRouter>
        </QueryClientProvider>

    );
}

export default App;