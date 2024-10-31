from flask import Flask
from flask import request, jsonify, send_from_directory
from config import create_vitessce_config

import zarr
from pprint import pprint
import pandas as pd


app = Flask(__name__)
zarr_cache = None 
# So this creates a new route, defines a new endpoint for the route and also contains a decorator
# This means that we only want to use the GET method for this particular URL

# # Path to your Zarr file
ZARR_PATH = "/Users/olympia/cellXplore_App/datasets/tbrucei_brain_spatial.zarr"
zarr_cache = zarr.open(ZARR_PATH)

@app.route('/filtered_metadata', methods=['GET'])
def get_filtered_metadata():
    # Access cached AnnData object
    global zarr_cache
    # Access the DataFrame from 'uns'
    cellchat_df = pd.DataFrame(zarr_cache['uns']['Cellchat_Interactions'])
    pprint(cellchat_df)
    # Convert DataFrame to JSON
    data = cellchat_df.to_json(orient='split')  # 'split' format for easier frontend parsing
    return jsonify(data)


@app.route("/get_anndata", methods=["GET"])
# Here we can write a function that specifies how we are handling the GET request that is sent to the above route
# This fetches the adata that is constructed as a vc visualisation and returns it as a json that the frontend can handle 

def get_anndata_config():
    data_path = "tbrucei_brain_spatial.zarr"
    config_name = "10X Visium Murine Brain T.brucei Infection"
    dataset_name = "T.brucei infection"
    config = create_vitessce_config(data_path, config_name, dataset_name)
    return jsonify(config)


@app.route('/datasets/<path:path>', methods=["GET"])
def send_report(path):
    print(f'/datasets: {path}')
    return send_from_directory('../datasets', path)

# @app.route("/get_anndata_spatial", methods=["GET"])
# Here we can write a function that specifies how we are handling the GET request that is sent to the above route
# This fetches the adata that is constructed as a vc visualisation and returns it as a json that the frontend can handle 

# def get_anndata_spatial_config():
#     data_path = "tbrucei_brain_spatial.zarr"
#     config_name = "Multiple 10X Visium Murine Brain T.brucei Infection"
#     dataset_name = "T.brucei infection slides"
#     config = create_vitessce_spatial_config(data_path, config_name)

#     return jsonify(config)

if __name__ == "__main__":
    app.run(debug=True)