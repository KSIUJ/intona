/* eslint-disable react-refresh/only-export-components */
import "./Carousel.css";
import {useRef} from "react";
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';

const ExerciseCard = () => {

    return (
        <Card className="carousel-card">
            <CardActionArea
                sx={{height: '100%'}}
            >
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
                    <Typography variant="subtitle1" sx={{fontWeight: 600}}>
                    </Typography>
                    <Chip

                    />
                    <Typography variant="body2" color="text.secondary">

                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};


const CarouselSkeleton = () => {

    const carouselRef = useRef(null);

    return (
        <section className="carousel-section">
            <section className="header-layout" style={{justifyContent: 'center'}}>
                <header className="carousel-header">
                    <h2 className="carousel-title"></h2>
                </header>
            </section>
            <div className="carousel-body">
                <button className="carousel-arrow carousel-arrow-left">
                    ‹
                </button>
                <div className="full-width-carousel" ref={carouselRef}>
                    <ExerciseCard/>
                </div>
                <button className="carousel-arrow carousel-arrow-right">
                    ›
                </button>

            </div>
        </section>
    );
};
export default CarouselSkeleton;