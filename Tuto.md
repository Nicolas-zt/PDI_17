# Documentation

## Sliders

The first slider's use is to select the date of the deformations we want to show.
The second slider's use is to select the window of dates integrated.

Therefore, the starting date of the first slider correspond to the selected date minus the window.

The third slider permits to modify the vector's scale (which is different from the map's one). A 1:100000 scale means that the vector is represented 100000 times bigger that what it really is.

## Vectors

By default, the horizontal and vertical vectors are shown.

The red vectors correspond to the horizontal deformations and are completed with error ellipses of the same colour.
The green vectors correspond to the vertical deformations and are completed with error ellipses of the same colour.

At the bottom of the map, a button permits to hide/show the horizontal vectors, same for the vertical vectors.


## Stations

By clicking on a station, a pop-up appears with the name of the station, its code and a link towards the station sheet produced by the IPGP on WebObs.

## Scales


The red scale bar corresponds to the vector's scale.
The white scale bar corresponds to the map's scale.

The scales adjust themselves according to the zoom level.


## Parameters

It is possible to modify 4 parameters in the JavaScript :

    - Scale factor at the line 7
    - Horizontal vector's colour at the line 8
    - Vertical vector's colour at the line 9
    - Map tiles at the line 10 + Sources of the tiles at the line 11






# DOCUMENTATION

Cette API permet de représenter dynamiquement des vecteurs de déformations GNSS pour les 4 volcans français.


## Sliders

Le premier Slider permet de sélectionner la date à laquelle on souhaite représenter les déformations.
Le second Slider permet de sélectionner la fenêtre d'intégration des données.

Ainsi la date de début du premier slider correspond à la date sélectionnée moins la fenêtre de temps sélectionnée. 

Le troisième slider permet de modifier l'échelle des vecteurs (qui est différente de l'échelle de la carte). Une échelle 1:100000 
signifie que le vecteur est représenté 100000 fois plus grand que ce qu'il est vraiment.



## Vecteurs

Par défaut les vecteurs horizontaux et verticaux sont affichés.

Les vecteurs rouges correspondent aux déformations horizontales et sont accompagnés d'une ellipse d'erreur de la même couleur.
Les vecteurs verts correspondent aux déformations verticales et sont accompagnés d'un cercle d'erreur de la même couleur.

En dessous de la carte un bouton permet de cacher/afficher les vecteurs horizontaux, de même pour les vecteurs verticaux.



## Stations

En cliquant sur une station, une pop-up s'affiche contenant le nom de la station, son code, ainsi qu'un lien vers la fiche de station produite par l'IPGP sur WebObs.

## Echelles

La barre d'échelle rouge correspond à l'échelle des vecteurs.
La barre d'échelle blanche correspond à l'échelle de la carte.

Les échelles s'ajustent en fonction du niveau de zoom.

## Paramètres

Il est possible de modifier 4 paramètres dans le JavaScript :

    - Facteur d'échelle à la ligne 7 
    - Couleur des vecteurs horizontaux à la ligne 8 
    - Couleur des vecteurs verticaux à la ligne 9
    - Tuiles utilisées comme fond de carte à la ligne 10 + Sources des tuiles à la ligne 11 


