import {Link, useParams} from "react-router-dom"
import {useEffect} from "react";

const SongsPage = () => {
  const { id, songsSlug } = useParams();

  return (
    <main>
      <h1>Songs page</h1>
      <p>Selected song: {songsSlug}</p>
        <Link to={`/exercises/${id}/${songsSlug}/start`}>Start</Link>
    </main>
  );
}
export default SongsPage;