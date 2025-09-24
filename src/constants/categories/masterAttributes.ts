import type { AttributeDefinition } from "../../types/category/CategoryTypes";

export const MASTER_ATTRIBUTES: Record<string, AttributeDefinition> = {
  macro_mvgr: {
    key: 'macro_mvgr',
    label: 'MACRO_MVGR',  // Original Excel column name
    type: 'select',
    allowedValues: ['Apparel', 'Accessories', 'Footwear', 'Home']
  },
  micro_mvgr: { 
    key: 'micro_mvgr',
    label: 'MICRO MVGR',  // Original Excel column name
    type: 'select',
    allowedValues: ['Casual', 'Formal', 'Ethnic', 'Sports', 'Inner', 'Occasion']
  },
  fab_division: {
    key: 'fab_division',
    label: 'FAB DIVISION',  // Original Excel column name
    type: 'select',
    allowedValues: ['Woven', 'Knit', 'Non-Woven', 'Denim']
  },
  fab_yarn_01: {
    key: 'fab_yarn_01',
    label: 'FAB YARN-01',  // Original Excel column name
    type: 'select',
    allowedValues: ['Cotton', 'Polyester', 'Viscose', 'Linen', 'Wool', 'Silk', 'Modal', 'Acrylic']
  },
  fab_yarn_02: {
    key: 'fab_yarn_02',
    label: 'FAB YARN-02',  // Original Excel column name
    type: 'select',
    allowedValues: ['Cotton', 'Polyester', 'Viscose', 'Linen', 'Wool', 'Silk', 'Modal', 'Acrylic']
  },
  fab_main_mvgr: {
    key: 'fab_main_mvgr',
    label: 'FAB MAIN_MVGR',  // Original Excel column name
    type: 'select',
    allowedValues: ['Cotton', 'Synthetic', 'Blended', 'Natural']
  },
  fab_weave: {
    key: 'fab_weave',
    label: 'FAB WEAVE',  // Original Excel column name
    type: 'select',
    allowedValues: ['Plain', 'Twill', 'Satin', 'Rib', 'Jersey', 'Interlock']
  },
  fab_weave_02: {
    key: 'fab_weave_02',
    label: 'FAB WEAVE-02',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  fab_composition: {
    key: 'fab_composition',
    label: 'FAB COMPOSITION',  // Original Excel column name
    type: 'text',
  },
  fab_finish: {
    key: 'fab_finish',
    label: 'FAB FINISH',  // Original Excel column name
    type: 'text',
  },
  fab_construction: {
    key: 'fab_construction',
    label: 'FAB CONSTRUCTION',  // Original Excel column name
    type: 'text',
  },
  fab_gsm: {
    key: 'fab_gsm',
    label: 'FAB GSM',  // Original Excel column name
    type: 'number',
  },
  fab_width: {
    key: 'fab_width',
    label: 'FAB WIDTH',  // Original Excel column name
    type: 'number',
  },
  fab_count: {
    key: 'fab_count',
    label: 'FAB COUNT',  // Original Excel column name
    type: 'number',
  },
  fab_weight_type: {
    key: 'fab_weight_type',
    label: 'FAB WEIGHT TYPE',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  fab_source: {
    key: 'fab_source',
    label: 'FAB SOURCE',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  fab_shade: {
    key: 'fab_shade',
    label: 'FAB SHADE',  // Original Excel column name
    type: 'text',
  },
  fab_lycra: {
    key: 'fab_lycra',
    label: 'FAB LYCRA',  // Original Excel column name
    type: 'select',
    allowedValues: ['None', '2%', '3%', '5%', '8%', '10%', '15%', '20%']
  },
  neck: {
    key: 'neck',
    label: 'NECK',  // Original Excel column name
    type: 'select',
    allowedValues: ['Round', 'V-Neck', 'Polo', 'Turtle', 'Boat', 'Off-Shoulder', 'Cowl', 'Halter', 'High Neck']
  },
  neck_type: {
    key: 'neck_type',
    label: 'NECK TYPE',  // Original Excel column name
    type: 'select',
    allowedValues: ['Basic', 'Ribbed', 'Contrast', 'Printed', 'Lace', 'Embroidered', 'Mandarin']
  },
  neck_size: {
    key: 'neck_size',
    label: 'NECK SIZE',  // Original Excel column name
    type: 'number',
  },
  placket: {
    key: 'placket',
    label: 'PLACKET',  // Original Excel column name
    type: 'select',
    allowedValues: ['None', 'Button', 'Zip', 'Keyhole', 'Slit', 'Overlap', 'Hidden']
  },
  father_belt: {
    key: 'father_belt',
    label: 'FATHER BELT',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  belt_design: {
    key: 'belt_design',
    label: 'BELT DESIGN',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  belt_size: {
    key: 'belt_size',
    label: 'BELT SIZE',  // Original Excel column name
    type: 'number',
  },
  sleeves_main_style: {
    key: 'sleeves_main_style',
    label: 'SLEEVES MAIN STYLE',  // Original Excel column name
    type: 'select',
    allowedValues: ['Full Sleeve', 'Half Sleeve', '3/4 Sleeve', 'Sleeveless', 'Cap Sleeve', 'Bell Sleeve', 'Bishop Sleeve']
  },
  bottom_fold: {
    key: 'bottom_fold',
    label: 'BOTTOM FOLD',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  width_inch: {
    key: 'width_inch',
    label: 'WIDTH (INCH)',  // Original Excel column name
    type: 'number',
  },
  set: {
    key: 'set',
    label: 'SET',  // Original Excel column name
    type: 'select',
    allowedValues: ['Single', 'Combo', 'Co-ord', '2-Piece', '3-Piece']
  },
  front_open_style: {
    key: 'front_open_style',
    label: 'FRONT OPEN STYLE',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  pocket_type: {
    key: 'pocket_type',
    label: 'POCKET TYPE',  // Original Excel column name
    type: 'select',
    allowedValues: ['None', 'Patch', 'Side Seam', 'Flap', 'Zip', 'Button', 'Hidden', 'Kangaroo', 'Chest']
  },
  number_of_pocket: {
    key: 'number_of_pocket',
    label: 'NUMBER-OF POCKET',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  fit: {
    key: 'fit',
    label: 'FIT',  // Original Excel column name
    type: 'select',
    allowedValues: ['Slim', 'Regular', 'Relaxed', 'Loose', 'Tight', 'Oversized', 'Skinny', 'Straight', 'Comfort']
  },
  pattern: {
    key: 'pattern',
    label: 'PATTERN',  // Original Excel column name
    type: 'select',
    allowedValues: ['Solid', 'Striped', 'Checked', 'Floral', 'Abstract', 'Geometric', 'Polka Dot', 'Animal Print', 'Digital Print']
  },
  length: {
    key: 'length',
    label: 'LENGTH',  // Original Excel column name
    type: 'select',
    allowedValues: ['Short', 'Medium', 'Long', 'Cropped', 'Regular', 'Extended', 'Knee Length', 'Ankle Length', 'Floor Length']
  },
  length_inch: {
    key: 'length_inch',
    label: 'LENGTH  (INCH)',  // Original Excel column name
    type: 'number',
  },
  drawcord: {
    key: 'drawcord',
    label: 'DRAWCORD ',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  drawcord_style: {
    key: 'drawcord_style',
    label: 'DRAWCORD STYLE',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  drawcord_loop: {
    key: 'drawcord_loop',
    label: 'DRAWCORD LOOP',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  button: {
    key: 'button',
    label: 'BUTTON',  // Original Excel column name
    type: 'select',
    allowedValues: ['None', 'Plastic', 'Metal', 'Wood', 'Shell', 'Fabric Covered']
  },
  button_color: {
    key: 'button_color',
    label: 'BUTTON COLOR',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  zip: {
    key: 'zip',
    label: 'ZIP',  // Original Excel column name
    type: 'select',
    allowedValues: ['None', 'Metal', 'Plastic', 'Invisible', 'Exposed']
  },
  zip_col: {
    key: 'zip_col',
    label: 'ZIP_COL',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  print_type: {
    key: 'print_type',
    label: 'PRINT_TYPE',  // Original Excel column name
    type: 'select',
    allowedValues: ['None', 'Screen Print', 'Digital Print', 'Block Print', 'Heat Transfer', 'Sublimation', 'Embossed']
  },
  print_placement: {
    key: 'print_placement',
    label: 'PRINT_PLACEMENT',  // Original Excel column name
    type: 'select',
    allowedValues: ['All Over', 'Front', 'Back', 'Chest', 'Sleeve', 'Bottom', 'Side Panel', 'Yoke']
  },
  print_style: {
    key: 'print_style',
    label: 'PRINT_STYLE',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  patches: {
    key: 'patches',
    label: 'PATCHES',  // Original Excel column name
    type: 'select',
    allowedValues: ['None', 'Fabric', 'Leather', 'Rubber', 'Embroidered']
  },
  patch_type: {
    key: 'patch_type',
    label: 'PATCH TYPE',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  embroidery: {
    key: 'embroidery',
    label: 'EMBROIDERY',  // Original Excel column name
    type: 'select',
    allowedValues: ['None', 'Hand', 'Machine', 'Beads', 'Sequins', 'Thread', 'Mirror Work', 'Stone Work']
  },
  embroidery_type: {
    key: 'embroidery_type',
    label: 'EMBROIDERY TYPE',  // Original Excel column name
    type: 'select',
    allowedValues: ['Traditional', 'Modern', 'Floral', 'Geometric', 'Abstract', 'Religious', 'Ethnic']
  },
  placement: {
    key: 'placement',
    label: 'PLACEMENT',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  additional_accessories: {
    key: 'additional_accessories',
    label: 'ADDITIONAL ACCESSORIES',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  wash: {
    key: 'wash',
    label: 'WASH',  // Original Excel column name
    type: 'select',
    allowedValues: ['Light', 'Medium', 'Dark', 'Stone', 'Acid', 'Enzyme', 'Bleach', 'Vintage', 'Raw']
  },
  wash_color: {
    key: 'wash_color',
    label: 'WASH COLOR ',  // Original Excel column name
    type: 'select',
    allowedValues: ['Yes', 'No', 'None']
  },
  color__main: {
    key: 'color__main',
    label: 'COLOR - MAIN',  // Original Excel column name
    type: 'select',
    allowedValues: ['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Brown', 'Gray', 'Pink', 'Purple', 'Orange', 'Maroon', 'Navy', 'Beige', 'Cream']
  },
  size: {
    key: 'size',
    label: 'SIZE',  // Original Excel column name
    type: 'number',
  },
};


export const getAttributeDefinition = (key: string): AttributeDefinition | undefined => {
  return MASTER_ATTRIBUTES[key];
};

// Get all attribute keys
export const getAllAttributeKeys = (): string[] => {
  return Object.keys(MASTER_ATTRIBUTES);
};