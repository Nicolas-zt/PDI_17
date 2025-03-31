# PDI_17

## Description

Ce projet a pour but de proposer une représentation dynamique de vecteurs de déformations GNSS dans les 4 volcans français.
Cette solution est déstinée à être implémentée dans le logiciel WebObs développé par l'Institut de Physique du Globe de Paris dont l'utilisation est exclusivement privée.

## Installation

L'une des contraintes de cette solution est de pouvoir fonctionner sans internet c'est pourquoi l'ensemble des librairies utilisées sont téléchargées dans le sous-dossier leaflet présent sur le github.
Seules les tuiles de fond de carte nécessitent une connexion internet mais peuvent être changées facilement à la ligne 10 du JavaScript (Modifier également la ligne 11 renseignant les sources des tuiles utilisées).

La version 7.4.1 de PHP a été utilisée durant le développement de cette solution, cependant PERL peut également être utilisé à condition de changer l'extension du fichier renseigné à la ligne 56 du JavaScript.

