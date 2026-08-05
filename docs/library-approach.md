## LIBRARIES TAKEN INTO CONSIDERATION

### 1. pitchy

**Advantages**
- it can be used directly in web browser
- **real-time analysis**
- easy integration with frontend

**Disadvantages**
- it can be less precise than DL algorithms
- it needs to be polished and modified for different singing techniques e.g.: vibratto and for pause in singing

### 2. aubio/ librosa.pyin

Basically the same principle of working as pitchy but it is made for using as native/desktop apps so modifying it for frontend usage can be tricky

### 3. torchcrepe

**Advantages**
- very good accuracy in detecting F0
- currently the best DL model for pitch detection

**Disadvantages**
- python library so not a good fit for frontend usage
- needs to be run on our server and it needs recording from user
- can be used as after-training summary not as real-live detector


### SUMMARY

The best course of action in my opinion would be to use pitchy as frontend library for live detection and to send user's recording to server for CREPE analysis