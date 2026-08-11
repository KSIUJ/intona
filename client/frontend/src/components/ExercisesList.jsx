import { Link, Route, Routes } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query';
import OngoingExercise from './OngoingExercise.jsx'


const fetchExercises = async () => {
    const response = await fetch(`/api/exercises`, {
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }
    return await response.json();
}

export default function ExercisesList() {
    const { data, error, isLoading, isError } = useQuery({ queryKey: ["exercises"], queryFn: fetchExercises })

    if (isLoading) return <p>Ładowanie ćwiczeń...</p>;
    if (isError) return <p>Błąd: {error.message}</p>;

    return (
        <Routes>
            <Route index
                element={
                    <nav>
                        {data.map((exercise) => (
                            <Link key={exercise.id} to={`${exercise.id}`}>
                                Exercise {exercise.id}
                            </Link>
                        ))}
                    </nav>
                } />

            <Route path=":id" element={<OngoingExercise />} />
        </Routes>
    )
}