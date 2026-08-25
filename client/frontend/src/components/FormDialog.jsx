import * as React from 'react';
import {
    Dialog, DialogContent, DialogActions, Button, Select, MenuItem, TextField, Typography, Divider
} from '@mui/material';
import {useEffect} from "react";

export default function FormDialog({setSettingsObject, typesAvailable, open, setOpen}) {

    const handleClose = () => {
        setOpen(false);
    };



    const handleSubmit = (e) => {
        e.preventDefault();
        const settingsObject = Object.fromEntries(new FormData(e.target).entries())
        // mam type i exercise_name, teraz jeszcze filter
        settingsObject.filter = {
            name: "",
            difficulties: {"Easy": true, "Medium": true, "Hard": true},
            rating: [0, 100]
        }
        setSettingsObject(prev => ({
            ...prev,
            selected_carousels: [
                ...prev.selected_carousels,
                {
                    ...settingsObject,
                    id: crypto.randomUUID()
                }
            ],

        }))
        handleClose()
    };

    useEffect(() => {
        console.log(typesAvailable)
    }, []);

    return (<Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
            sx: {
                borderRadius: '16px',
                width: '340px', maxWidth: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }
        }}
    >
        <DialogContent sx={{padding: '24px 24px 16px 24px'}}>
            <form onSubmit={handleSubmit} id="subscription-form">

                {/* Etykieta zamiast domyślnego InputLabel, żeby mieć pełną kontrolę nad stylem */}
                <Typography sx={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    mb: 1,
                    letterSpacing: '0.5px'
                }}>
                    Carousel Type
                </Typography>

                <Select
                    name="type"
                    variant="outlined"
                    required={true}
                    fullWidth
                    size="small"
                    displayEmpty
                    sx={{
                        mb: 3,
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        color: '#1e293b',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e2e8f0',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#cbd5e1',
                        }
                    }}
                >
                    {typesAvailable?.map((element) => (
                        <MenuItem key={element.id} id={element.id} value={element.type}>
                            {element.type}
                        </MenuItem>))}
                </Select>

                <Typography sx={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    mb: 1,
                    letterSpacing: '0.5px'
                }}>
                    Custom Name (Optional)
                </Typography>

                <TextField
                    name="exercise_name"
                    variant="outlined"
                    placeholder="e.g. My favorite warmups..."
                    fullWidth
                    size="small"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px', backgroundColor: '#ffffff', color: '#64748b', '& fieldset': {
                                borderColor: '#e2e8f0',
                            }, '&:hover fieldset': {
                                borderColor: '#cbd5e1',
                            }
                        }
                    }}
                />
            </form>
        </DialogContent>

        <Divider sx={{mx: 3, borderColor: '#f1f5f9'}}/>

        <DialogActions sx={{padding: '20px 24px 24px 24px', gap: '12px'}}>
            <Button
                onClick={handleClose}
                disableElevation
                sx={{
                    flex: 1,
                    backgroundColor: '#f1f5f9',
                    color: '#0f172a',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                    borderRadius: '8px',
                    padding: '8px 0',
                    '&:hover': {backgroundColor: '#e2e8f0'}
                }}
            >
                Cancel
            </Button>
            <Button
                type="submit"
                form="subscription-form"
                variant="contained"
                disableElevation
                sx={{
                    flex: 1,
                    backgroundColor: '#4f46e5', // Mocny niebieski/fiolet ze screena
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                    borderRadius: '8px',
                    padding: '8px 0',
                    '&:hover': {backgroundColor: '#4338ca'}
                }}
            >
                OK
            </Button>
        </DialogActions>
    </Dialog>);
}