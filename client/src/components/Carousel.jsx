/* eslint-disable react-refresh/only-export-components */
import "./Carousel.css";
import { useRef} from "react";
import { Link } from "react-router-dom";
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';



export let exercises = [
  { id:1, title: "G-major scale", slug: "g-major-scale", difficulty: "Easy", rating: "100%" },
  { id:2, title: "C-major scale", slug: "c-major-scale" , difficulty: "Easy", rating: "100%"},
  { id:3, title: "F-major scale", slug: "f-major-scale" , difficulty: "Easy", rating: "100%"},
  { id:4, title: "Intervals 2-3", slug: "intervals-2-3" , difficulty: "Medium", rating: "90%"},
  { id:5, title: "Intervals 4-5", slug: "intervals-4-5" , difficulty: "Medium", rating: "95%"},
  { id:6, title: "Intervals 6-7", slug: "intervals-6-7" , difficulty: "Medium", rating: "97%"},
  { id:7, title: "Intervals 1-8", slug: "intervals-1-8" , difficulty: "Hard", rating: "50%"},
];
export let songs = [
  { id: 1, title: "Song 1", slug: "song-1", difficulty: "Easy", rating: "100%" },
  { id: 2, title: "Song 2", slug: "song-2", difficulty: "Easy", rating: "100%" },
  { id: 3, title: "Song 3", slug: "song-3", difficulty: "Easy", rating: "100%" },
  { id: 4, title: "Song 4", slug: "song-4", difficulty: "Medium", rating: "90%" },
  { id: 5, title: "Song 5", slug: "song-5", difficulty: "Medium", rating: "95%" },
  { id: 6, title: "Song 6", slug: "song-6", difficulty: "Medium", rating: "97%" },
  { id: 7, title: "Song 7", slug: "song-7", difficulty: "Hard", rating: "50%" },
];
    const difficultyColors = {
    Easy: "success",
    Medium: "warning",
    Hard: "error",
                            };



export const ExerciseCard = ({ title, slug, difficulty, rating, linkBase }) => {
  return (
    <Card className='carousel-card'>
      <Link to={`${linkBase}/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            textAlign: 'center',
            padding: '20px 12px',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Chip
            label={difficulty}
            color={difficultyColors[difficulty] || "default"}
            size="small"
          />
          <Typography variant="body2" color="text.secondary">
            {rating}
          </Typography>
        </CardContent>
      </Link>
    </Card>
  );
};


const Carousel = ({isSong, title}) => {
    const carouselRef = useRef(null);
    const scrollByAmount = (direction) => {
      if(!carouselRef.current) return;
      const firstCard = carouselRef.current.querySelector(".carousel-card");
      if(!firstCard) return;
      const cardWidth = firstCard.getBoundingClientRect().width;
      const gap = 12;
      const amount = 3 * cardWidth + 2 * gap;
      carouselRef.current.scrollBy({
        left: direction * amount,
        behavior: "smooth",
      });
    };
    const rows = isSong ? songs : exercises;
    const linkBase = isSong ? "/songs" : "/exercises";
   return (
<section className="carousel-section">
      <header className="carousel-header">
    <h2 className="carousel-title">{title}</h2>
  </header>
  <div className="carousel-body">
    <button className="carousel-arrow carousel-arrow-left" onClick={() => scrollByAmount(-1)}>
      ‹
    </button>
      <div className="full-width-carousel" ref={carouselRef}>
          {rows.map((row) => (
            <ExerciseCard
              key={row.id}
              title={row.title}
              slug={row.slug}
              difficulty={row.difficulty}
              rating={row.rating}
              linkBase={linkBase}
            />
          ))}
      </div>
      <button className="carousel-arrow carousel-arrow-right" onClick={() => scrollByAmount(1)}>
      ›
    </button>

      </div>
    </section>
  );
};


export default Carousel;