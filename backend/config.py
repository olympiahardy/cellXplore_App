# This will contain the main configuration of the application
# When you install python packages use python3.13 -m pip install 
import os
from flask import Flask
import scanpy as sc
from flask_cors import CORS
from pprint import pprint

# import zarr
from vitessce import VitessceConfig, AnnDataWrapper, ViewType as vt, SpatialDataWrapper, hconcat

# This initialises the application
app = Flask(__name__)
# This disables an error that will allow us to send cross-origin requests to our app
print("cors")
CORS(app)

BASE_DIR = os.path.abspath("/Users/olympia/cellXplore_App/datasets/")

## Setting up the Vitessce config
def create_vitessce_config(zarr_file_path, config_name, dataset_name):

    # This will create a Vitessce object that will define what data we extract and what views we can plot
    vc = VitessceConfig(name=config_name, schema_version="1.0.15", base_dir=BASE_DIR)
    # This will define our Zarr dataset and will wrap the file into our Vitessce object
    dataset = vc.add_dataset(name=dataset_name).add_object(
        AnnDataWrapper(
            zarr_file_path,
            obs_embedding_paths=["obsm/X_umap", "uns/spatial/Naive_1"],          # UMAP embeddings
            obs_embedding_names=["UMAP", "spatial"],
            obs_set_paths=["obs/clusters"],               # Cluster labels
            obs_set_names=["clusters"],
            obs_feature_matrix_path="X",                  # Feature matrix
            # obs_spots_path="obsm/spatial",                # Spatial coordinates
            #spatial_image_layer="hires",                  # The resolution layer to use
            #spatial_image_path="uns/spatial/Naive_1/images/hires",  # Updated path for hires image
            #spatial_image_key="Naive_1"                   # Corresponding key for the image
        )
    )
    pprint("LOOOOOK HERE!!!!!")
    pprint(dataset)

    spatial_view = vc.add_view(dataset = dataset, mapping="spatial", view_type=vt.SPATIAL)
    umap_view = vc.add_view(dataset = dataset, view_type=vt.SCATTERPLOT, mapping="UMAP")

    # Here we define what plots and views we want to visualise
    vc.layout(hconcat(spatial_view, umap_view))
    # Exports the Vitessce config file to a JSON format to your API endpoint in main.py
    pprint(vc)
    return vc.to_dict(base_url='http://127.0.0.1:5000/datasets')

