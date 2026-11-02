---- MODULE garden_phases ----
EXTENDS Integers, TLC

\* Mirrors src/sim/state.ts PHASE_EDGE_NAMES 1:1.
\* Run (if Java + tla2tools present):
\*   java -cp tools/tla2tools.jar tlc2.TLC -config spec/garden_phases.cfg spec/garden_phases.tla
\* Or: npm run tla:fetch && npm run tla:check
\* Offline stand-in: npm test (state.test.ts enumerates the same table).

VARIABLE phase

Phases == {"Menu", "Story", "Run", "Pause", "LevelUp", "Result"}

Edges == {
  <<"Menu", "Story">>,
  <<"Menu", "Run">>,
  <<"Story", "Run">>,
  <<"Story", "Menu">>,
  <<"Run", "Pause">>,
  <<"Run", "LevelUp">>,
  <<"Run", "Result">>,
  <<"Pause", "Run">>,
  <<"Pause", "Menu">>,
  <<"LevelUp", "Run">>,
  <<"LevelUp", "Result">>,
  <<"Result", "Menu">>,
  <<"Result", "Run">>,
  <<"Result", "Story">>
}

CanEnter(f, t) == /\ f # t
                  /\ <<f, t>> \in Edges

TypeOK == phase \in Phases

Init == phase = "Menu"

Next == \E t \in Phases:
          /\ CanEnter(phase, t)
          /\ phase' = t

Spec == Init /\ [][Next]_phase

IllegalNever == \A t \in Phases: CanEnter(phase, t) => <<phase, t>> \in Edges

====
