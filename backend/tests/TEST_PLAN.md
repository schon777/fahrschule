# QuizTab v2 Test Plan (MVP)

## Backend Automated Tests
- `test_import_quiztab_v2_success`: import pack with all 12 methods.
- `test_grade_calc_value_units_tolerance`: grade value with unit conversion + tolerance.
- `test_grade_calc_multi_all_fields`: binary grading on multi-field calc.
- `test_hotspot_svg_set_compare`: set compare on hotspots.
- `test_troubleshoot_flow_success_path`: success node grading.
- `test_instantiate_variants_seeded`: deterministic variant by seed.
- `test_export_quiztab_v2`: export pack in quiztab v2 schema.

## Frontend Smoke Checklist (Manual)
1. Import a `quiztab-questionpack-v2` JSON in Builder.
2. Quiz renders each new type: `calc_value`, `calc_multi`, `hotspot_svg`, `troubleshoot_flow`.
3. Submit answers and verify backend grading feedback and attempt saved.
4. Support panel shows `given`, `formula_sheet`, `tables`, `assumptions`, `units_guide`.
5. Hotspot SVG toggles highlight + selection list updates.
6. Troubleshoot flow: back/reset works; final node grading works.
7. Progress summary (accuracy/mastery) shows on dashboard.

## Acceptance Criteria
- Import quiztab v2 without errors, questions appear in quiz mode.
- Legacy ap2 v1/v2 imports still work.
- All 8 old methods render and grade.
- New methods render and grade with unit/tolerance rules.
- Randomization/variants deterministic by seed.
- Offline: no external requests required.
