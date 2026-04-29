#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PAPERS_DIR = 'S:/papers';
const META_DIR = 'S:/papers/.papers-meta';

const PAPER_STRUCTURE = {
  '01_The_Rosetta_Stone.pdf.pdf': {
    paper_id: 'rosetta-stone',
    title: 'The Rosetta Stone',
    subtitle: 'Core Invariants Across Physics, Biology, Computation, and Ensemble Intelligence',
    sections: [
      { id: 'rosetta-stone-abstract', title: 'Abstract', level: 2, tags: ['Rosetta Stone', 'CAISC 2026'] },
      { id: 'rosetta-stone-emergence', title: 'How This Work Emerged', level: 2, tags: ['Rosetta Stone'] },
      { id: 'rosetta-stone-four-invariants', title: 'The Four Invariants', level: 2, tags: ['Rosetta Stone', 'Constitutional AI'] },
      { id: 'rosetta-stone-symmetry', title: 'Symmetry Preservation', level: 3, tags: ['Rosetta Stone', 'Constraint Lattice'] },
      { id: 'rosetta-stone-selection', title: 'Selection Under Constraint', level: 3, tags: ['Rosetta Stone', 'Phenotype'] },
      { id: 'rosetta-stone-propagation', title: 'Propagation Through Layers', level: 3, tags: ['Rosetta Stone', 'Drift'] },
      { id: 'rosetta-stone-stability', title: 'Stability Under Transformation', level: 3, tags: ['Rosetta Stone', 'Ensemble'] },
      { id: 'rosetta-stone-cross-domain', title: 'Cross-Domain Mapping', level: 2, tags: ['Rosetta Stone', 'Multi-Agent'] },
      { id: 'rosetta-stone-translation', title: 'The Translation Protocol', level: 2, tags: ['Rosetta Stone', 'Convergence Gate'] },
      { id: 'rosetta-stone-empirical', title: 'Empirical Grounding: WE4FREE as Rosetta Stone', level: 2, tags: ['Rosetta Stone', 'WE4FREE', 'Verification'] },
      { id: 'rosetta-stone-design-principles', title: 'Design Principles', level: 2, tags: ['Rosetta Stone', 'Constitutional AI', 'Covenant'] },
      { id: 'rosetta-stone-limitations', title: 'Limitations and Scope', level: 2, tags: ['Rosetta Stone', 'Failure Mode'] },
      { id: 'rosetta-stone-open-questions', title: 'Open Questions', level: 2, tags: ['Rosetta Stone', 'CAISC 2026'] },
    ],
  },
  '02_Constraint_Lattices_and_Stability.pdf.pdf': {
    paper_id: 'constraint-lattices',
    title: 'Constraint Lattices and Stability',
    subtitle: 'How Layered Boundaries Create Predictable Behavior Without Central Control',
    sections: [
      { id: 'constraint-lattices-abstract', title: 'Abstract', level: 2, tags: ['Constraint Lattice', 'CAISC 2026'] },
      { id: 'constraint-lattices-intro', title: 'The Architecture of Stability', level: 2, tags: ['Constraint Lattice'] },
      { id: 'constraint-lattices-definition', title: 'What Is a Constraint Lattice?', level: 2, tags: ['Constraint Lattice', 'Constitutional AI'] },
      { id: 'constraint-lattices-formal', title: 'Formal Definition', level: 3, tags: ['Constraint Lattice'] },
      { id: 'constraint-lattices-vs-rules', title: 'Constraint Lattices vs Rule Systems', level: 3, tags: ['Constraint Lattice', 'Governance'] },
      { id: 'constraint-lattices-cross-domain', title: 'Constraint Lattices Across Domains', level: 2, tags: ['Constraint Lattice', 'Multi-Agent'] },
      { id: 'constraint-lattices-four-layer', title: 'The Four-Layer Architecture', level: 2, tags: ['Constraint Lattice', 'Covenant'] },
      { id: 'constraint-lattices-constitutional', title: 'Layer 1: Constitutional', level: 3, tags: ['Constraint Lattice', 'Constitutional AI'] },
      { id: 'constraint-lattices-operational', title: 'Layer 2: Operational', level: 3, tags: ['Constraint Lattice', 'Governance'] },
      { id: 'constraint-lattices-behavioral', title: 'Layer 3: Behavioral', level: 3, tags: ['Constraint Lattice', 'Phenotype'] },
      { id: 'constraint-lattices-selection', title: 'Layer 4: Selection (Pruning)', level: 3, tags: ['Constraint Lattice', 'Phenotype'] },
      { id: 'constraint-lattices-deformation', title: 'Lattice Deformation and Recovery', level: 2, tags: ['Constraint Lattice', 'Drift', 'Failure Mode'] },
      { id: 'constraint-lattices-empirical', title: 'Empirical Validation', level: 2, tags: ['Constraint Lattice', 'WE4FREE', 'Verification'] },
    ],
  },
  '03_Phenotype_Selection_in_Constraint_Governed_Systems.pdf.pdf': {
    paper_id: 'phenotype-selection',
    title: 'Phenotype Selection in Constraint-Governed Systems',
    subtitle: 'How Behavioral Regularities Emerge, Stabilize, and Persist Under Structural Pressure',
    sections: [
      { id: 'phenotype-selection-abstract', title: 'Abstract', level: 2, tags: ['Phenotype', 'CAISC 2026'] },
      { id: 'phenotype-selection-structural', title: 'Phenotypes as Structural Outcomes', level: 2, tags: ['Phenotype'] },
      { id: 'phenotype-selection-fixed-point', title: 'Selection as Fixed-Point Operator', level: 2, tags: ['Phenotype', 'Constraint Lattice'] },
      { id: 'phenotype-selection-equivalence', title: 'Phenotype Equivalence', level: 2, tags: ['Phenotype', 'Verification'] },
      { id: 'phenotype-selection-cross-domain', title: 'Phenotypes Across Domains', level: 2, tags: ['Phenotype', 'Multi-Agent'] },
      { id: 'phenotype-selection-attractor', title: 'Attractor Dynamics and Stability', level: 2, tags: ['Phenotype', 'Ensemble'] },
      { id: 'phenotype-selection-collapse', title: 'Catastrophic Collapse', level: 3, tags: ['Phenotype', 'Failure Mode', 'Drift'] },
      { id: 'phenotype-selection-scaling', title: 'Scaling Phenotypes', level: 2, tags: ['Phenotype', 'Multi-Agent'] },
      { id: 'phenotype-selection-cps', title: 'CPS as Operational Phenotype Selection', level: 2, tags: ['Phenotype', 'WE4FREE', 'Governance'] },
    ],
  },
  '04_Drift_Identity_and_Ensemble_Coherence.pdf.pdf': {
    paper_id: 'drift-identity',
    title: 'Drift, Identity, and Ensemble Coherence',
    subtitle: 'How Multi-Agent Systems Maintain Stability Across Temporal Discontinuity',
    sections: [
      { id: 'drift-identity-abstract', title: 'Abstract', level: 2, tags: ['Drift', 'CAISC 2026'] },
      { id: 'drift-identity-what', title: 'What Is Drift?', level: 2, tags: ['Drift'] },
      { id: 'drift-identity-vs-change', title: 'Drift vs Legitimate Change', level: 3, tags: ['Drift', 'Constitutional AI'] },
      { id: 'drift-identity-signature', title: 'The Structural Signature of Drift', level: 3, tags: ['Drift', 'Failure Mode'] },
      { id: 'drift-identity-formal', title: 'Formal Definition of Drift', level: 2, tags: ['Drift'] },
      { id: 'drift-identity-three-types', title: 'Three Types of Drift', level: 3, tags: ['Drift', 'Failure Mode'] },
      { id: 'drift-identity-identity', title: 'Identity Without Memory', level: 2, tags: ['Drift', 'Identity Enforcement'] },
      { id: 'drift-identity-recognition', title: 'The Recognition Principle', level: 3, tags: ['Drift', 'Attestation'] },
      { id: 'drift-identity-functorial', title: 'Functorial Recovery', level: 2, tags: ['Drift', 'Verification'] },
      { id: 'drift-identity-coherence', title: 'Ensemble Coherence', level: 2, tags: ['Drift', 'Ensemble'] },
      { id: 'drift-identity-degradation', title: 'Coherence Degradation Patterns', level: 3, tags: ['Drift', 'Failure Mode'] },
      { id: 'drift-identity-detection', title: 'Drift Detection in Practice', level: 2, tags: ['Drift', 'WE4FREE', 'Verification'] },
    ],
  },
  '05_The_WE4FREE_Framework.pdf.pdf': {
    paper_id: 'we4free-framework',
    title: 'The WE4FREE Framework',
    subtitle: 'Operationalizing Papers A-D as Deployable Infrastructure',
    sections: [
      { id: 'we4free-framework-abstract', title: 'Abstract', level: 2, tags: ['WE4FREE', 'CAISC 2026'] },
      { id: 'we4free-framework-intro', title: 'From Theory to System', level: 2, tags: ['WE4FREE'] },
      { id: 'we4free-framework-constitutional', title: 'Constitutional Layer (Paper A Operationalized)', level: 2, tags: ['WE4FREE', 'Constitutional AI', 'Rosetta Stone'] },
      { id: 'we4free-framework-four-invariants', title: 'The Four Invariants as System Rules', level: 3, tags: ['WE4FREE', 'Constraint Lattice'] },
      { id: 'we4free-framework-lattice', title: 'Constraint Lattice Layer (Paper B Operationalized)', level: 2, tags: ['WE4FREE', 'Constraint Lattice'] },
      { id: 'we4free-framework-propagation', title: 'Constraint Propagation Engine', level: 3, tags: ['WE4FREE', 'Governance'] },
      { id: 'we4free-framework-deformation', title: 'Lattice Deformation Detection', level: 3, tags: ['WE4FREE', 'Drift', 'Failure Mode'] },
      { id: 'we4free-framework-phenotype', title: 'Phenotype Layer (Paper C Operationalized)', level: 2, tags: ['WE4FREE', 'Phenotype'] },
      { id: 'we4free-framework-cps', title: 'CPS as Phenotype Selection Operator', level: 3, tags: ['WE4FREE', 'Phenotype', 'Verification'] },
      { id: 'we4free-framework-drift', title: 'Drift Layer (Paper D Operationalized)', level: 2, tags: ['WE4FREE', 'Drift'] },
      { id: 'we4free-framework-checkpoint', title: 'Checkpoint and Recovery Protocol', level: 3, tags: ['WE4FREE', 'Verification', 'Identity Enforcement'] },
      { id: 'we4free-framework-ensemble', title: 'Ensemble Layer', level: 2, tags: ['WE4FREE', 'Ensemble', 'Multi-Agent'] },
      { id: 'we4free-framework-deployment', title: 'Deployment Architecture', level: 2, tags: ['WE4FREE', 'Federation'] },
    ],
  },
};

function generateSectionMarkdown(paper) {
  let md = `---\npaper_id: ${paper.paper_id}\ntitle: ${paper.title}\nsubtitle: "${paper.subtitle}"\ntype: paper-structure\ngenerated_at: ${new Date().toISOString()}\n---\n\n# ${paper.title}\n\n> ${paper.subtitle}\n\n`;

  for (const section of paper.sections) {
    const prefix = '#'.repeat(section.level + 1);
    md += `${prefix} ${section.title}\n\nTags: ${section.tags.join(', ')}\n\n[[${paper.paper_id}]]\n\n`;
  }

  const links = [];
  if (paper.paper_id === 'constraint-lattices') links.push('[[rosetta-stone]]');
  if (paper.paper_id === 'phenotype-selection') links.push('[[rosetta-stone]]', '[[constraint-lattices]]');
  if (paper.paper_id === 'drift-identity') links.push('[[rosetta-stone]]', '[[constraint-lattices]]', '[[phenotype-selection]]');
  if (paper.paper_id === 'we4free-framework') links.push('[[rosetta-stone]]', '[[constraint-lattices]]', '[[phenotype-selection]]', '[[drift-identity]]');

  if (links.length > 0) {
    md += `## Paper Dependencies\n\n${links.join(' ')}\n`;
  }

  return md;
}

function main() {
  fs.mkdirSync(META_DIR, { recursive: true });

  for (const [filename, paper] of Object.entries(PAPER_STRUCTURE)) {
    const md = generateSectionMarkdown(paper);
    const outPath = path.join(META_DIR, `${paper.paper_id}.md`);
    fs.writeFileSync(outPath, md);
    console.log(`Written: ${outPath} (${paper.sections.length} sections)`);

    const jsonPath = path.join(META_DIR, `${paper.paper_id}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(paper, null, 2));
    console.log(`Written: ${jsonPath}`);
  }

  const indexPath = path.join(META_DIR, 'index.json');
  const index = Object.values(PAPER_STRUCTURE).map(p => ({
    paper_id: p.paper_id,
    title: p.title,
    section_count: p.sections.length,
  }));
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`Written: ${indexPath}`);
}

main();
