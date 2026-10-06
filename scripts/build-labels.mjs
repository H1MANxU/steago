// Builds public/models/common_names.json from the unmodified Perch v2 label files
// plus the eBird/Clements taxonomy. Output is an array aligned with labels.csv rows
// (header excluded); entries are "" when no common name is known.
//
// Usage: node scripts/build-labels.mjs path/to/ebird_taxonomy.csv
// Taxonomy source: https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=csv&cat=species
import { readFileSync, writeFileSync } from 'node:fs'

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

const taxonomyPath = process.argv[2]
if (!taxonomyPath) {
  console.error('Usage: node scripts/build-labels.mjs <ebird_taxonomy.csv>')
  process.exit(1)
}

const lines = (p) => readFileSync(p, 'utf8').replace(/\r/g, '').split('\n').filter(Boolean)
const labels = lines('public/models/labels.csv').slice(1)
const codes = lines('public/models/perch_v2_ebird_classes.csv').slice(1)
const taxonomy = lines(taxonomyPath)
const header = parseCsvLine(taxonomy[0])
const sciIdx = header.indexOf('SCIENTIFIC_NAME')
const comIdx = header.indexOf('COMMON_NAME')
const codeIdx = header.indexOf('SPECIES_CODE')

const byCode = new Map()
const bySci = new Map()
for (const row of taxonomy.slice(1)) {
  const cols = parseCsvLine(row)
  byCode.set(cols[codeIdx], cols[comIdx])
  bySci.set(cols[sciIdx].toLowerCase(), cols[comIdx])
}

if (labels.length !== codes.length) {
  console.error(`Row mismatch: ${labels.length} labels vs ${codes.length} codes`)
  process.exit(1)
}

let matched = 0
const names = labels.map((sci, i) => {
  const name = byCode.get(codes[i]) ?? bySci.get(sci.trim().toLowerCase()) ?? ''
  if (name) matched++
  return name
})

writeFileSync('public/models/common_names.json', JSON.stringify(names))
console.log(`Wrote ${names.length} entries, ${matched} with common names.`)
