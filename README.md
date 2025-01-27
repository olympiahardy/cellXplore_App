This repo contains the development of cellular interaction visualisation tool cellXplore. It is built as a Flask-React app that implements Vitessce python visualisation components to visualise the single cell level data (both single cell and spatial) and plotlyJS and D3 plotting visualisations in the front end. The app expects data stored in a Zarr format that were converted from either Anndata (h5ad) or SpatialData objects. 

Links of interest:
Vitessce:
https://vitessce.io/
https://github.com/vitessce/vitessce
https://github.com/vitessce/vitessce-python

Zarr data:
https://vitessce.io/docs/data-file-types/
https://zarr.dev/

SpatialData:
https://spatialdata.scverse.org/en/latest/index.html

D3:
https://d3js.org/

Plotly:
https://plotly.com/javascript/

The tool works broadly using the below schema:

<img width="848" alt="Screenshot 2025-01-27 at 18 13 51" src="https://github.com/user-attachments/assets/ab1c9320-4bff-407e-86f1-58bad7a96b6a" />
