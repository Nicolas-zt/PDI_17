# README

## Description

This project aims at proposing a dynamic representation of GNSS deformation vectors about the 4 french volcanos.
This solution is meant to be implemented in the WebObs software developed by the Institut de physique du globe de Paris and which use is exclusively private.

## Installation

One of the restraints of this application is to be able to be used without any internet connection. That is why all the libraries used are downloaded is the sub-folder named "leaflet" within the github.
Only the tiles used for the map need an internet connection but it can be changed easily at the line 10 of the JavaScript file (Also modify the line 11 concerning the sources of the used tiles).

The 7.4.1 version of PHP was used during the development of the application, however PERL can also be used by changing the file's name at the line 56 of the JavaScript file.

## User Guide – Running the Project Locally

Cloning the Git Repository
Start by cloning the repository to your machine using a Git Bash terminal with the following command:

git clone https://github.com/Nicolas-zt/PDI_17.git

## Repository Structure

The PDI_17 repository contains two main folders:

Codes: contains all the necessary project files (.js, .css, .pl, .php).

Fichiers_stations: contains GNSS station observation data.

## Installing a Local Server
To run the project locally, you need to install a local server such as MAMP.

Steps:

Go to the official website: https://www.mamp.info/en/downloads/

Download and install version 5.0.6 of MAMP.

Once installed, launch MAMP.

Go to MAMP > Preferences > Server.

Change the server path to point to the Codes folder inside the cloned repository.

## Launching the Project
Once the configuration is complete:

Open your browser.

Type localhost in the address bar.

The project should launch automatically.