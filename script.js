
// Initialize Fabric.js canvas
const canvas = new fabric.Canvas('canvas');

// Variables to track states for undo/redo
let state = [];
let mods = 0;

// Save state for undo/redo
function saveState() {
    state.push(JSON.stringify(canvas));
    mods = 0;
}

// Initial save state
saveState();

// Add Text to Canvas
document.getElementById('add-text').addEventListener('click', function() {
    const text = new fabric.Textbox('Odd One', {
        left: 100,
        top: 100,
        fontSize: parseInt(document.getElementById('font-size').value),
        fontFamily: document.getElementById('font-family').value,
        fill: document.getElementById('color-picker').value
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    saveState();
});

// Undo functionality
document.getElementById('undo').addEventListener('click', function() {
    if (state.length > 1) {
        canvas.clear();
        state.pop();
        canvas.loadFromJSON(state[state.length - 1]);
        canvas.renderAll();
    }
});

// Redo functionality
document.getElementById('redo').addEventListener('click', function() {
    if (mods < state.length - 1) {
        canvas.clear();
        mods++;
        canvas.loadFromJSON(state[mods]);
        canvas.renderAll();
    }
});

// Delete selected object
document.getElementById('delete').addEventListener('click', function() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        canvas.remove(activeObject);
        saveState();
    }
});

// Add Rectangle to Canvas
document.getElementById('add-rectangle').addEventListener('click', function() {
    const rect = new fabric.Rect({
        left: 100,
        top: 100,
        fill: 'blue',
        width: 100,
        height: 100
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    saveState();
});

// Add Circle to Canvas
document.getElementById('add-circle').addEventListener('click', function() {
    const circle = new fabric.Circle({
        left: 200,
        top: 200,
        radius: 50,
        fill: 'red'
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    saveState();
});

// Add Line to Canvas
document.getElementById('add-line').addEventListener('click', function() {
    const line = new fabric.Line([50, 100, 200, 200], {
        left: 100,
        top: 100,
        stroke: 'green'
    });
    canvas.add(line);
    canvas.setActiveObject(line);
    saveState();
});

// Image Upload
document.getElementById('image-upload').addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        fabric.Image.fromURL(event.target.result, function(img) {
            img.set({
                left: 100,
                top: 100
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            saveState();
        });
    };
    reader.readAsDataURL(e.target.files[0]);
});

// Lock object
document.getElementById('lock-object').addEventListener('click', function() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        activeObject.set({
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true
        });
        canvas.renderAll();
    }
});

// Unlock object
document.getElementById('unlock-object').addEventListener('click', function() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        activeObject.set({
            lockMovementX: false,
            lockMovementY: false,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false
        });
        canvas.renderAll();
    }
});

// Group objects
document.getElementById('group-objects').addEventListener('click', function() {
    if (canvas.getActiveObject() && canvas.getActiveObjects().length > 1) {
        const group = new fabric.Group(canvas.getActiveObjects());
        canvas.discardActiveObject();
        canvas.add(group);
        canvas.setActiveObject(group);
        saveState();
    }
});

// Ungroup objects
document.getElementById('ungroup-objects').addEventListener('click', function() {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'group') {
        const items = activeObject._objects;
        activeObject._restoreObjectsState();
        canvas.remove(activeObject);
        items.forEach(function(item) {
            canvas.add(item);
        });
        canvas.renderAll();
        saveState();
    }
});

// Toggle grid
let grid = false;
document.getElementById('toggle-grid').addEventListener('click', function() {
    grid = !grid;
    if (grid) {
        for (let i = 0; i < (800 / 50); i++) {
            canvas.add(new fabric.Line([ i * 50, 0, i * 50, 600], { stroke: '#ccc', selectable: false }));
            canvas.add(new fabric.Line([ 0, i * 50, 800, i * 50], { stroke: '#ccc', selectable: false }));
        }
    } else {
        canvas.getObjects('line').forEach(function(line) {
            canvas.remove(line);
        });
    }
    canvas.renderAll();
});
// Firebase Configuration for Cloud Save/Load
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Fabric.js Canvas Setup
const canvas = new fabric.Canvas('canvas');

// Event to Save Project to Cloud
document.getElementById('save-cloud').addEventListener('click', function() {
    const projectData = JSON.stringify(canvas.toJSON());
    db.collection('projects').doc('project-id').set({ design: projectData })
        .then(() => alert('Project saved to the cloud!'))
        .catch(err => console.error('Error saving project: ', err));
});

// Load Project from Cloud
document.getElementById('load-cloud').addEventListener('click', function() {
    db.collection('projects').doc('project-id').get().then(doc => {
        if (doc.exists) {
            canvas.loadFromJSON(doc.data().design, canvas.renderAll.bind(canvas));
            alert('Project loaded from cloud!');
        }
    }).catch(err => console.error('Error loading project: ', err));
});

// Export project (to various formats)
document.getElementById('export-project').addEventListener('click', function() {
    const format = prompt('Enter format (PNG, JPG, SVG, PDF):').toLowerCase();
    
    if (format === 'png') {
        const dataURL = canvas.toDataURL({ format: 'png' });
        downloadImage(dataURL, 'design.png');
    } else if (format === 'svg') {
        const svgData = canvas.toSVG();
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        downloadBlob(blob, 'design.svg');
    } else if (format === 'pdf') {
        const pdf = new jsPDF();
        pdf.addImage(canvas.toDataURL('png'), 'PNG', 10, 10, 180, 160);
        pdf.save('design.pdf');
    }
});

// Helper function to download image files
function downloadImage(dataURL, filename) {
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    link.click();
}

// Helper function to download blob (SVG, etc.)
function downloadBlob(blob, filename) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// Tool: Add text to the canvas
document.getElementById('text-tool').addEventListener('click', function() {
    const text = new fabric.Textbox('Enter your text here', { left: 100, top: 100, fontSize: 16 });
    canvas.add(text);
});

// Tool: Add image to the canvas
document.getElementById('image-tool').addEventListener('click', function() {
    const imgElement = document.createElement('input');
    imgElement.type = 'file';
    imgElement.accept = 'image/*';
    imgElement.onchange = function(e) {
        const reader = new FileReader();
        reader.onload = function(event) {
            fabric.Image.fromURL(event.target.result, function(img) {
                img.scaleToWidth(300);
                img.set({ left: 50, top: 50 });
                canvas.add(img);
            });
        };
        reader.readAsDataURL(e.target.files[0]);
    };
    imgElement.click();
});

// Handle Layers
function updateLayers() {
    const layerList = document.getElementById('layer-list');
    layerList.innerHTML = '';  // Clear existing layers
    canvas.getObjects().forEach((obj, i) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${obj.type} Layer ${i + 1}`;
        listItem.addEventListener('click', function() {
            canvas.setActiveObject(obj);
        });
        layerList.appendChild(listItem);
    });
}
canvas.on('object:added', updateLayers);
canvas.on('object:removed', updateLayers);

// Save canvas as JSON
document.getElementById('save').addEventListener('click', function() {
    const json = JSON.stringify(canvas);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'canvas-design.json';
    link.click();
});

// Load canvas from JSON
document.getElementById('load').addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = function(e) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const json = event.target.result;
            canvas.loadFromJSON(json, canvas.renderAll.bind(canvas));
        };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
});

// Download canvas as PNG
document.getElementById('download').addEventListener('click', function() {
    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0
    });
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'canvas.png';
    link.click();
});

// Save initial state
saveState();
