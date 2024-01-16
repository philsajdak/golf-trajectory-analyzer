# golf-trajectory-analyzer

**golf-trajectory-analyzer** is an interactive analytics tool designed to study the physics of a golf simulator. This tool is specifically designed for use with the Project64 emulator playing Mario Golf 64, and it enables users to capture real-time shot data and visualize it on a detailed map.

Please note that this repo will only contain the scripts used, and not the web platform itself. Please contact me privately.

## Features

- **Real-time Data Capture:** Automatically captures shot data from the Project64 emulator during gameplay.
- **Shot Visualization:** Displays the ball's trajectory on an interactive map of the golf course.
- **TCP Integration:** Utilizes TCP communication with Project64 to ensure seamless data transmission.

## Getting Started

These instructions will help you get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Project64 Development Client
- Node.js
- Firebase account

### Installation

# Navigate to the project directory
` cd golfsim-data-visualizer

# Install dependencies
` npm install

# Set up your Firebase configuration in firebase-config.js
` const firebaseConfig = {
  // Your Firebase configuration details
};

# Start the server
` node server.js

# Open index.html in your browser to access the application.

## Usage

Once you've started the server and opened the web application, open up Project64 and load the script. Edit the script file so that the IP address points to your server. The tool will capture and display shot data in real-time.


