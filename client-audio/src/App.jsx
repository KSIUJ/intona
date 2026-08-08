import { Route, Routes, Link, BrowserRouter } from "react-router-dom"
import LoginPage from "./components/LoginPage"
import ExercisesList from "./components/ExercisesList"



function App() {
  return <BrowserRouter>
    <Routes>
      <Route index element={
        <>
          <Link to="/login">Login</Link>
          <Link to="/exercises">Exercises</Link>
        </>
      } />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/exercises/*" element={<ExercisesList />} />
    </Routes>
  </BrowserRouter>
}

export default App
