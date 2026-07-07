# Recherche ObsiaFormation

Mini-app statique, hébergeable sur GitHub Pages ou sur n'importe quel espace web.

## Utilisation

Ouvrir `index.html`, saisir un mot-clé, choisir l'ouverture, puis copier le
lien généré.

Le lien ressemble à ceci :

```text
index.html?q=unisciel
```

Quand la personne ouvre le lien, une courte démonstration se lance puis redirige
vers la recherche réelle sur :

```text
https://observatoire-ia-formation.univ-amu.fr/
```

La redirection ajoute les paramètres Ajax Search Lite nécessaires pour afficher
les résultats avec le mot-clé recherché.

Pour tenter une ouverture directe du premier résultat :

```text
index.html?q=actif&mode=lucky
```

Dans ce mode, la page interroge l'API REST WordPress native :

```text
https://observatoire-ia-formation.univ-amu.fr/wp-json/wp/v2/search
```

Elle demande un seul résultat avec `per_page=1`, puis ouvre l'URL renvoyée. Si
l'API ne répond pas ou ne renvoie aucun résultat, le lien ouvre les résultats de
recherche classiques.

## Option

Pour afficher la page de démonstration sans lancement automatique :

```text
index.html?q=unisciel&auto=0
```
