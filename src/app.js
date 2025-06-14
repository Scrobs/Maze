// src/app.js

import { algorithms } from './algorithms/index.js';
import { renderMaze } from './render/canvas.js';
import { saveMazeAsJSON } from './export/json.js';
import { saveMazeAsSVG } from './export/svg.js';

// --- DOM Elements ---
const form = document.getElementById('maze-config');
const widthInput = document.getElementById('maze-width');
const heightInput = document.getElementById('maze-height');
const algoSelect = document.getElementById('algorithm');
const generateBtn = document.getElementById('generate-btn');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');
const saveSvgBtn = document.getElementById('save-svg-btn');
const canvas = document.getElementById('maze-canvas');
const errorMessage = document.getElementById('error-message');
const algorithmOptions = document.getElementById('algorithm-options');

// --- App State ---
let currentMaze = null;
let isGenerating = false;

// --- Canvas Setup ---
function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const size = 600;
  
  // Set actual size in memory
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  
  // Scale everything down using CSS
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  
  // Scale the drawing context to match device pixel ratio
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
}

// --- Helpers ---
function getFormConfig() {
  const config = {
    width: parseInt(widthInput.value, 10),
    height: parseInt(heightInput.value, 10),
    algorithm: algoSelect.value
  };
  
  // Validate inputs
  if (isNaN(config.width) || config.width < 2 || config.width > 100) {
    throw new Error('Width must be between 2 and 100');
  }
  if (isNaN(config.height) || config.height < 2 || config.height > 100) {
    throw new Error('Height must be between 2 and 100');
  }
  
  // Get algorithm-specific options
  const activeOptions = algorithmOptions.querySelector(`.option-group[data-algorithm="${config.algorithm}"]`);
  if (activeOptions) {
    config.options = {};
    activeOptions.querySelectorAll('input[type="number"]').forEach(input => {
      const value = parseFloat(input.value);
      if (!isNaN(value)) {
        config.options[input.name] = value;
      }
    });
  }
  
  return config;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
  setTimeout(() => {
    errorMessage.classList.remove('show');
  }, 5000);
}

function setGenerating(generating) {
  isGenerating = generating;
  generateBtn.disabled = generating;
  generateBtn.textContent = generating ? 'Generating...' : 'Generate';
}

// --- Algorithm Options Handling ---
function updateAlgorithmOptions() {
  const selectedAlgo = algoSelect.value;
  
  // Hide all option groups
  algorithmOptions.querySelectorAll('.option-group').forEach(group => {
    group.classList.remove('active');
  });
  
  // Show relevant option group
  const relevantGroup = algorithmOptions.querySelector(`.option-group[data-algorithm="${selectedAlgo}"]`);
  if (relevantGroup) {
    relevantGroup.classList.add('active');
  }
}

// --- Main UI Actions ---
async function handleGenerate(e) {
  if (e) e.preventDefault?.();
  
  if (isGenerating) return;
  
  try {
    setGenerating(true);
    const config = getFormConfig();
    
    if (!algorithms[config.algorithm]) {
      throw new Error('This algorithm is not implemented yet.');
    }
    
    // Use requestAnimationFrame to ensure UI updates
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // Generate maze with options if available
    currentMaze = config.options 
      ? algorithms[config.algorithm](config.width, config.height, config.options)
      : algorithms[config.algorithm](config.width, config.height);
    
    if (!currentMaze || !currentMaze.isValid()) {
      throw new Error('Failed to generate valid maze');
    }
    
    renderMaze(currentMaze, canvas);
    
  } catch (error) {
    console.error('Maze generation failed:', error);
    showError(error.message || 'Failed to generate maze. Please try different settings.');
    currentMaze = null;
  } finally {
    setGenerating(false);
  }
}

function handleClear(e) {
  if (e) e.preventDefault?.();
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  currentMaze = null;
}

function handleSave(e) {
  if (e) e.preventDefault?.();
  if (!currentMaze) {
    showError('No maze to save!');
    return;
  }
  
  try {
    saveMazeAsJSON(currentMaze);
  } catch (error) {
    console.error('Failed to save maze:', error);
    showError('Failed to save maze as JSON');
  }
}

function handleSaveSVG(e) {
  if (e) e.preventDefault?.();
  if (!currentMaze) {
    showError('No maze to export!');
    return;
  }
  
  try {
    saveMazeAsSVG(currentMaze);
  } catch (error) {
    console.error('Failed to export maze:', error);
    showError('Failed to export maze as SVG');
  }
}

// --- Wire Events ---
generateBtn.addEventListener('click', handleGenerate);
clearBtn.addEventListener('click', handleClear);
saveBtn.addEventListener('click', handleSave);
saveSvgBtn.addEventListener('click', handleSaveSVG);
form.addEventListener('submit', handleGenerate);
algoSelect.addEventListener('change', updateAlgorithmOptions);

// --- Handle window resize for canvas DPI ---
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    setupCanvas();
    if (currentMaze) {
      renderMaze(currentMaze, canvas);
    }
  }, 250);
});

// --- Initialize ---
// Wait for all modules to load before auto-generating
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupCanvas();
    updateAlgorithmOptions();
    // Small delay to ensure all modules are loaded
    setTimeout(() => handleGenerate(), 100);
  });
} else {
  setupCanvas();
  updateAlgorithmOptions();
  setTimeout(() => handleGenerate(), 100);
}

// --- Expose for debugging (optional) ---
window.__maze = () => currentMaze;
