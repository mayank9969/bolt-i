# Veyra model assets

The floating-island meshes are generated for the Veyra archipelago: four terrain silhouettes with uneven grass shelves, a layered rocky underside, scattered stones, grass tufts, and hanging vines. The coastal tree source is Poly Haven's **Island Tree 01**, reduced to two web-friendly detail levels.

## Files

- `veyra_floating_island_01.glb` through `veyra_floating_island_04.glb`: four independent island shapes.
- `veyra_canopy_tree_detail.glb`: higher-detail tree for subject islands.
- `veyra_canopy_tree_forest.glb`: lighter tree for distant forest instances.
- `veyra_model_source.blend`: editable Blender scene containing the source and generated assets.
- `veyra_island_preview.png`: Blender render of a sample island and trees.
- `build_veyra_models.py`: rebuilds the models with Blender 5.x.
- `pack_models.py`: rebuilds `veyra-models-data.js` for the self-contained local HTML demo.
- `veyra-three.bundle.js`: local Three.js 0.186.0 + GLTFLoader bundle used by the demo, so the page renders without fetching code from a CDN.
- `THREE-LICENSE.txt`: MIT license for the bundled Three.js code.
- `_source-tree/`: downloaded Poly Haven source model and 1K maps.

## Attribution and license

`Island Tree 01` by Poly Haven, CC0: https://polyhaven.com/a/island_tree_01

Poly Haven assets are released under CC0: https://polyhaven.com/license

The island meshes and scene assembly are original Veyra-specific procedural work. The downloaded tree source remains unmodified in `_source-tree/`; the GLBs are simplified derivatives for this demo.

The provided `react-three-fiber` and `drei` clones were inspected for rendering patterns and performance helpers. They are React-focused libraries rather than model collections, so the standalone Three.js demo uses the locally bundled renderer and its own GLB assets instead of copying either repository into the site.
