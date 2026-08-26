/* eslint-disable react-refresh/only-export-components */
import "./Carousel.css";
import {useRef} from "react";
import {Link} from "react-router-dom";
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import {useQuery} from "@tanstack/react-query";


export let exercises = [
    {id: 1, title: "G-major scale", slug: "g-major-scale", difficulty: "Easy", rating: "100%"},
    {id: 2, title: "C-major scale", slug: "c-major-scale", difficulty: "Easy", rating: "100%"},
    {id: 3, title: "F-major scale", slug: "f-major-scale", difficulty: "Easy", rating: "100%"},
    {id: 4, title: "Intervals 2-3", slug: "intervals-2-3", difficulty: "Medium", rating: "90%"},
    {id: 5, title: "Intervals 4-5", slug: "intervals-4-5", difficulty: "Medium", rating: "95%"},
    {id: 6, title: "Intervals 6-7", slug: "intervals-6-7", difficulty: "Medium", rating: "97%"},
    {id: 7, title: "Intervals 1-8", slug: "intervals-1-8", difficulty: "Hard", rating: "50%"},
];
export let songs = [
    { id: 1, title: "Iris", slug: "Iris", difficulty: "Easy", rating: "100%",
  musicXmlUrl: "/songs/Iris-voice.musicxml", audioUrl: "/songs/Iris-piano.mp3" },
    {id: 2, title: "All of me", slug: "All of me", difficulty: "Easy", rating: "100%",
        musicXmlUrl: "/songs/All_Of_Me.musicxml", audioUrl: "/songs/All_Of_Me.mp3"
    },
    {id: 3, title: "Song 3", slug: "song-3", difficulty: "Easy", rating: "100%"},
    {id: 4, title: "Song 4", slug: "song-4", difficulty: "Medium", rating: "90%"},
    {id: 5, title: "Song 5", slug: "song-5", difficulty: "Medium", rating: "95%"},
    {id: 6, title: "Song 6", slug: "song-6", difficulty: "Medium", rating: "97%"},
    {id: 7, title: "Song 7", slug: "song-7", difficulty: "Hard", rating: "50%"},
];
const difficultyColors = {
    Easy: "success",
    Medium: "warning",
    Hard: "error",
};


const ExerciseCard = ({id, title, slug, difficulty, rating, linkBase, type, clickable}) => {

    return (
        <Card className="carousel-card">
            <CardActionArea
                component={clickable ? Link : 'div'}
                to={clickable ? `${linkBase}/${id}/${slug}?type=${type}` : ''}
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
            </CardActionArea>
        </Card>
    );
};


const Carousel = ({info, setCarouselUpdating, setCarouselDelete}) => {
    const [isOpen, setOpen] = useState(false)
    const linkBase = "/exercises";
    const [cacheArray, setCacheArray] = useState([])
    const previousSettingsArray = useRef({
        "name": crypto.randomUUID(),
        "difficulties": {"Easy": false, "Medium": false, "Hard": false},
        "rating": [0, 100]
    })
    const [currentSettingsArray, setCurrentSettingsArray] = useState(() => {
        return info.filter ? info.filter : {
            "name": "",
            "difficulties": {"Easy": true, "Medium": true, "Hard": true},
            "rating": [0, 100]
        }
    })
    const [workingSettingsArray, setWorkingSettingsArray] = useState(() => {
        return info.filter ? info.filter : {
            "name": "",
            "difficulties": {"Easy": true, "Medium": true, "Hard": true},
            "rating": [0, 100]
        }
    })
    const [exerciseName, setExerciseName] = useState(info.exercise_name.length !== 0 ? info.exercise_name : `${info.type}s`)
    const carouselRef = useRef(null);
    const timerIdRed = useRef(0)

    const {data: rows, isLoading, isError} = useQuery({
        queryKey: ["type", info.type],
        queryFn: () => fetchExercises(info.type),
        staleTime: Infinity,
        refetchOnWindowFocus: false
    })

    const fetchExercises = async (type) => {
        const api_response = await fetch(`/api/exercises/list/${type}`)
        if (!api_response.ok) {
            const errorText = await api_response.text();
            console.error("error message:", errorText);

            const api_response_error = new Error(errorText);
            api_response_error.status = api_response.status;
            throw api_response_error;
        }
        const response_json = await api_response.json()
        return response_json
    }


    const scrollByAmount = (direction) => {
        if (!carouselRef.current) return;
        const firstCard = carouselRef.current.querySelector(".carousel-card");
        if (!firstCard) return;
        const cardWidth = firstCard.getBoundingClientRect().width;
        const gap = 12;
        const amount = 3 * cardWidth + 2 * gap;
        carouselRef.current.scrollBy({
            left: direction * amount,
            behavior: "smooth",
        });
    };

    const returnNewArray = (rows) => {
        return rows.filter(row => {
            if (currentSettingsArray.difficulties[row.difficulty] !== true) {
                return false;
            }
            if (row.rating > currentSettingsArray.rating[1] || row.rating < currentSettingsArray.rating[0]) {
                return false;
            }
            return row.exercise_name.startsWith(currentSettingsArray.name);
        })
    }

    const isCategoryAdded = (prevDict, currDict) => {
        return Object.entries(prevDict).filter(([key, value]) => {
            if (!value) {
                return currDict[key];
            }
            return false;
        }).length;
    }

    useEffect(() => {
        if (!rows) {
            return;
        }
        if ((!currentSettingsArray.name.startsWith(previousSettingsArray.current.name)) ||
            (currentSettingsArray.rating[0] < previousSettingsArray.current.rating[0] || currentSettingsArray.rating[1] > previousSettingsArray.current.rating[1]) ||
            (isCategoryAdded(previousSettingsArray.current.difficulties, currentSettingsArray.difficulties))) {
            setCacheArray(returnNewArray(rows))


        } else {
            setCacheArray(prev => returnNewArray(prev))
        }
        previousSettingsArray.current = currentSettingsArray
    }, [currentSettingsArray, rows]);


    if (isError) {
        // to change for better error ui
        return <>error</>
    }
    return (
        <section className="carousel-section">
            <header className={`carousel-header filter-icon filter-trigger-btn ${isOpen ? 'active' : ''}`}
                    onClick={() => setOpen(prev => !prev)}>
                <h2 className="carousel-title"><FilterIcon/></h2>
            </header>
            {isOpen && (
                <div className="filter-menu" style={{
                    position: 'absolute',
                    right: 0,
                    zIndex: 10
                }}>

                    <div className="search-wrapper">
                        <SearchIcon/>
                        <input type="text" placeholder="Search by name..." value={workingSettingsArray.name}
                               onChange={(e) =>
                                   setWorkingSettingsArray((prev) => ({
                                       ...prev,
                                       name: e.target.value
                                   }))}/>
                    </div>

                    <div className="filter-group">
                        <h3 className="section-title">Difficulty level</h3>
                        <div className="row">
                            <button
                                className={`diff-btn btn-easy ${workingSettingsArray.difficulties["Easy"] ? "active" : ""}`}
                                onClick={() =>
                                    setWorkingSettingsArray((prev) => ({
                                        ...prev,
                                        difficulties: {
                                            "Easy": !prev.difficulties["Easy"],
                                            "Medium": prev.difficulties["Medium"],
                                            "Hard": prev.difficulties["Hard"]
                                        }
                                    }))}>EASY
                            </button>
                            <button
                                className={`diff-btn btn-med ${workingSettingsArray.difficulties["Medium"] ? "active" : ""}`}
                                onClick={() =>
                                    setWorkingSettingsArray((prev) => ({
                                        ...prev,
                                        difficulties: {
                                            "Easy": prev.difficulties["Easy"],
                                            "Medium": !prev.difficulties["Medium"],
                                            "Hard": prev.difficulties["Hard"]
                                        }
                                    }))}>MED
                            </button>
                            <button
                                className={`diff-btn btn-hard ${workingSettingsArray.difficulties["Hard"] ? "active" : ""}`}
                                onClick={() =>
                                    setWorkingSettingsArray((prev) => ({
                                        ...prev,
                                        difficulties: {
                                            "Easy": prev.difficulties["Easy"],
                                            "Medium": prev.difficulties["Medium"],
                                            "Hard": !prev.difficulties["Hard"]
                                        }
                                    }))}>HARD
                            </button>
                        </div>
                    </div>

                    <div className="filter-group">
                        <h3 className="section-title">Rating (%)</h3>
                        <div className="row">
                            <input type="number" className="rating-input" placeholder="From"
                                   value={workingSettingsArray.rating[0]}
                                   onChange={(e) =>
                                       setWorkingSettingsArray((prev) => ({
                                           ...prev,
                                           rating: [e.target.value !== '' ? parseInt(e.target.value) > 100 ? 100 : parseInt(e.target.value) : 0, prev.rating[1]]
                                       }))}/>
                            <span className="rating-separator">—</span>
                            <input type="number" className="rating-input" placeholder="To"
                                   value={workingSettingsArray.rating[1]}
                                   onChange={(e) =>
                                       setWorkingSettingsArray((prev) => ({
                                           ...prev,
                                           rating: [prev.rating[0], e.target.value !== '' ? parseInt(e.target.value) > 100 ? 100 : parseInt(e.target.value) : 0]
                                       }))}/>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button className="action-btn btn-cancel" onClick={() => {
                            setWorkingSettingsArray(currentSettingsArray)
                            setOpen(false)
                        }}>Cancel
                        </button>
                        <button className="action-btn btn-ok" onClick={() => {
                            info.filter = workingSettingsArray
                            setCurrentSettingsArray(workingSettingsArray)
                            setCarouselUpdating(info)
                            setOpen(false)
                        }}>OK
                        </button>
                    </div>

                </div>
            )}

            <button className={`carousel-header delete-icon`} onClick={() => {
                setCarouselDelete(info.id)
            }}>
                <h2 className="carousel-title"><TrashIcon/></h2>
            </button>

            <header className="carousel-header">
                <input
                    type="text"
                    className="carousel-title"
                    defaultValue={exerciseName}
                    value={exerciseName}
                    onChange={(e) => {
                        const value = e.target.value
                        setExerciseName(value)

                        if (timerIdRed.current !== 0) {
                            clearTimeout(timerIdRed.current)
                        }

                        timerIdRed.current = setTimeout(() => {
                            info.exercise_name = value
                            setCarouselUpdating(info)
                            clearTimeout(timerIdRed.current)
                        }, 1000)


                    }}
                />
            </header>
            <div className="carousel-body">
                <button className="carousel-arrow carousel-arrow-left" onClick={() => scrollByAmount(-1)}>
                    ‹
                </button>
                <div className="full-width-carousel" ref={carouselRef}>
                    {isLoading && <ExerciseCard
                        clickable={false}
                    />}
                    {cacheArray?.map((row) => (
                        <ExerciseCard
                            key={row.id}
                            id={row.id}
                            title={row.exercise_name}
                            slug={row.slug}
                            difficulty={row.difficulty}
                            rating={`${row.rating}%`}
                            linkBase={linkBase}
                            type={info.type}
                            clickable={true}
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