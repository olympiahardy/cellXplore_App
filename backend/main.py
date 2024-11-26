from flask import Flask, Response
from flask import request, jsonify, send_from_directory, abort
from config import create_vitessce_config
import anndata as ad
from flask_cors import CORS
import traceback
from pprint import pprint
import pandas as pd
import yaml


app = Flask(__name__)
CORS(app, origins=["http://localhost:5174"]) 

zarr_cache = None 


def load_cached_zarr():
    global zarr_cache
    if zarr_cache is None:
        # Load the Zarr file and cache it (replace 'your_file.zarr' with your actual file path)
        zarr_cache = ad.read_zarr('/Users/olympia/cellXplore_App/datasets/tbrucei_brain_spatial.zarr')

# Load the Zarr file when the application starts
load_cached_zarr()

@app.route('/data-table', methods=['GET'])
def get_data_table():
    try:
        # Check if the Zarr object is loaded
        if zarr_cache is not None:
            try:
                # Access the DataFrame in the `.uns` slot
                if 'Cellchat_Interactions' in zarr_cache.uns:
                    df = zarr_cache.uns['Cellchat_Interactions']
                    print("DataFrame accessed:", df)
                    
                    # Convert the DataFrame to JSON format
                    data = df.to_json(orient='records')
                    print("Data converted to JSON format:", data)
                else:
                    print("Key 'Cellchat_Interactions' not found in zarr_cache")
                    data = []  # Return an empty array if the key is not found
            except Exception as e:
                print("Error accessing DataFrame in 'zarr_cache.uns':", str(e))
                traceback.print_exc()  # Prints the full traceback to console
                return jsonify({"error": f"Failed to access DataFrame: {str(e)}"}), 500
        else:
            print("Zarr cache not loaded.")
            data = []  # Return an empty array if Zarr file failed to load

        # Log the data type for debugging
        print("Data type:", type(data))
        
        # Return the data as JSON
        return Response(data, mimetype='application/json')

    except Exception as e:
        print("General error in '/data-table' endpoint:", str(e))
        traceback.print_exc()  # Prints the full traceback to console
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


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
    print(f'Requested path: {path}')
    
    # Check if the requested path is the missing .zarray file
    if path == 'tbrucei_brain_spatial.zarr/var/.zarray':
        # Redirect to the correct file location
        path = 'tbrucei_brain_spatial.zarr/var/_index/.zarray'
    
    try:
        # Send the file from the datasets directory
        return send_from_directory('../datasets', path)
    except FileNotFoundError:
        print(f'File not found: {path}')
        abort(404)

if __name__ == "__main__":
    app.run(debug=True)