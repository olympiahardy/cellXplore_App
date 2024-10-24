from flask import request, jsonify, send_from_directory
from config import app, create_vitessce_config
import pprint as pprint

# So this creates a new route, defines a new endpoint for the route and also contains a decorator
# This means that we only want to use the GET method for this particular URL

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