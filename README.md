# DogWorkers iCal Server

This project provides an iCal feed for the DogWorkers dog training events. It scrapes event data from a specified portal URL and generates an iCalendar feed that can be subscribed to by calendar applications.

## Features

- **iCal Feed Generation**: Provides a calendar feed for dog training events, covering the current and next month.
- **Environment Configuration**: Easily configure the portal URL through environment variables.
- **Dynamic Event Parsing**: Uses web scraping to dynamically fetch and parse events.

## Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/JonathanSchndr/dogworkers-ical-server.git
   cd dogworkers-ical-server
