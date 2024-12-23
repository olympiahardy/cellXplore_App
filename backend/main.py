from flask import Flask, Response
from flask import request, jsonify, send_from_directory, abort, send_file
from config import create_vitessce_config
from flask_cors import CORS
import traceback
from pprint import pprint
import spatialdata as sd
import json
import os
from vitessce import VitessceConfig, SpatialDataWrapper, CoordinationLevel as CL, ViewType as vt, get_initial_coordination_scope_prefix

app = Flask(__name__)
CORS(app, origins=["http://localhost:5174"]) 

zarr_cache = None 

MERGED_ZARR_FILE = "tbrucei_brain_spatial_spatial_data3.zarr"
CONFIG_DIR = "/Users/olympia/cellXplore_App/configs/"
BASE_DIR = "/Users/olympia/cellXplore_App/datasets/"

def load_cached_zarr():
    global zarr_cache
    if zarr_cache is None:
        zarr_cache = sd.read_zarr(os.path.join(BASE_DIR, MERGED_ZARR_FILE))

# Load the Zarr file at application startup
load_cached_zarr()

def generate_configs_from_merged_zarr(merged_zarr_file, output_dir, base_dir):
    try:
        global zarr_cache
        if zarr_cache is None:
            zarr_cache = sd.read_zarr(os.path.join(base_dir, merged_zarr_file))

        dataset_names = set("_".join(name.split("_")[:2]) for name in zarr_cache.images.keys())
        os.makedirs(output_dir, exist_ok=True)

        for image_name in zarr_cache.images.keys():
            vc = VitessceConfig(
            schema_version="1.0.16",
            name='Visium SpatialData Demo (visium_associated_xenium_io)',
            base_dir=base_dir)
            print(image_name)
            # Add data to the configuration:
            wrapper = SpatialDataWrapper(
                sdata_path=MERGED_ZARR_FILE,
                # The following paths are relative to the root of the SpatialData zarr store on-disk.
                image_path=f"images/{image_name}_hires_image",
                table_path="tables/table",
                obs_feature_matrix_path="tables/table/X",
                obs_spots_path="shapes/locations",
                obs_embedding_paths="tables/table/obsm/X_umap",
                obs_embedding_names="UMAP",
                obs_set_paths="tables/table/obs/region",
                obs_set_names="region",
                region="Tbrucei brain",
                coordinate_system="global",
                coordination_values={
                    # The following tells Vitessce to consider each observation as a "spot"
                    "obsType": "spot",
                    "embeddingType": "UMAP"
                }
            )
            dataset = vc.add_dataset(name='Tbrucei Visium').add_object(wrapper)
            spatial = vc.add_view("spatialBeta", dataset=dataset)
            layer_controller = vc.add_view("layerControllerBeta", dataset=dataset)
            umap_view = vc.add_view(vt.SCATTERPLOT, dataset=dataset, coordination_scopes={"embeddingType": "UMAP"})
            vc.link_views_by_dict([spatial, layer_controller], {
                'imageLayer': CL([{
                    'photometricInterpretation': 'RGB',
                }]),
            }, scope_prefix=get_initial_coordination_scope_prefix("A", "image"))
            vc.link_views([spatial, layer_controller, umap_view], ['obsType', 'embeddingType'], [wrapper.obs_type_label, "UMAP"])

            vc.layout(umap_view | spatial)
            # Generate and save the configuration
            config_dict = vc.to_dict(base_url="http://127.0.0.1:5000/datasets")
            output_path = os.path.join(output_dir, f"{image_name}.json")
            with open(output_path, "w") as json_file:
                json.dump(config_dict, json_file, indent=4)

        print(f"Configurations generated for datasets: {', '.join(dataset_names)}")
    except Exception as e:
        print(f"Error generating configurations: {str(e)}")
        traceback.print_exc()


# def generate_configs_from_merged_zarr(merged_zarr_file, output_dir, base_dir):
#     try:
#         global zarr_cache
#         if zarr_cache is None:
#             zarr_cache = sd.read_zarr(os.path.join(base_dir, merged_zarr_file))

#         print(f"Base directory: {base_dir}")
#         print(f"Merged Zarr file: {os.path.join(base_dir, merged_zarr_file)}")

#         dataset_names = set("_".join(name.split("_")[:2]) for name in zarr_cache.images.keys())
#         os.makedirs(output_dir, exist_ok=True)

#         for dataset_name in dataset_names:
#             config_name = f"Vitessce Config for {dataset_name}"
#             vc = VitessceConfig(name=config_name, schema_version="1.0.16", base_dir=base_dir)

#             dataset = vc.add_dataset(name=dataset_name)
#             print(f"Processing dataset: {dataset_name}")

#             for image_name in zarr_cache.images.keys():
#                 if image_name.startswith(dataset_name):
#                     dataset.add_object(
#                         SpatialDataWrapper(
#                             sdata_path=MERGED_ZARR_FILE,
#                             image_path=f"images/{image_name}/",
#                             table_path="tables/table",
#                             obs_feature_matrix_path="tables/table/X",
#                             obs_spots_path="shapes/locations",
#                             obs_embedding_paths="tables/table/obsm/X_umap",
#                             obs_embedding_names="UMAP",
#                             obs_set_paths="tables/table/obs/region",
#                             obs_set_names="region",
#                             coordinate_system="global",
#                             coordination_values={"obsType": "spot",
#                                                  "embeddingType": "UMAP",
#                                                  "imageLayer": image_name
#                                                         }
#                         )
#                     )
#             print(f"Dataset object added for {dataset_name}")

#             spatial_views = []
#             layer_controllers = []
#             x, y = 0, 0
#             for image_name in zarr_cache.images.keys():
#                 if dataset_name in image_name:
#                     #image_layer_scope = vc.add_coordination("imageLayer", image_name)
#                     #print(image_layer_scope)
#                     # Create a layer controller for the same image and assign the same scope
#                     layer_controller = vc.add_view(
#                         "layerControllerBeta",
#                         dataset=dataset,
#                         coordination_scopes={"imageLayer": image_name}
#                     )
#                     layer_controllers.append(layer_controller)

#                     spatial_view = vc.add_view("spatialBeta", dataset=dataset)
#                     spatial_views.append(spatial_view)

#             #layer_controller = vc.add_view("layerControllerBeta", dataset=dataset)
#             umap_view = vc.add_view("scatterplot", dataset=dataset, coordination_scopes={"embeddingType": "UMAP"})
#             obs_sets = vc.add_view("obsSets", dataset=dataset)


#             # Link views
#             for spatial_view, layer_controller in zip(spatial_views, layer_controllers):
#                 vc.link_views([spatial_view, layer_controller], {
#                 'imageLayer': CL([{
#                     'photometricInterpretation': 'RGB',
#                 }]),
#             })
#             vc.link_views([umap_view, obs_sets], ["embeddingType"])

#             vc.layout(spatial_view | umap_view)
#             # Layout the views
#             layout_items = []
#             for spatial_view, layer_controller in zip(spatial_views, layer_controllers):
#                 layout_items.append(spatial_view | layer_controller)

#             if layout_items:
#                 vc.layout(layout_items[0] | umap_view )
#             # # Flatten spatial_views before linking
#             # all_views = spatial_views + [layer_controller, obs_sets, umap_view]

#             #             # Link views using CoordinationLevel
#             # vc.link_views_by_dict([spatial_views, layer_controller], {
#             #     'imageLayer': CL([{
#             #         'photometricInterpretation': 'RGB',
#             #     }]),
#             # })
            
#             # # Link views using CoordinationLevel
#             # vc.link_views(all_views, ['obsType', 'embeddingType'], allow_multiple_scopes_per_type=True)

#             # if spatial_views:
#             #     vc.layout(umap_view | spatial_views[0] | (layer_controller / obs_sets))
            
#             config_dict = vc.to_dict(base_url="http://127.0.0.1:5000/datasets")
#             output_path = os.path.join(output_dir, f"{dataset_name}.json")
#             with open(output_path, "w") as json_file:
#                 json.dump(config_dict, json_file, indent=4)

#         print(f"Configurations generated for datasets: {', '.join(dataset_names)}")

#     except Exception as e:
#         print(f"Error generating configurations: {str(e)}")
#         traceback.print_exc()

# # Generate configurations at startup

generate_configs_from_merged_zarr(MERGED_ZARR_FILE, CONFIG_DIR, BASE_DIR)

@app.route('/get_config', methods=['GET'])
def get_config():
    try:
        # Get the sample name from the query parameters
        sample = request.args.get('sample')
        if not sample:
            return jsonify({"error": "Sample parameter is required"}), 400

        # Construct the path to the JSON configuration file
        config_path = os.path.join(CONFIG_DIR, f"{sample}.json")
        if not os.path.exists(config_path):
            return jsonify({"error": f"Configuration file for sample '{sample}' not found"}), 404

        # Load the JSON configuration file
        with open(config_path, 'r') as f:
            config = json.load(f)
        return jsonify(config), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    # Endpoint to get a list of available samples
@app.route('/get_samples', methods=['GET'])
def get_samples():
    try:
        # List all JSON files in the CONFIG_DIR
        samples = [os.path.splitext(file)[0] for file in os.listdir(CONFIG_DIR) if file.endswith('.json')]
        return jsonify(samples), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/data-table', methods=['GET'])
def get_data_table():
    try:
        # Check if the Zarr object is loaded
        if zarr_cache is not None:
            try:
                # Access the DataFrame in the `.uns` slot
                if 'Cellchat_Interactions' in zarr_cache.tables["table"].uns["Interactions"]:
                    df = zarr_cache.tables["table"].uns["Interactions"]['Cellchat_Interactions']
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
        print("General error in '/data-table' endpoint:", str(e))
        traceback.print_exc()  # Prints the full traceback to console
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@app.route("/get_anndata", methods=["GET"])
# Here we can write a function that specifies how we are handling the GET request that is sent to the above route
# This fetches the adata that is constructed as a vc visualisation and returns it as a json that the frontend can handle 

def get_anndata_config():
    data_path = "tbrucei_brain_spatial_spatial_data3.zarr"
    config_name = "10X Visium Murine Brain T.brucei Infection"
    dataset_name = "T.brucei infection"
    config = create_vitessce_config(data_path, config_name, dataset_name, zarr_cache)
    
    return jsonify(config)

    # Endpoint to list images for debugging
@app.route('/list_images', methods=['GET'])
def list_images():
    try:
        global zarr_cache
        if zarr_cache is None:
            load_cached_zarr()
        images = list(zarr_cache.images.keys())
        return jsonify(images), 200
    except Exception as e:
        print(f"Error listing images: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Here we are going to make a function to create a heatmap of interaction counts
@app.route('/get_cellchat_data', methods=['GET'])
def get_cellchat_data():
    try:
        # Ensure the global variable is being accessed
        global zarr_cache
        #pprint("Here is the object: " + zarr_cache)
        # Convert the Cellchat_Interactions data from uns to a DataFrame
        if zarr_cache is not None and 'Cellchat_Interactions' in zarr_cache.tables["table"].uns["Interactions"]:
            df = zarr_cache.tables["table"].uns["Interactions"]['Cellchat_Interactions']
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
        if 'Cellchat_Interactions' in zarr_cache.tables["table"].uns["Interactions"]:
            df = zarr_cache.tables["table"].uns["Interactions"]['Cellchat_Interactions']
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
    if path == 'my_spatialdata_test.zarr/images/Naive_1_image/.zarray':
        # Redirect to the correct file location
        path = 'my_spatialdata_test.zarr/images/Naive_1_image/0/.zarray'

    # Check if the requested path is the missing .zarray file for obs
    if path == 'my_spatialdata_test.zarr/images/Naive_1_image/0/.zattrs':
        # Redirect to the correct file location for obs
        path = 'my_spatialdata_test.zarr/images/Naive_1_image/.zattrs'
    
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