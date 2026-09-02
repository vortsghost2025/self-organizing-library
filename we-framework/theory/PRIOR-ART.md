# Book 7 Prior-Art Map

**Status:** research positioning, not a novelty claim.

This file records established mathematical frames adjacent to the WE Framework. The rule is deliberately conservative: resemblance is not identity. A WE definition inherits a classical theorem only when its hypotheses and objects actually match.

## 1. Operational sufficiency and Blackwell comparison

David Blackwell's comparison-of-experiments program asks when one statistical experiment is at least as informative as another across decision problems, with the 1953 equivalence result giving the canonical decision-theoretic frame.

Reference:

- David Blackwell, “Equivalent Comparisons of Experiments,” *Annals of Mathematical Statistics* 24(2), 265–272 (1953). DOI: https://doi.org/10.1214/aoms/1177729032

WE adjacency:

```text
sup_a |Pπ(a | H) - Pπ(a | Z)| <= ε
```

asks whether a compact state preserves a declared policy's future action distribution.

**Do not state that this total-variation criterion is “Blackwell sufficiency.”** Blackwell comparison is a stronger decision-theoretic relation over experiments/decision problems. The current WE criterion is an engineering fidelity test inspired by the same question: what information can be removed without changing relevant decisions?

## 2. Compact/fidelity optimization, rate-distortion, and information bottleneck

Shannon's rate-distortion theory formalizes the tradeoff between coding rate and reconstruction distortion.

Reference:

- Claude E. Shannon, “Coding Theorems for a Discrete Source With a Fidelity Criterion,” *IRE National Convention Record*, part 4, 142–163 (1959).

Tishby, Pereira, and Bialek's information bottleneck asks for a short representation of one variable that preserves information relevant to another.

Reference:

- Naftali Tishby, Fernando C. Pereira, William Bialek, “The Information Bottleneck Method,” arXiv:physics/0004057.

WE adjacency:

```text
C* = arg min_C [ |C(H)| + λ d(I(H), I(R(C(H)))) ]
```

has the same broad compression-versus-fidelity shape.

**Do not call `|C(H)|` Shannon rate or mutual information.** It is currently an implementation-size proxy. A true rate-distortion or information-bottleneck formulation would require a probabilistic source model and information-theoretic rate/relevance quantities.

## 3. Belief conflict and AGM belief revision

AGM gives a foundational formal treatment of contraction and revision of belief/theory sets when information changes.

Reference:

- Carlos E. Alchourrón, Peter Gärdenfors, David Makinson, “On the Logic of Theory Change: Partial Meet Contraction and Revision Functions,” *Journal of Symbolic Logic* 50(2), 510–530 (1985). DOI: https://doi.org/10.2307/2274239

WE adjacency:

```text
B' = B ∩ Consistent(E)
```

is simple possible-world conditioning while the evidence remains jointly consistent. When the result is `∅`, the model has reached inconsistent top and needs an explicit conflict/revision policy rather than fabricated certainty.

**The WE Conflict Preservation Principle is not yet an AGM implementation.** AGM is a useful frame for asking what a principled revision operator should satisfy after contradiction.

## 4. Distributivity and quantum logic

Birkhoff and von Neumann famously studied a lattice of quantum-mechanical propositions whose structure departs from classical Boolean logic; later presentations emphasize the failure of distributivity for Hilbert-space subspace lattices.

Reference:

- Garrett Birkhoff, John von Neumann, “The Logic of Quantum Mechanics,” *Annals of Mathematics* 37(4), 823–843 (1936). DOI: https://doi.org/10.2307/1968621

WE relevance:

- the ambient constraint powerset is Boolean and therefore distributive;
- an induced observed signature family may be a lattice without being distributive;
- finite nondistributive lattices contain an `M3` or `N5` sublattice witness.

**A nondistributive WE/AIDE signature lattice would not prove quantum mechanics or quantum logic.** It would prove only an order-theoretic property that is also important in the history of quantum logic. Any stronger Rosetta claim would need additional preserved structure, not vocabulary.

## 5. Semantic binding and verification/validation

Barry Boehm's software V&V work distinguishes checking a product against a specification from checking whether the specification/product corresponds to the intended need.

Reference:

- Barry W. Boehm, “Guidelines for Verifying and Validating Software Requirements and Design Specifications,” *Euro IFIP 79*, pp. 711–719 (1979).

WE adjacency:

```text
FormalValidity(φ) != Bind(q, φ, c)
```

captures the same broad fault line: an object can satisfy its formal checker while being the wrong object, task, role, time, claim, or semantic representation.

The WE binding relation is more specific to evidence/authority/provenance and is not claimed to be derived from Boehm's software lifecycle model.

## 6. Causal slices and Pearl interventions

Pearl's causal framework distinguishes observation from intervention and gives formal semantics to interventions in a structural causal model.

Reference:

- Judea Pearl, “Causal Diagrams for Empirical Research,” *Biometrika* 82(4), 669–688 (1995). DOI: https://doi.org/10.1093/biomet/82.4.669

WE adjacency:

```text
V(x) versus V(x + δ_i)
```

freezes all declared coordinates except one and measures the verifier disposition.

**A one-coordinate perturbation is not automatically a Pearl `do` intervention.** It becomes intervention-like only when the coordinate belongs to an explicit structural causal model and the manipulation semantics are frozen so that the changed coordinate is set independently of its ordinary generating mechanism.

## Promotion rule

Prior art is used in one of four ways:

```text
IDENTICAL OBJECTS/HYPOTHESES -> classical theorem may transfer
SPECIAL CASE                  -> cite theorem and state restriction
ADJACENT STRUCTURE            -> cite as framing only
VOCABULARY RESEMBLANCE        -> ANALOGY ONLY
```

Book 7 should prefer a narrower correct relationship over a stronger borrowed label.
