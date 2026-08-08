import { Link, Routes, Route } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query';
import OngoingExercise from '../components/OngoingExercise'



const fetchExercises = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/exercises`);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }
    const result = await response.json();
    return result;
}

export default function ExercisesList() {
    const { data: exercises, error, isLoading, isError } = useQuery({ queryKey: ["exercises"], queryFn: fetchExercises })

    if (isLoading) return <p>Ładowanie ćwiczeń...</p>;
    if (isError) return <p>Błąd: {error.message}</p>;

    return (
        <Routes>
            <Route index
                element={
                    <nav>
                        {exercises.map((exercise) => (
                            <Link key={exercise.id} to={`exercises/${exercise.id}`}>
                                Exercise {exercise.id}
                            </Link>
                        ))}
                    </nav>
                } />

            <Route path="exercises/:id" element={<OngoingExercise />} />
        </Routes>
    )
}