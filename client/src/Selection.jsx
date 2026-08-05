import { DataGrid } from '@mui/x-data-grid';
import { Link } from "react-router-dom";
import Chip from '@mui/material/Chip';

export function ExerciseTable({isSong}) {
  let exercises = [
  { id:1, title: "G-major scale", slug: "g-major-scale", difficulty: "Easy", rating: "100%" },
  { id:2, title: "C-major scale", slug: "c-major-scale" , difficulty: "Easy", rating: "100%"},
  { id:3, title: "F-major scale", slug: "f-major-scale" , difficulty: "Easy", rating: "100%"},
  { id:4, title: "Intervals 2-3", slug: "intervals-2-3" , difficulty: "Medium", rating: "90%"},
  { id:5, title: "Intervals 4-5", slug: "intervals-4-5" , difficulty: "Medium", rating: "95%"},
  { id:6, title: "Intervals 6-7", slug: "intervals-6-7" , difficulty: "Medium", rating: "97%"},
  { id:7, title: "Intervals 1-8", slug: "intervals-1-8" , difficulty: "Hard", rating: "50%"},
];
let songs = [
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
    const rows = isSong ? songs : exercises;
    const linkBase = isSong ? "/songs" : "/exercises";
    const titleLabel = isSong ? "Songs" : "Exercise";

    const columns = [
    {
      field: "title",
      headerName: titleLabel,
      flex: 2,
      renderCell: (params) => (
        <Link to={`${linkBase}/${params.row.slug}`}>{params.value}</Link>
      ),
    },
    {
        field: "difficulty", 
        headerName: "Difficulty", 
        flex: 1,
        renderCell: (params) => (
            <Chip
                label ={params.value}
                color={difficultyColors[params.value] || "default"}
                size = "small"
            />

        ),
    

     },
    { field: "rating", headerName: "Rating", flex: 1 },
  ];

  return (
    <div style={{ width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight
        hideFooterPagination
        disableRowSelectionOnClick
        sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'transparent',
    },
  }}
/>
    </div>
  );
}