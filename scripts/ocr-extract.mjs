// Script to extract text from image-based PDFs using OCR
// Run with: node scripts/ocr-extract.mjs

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

// Configuration
const IMAGES_DIR = './temp_images';
const OUTPUT_DIR = './extracted_text';
const LANGUAGE = 'chi_sim'; // Simplified Chinese

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

/**
 * Extract text from an image using Tesseract OCR
 * @param {string} imagePath Path to the image file
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromImage(imagePath) {
  try {
    const { stdout } = await execPromise(
      `tesseract "${imagePath}" stdout -l ${LANGUAGE}`
    );
    return stdout;
  } catch (error) {
    console.error(`Error extracting text from ${imagePath}:`, error.message);
    return '';
  }
}

/**
 * Process all images in the images directory
 */
async function processAllImages() {
  try {
    const files = fs.readdirSync(IMAGES_DIR);
    const imageFiles = files.filter(file => 
      file.toLowerCase().endsWith('.png') || 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.jpeg')
    );

    console.log(`Found ${imageFiles.length} image files to process...\n`);

    const allExtractedText = [];

    for (const [index, file] of imageFiles.entries()) {
      const imagePath = path.join(IMAGES_DIR, file);
      console.log(`Processing ${index + 1}/${imageFiles.length}: ${file}`);
      
      const text = await extractTextFromImage(imagePath);
      allExtractedText.push(`\n\n=== ${file} ===\n\n${text}`);

      // Save individual text file
      const outputFileName = path.basename(file, path.extname(file)) + '.txt';
      const outputPath = path.join(OUTPUT_DIR, outputFileName);
      fs.writeFileSync(outputPath, text, 'utf-8');
      console.log(`Saved to ${outputPath}\n`);
    }

    // Save all extracted text to a single file
    const combinedOutputPath = path.join(OUTPUT_DIR, 'all-extracted-text.txt');
    fs.writeFileSync(combinedOutputPath, allExtractedText.join('\n'), 'utf-8');
    console.log(`\nAll text extracted successfully! Combined output saved to ${combinedOutputPath}`);

    return allExtractedText;
  } catch (error) {
    console.error('Error processing images:', error);
    throw error;
  }
}

// Run the extraction
processAllImages().catch(console.error);
