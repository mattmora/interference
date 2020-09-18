### Interference: 
An experimental generative music composition / game
---
Hosted [here](https://interference.herokuapp.com)  
Audio recording [here](https://soundcloud.com/user-519512177/interference-042019)  
Video recording [here](https://www.youtube.com/watch?v=C-5P3hXuGfs) (Princeton Laptop Orchestra Concert 4/20/2019) and [here](https://youtu.be/uD4tDYiHQnM) (Princeton Laptop Orchestra Livestream 4/20/2020)  

Paper for WAC2019 [here](https://www.ntnu.edu/documents/1282113268/1290797448/WAC2019-CameraReadySubmission-43.pdf/c2dec2c2-c34a-122d-be16-465082b3afbd?t=1575329716758)  

If you're interested in performing/playing it, feel free to get in touch with me at mjw7@princeton.edu.
I generally leave the Heroku app at the free level of server usage which doesn't always run Interference reliably.

Basic controls:
- c (during setup) : Change color
- [ and ] (during setup) : Change player position
- b (during setup) : Start the game!
- space (during build phase with a ball in your space) : Place a note at the ball position
- 1 (with a broken ball in your space) : Start another build phase
- 2 (with a broken ball in your space) : Start a fight phase
- w/a/s/d (during fight phase) : Move
- r/b (during outro) : Remove a random note from the game space
- p (at any time after setup) : After a several presses, progress the harmony, and at the end of a fight phase (locked movement and inverted colors), progress to the next build phase
- f : Toggle fullscreen
- h : Toggle cursor
- v : Toggle zoom
- m : Mute/unmute sound

To run locally (requires Node.js):
1. Download this repo
2. Navigate to the project folder in terminal
3. Install dependencies: `npm install`
4. Build: `npm run build`
5. Run on localhost:8080: `npm start`

Note:
Might not work in browsers other than Chrome

Game and networking powered by [Lance](http://lance.gg/)  
Sound powered by [Tone.js](https://tonejs.github.io/)  
Timing synchronization with [sync](https://github.com/collective-soundworks/sync) 
