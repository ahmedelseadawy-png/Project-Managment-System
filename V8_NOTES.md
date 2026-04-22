V8 changes

- BOQ form now requires a Building / Villa selection before saving.
- BOQ list now shows the related structure column.
- BOQ insert payload sends structure_id and villa_id compatibility value.
- Added ProjectStructure typing to the frontend database types.

Important
- This package still expects project structures to exist for the selected project.
- Create Phase / Building / Villa rows first from the Project Structure module in the dashboard.
- The database must contain boq_items.structure_id and allow inserts.
