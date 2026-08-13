import { useParams } from "react-router-dom"

const SongsPage = () => {
  const { songsSlug } = useParams();

  return (
    <main>
      <h1>Songs page</h1>
      <p>Selected song: {songsSlug}</p>
    </main>
  );
}
export default SongsPage;