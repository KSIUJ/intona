import { useParams } from "react-router-dom";
import {useEffect} from "react";

const ExercisePage = () => {
  const { exerciseSlug } = useParams();
    useEffect(() => {
        console.log(exerciseSlug)
    }, []);
  return (
    <main>
      <h1>Exercise page</h1>
      <p>Selected exercise: {exerciseSlug}</p>
    </main>
  );
};

export default ExercisePage;