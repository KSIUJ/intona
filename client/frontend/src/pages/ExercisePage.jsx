import {Link, useParams} from "react-router-dom";
import {useEffect} from "react";

const ExercisePage = () => {
  const { id, exerciseSlug } = useParams();
  useEffect(() => {
      console.log(id)
      console.log(exerciseSlug)
  })
  return (
    <main>
      <h1>Exercise page</h1>
      <p>Selected exercise: {exerciseSlug}</p>
        <Link to={`/exercises/${id}/${exerciseSlug}/start`}>Start</Link>
    </main>
  );
};

export default ExercisePage;