from flask import Flask, Response
from flask import request, jsonify, send_from_directory, abort
from config import create_vitessce_config
import anndata as ad
from flask_cors import CORS
import traceback
from pprint import pprint
import dash
from dash import dcc, html
import plotly.express as px
import pandas as pd
import plotly.graph_objects as go


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
pprint(zarr_cache)
@app.route('/data-table', methods=['GET'])
def get_data_table():
    try:
        # Check if the Zarr object is loaded
        if zarr_cache is not None:
            try:
                # Access the DataFrame in the `.uns` slot
                if 'Cellchat_Interactions' in zarr_cache.uns["Interactions"]:
                    df = zarr_cache.uns["Interactions"]['Cellchat_Interactions']
                    print("DataFrame accessed:", df)
                    
                    # Convert the DataFrame to JSON format
                    data = df.to_json(orient='records')
                    #print("Data converted to JSON format:", data)
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
        #print("Data type:", type(data))
        
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
    config = create_vitessce_config(data_path, config_name, dataset_name, zarr_cache)
    return jsonify(config)

# Here we are going to make a function to create a heatmap of interaction counts
@app.route('/get_cellchat_data', methods=['GET'])
def get_cellchat_data():
    try:
        # Ensure the global variable is being accessed
        global zarr_cache
        # Convert the Cellchat_Interactions data from uns to a DataFrame
        if zarr_cache is not None and 'Cellchat_Interactions' in zarr_cache.uns["Interactions"]:
            df = zarr_cache.uns["Interactions"]['Cellchat_Interactions']
            # Convert the DataFrame to JSON format (ensure 'source' and 'target' columns exist)
            data = df[['source', 'target']].to_json(orient='records')
            # Return the data as JSON response
            return Response(data, mimetype='application/json')
        else:
            return jsonify({"error": "'Cellchat_Interactions' not found in the specified Zarr file."}), 500
    except KeyError as ke:
        print(f"KeyError: {ke}")
        return jsonify({"error": str(ke)}), 500
    except Exception as e:
        print("Error accessing Cellchat_Interactions data:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    

@app.route('/get_cellchat_bubble', methods=['GET'])
def get_cellchat_bubble():
    try:
        # Access the DataFrame in the `.uns` slot
        if 'Cellchat_Interactions' in zarr_cache.uns["Interactions"]:
            df = zarr_cache.uns["Interactions"]['Cellchat_Interactions']
            # Ensure the DataFrame contains the required columns
            required_columns = ['source', 'target', 'pval', 'prob', 'interaction_name_2', 'Interacting_Pair']
            if not all(col in df.columns for col in required_columns):
                return jsonify({"error": f"Missing required columns in DataFrame."}), 500
            # Convert the DataFrame to JSON format
            return jsonify(df.to_dict(orient='records'))
        else:
            return jsonify({"error": "'Cellchat_Interactions' not found in the specified Zarr file."}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/datasets/<path:path>', methods=["GET"])
def send_report(path):
    print(f'Requested path: {path}')
    
    # Check if the requested path is the missing .zarray file
    if path == 'tbrucei_brain_spatial.zarr/var/.zarray':
        # Redirect to the correct file location
        path = 'tbrucei_brain_spatial.zarr/var/_index/.zarray'

    # Check if the requested path is the missing .zarray file for obs
    if path == 'tbrucei_brain_spatial.zarr/obs/.zarray':
        # Redirect to the correct file location for obs
        path = 'tbrucei_brain_spatial.zarr/obs/_index/.zarray'
    
    # Check if the requested path is the missing .zarray file for obs
    if path == 'tbrucei_brain_spatial.zarr/obs/clusters/.zarray':
        # Redirect to the correct file location for obs
        path = 'tbrucei_brain_spatial.zarr/obs/clusters/categories/.zarray'

    # Check if the requested path is the missing .zarray file for obs
    if path == 'tbrucei_brain_spatial.zarr/obs/library_id/.zarray':
        # Redirect to the correct file location for obs
        path = 'tbrucei_brain_spatial.zarr/obs/library_id/categories/.zarray'
    try:
        # Send the file from the datasets directory
        return send_from_directory('../datasets', path)
    except FileNotFoundError:
        print(f'File not found: {path}')
        abort(404)

if __name__ == "__main__":
    app.run(debug=True)