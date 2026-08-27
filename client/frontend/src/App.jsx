import "./App.css";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ExercisePage from "./pages/ExercisePage";
import OngoingExercise from "./components/OngoingExercise.jsx";
import ExerciseSummary from "./pages/ExerciseSummary.jsx";
import SignUp from "./pages/SignUp.jsx";
import ForgetPasswordPage from "./pages/ForgetPasswordPage.jsx";

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home/>}/>
                    <Route path="/login" element={<Login/>}/>
                    <Route path="/sign_up" element={<SignUp/>}/>
                    <Route path="/forgot_password" element={<ForgetPasswordPage/>}/>
                    <Route path="/dashboard" element={<Dashboard/>}/>
                    <Route path="/exercises/:id/:exercise_slug" element={<ExercisePage/>}/>
                    <Route path="/exercises/:id/:exercise_slug/start" element={<OngoingExercise/>}/>
                    <Route path="/exercises/:id/:exercise_slug/summary" element={<ExerciseSummary/>}/>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>

    );
}

export default App;