import os
from pprint import pprint
from vitessce import VitessceConfig, AnnDataWrapper, Component as cm, hconcat

BASE_DIR = os.path.abspath("/Users/olympia/cellXplore_App/datasets/")

## Setting up the Vitessce config
def create_vitessce_config(zarr_file_path, config_name, dataset_name, zarr_cache):
    try:
        # Create the Vitessce configuration object
        vc = VitessceConfig(name=config_name, schema_version="1.0.15", base_dir=BASE_DIR)
        
        # Wrap the Zarr dataset with AnnDataWrapper
        dataset = vc.add_dataset(name=dataset_name).add_object(
            AnnDataWrapper(
                zarr_file_path,
                obs_embedding_paths=["obsm/X_umap"],
                obs_embedding_names=["UMAP"],
                obs_set_paths=["obs/leiden", "obs/library_id"],
                obs_set_names=["Cell Type", "Sample"],
                obs_feature_matrix_path="X",
                spatial_image_paths=["uns/spatial"],
                spatial_centroid_paths=["obsm/spatial"],
            )
        )

        # Create a UMAP view
        umap_view = vc.add_view(cm.SCATTERPLOT, dataset=dataset, mapping="UMAP")
        obs_sets_view = vc.add_view(cm.OBS_SETS, dataset=dataset)

        # Create spatial views for all samples, with a unique coordination scope for each spatial layer
        spatial_views = []
        for sample_id in zarr_cache.obs['library_id'].unique():
            # Create a new coordination scope for each spatial layer
            spatial_layer_scope = vc.add_coordination("spatialLayer", sample_id)

            # Create a spatial view and associate it with the coordination scope
            spatial_view = vc.add_view(
                cm.SPATIAL, 
                dataset=dataset, 
                coordination_scopes={"spatialLayer": spatial_layer_scope}
            )
            spatial_views.append(spatial_view)

        # Layout views
        vc.layout(hconcat(umap_view, obs_sets_view, *spatial_views))

        # Export the configuration to a JSON format to be used by the frontend
        config_dict = vc.to_dict(base_url='http://127.0.0.1:5000/datasets')
        pprint("Generated Vitessce Configuration:")
        pprint(config_dict)
        return config_dict

    except Exception as e:
        print(f"Error creating Vitessce configuration: {str(e)}")
        return {"error": str(e)}
