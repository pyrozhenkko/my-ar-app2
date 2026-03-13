// Script to generate a city GLTF model using raw JSON (no browser APIs needed)
const fs = require('fs');

// Helper: create a buffer from Float32Array data, returns base64
function toBase64(float32Data) {
  const buf = Buffer.from(float32Data.buffer);
  return buf.toString('base64');
}

// Cube mesh data (unit cube centered at origin)
const cubePositions = new Float32Array([
  // Front
  -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
  // Back
   0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
  // Top
  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,  -0.5,  0.5, -0.5,
  // Bottom
  -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
  // Right
   0.5, -0.5,  0.5,   0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
  // Left
  -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
]);

const cubeNormals = new Float32Array([
   0,0,1, 0,0,1, 0,0,1, 0,0,1,
   0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
   0,1,0, 0,1,0, 0,1,0, 0,1,0,
   0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
   1,0,0, 1,0,0, 1,0,0, 1,0,0,
  -1,0,0, -1,0,0, -1,0,0, -1,0,0,
]);

const cubeIndices = new Uint16Array([
  0,1,2, 0,2,3,
  4,5,6, 4,6,7,
  8,9,10, 8,10,11,
  12,13,14, 12,14,15,
  16,17,18, 16,18,19,
  20,21,22, 20,22,23,
]);

// Combine all binary data into one buffer
const posBuf = Buffer.from(cubePositions.buffer);
const normBuf = Buffer.from(cubeNormals.buffer);
const idxBuf = Buffer.from(cubeIndices.buffer);
const totalBuf = Buffer.concat([posBuf, normBuf, idxBuf]);

const posBytes = posBuf.length;   // 288
const normBytes = normBuf.length; // 288
const idxBytes = idxBuf.length;   // 72

// Buildings: [scaleX, scaleY, scaleZ, posX, posY, posZ, colorR, colorG, colorB, name]
const buildings = [
  [1.2, 4.0, 1.2,  -2.0, 2.0, -2.0,  0.27, 0.53, 0.67, 'Office Tower'],
  [1.5, 2.5, 1.5,   1.0, 1.25, -1.5,  0.80, 0.53, 0.27, 'Residential'],
  [1.0, 1.5, 1.0,   2.5, 0.75, 1.0,   0.67, 0.27, 0.27, 'Shop'],
  [2.0, 1.2, 1.5,  -1.0, 0.6, 2.0,    0.40, 0.40, 0.53, 'Warehouse'],
  [0.8, 3.5, 0.8,   0.0, 1.75, 0.5,   0.53, 0.67, 0.40, 'Apartment'],
  [1.3, 2.0, 1.0,  -3.0, 1.0, 1.0,    0.73, 0.47, 0.20, 'Store'],
  [1.0, 1.8, 1.2,   3.0, 0.9, -0.5,   0.56, 0.36, 0.60, 'Gallery'],
  [1.6, 3.0, 1.4,  -0.5, 1.5, -3.0,   0.30, 0.60, 0.50, 'Hospital'],
];

// Ground plane
const groundPositions = new Float32Array([
  -5, 0, -5,   5, 0, -5,   5, 0, 5,  -5, 0, 5
]);
const groundNormals = new Float32Array([
  0, 1, 0,   0, 1, 0,   0, 1, 0,  0, 1, 0
]);
const groundIndices = new Uint16Array([0, 2, 1, 0, 3, 2]);

const groundPosBuf = Buffer.from(groundPositions.buffer);
const groundNormBuf = Buffer.from(groundNormals.buffer);
const groundIdxBuf = Buffer.from(groundIndices.buffer);

const allBuf = Buffer.concat([totalBuf, groundPosBuf, groundNormBuf, groundIdxBuf]);

// Build GLTF
const gltf = {
  asset: { version: '2.0', generator: 'city-generator' },
  scene: 0,
  scenes: [{ name: 'CityScene', nodes: [] }],
  nodes: [],
  meshes: [],
  accessors: [],
  bufferViews: [],
  buffers: [{
    uri: 'city.bin',
    byteLength: allBuf.length,
  }],
  materials: [],
};

// Add cube buffer views (shared by all buildings)
// BV 0: positions
gltf.bufferViews.push({ buffer: 0, byteOffset: 0, byteLength: posBytes, target: 34962 });
// BV 1: normals
gltf.bufferViews.push({ buffer: 0, byteOffset: posBytes, byteLength: normBytes, target: 34962 });
// BV 2: indices
gltf.bufferViews.push({ buffer: 0, byteOffset: posBytes + normBytes, byteLength: idxBytes, target: 34963 });

// ACC 0: cube positions
gltf.accessors.push({ bufferView: 0, componentType: 5126, count: 24, type: 'VEC3', max: [0.5, 0.5, 0.5], min: [-0.5, -0.5, -0.5] });
// ACC 1: cube normals
gltf.accessors.push({ bufferView: 1, componentType: 5126, count: 24, type: 'VEC3' });
// ACC 2: cube indices
gltf.accessors.push({ bufferView: 2, componentType: 5123, count: 36, type: 'SCALAR' });

// Ground buffer views
const groundOffset = totalBuf.length;
// BV 3: ground positions
gltf.bufferViews.push({ buffer: 0, byteOffset: groundOffset, byteLength: groundPosBuf.length, target: 34962 });
// BV 4: ground normals
gltf.bufferViews.push({ buffer: 0, byteOffset: groundOffset + groundPosBuf.length, byteLength: groundNormBuf.length, target: 34962 });
// BV 5: ground indices
gltf.bufferViews.push({ buffer: 0, byteOffset: groundOffset + groundPosBuf.length + groundNormBuf.length, byteLength: groundIdxBuf.length, target: 34963 });

// ACC 3: ground positions
gltf.accessors.push({ bufferView: 3, componentType: 5126, count: 4, type: 'VEC3', max: [5, 0, 5], min: [-5, 0, -5] });
// ACC 4: ground normals
gltf.accessors.push({ bufferView: 4, componentType: 5126, count: 4, type: 'VEC3' });
// ACC 5: ground indices
gltf.accessors.push({ bufferView: 5, componentType: 5123, count: 6, type: 'SCALAR' });

// Ground material (dark gray)
const groundMatIdx = gltf.materials.length;
gltf.materials.push({
  name: 'Ground',
  pbrMetallicRoughness: {
    baseColorFactor: [0.25, 0.25, 0.25, 1],
    metallicFactor: 0.0,
    roughnessFactor: 0.9,
  },
});

// Ground mesh
const groundMeshIdx = gltf.meshes.length;
gltf.meshes.push({
  name: 'Ground',
  primitives: [{
    attributes: { POSITION: 3, NORMAL: 4 },
    indices: 5,
    material: groundMatIdx,
  }],
});

// Ground node
const groundNodeIdx = gltf.nodes.length;
gltf.nodes.push({ name: 'Ground', mesh: groundMeshIdx });
gltf.scenes[0].nodes.push(groundNodeIdx);

// Create buildings
buildings.forEach((b, i) => {
  const [sx, sy, sz, px, py, pz, cr, cg, cb, name] = b;

  // Material
  const matIdx = gltf.materials.length;
  gltf.materials.push({
    name: name,
    pbrMetallicRoughness: {
      baseColorFactor: [cr, cg, cb, 1],
      metallicFactor: 0.1,
      roughnessFactor: 0.7,
    },
  });

  // Mesh
  const meshIdx = gltf.meshes.length;
  gltf.meshes.push({
    name: name,
    primitives: [{
      attributes: { POSITION: 0, NORMAL: 1 },
      indices: 2,
      material: matIdx,
    }],
  });

  // Node with scale and translation
  const nodeIdx = gltf.nodes.length;
  gltf.nodes.push({
    name: name,
    mesh: meshIdx,
    translation: [px, py, pz],
    scale: [sx, sy, sz],
  });
  gltf.scenes[0].nodes.push(nodeIdx);
});

// Write files
fs.writeFileSync('public/models/scene.gltf', JSON.stringify(gltf, null, 2));
fs.writeFileSync('public/models/city.bin', allBuf);

console.log('City model generated!');
console.log(`  scene.gltf: ${JSON.stringify(gltf, null, 2).length} bytes`);
console.log(`  city.bin: ${allBuf.length} bytes`);
console.log(`  ${buildings.length} buildings + ground`);
