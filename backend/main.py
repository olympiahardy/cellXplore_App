from flask import Flask, Response
from flask import request, jsonify, send_from_directory, abort, send_file
from flask_cors import CORS
import traceback
from pprint import pprint
import spatialdata as sd
import anndata as ad
import json
import os
from vitessce import (VitessceConfig, 
                      SpatialDataWrapper, 
                      CoordinationLevel as CL,
                      ViewType as vt, 
                      Component as cm,
                      AnnDataWrapper,
                      get_initial_coordination_scope_prefix)

app = Flask(__name__)
CORS(app, origins=["http://localhost:5174"]) 

zarr_cache = None 

# Constants
MERGED_ZARR_FILE = "sc_FPPE_breast_cancer.zarr"
CONFIG_DIR = "/Users/olympia/cellXplore_App/configs/"
BASE_DIR = "/Users/olympia/cellXplore_App/datasets/"
SAMPLE_NAME = "Breast_Cancer"  # Replace this with the desired sample

def load_cached_zarr():
    global zarr_cache
    if zarr_cache is None:
        zarr_cache = ad.read_zarr(os.path.join(BASE_DIR, MERGED_ZARR_FILE))

# Load the Zarr file at application startup
load_cached_zarr()

# Generate a single config file for the sample
def generate_config(merged_zarr_file, output_dir, base_dir, sample):
    try:
        os.makedirs(output_dir, exist_ok=True)

        # Vitessce configuration
        vc = VitessceConfig(schema_version="1.0.16", name='Breast Cancer Single cell', base_dir=base_dir)
        dataset = vc.add_dataset(name='Space Ranger outputs').add_object(AnnDataWrapper(
            adata_path=merged_zarr_file, # Relative to BASE_DIR (because we specified base_dir in the VitessceConfig constructor)
            obs_feature_matrix_path="X",
            obs_embedding_paths=["obsm/X_umap"],
            obs_embedding_names=["UMAP"],
            obs_set_paths=["obs/clusters", "obs/Cell_Type"],
            obs_set_names=["Clusters", "Cell Type"],
            coordination_values={
                "obsType":"cell",
            },
        ))

        scatterplot = vc.add_view(cm.SCATTERPLOT, dataset=dataset, mapping="UMAP")
        cell_sets = vc.add_view(cm.OBS_SETS, dataset=dataset)
        feature_list = vc.add_view(cm.FEATURE_LIST, dataset=dataset)


        vc.link_views([scatterplot, feature_list, cell_sets], ["obsType"], ["cell"])
        vc.layout((scatterplot | (cell_sets / feature_list)))

        # Save config
        config_dict = vc.to_dict(base_url="http://127.0.0.1:5000/datasets")
        output_path = os.path.join(output_dir, f"{sample}.json")
        with open(output_path, "w") as json_file:
            json.dump(config_dict, json_file, indent=4)

        print(f"Configuration generated for {sample}")
    except Exception as e:
        print(f"Error generating configuration: {str(e)}")
        traceback.print_exc()

# Generate config on startup
generate_config(MERGED_ZARR_FILE, CONFIG_DIR, BASE_DIR, SAMPLE_NAME)

@app.route('/get_config', methods=['GET'])
def get_config():
    try:
        config_path = os.path.join(CONFIG_DIR, f"{SAMPLE_NAME}.json")
        if not os.path.exists(config_path):
            return jsonify({"error": "Configuration file not found"}), 404

        with open(config_path, 'r') as f:
            config = json.load(f)
        return jsonify(config), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/data-table', methods=['GET'])
def get_data_table():
    try:
        # Check if the Zarr object is loaded
        if zarr_cache is not None:
            try:
                # Access the DataFrame in the `.uns` slot
                if 'liana_res' in zarr_cache.uns:
                    df = zarr_cache.uns["liana_res"]
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
    

@app.route('/prop-freq', methods=['GET'])
def get_table_prop():
    try:
        # Check if the Zarr object is loaded
        if zarr_cache is not None:
            try:
                # Access the DataFrame in the `.uns` slot
                if 'liana_res' in zarr_cache.uns:
                    df = zarr_cache.uns["liana_res"]
                    #print("DataFrame accessed:", df)
                    
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
        print("General error in '/prop-freq' endpoint:", str(e))
        traceback.print_exc()  # Prints the full traceback to console
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    

@app.route('/sankey', methods=['GET'])
def get_table_sankey():
    try:
        # Check if the Zarr object is loaded
        if zarr_cache is not None:
            try:
                # Access the DataFrame in the `.uns` slot
                if 'liana_res' in zarr_cache.uns:
                    df = zarr_cache.uns["liana_res"]
                    #print("DataFrame accessed:", df)
                    
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
        print("General error in '/sankey' endpoint:", str(e))
        traceback.print_exc()  # Prints the full traceback to console
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/circos', methods=['GET'])
def get_table_circos():
    try:
        # Check if the Zarr object is loaded
        if zarr_cache is not None:
            try:
                # Access the DataFrame in the `.uns` slot
                if 'liana_res' in zarr_cache.uns:
                    df = zarr_cache.uns["liana_res"]
                    #print("DataFrame accessed:", df)
                    df = df[df["lr_probs"] > 0]
                    df = df[df["cellchat_pvals"] <= 0.05]
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
        print("General error in '/circos' endpoint:", str(e))
        traceback.print_exc()  # Prints the full traceback to console
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    

# Here we are going to make a function to create a heatmap of interaction counts
@app.route('/get_cellchat_data', methods=['GET'])
def get_cellchat_data():
    try:
        # Convert the Cellchat_Interactions data from uns to a DataFrame
        if 'liana_res' in zarr_cache.uns:
            df = zarr_cache.uns["liana_res"]
            df = df[df["lr_probs"] > 0]
            df = df[df["cellchat_pvals"] <= 0.05]
            print("Bubble Plot DataFrame accessed:", df)
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
        if 'liana_res' in zarr_cache.uns:
            df = zarr_cache.uns["liana_res"]
            df["Interacting_Pair"] = df["source"] + " -> " + df["target"]
            df["Interaction"] = df["ligand_complex"] + " - " + df["receptor_complex"]
            df = df[df["lr_probs"] > 0]
            #print("Bubble Plot DataFrame accessed:", df)
 
            # Convert the DataFrame to JSON format
            return jsonify(df.to_dict(orient='records'))
        else:
            return jsonify({"error": "'Cellchat_Interactions' not found in the specified Zarr file."}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint: Serve hierarchical Zarr files
@app.route('/datasets/<path:filename>', methods=['GET'])
def serve_datasets(filename):
    try:
        # Construct the full path to the requested file
        full_path = os.path.join(BASE_DIR, filename)
        if os.path.exists(full_path):
            # Check if it's a file
            if os.path.isfile(full_path):
                return send_file(full_path)
            else:
                # Handle directory requests (e.g., for Zarr hierarchical access)
                return jsonify({"error": f"'{filename}' is a directory, not a file."}), 400
        else:
            return jsonify({"error": f"File or directory '{filename}' not found."}), 404
    except Exception as e:
        print(f"Error serving dataset file: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(debug=True)