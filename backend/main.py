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

app = Flask(__name__, static_folder="./dist", static_url_path="/dist")
CORS(app, origins=["http://localhost:5174"]) 

zarr_cache = None 

# Constants
# Paths
MERGED_ZARR_FILE = "sc_FPPE_breast_cancer.zarr"
XENIUM_ZARR_FILE = "Xenium_proper_data.zarr"  # Xenium dataset
CONFIG_DIR = "/home/olympia/cellXplore_App/configs/"
BASE_DIR = "/home/olympia/cellXplore_App/datasets"
SAMPLE_NAME = "Breast_Cancer"  # Sample name
DESCRIPTION = "High resolution mapping of the tumor microenvironment using integrated single-cell, spatial and in situ analysis. Janesick, A., Shelansky, R., Gottscho, A.D. et al. Nat Commun 14, 8353 (2023). https://doi.org/10.1038/s41467-023-43458-x"

def load_cached_zarr():
    global zarr_cache
    if zarr_cache is None:
        zarr_cache = ad.read_zarr(os.path.join(BASE_DIR, MERGED_ZARR_FILE))
        pprint(zarr_cache)

# Load the Zarr file at application startup
load_cached_zarr()

def generate_config(merged_zarr_file, xenium_zarr_file, output_dir, base_dir, sample, description):
    try:
        os.makedirs(output_dir, exist_ok=True)

        # Initialize Vitessce Configuration
        vc = VitessceConfig(schema_version="1.0.17", name='Breast Cancer Multi-Modal', 
                            description = description, base_dir = base_dir)

        # Single-Cell Dataset (scRNA-seq)
        sc_dataset = vc.add_dataset(name='Single-Cell RNA').add_object(AnnDataWrapper(
                adata_path=merged_zarr_file,
                obs_feature_matrix_path="X",
                obs_embedding_paths=["obsm/X_umap"],
                obs_embedding_names=["UMAP"],
                obs_set_paths=["obs/clusters", "obs/Cell_Type"],
                obs_set_names=["Clusters", "Cell Type"],
                coordination_values={
                    "obsType": "cell",
                    "obsSetSelection": "obsSetSelectionScope",
                },
                ))

        # Xenium Spatial Dataset
        xenium_dataset = vc.add_dataset(name='Xenium Spatial').add_object(SpatialDataWrapper(
                sdata_path=xenium_zarr_file,  # Path to Xenium dataset
                image_path="images/morphology_focus",  # Adjust this based on your Zarr file structure
                obs_feature_matrix_path="tables/table/X",  # Adjust this based on Xenium data
                obs_set_paths=["tables/table/obs/clusters"],  # Cluster annotations
                obs_set_names=["Cell Type"],
                obs_spots_path="shapes/cell_circles",
                coordination_values={
                    "obsType": "spot",
                    "obsSetSelection": "obsSetSelectionScope",
                    },
            ))

        spatial_view = vc.add_view("spatialBeta", dataset=xenium_dataset, x=0.0, y = 6.0, w=6.0,h=6.0)
        lc_view = vc.add_view("layerControllerBeta", dataset=xenium_dataset,x=6.0, y = 6.0, w=3.0, h=3.0)
        feature_list_spatial = vc.add_view("featureList", dataset=xenium_dataset, x=9.0, y = 6.0, w=3.0, h=3.0)
        xenium_obs_sets = vc.add_view(cm.OBS_SETS, dataset=xenium_dataset, x=6.0, y = 3.0, w=3.0, h=3.0)
            


        # layer_controller = vc.add_view("layerControllerBeta", dataset=xenium_dataset)
        vc.link_views_by_dict([spatial_view, lc_view], {    
                'imageLayer': CL([{
                        'photometricInterpretation': 'RGB',
                        }])
                        }, scope_prefix=get_initial_coordination_scope_prefix("B", "image"))

        # Views for Single-Cell Data
        scatterplot = vc.add_view(cm.SCATTERPLOT, dataset=sc_dataset, mapping="UMAP", x=0.0, y = 0.0, w=6.0,h=6.0)
        cell_sets = vc.add_view(cm.OBS_SETS, dataset=sc_dataset, x=6.0, y = 0.0, w=3.0, h=4.0)
        feature_list = vc.add_view(cm.FEATURE_LIST, dataset=sc_dataset, x=9.0, y = 0.0, w=3.0, h=4.0)

        description = vc.add_view(cm.DESCRIPTION, dataset=xenium_dataset, x=9.0, y = 6.0, w=3.0, h=3.0)
        
        # Link views appropriately
        vc.link_views([scatterplot, spatial_view, feature_list, cell_sets], ["obsType", "obsSetSelection"], ["cell", []])
        vc.link_views([spatial_view, xenium_obs_sets, feature_list_spatial, lc_view], ["obsType", "obsSetSelection"], ["spot", []])
        # Layout arrangement
        # vc.layout((scatterplot / spatial_view) | (cell_sets / feature_list / xenium_obs_sets / lc_view / feature_list_spatial))

        # Save the generated configuration
        config_dict = vc.to_dict(base_url="http://oh-cxg-dev.mvls.gla.ac.uk/datasets") # config_dict = vc.to_dict(base_url="http://oh-cxg-dev.mvls.gla.ac.uk/datasets")
        output_path = os.path.join(output_dir, f"{sample}.json")
        with open(output_path, "w") as json_file:
            json.dump(config_dict, json_file, indent=4)

        print(f"Configuration generated for {sample} with Single-Cell and Xenium datasets")
    
    except Exception as e:
        print(f"Error generating configuration: {str(e)}")
        traceback.print_exc()

# Generate config with both datasets
generate_config(MERGED_ZARR_FILE, XENIUM_ZARR_FILE, CONFIG_DIR, BASE_DIR, SAMPLE_NAME, DESCRIPTION)

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
    

@app.route("/")
def serve_spa_default():
    print("Serving default")
    return app.send_static_file("index.html")

@app.route("/<path:path>")
def serve_spa_files(path):
    print("Serving " + path)
    return app.send_static_file(path)

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
                    df = df[df["lr_probs"] > 0]
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
            # df = df[df["cellchat_pvals"] <= 0.05]
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
    
@app.route('/filter-table', methods=['POST'])
def filter_table():
    try:
        data = request.json  # Receive request data
        selection_name = data.get("selection_name")  # Get selection name

        if not selection_name:
            return jsonify({"error": "Selection name not provided"}), 400

        # Retrieve stored selections from previous /process_selections call
        stored_selections = getattr(filter_table, "stored_selections", {})

        if selection_name not in stored_selections:
            return jsonify({"error": "Selection not found"}), 404

        selected_barcodes = stored_selections[selection_name]
        print(f"Selected Barcodes: {selected_barcodes}")

        # Check if the Zarr object is loaded
        if zarr_cache is not None and 'liana_res' in zarr_cache.uns:
            metadf = zarr_cache.obs["Cell_Type"]

            # Ensure metadf uses row names (barcodes) correctly
            metadf = metadf.reindex(selected_barcodes)  # Avoids KeyErrors
            print(f"Filtered Metadata: {metadf}")

            # Get unique cell types
            celltypes = metadf.dropna().unique()  # Drop NaN values
            print(f"Cell Types Found: {celltypes}")

            df = zarr_cache.uns["liana_res"]
            df = df[df["lr_probs"] > 0]

            # Ensure source and target columns exist
            if "source" not in df.columns or "target" not in df.columns:
                return jsonify({"error": "Columns 'source' or 'target' not found in dataset"}), 500

            # Filter dataset based on selected barcodes
            filtered_df = df[df["source"].isin(celltypes) & df["target"].isin(celltypes)]

            # Convert filtered DataFrame to JSON
            filtered_data = filtered_df.to_json(orient="records")
            return Response(filtered_data, mimetype='application/json')

        return jsonify({"error": "liana_res or obs not found in dataset"}), 500

    except Exception as e:
        print(f"Error in /filter-table: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    
# Store selections globally for later retrieval
@app.route('/process_selections', methods=['POST'])
def process_selections():
    try:
        data = request.json  # Get data from request
        selections = data.get("selections", {})

        if not selections:
            return jsonify({"message": "No selections received"}), 400

        print(f"Received Selections: {selections}")

        # Store selections for later retrieval in /filter-table
        filter_table.stored_selections = selections

        return jsonify({"message": "Selections stored successfully"}), 200

    except Exception as e:
        print(f"Error in /process_selections: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



# Endpoint: Serve hierarchical Zarr files
# @app.route('/api/<path:filename>', methods=['GET'])
# def serve_datasets(filename):
#     try:
#         # Construct the full path to the requested file
#         full_path = os.path.join(BASE_DIR, filename)
#         if os.path.exists(full_path):
#             # Check if it's a file
#             if os.path.isfile(full_path):
#                 return send_file(full_path)
#             else:
#                 # Handle directory requests (e.g., for Zarr hierarchical access)
#                 return jsonify({"error": f"'{filename}' is a directory, not a file."}), 400
#         else:
#             return jsonify({"error": f"File or directory '{filename}' not found."}), 404
#     except Exception as e:
#         print(f"Error serving dataset file: {str(e)}")
#         traceback.print_exc()
#         return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(debug=True)