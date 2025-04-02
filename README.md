# README

## Description

This project aims to provide a dynamic representation of GNSS deformation vectors for the four main French volcanoes.  
It is designed to be integrated into the **WebObs** software developed by the *Institut de Physique du Globe de Paris*, and its use is strictly private.

## Installation

One of the constraints of this application is that it must work **without any internet connection**.  
For this reason, all required libraries are included in a sub-folder named `leaflet` within the repository.  
Only the map tiles require an internet connection, but this can easily be changed by editing:

- **Line 10** of the JavaScript file (tile server URL)
- **Line 11** (tile source attribution)

> **Note:** The application was developed using **PHP version 7.4.1**,  

> but it can also be run using **Perl** by changing the script file name at **line 56** of the JavaScript file.

## User Guide – Running the Project Locally

### Cloning the Git Repository

Start by cloning the repository to your machine using a Git Bash terminal with the following command:

git clone https://github.com/Nicolas-zt/PDI_17.git


## Repository Structure

The PDI_17 repository contains two main folders:

Codes: contains all the necessary project files (.js, .css, .pl, .php).

files_stations: contains GNSS station observation data.

## Installing a Local Server
To run the project locally, you need to install a local server such as MAMP.

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
