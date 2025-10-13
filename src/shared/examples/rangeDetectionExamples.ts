/**
 * 🎯 SMART ATTRIBUTE PROCESSING EXAMPLES
 * 
 * Demonstrates how the universal attribute processor works:
 * - Schema matching for all attributes
 * - Range detection for size/GSM attributes  
 * - Raw value preservation for display
 */

import { AttributeProcessor } from '../services/extraction/rangeAwareProcessor';
import { MASTER_ATTRIBUTES } from '../../constants/categories/masterAttributes';

// 📏 SIZE DETECTION EXAMPLES
console.log('🎯 SIZE RANGE DETECTION EXAMPLES:');
console.log('==================================');

const sizeAttribute = MASTER_ATTRIBUTES['size'];
const sizeTests = [
  'S-XXL',
  'SMALL TO EXTRA LARGE', 
  'XS-L',
  'SIZE MEDIUM',
  'EXTRA SMALL',
  '32-40',
  'Random text with no size'
];

sizeTests.forEach(test => {
  const result = AttributeProcessor.processExtractionResult('size', test, sizeAttribute);
  console.log(`Input: "${test}" → Output: "${result}"`);
});

// 🧵 GSM DETECTION EXAMPLES
console.log('\n🎯 GSM RANGE DETECTION EXAMPLES:');
console.log('================================');

const gsmAttribute = MASTER_ATTRIBUTES['fab_gsm'];
const gsmTests = [
  '120G',
  '100-150 GSM',
  '135 grams',
  'FABRIC WEIGHT 120G',
  '180G TO 200G',
  'Heavy fabric 250 GSM',
  'No GSM info here'
];

gsmTests.forEach(test => {
  const result = AttributeProcessor.processExtractionResult('fab_gsm', test, gsmAttribute);
  console.log(`Input: "${test}" → Output: "${result}"`);
});

// 🎨 GENERAL ATTRIBUTE TESTS
console.log('\n🎯 GENERAL ATTRIBUTE EXAMPLES:');
console.log('=============================');

const generalTests = [
  { key: 'size', value: 'Medium', expected: 'M' },
  { key: 'size', value: 'Random text', expected: 'Random text' },
  { key: 'fab_gsm', value: '120G', expected: '120G' },
  { key: 'fab_gsm', value: 'No weight info', expected: 'No weight info' }
];

generalTests.forEach(test => {
  const attr = MASTER_ATTRIBUTES[test.key];
  if (attr) {
    const result = AttributeProcessor.processExtractionResult(test.key, test.value, attr);
    console.log(`${test.key}: "${test.value}" → "${result}"`);
  }
});

export const ATTRIBUTE_EXAMPLES = {
  sizeTests,
  gsmTests,
  generalTests
};