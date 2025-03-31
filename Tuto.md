# PDI_17

Cette API permet de représenter dynamiquement des vecteurs de déformations GNSS pour les 4 volcans français.


## Sliders
Le premier Slider permet de sélectionner la date à laquelle on souhaite représenter les déformations.
Le second Slider permet de sélectionner la fenêtre d'intégration des données.


Ainsi la date de début du premier slider correspond à la date sélectionnée moins la fenêtre de temps sélectionnée. 

Le troisième slider permet de modifier l'échelle des vecteurs (qui est différente de l'échelle de la carte). Une échelle 1:100000 
signifie que le vecteur est représenté 100000 fois plus grand que ce qu'il est vraiment.

## Vecteurs
Par défaut les vecteurs horizontaux et verticaux sont affichés

Les vecteurs rouges correspondent aux déformations horizontales et sont accompagnés d'une ellipse d'erreur de la même couleur.
Les vecteurs verts correspondent aux déformations verticales et sont accompagnés d'un cercle d'erreur de la même couleur.

En dessous de la carte un bouton permet de cacher/afficher les vecteurs horizontaux, de même pour les vecteurs verticaux.

## Stations
En cliquant sur une station, une pop-up s'affiche contenant le nom de la station, son code, ainsi qu'un lien vers la fiche de station produite par l'IPGP sur WebObs.

## Echelles

La barre d'échelle rouge correspond à l'échelle des vecteurs.
La barre d'échelle blanche correspond à l'échelle de la carte.

Les échelles s'ajustent en fonction du niveau de zoom.