# Deserción escolar por región y distrito (SIAGIE 2023 → 2024)

Porcentajes calculados con el dataset del Minedu compartido por Jhosep. Los datos vienen por distrito y se agruparon por región.

## Qué mide

Estudiantes matriculados en 2023 que no se matricularon en 2024. No incluye a los fallecidos ni a quienes terminaron 5.° de secundaria.

- **Fuente:** SIAGIE, corte de enero de 2025.
- **Datos en CSV:** [`desercion_por_region_siagie_2023_2024.csv`](desercion_por_region_siagie_2023_2024.csv)

## Promedio nacional

| Nivel      | Estudiantes | Desertores | Tasa   |
|------------|------------:|-----------:|-------:|
| Primaria   | 3 721 852   | 64 463     | 1,73 % |
| Secundaria | 2 842 831   | 72 282     | 2,54 % |

## Ranking por región (ordenado por secundaria)

*Estudiantes* = matriculados en 2023, base del cálculo; *desertores* = cuántos de ellos no se matricularon en 2024.

| # | Región | Secundaria: estudiantes | Secundaria: desertores | Secundaria % | Primaria: estudiantes | Primaria: desertores | Primaria % |
|---|--------|------:|------:|------:|------:|------:|------:|
| 1 | Ucayali | 66 211 | 3 385 | 5,11 | 98 150 | 2 826 | 2,88 |
| 2 | Callao | 83 703 | 2 984 | 3,56 | 114 087 | 3 345 | 2,93 |
| 3 | La Libertad | 174 599 | 5 991 | 3,43 | 233 970 | 4 325 | 1,85 |
| 4 | Tumbes | 23 416 | 796 | 3,40 | 31 375 | 793 | 2,53 |
| 5 | Loreto | 122 023 | 3 905 | 3,20 | 176 621 | 4 965 | 2,81 |
| 6 | Lambayeque | 117 937 | 3 703 | 3,14 | 160 132 | 2 094 | 1,31 |
| 7 | Piura | 195 528 | 6 131 | 3,14 | 257 137 | 3 016 | 1,17 |
| 8 | Áncash | 106 164 | 3 056 | 2,88 | 132 091 | 1 528 | 1,16 |
| 9 | San Martín | 93 168 | 2 647 | 2,84 | 122 472 | 1 284 | 1,05 |
| 10 | Lima | 812 370 | 22 591 | 2,78 | 1 064 061 | 28 543 | 2,68 |
| 11 | Cajamarca | 139 854 | 3 823 | 2,73 | 177 746 | 1 587 | 0,89 |
| 12 | Madre de Dios | 19 699 | 446 | 2,26 | 28 914 | 302 | 1,04 |
| 13 | Junín | 124 969 | 2 720 | 2,18 | 156 613 | 1 958 | 1,25 |
| 14 | Ica | 83 517 | 1 796 | 2,15 | 113 658 | 1 555 | 1,37 |
| 15 | Amazonas | 45 871 | 986 | 2,15 | 65 021 | 1 508 | 2,32 |
| 16 | Pasco | 25 406 | 533 | 2,10 | 33 711 | 485 | 1,44 |
| 17 | Huancavelica | 36 153 | 567 | 1,57 | 41 959 | 142 | 0,34 |
| 18 | Ayacucho | 63 492 | 886 | 1,40 | 77 201 | 372 | 0,48 |
| 19 | Huánuco | 79 392 | 1 080 | 1,36 | 99 842 | 920 | 0,92 |
| 20 | Cusco | 118 401 | 1 589 | 1,34 | 150 287 | 737 | 0,49 |
| 21 | Moquegua | 15 580 | 168 | 1,08 | 19 005 | 121 | 0,64 |
| 22 | Apurímac | 42 368 | 434 | 1,02 | 50 997 | 158 | 0,31 |
| 23 | Arequipa | 122 313 | 1 152 | 0,94 | 159 971 | 1 162 | 0,73 |
| 24 | Tacna | 29 506 | 263 | 0,89 | 35 338 | 375 | 1,06 |
| 25 | Puno | 101 191 | 650 | 0,64 | 121 493 | 362 | 0,30 |
|  | **Perú** | **2 842 831** | **72 282** | **2,54** | **3 721 852** | **64 463** | **1,73** |

## Distritos más críticos en secundaria (con al menos 500 estudiantes)

| Distrito (provincia)          | Región    | Secundaria % |
|-------------------------------|-----------|-------------:|
| Aguas Verdes (Zarumilla)      | Tumbes    | 12,8 |
| Masisea (Coronel Portillo)    | Ucayali   | 11,1 |
| Tahuanía (Atalaya)            | Ucayali   | 10,2 |
| José Sabogal (San Marcos)     | Cajamarca | 9,7  |
| Oxamarca (Celendín)           | Cajamarca | 9,1  |
| Sapallanga (Huancayo)         | Junín     | 8,8  |
| Manantay (Coronel Portillo)   | Ucayali   | 8,4  |

## Lo que muestran los datos

- **El problema se concentra en la Amazonía y la costa norte, no en la sierra sur.** Ucayali duplica el promedio nacional, mientras Puno, Apurímac y Cusco están entre los más bajos.
- **Hay dos formas de priorizar.** Por porcentaje destaca Ucayali. Por número de estudiantes destaca Lima, que reúne cerca de 1 de cada 3 desertores de secundaria del país.
- **Ucayali es un buen candidato para el piloto:** tiene la tasa más alta en ambos niveles y varios distritos críticos en una misma provincia, Coronel Portillo.

> **Ojo:** el dataset cuenta como desertor a quien no se volvió a matricular en el Perú. En zonas de frontera como Aguas Verdes, o con mucha población migrante como Callao y Lima, parte de esa cifra podría ser estudiantes que se fueron a otro país. Es una hipótesis que habría que comprobar antes de usarla en el pitch.

## Fuentes

- Datos Abiertos – *Tasa y número de desertores en Educación Primaria y Secundaria 2023/2024* (Minedu).
