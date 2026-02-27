import json
import tempfile

import pytest
from fastapi.testclient import TestClient

import backend.main as appmod


@pytest.fixture()
def client():
    with tempfile.NamedTemporaryFile(suffix=".db") as db:
        appmod.DB_PATH = db.name
        appmod.init_db()
        appmod.app.dependency_overrides[appmod.get_current_user] = lambda: "test"
        client = TestClient(appmod.app)
        yield client
        appmod.app.dependency_overrides = {}


def build_quiztab_pack():
    return {
        "schema": "quiztab-questionpack-v2",
        "meta": {"title": "Test Pack", "created_at": "2026-02-23"},
        "settings": {},
        "topics": [{"slug": "netzwerk", "title": "Netzwerk"}],
        "methods": [],
        "assets": [
            {
                "id": "asset_table",
                "type": "table",
                "title": "Sample",
                "content": {"headers": ["A", "B"], "rows": [["1", "2"]]},
            }
        ],
        "questions": [
            {
                "id": "q_single",
                "topic_slug": "netzwerk",
                "method_id": "single",
                "prompt": "Single?",
                "payload": {"options": ["a", "b"], "correct": [0]},
                "solution": {"final": "a"},
                "support": {},
            },
            {
                "id": "q_multi",
                "topic_slug": "netzwerk",
                "method_id": "multi",
                "prompt": "Multi?",
                "payload": {"options": ["a", "b", "c"], "correct": [0, 2]},
                "solution": {"final": "a,c"},
                "support": {},
            },
            {
                "id": "q_tf",
                "topic_slug": "netzwerk",
                "method_id": "truefalse",
                "prompt": "TF?",
                "payload": {"correct": True},
                "solution": {"final": "True"},
                "support": {},
            },
            {
                "id": "q_fill",
                "topic_slug": "netzwerk",
                "method_id": "fillblank",
                "prompt": "Fill?",
                "payload": {"blanks": [["a", "A"]]},
                "solution": {"final": "a"},
                "support": {},
            },
            {
                "id": "q_match",
                "topic_slug": "netzwerk",
                "method_id": "matching",
                "prompt": "Match?",
                "payload": {"pairs": [{"left": "l1", "right": "r1"}]},
                "solution": {"final": "l1->r1"},
                "support": {},
            },
            {
                "id": "q_order",
                "topic_slug": "netzwerk",
                "method_id": "ordering",
                "prompt": "Order?",
                "payload": {"items": ["a", "b"], "correct_order": [0, 1]},
                "solution": {"final": "a,b"},
                "support": {},
            },
            {
                "id": "q_guess",
                "topic_slug": "netzwerk",
                "method_id": "guess",
                "prompt": "Guess?",
                "payload": {"answers": ["term"]},
                "solution": {"final": "term"},
                "support": {},
            },
            {
                "id": "q_explain",
                "topic_slug": "netzwerk",
                "method_id": "explain",
                "prompt": "Explain?",
                "payload": {"expectedAnswer": "keywords"},
                "solution": {"final": "keywords"},
                "support": {},
            },
            {
                "id": "q_exam",
                "topic_slug": "netzwerk",
                "method_id": "exam",
                "prompt": "Exam?",
                "payload": {"expectedAnswer": "key"},
                "solution": {"final": "key"},
                "support": {},
            },
            {
                "id": "q_calc",
                "topic_slug": "netzwerk",
                "method_id": "calc_value",
                "prompt": "Calc?",
                "payload": {
                    "expected_value": 0.26,
                    "expected_unit": "A",
                    "accept_units": ["A", "mA"],
                    "rounding_decimals": 2,
                    "tolerance": {"mode": "relative", "value": 0.02},
                },
                "solution": {"final": "0.26 A"},
                "support": {},
            },
            {
                "id": "q_calc_multi",
                "topic_slug": "netzwerk",
                "method_id": "calc_multi",
                "prompt": "Calc multi?",
                "payload": {
                    "fields": [
                        {"id": "p", "label": "P", "unit": "W", "decimals": 2},
                        {"id": "u", "label": "U", "unit": "V", "decimals": 2},
                    ],
                    "answers": {
                        "p": {"value": 10, "unit": "W"},
                        "u": {"value": 5, "unit": "V"},
                    },
                },
                "solution": {"final": "p,u"},
                "support": {},
            },
            {
                "id": "q_hot",
                "topic_slug": "netzwerk",
                "method_id": "hotspot_svg",
                "prompt": "Hot?",
                "payload": {
                    "svg": "<svg xmlns='http://www.w3.org/2000/svg'><rect id='r1' width='10' height='10'/></svg>",
                    "hotspots": [{"id": "r1", "label": "R1", "svg_element_id": "r1"}],
                    "correct": ["r1"],
                },
                "solution": {"final": "r1"},
                "support": {},
            },
            {
                "id": "q_flow",
                "topic_slug": "netzwerk",
                "method_id": "troubleshoot_flow",
                "prompt": "Flow?",
                "payload": {
                    "start": "n1",
                    "success_node": "n2",
                    "nodes": [
                        {"id": "n1", "text": "Start", "choices": [{"id": "c1", "next": "n2"}]},
                        {"id": "n2", "text": "Done", "choices": []},
                    ],
                },
                "solution": {"final": "n2"},
                "support": {},
            },
        ],
    }


def test_import_quiztab_v2_success(client):
    pack = build_quiztab_pack()
    res = client.post("/questions/import", json=pack)
    assert res.status_code == 200
    body = res.json()
    assert body["summary"]["valid"] == len(pack["questions"])


def test_grade_calc_value_units_tolerance(client):
    pack = build_quiztab_pack()
    client.post("/questions/import", json=pack)
    res = client.post(
        "/questions/q_calc/grade",
        json={"answer": {"value": "260", "unit": "mA"}},
    )
    assert res.status_code == 200
    assert res.json()["correct"] is True


def test_grade_calc_multi_all_fields(client):
    pack = build_quiztab_pack()
    client.post("/questions/import", json=pack)
    res = client.post(
        "/questions/q_calc_multi/grade",
        json={"answer": {"fields": {"p": {"value": 10, "unit": "W"}, "u": {"value": 4, "unit": "V"}}}},
    )
    assert res.status_code == 200
    assert res.json()["correct"] is False


def test_hotspot_svg_set_compare(client):
    pack = build_quiztab_pack()
    client.post("/questions/import", json=pack)
    res = client.post(
        "/questions/q_hot/grade",
        json={"answer": {"selected": ["r1"]}},
    )
    assert res.status_code == 200
    assert res.json()["correct"] is True


def test_troubleshoot_flow_success_path(client):
    pack = build_quiztab_pack()
    client.post("/questions/import", json=pack)
    res = client.post(
        "/questions/q_flow/grade",
        json={"answer": {"path": [{"node_id": "n1", "choice_id": "c1"}], "final_node": "n2"}},
    )
    assert res.status_code == 200
    assert res.json()["correct"] is True


def test_instantiate_variants_seeded(client):
    pack = build_quiztab_pack()
    pack["questions"][0]["variants"] = [
        {"variant_id": "v1", "param_overrides": {"prompt": "A"}, "expected": {"final": "a"}},
        {"variant_id": "v2", "param_overrides": {"prompt": "B"}, "expected": {"final": "b"}},
    ]
    client.post("/questions/import", json=pack)
    res1 = client.post("/questions/q_single/instantiate", json={"seed": 1})
    res2 = client.post("/questions/q_single/instantiate", json={"seed": 1})
    assert res1.status_code == 200
    assert res1.json()["question"]["prompt"] == res2.json()["question"]["prompt"]


def test_export_quiztab_v2(client):
    pack = build_quiztab_pack()
    client.post("/questions/import", json=pack)
    res = client.get("/packs/export?schema=quiztab-questionpack-v2&pack_id=default_pack")
    assert res.status_code == 200
    exported = res.json()
    assert exported["schema"] == "quiztab-questionpack-v2"
    assert len(exported["questions"]) >= 1
