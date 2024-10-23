# This will contain the main configuration of the application
# When you install python packages use python3.13 -m pip install 
import os
from flask import Flask
import scanpy as sc
from flask_cors import CORS
from pprint import pprint

# import zarr
from vitessce import VitessceConfig, AnnDataWrapper

# This initialises the application
app = Flask(__name__)
# This disables an error that will allow us to send cross-origin requests to our app
CORS(app)

BASE_DIR = os.path.abspath("/Users/olympia/cellXplore_App/datasets/")

## Setting up the Vitessce config
def create_vitessce_config(zarr_file_path, config_name, dataset_name):

    # This will create a Vitessce object that will define what data we extract and what views we can plot
    vc = VitessceConfig(name=config_name, schema_version="1.0.15", base_dir=BASE_DIR)
    pprint(dir(vc))
    # This will define our Zarr dataset and will wrap the file into our Vitessce object
    dataset = vc.add_dataset(name=dataset_name).add_object(AnnDataWrapper(zarr_file_path,
                                                                          obs_embedding_paths=["obsm/X_umap"],
                                                                          obs_embedding_names=["UMAP"],
                                                                          obs_set_paths=["obs/Seurat_Clusters"],
                                                                          obs_set_names=["Cell Type"],
                                                                          obs_feature_matrix_path="X"
                                                                          )
                                                                          )

    # Here we define what plots and views we want to visualise
    vc.layout(vc.add_view(view_type="scatterplot", dataset=dataset, mapping='UMAP'))
    
    # Exports the Vitessce config file to a JSON format to your API endpoint in main.py

    return vc.to_dict(base_url='http://127.0.0.1:5000/datasets')

