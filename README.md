# PDI_17

## Description

This project aims at proposing a dynamic representation of GNSS deformation vectors about the 4 french volcanos.
This solution is meant to be implemented in the WebObs software developed by the Institut de physique du globe de Paris  and which use is exclusively private.

## Installation

One of the restraints of this application is to be able to be used without any internet connection. That is why all the libraries used are downloaded is the sub-folder named "leaflet" within the github.
Only the tiles used for the map need an internet connection but it can be changed easily at the line 10 of the JavaScript file (Also modify the line 11 concerning the sources of the used tiles).

The 7.4.1 version of PHP was used during the development of the application, however PERL can also be used by changing the file's name at the line 56 of the JavaScript file.
