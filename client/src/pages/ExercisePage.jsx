import { useParams } from "react-router-dom";

const ExercisePage = () => {
  const { exerciseSlug } = useParams();
  return (
    <main>
      <h1>Exercise page</h1>
      <p>Selected exercise: {exerciseSlug}</p>
    </main>
  );
};

export default ExercisePage;