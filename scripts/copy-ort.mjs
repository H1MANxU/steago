// Copies the ONNX Runtime Web WASM backend into public/ort so it is served
// from the app's own origin (CSP: script-src 'self' 'wasm-unsafe-eval').
import { copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const src = 'node_modules/onnxruntime-web/dist'
const dest = 'public/ort'
const files = ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']

mkdirSync(dest, { recursive: true })
for (const f of files) copyFileSync(join(src, f), join(dest, f))
console.log(`Copied ${files.length} ONNX Runtime files to ${dest}`)
