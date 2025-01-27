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


Breast Cancer data (single cell and Xenium) can be accessed here: 
https://gla-my.sharepoint.com/:f:/g/personal/olympia_hardy_glasgow_ac_uk/EqQG_bLKH8hIp4XJveN3IbsBXsfd5mvvw4IoDKcB8t3Fww?e=QYrzIG

Dummy view of cellXplore currently:

<img width="1171" alt="Screenshot 2025-01-27 at 18 52 52" src="https://github.com/user-attachments/assets/16d5f383-09e8-40e2-a0d1-208abb8d9fef" />

Running cellXplore for dev purposes:

`conda env create -f environment.yml`

Download the repo

Open a split terminal in VSCode or terminal:

`cd cellXplore_App/backend`
`python main.py`

In the other:

`cd cellXplore_App/frontend`
`npm run dev -- --port 5174`

Note: Front end must serve port 5174 as this is set in CORS

Open local browser: `http://localhost:5174/`


