# Bike Share Route Planner
Web app which uses open bikeshare data and the Google Maps API to plan a bikeshare route between two points.

### Features
- App opens with the bikeshare system map most pertinent to your location
- Find the closest bikeshare stations to you and your destination
- Get walking directions to those stations and biking directions between stations
- See total travel time and the split between walking and biking time, powered by the Google Maps API
- Use real places as your start and end points, powered by the Google Places API

### How to Use
1. Navigate to <https://bike-share-routes.appspot.com/> (for best experience, allow the site to access your location)
2. Choose a starting point and an ending point (start typing and pick from the list of local places).
3. Go!

### Minimum Technical Requirements
* Browser with JavaScript enabled
* Internet access
* (optional) Location enabled

### Built With
- JavaScript
- HTML, CSS
- Google Maps API
- Station data courtesy of the North American Bike Share Association [feed specification](https://github.com/NABSA/gbfs)

### The Inspiration
I was living in Boulder, CO, which uses the B-Cycle bikeshare system. At the time, the B-Cycle app could not deliver on a simple request: how can I get from point A to B using their system? The app required me to know which B-Cycle stations were nearest to my start and end points. Google Maps doesn't include bikeshare stations in their biking or transit directions, so there wasn't a seamless way for me to find directions.

I decided to see if I could build something myself. It turns out that I could, and it was a super fun project. It may not be the prettiest app, and the code could definitely benefit from some refactoring, but I delivered on what I set to achieve, fighting through some challenges and learning a ton throughout the process.

### What I learned
- Client-side web development with JavaScript
- Asynchronous JavaScript, including the use of Promises
- Google Maps API
- Google App Engine

### Where it goes from here
This project has been set aside for the time being while I focus on my studies, but here are some ideas on where I'd like to take it:
- Handle multiple queries without Refresh
- Utilize Current Location for Starting Address
- Display Station Status (bikes available / docks open)
- Display Alternate Routes (i.e. is public transit better?)
