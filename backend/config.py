# This will contain the main configuration of the application
# When you install python packages use python3.13 -m pip install 
import os
from flask import Flask
from pprint import pprint
from vitessce import VitessceConfig, AnnDataWrapper, ViewType as vt, SpatialDataWrapper, hconcat, wrappers

BASE_DIR = os.path.abspath("/Users/olympia/cellXplore_App/datasets/")

## Setting up the Vitessce config
def create_vitessce_config(zarr_file_path, config_name, dataset_name):
    try:
        # Create the Vitessce configuration object
        # This will create a Vitessce object that will define what data we extract and what views we can plot
        vc = VitessceConfig(name=config_name, schema_version="1.0.15", base_dir=BASE_DIR)
        pprint(dir(vc))
        # This will define our Zarr dataset and will wrap the file into our Vitessce object
        dataset = vc.add_dataset(name=dataset_name).add_object(AnnDataWrapper(zarr_file_path,
                                                                          obs_embedding_paths=["obsm/X_umap"],
                                                                          obs_embedding_names=["UMAP"],
                                                                          obs_set_paths=["obs/clusters"],
                                                                          obs_set_names=["Cell Type"],
                                                                          obs_feature_matrix_path="X"
                                                                          )
                                                                          )

    # Here we define what plots and views we want to visualise
        vc.layout(vc.add_view(view_type="scatterplot", dataset=dataset, mapping='UMAP'))

        # Export the configuration to a JSON format to be used by the frontend
        config_dict = vc.to_dict(base_url='http://127.0.0.1:5000/datasets')
        pprint("Generated Vitessce Configuration:")
        pprint(config_dict)
        return config_dict
    except Exception as e:
        print(f"Error creating Vitessce configuration: {str(e)}")
        return {"error": str(e)}


