# -*- coding: utf-8 -*-
"""
Pack 5 ultra-lean rigged 66-bone animated performers (`singer`, `guitarist`, `bassist`, `drummer`, `dj`)
from `5.Design_mcp/3.blender/.pjs/led_stage_characters` into `alpha-studio/src/assets/performers/`.

Preserves the exact `led_glb_check.py --check-animation` verified skinning & quaternion hemisphere
continuity while keeping only 1 signature looping performance clip (subsampled 24fps -> 12fps with
exact start/end seam frames) + 192x192 JPEG texture (~180KB raw / ~85KB gzip per performer).
"""
from __future__ import annotations

import gzip
import io
import json
import struct
from pathlib import Path

import numpy as np
from PIL import Image

CHARS_DIR = Path(r"D:\Dev\5.Design_mcp\3.blender\.pjs\led_stage_characters")
OUT_DIR = Path(r"D:\Dev\NodeJS\alpha-studio\alpha-studio\src\assets\performers")

PERFORMER_SPECS = [
    ("stage_singer.glb", "singer.glb", 0, False),
    ("stage_guitarist.glb", "guitarist.glb", 0, False),
    ("stage_bassist.glb", "bassist.glb", 0, False),
    ("stage_drummer.glb", "drummer.glb", 0, False),
    ("stage_dj.glb", "dj.glb", 1, False),
    ("stage_keyboardist.glb", "keyboardist.glb", 0, True),
]


def _q_mul(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    q = np.array([
        aw * bx + ax * bw + ay * bz - az * by,
        aw * by - ax * bz + ay * bw + az * bx,
        aw * bz + ax * by - ay * bx + az * bw,
        aw * bw - ax * bx - ay * by - az * bz,
    ], dtype=np.float32)
    n = float(np.linalg.norm(q))
    return q / n if n > 1e-8 else np.array([0.0, 0.0, 0.0, 1.0], dtype=np.float32)


TYPE_COMPONENTS = {
    "SCALAR": 1,
    "VEC2": 2,
    "VEC3": 3,
    "VEC4": 4,
    "MAT4": 16,
}

NP_DTYPES = {
    5121: np.uint8,
    5123: np.uint16,
    5125: np.uint32,
    5126: np.float32,
}


def _read_acc_np(gltf: dict, bin_chunk: bytes, acc_idx: int) -> np.ndarray:
    acc = gltf["accessors"][acc_idx]
    bv = gltf["bufferViews"][acc["bufferView"]]
    off = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
    n_comp = TYPE_COMPONENTS[acc["type"]]
    dt = NP_DTYPES[acc["componentType"]]
    return np.frombuffer(bin_chunk, dtype=dt, count=acc["count"] * n_comp, offset=off).reshape((acc["count"], n_comp)).copy()


def _q_axis_angle(axis: tuple[float, float, float], angle_rad: float) -> np.ndarray:
    s = float(np.sin(angle_rad * 0.5))
    c = float(np.cos(angle_rad * 0.5))
    return np.array([axis[0] * s, axis[1] * s, axis[2] * s, c], dtype=np.float32)


def _q_mul_batch(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    ax, ay, az, aw = a[:, 0], a[:, 1], a[:, 2], a[:, 3]
    bx, by, bz, bw = b[:, 0], b[:, 1], b[:, 2], b[:, 3]
    out = np.stack([
        aw * bx + ax * bw + ay * bz - az * by,
        aw * by - ax * bz + ay * bw + az * bx,
        aw * bz + ax * by - ay * bx + az * bw,
        aw * bw - ax * bx - ay * by - az * bz,
    ], axis=-1).astype(np.float32)
    norms = np.linalg.norm(out, axis=-1, keepdims=True)
    return np.where(norms > 1e-8, out / np.maximum(norms, 1e-8), out)


def trim_and_subsample_glb(
    glb_bytes: bytes,
    keep_anim_idx: int,
    frame_step: int = 2,
    seated_piano: bool = False,
) -> bytes:
    _magic, _version, _ = struct.unpack_from("<4sII", glb_bytes, 0)
    jlen, _jtype = struct.unpack_from("<II", glb_bytes, 12)
    gltf = json.loads(glb_bytes[20 : 20 + jlen].decode("utf-8"))
    b_off = 20 + jlen
    blen, _btype = struct.unpack_from("<II", glb_bytes, b_off)
    bin_chunk = glb_bytes[b_off + 8 : b_off + 8 + blen]

    anims = gltf.get("animations", [])
    if anims:
        gltf["animations"] = [anims[min(keep_anim_idx, len(anims) - 1)]]

    # Optional seated-pianist adaptation: strip X-stand synth weighted to `root` and map lower-body/arm pose
    custom_acc_bytes: dict[int, bytes] = {}
    channel_overrides: dict[int, np.ndarray] = {}
    if seated_piano:
        joint_names = [gltf["nodes"][ji].get("name", "") for ji in gltf["skins"][0]["joints"]]
        root_joint_idx = joint_names.index("root")
        for m in gltf.get("meshes", []):
            for pr in m.get("primitives", []):
                if "indices" not in pr:
                    continue
                jnt_arr = _read_acc_np(gltf, bin_chunk, pr["attributes"]["JOINTS_0"])
                raw_wgt = _read_acc_np(gltf, bin_chunk, pr["attributes"]["WEIGHTS_0"])
                wgt_arr = raw_wgt.astype(np.float32)
                if raw_wgt.dtype == np.uint8:
                    wgt_arr = wgt_arr / 255.0
                elif raw_wgt.dtype == np.uint16:
                    wgt_arr = wgt_arr / 65535.0
                root_w = np.where(jnt_arr == root_joint_idx, wgt_arr, 0.0).sum(axis=-1)
                drop_mask = root_w > 0.99
                idx_acc_i = pr["indices"]
                tris = _read_acc_np(gltf, bin_chunk, idx_acc_i).reshape((-1, 3))
                keep_tris = tris[~np.any(drop_mask[tris], axis=1)]
                flat_idx = np.ascontiguousarray(keep_tris.reshape(-1), dtype=NP_DTYPES[gltf["accessors"][idx_acc_i]["componentType"]])
                gltf["accessors"][idx_acc_i]["count"] = int(flat_idx.size)
                gltf["accessors"][idx_acc_i].pop("byteOffset", None)
                if "min" in gltf["accessors"][idx_acc_i]:
                    gltf["accessors"][idx_acc_i]["min"] = [int(flat_idx.min())]
                if "max" in gltf["accessors"][idx_acc_i]:
                    gltf["accessors"][idx_acc_i]["max"] = [int(flat_idx.max())]
                custom_acc_bytes[idx_acc_i] = flat_idx.tobytes()

        if gltf.get("animations"):
            an = gltf["animations"][0]
            q_thigh_l = _q_mul_batch(np.array([[0.562, 0.061, 0.049, 0.824]], np.float32), _q_axis_angle((1, 0, 0), 0.30)[None, :])[0]
            q_thigh_r = _q_mul_batch(np.array([[0.561, -0.061, -0.049, 0.824]], np.float32), _q_axis_angle((1, 0, 0), 0.30)[None, :])[0]
            q_calf_l = _q_mul_batch(np.array([[0.767, 0.0, 0.0, 0.641]], np.float32), _q_axis_angle((1, 0, 0), -0.24)[None, :])[0]
            q_calf_r = _q_mul_batch(np.array([[0.753, 0.0, 0.0, 0.658]], np.float32), _q_axis_angle((1, 0, 0), -0.24)[None, :])[0]
            q_foot_l = _q_mul_batch(np.array([[-0.545, 0.025, 0.03, 0.838]], np.float32), _q_axis_angle((1, 0, 0), -0.06)[None, :])[0]
            q_foot_r = _q_mul_batch(np.array([[-0.526, -0.026, -0.03, 0.850]], np.float32), _q_axis_angle((1, 0, 0), -0.06)[None, :])[0]
            fixed_leg = {
                "thigh_l": q_thigh_l,
                "thigh_r": q_thigh_r,
                "calf_l": q_calf_l,
                "calf_r": q_calf_r,
                "foot_l": q_foot_l,
                "foot_r": q_foot_r,
            }
            for ch in an.get("channels", []):
                n_name = gltf["nodes"][ch["target"]["node"]].get("name", "")
                out_acc_i = an["samplers"][ch["sampler"]]["output"]
                arr = _read_acc_np(gltf, bin_chunk, out_acc_i).astype(np.float32)
                if n_name == "pelvis" and ch["target"]["path"] == "translation":
                    arr[:, 0] = 0.0
                    arr[:, 1] = 0.08
                    arr[:, 2] = 0.57 + (arr[:, 2] - float(arr[:, 2].mean())) * 0.4
                    channel_overrides[out_acc_i] = arr
                elif n_name in fixed_leg and ch["target"]["path"] == "rotation":
                    arr[:] = fixed_leg[n_name]
                    channel_overrides[out_acc_i] = arr
                elif n_name in ("upperarm_l", "upperarm_r") and ch["target"]["path"] == "rotation":
                    q_lift = _q_axis_angle((1.0, 0.0, 0.0), 0.38)[None, :]
                    channel_overrides[out_acc_i] = _q_mul_batch(arr, np.repeat(q_lift, len(arr), axis=0))

    used_acc: set[int] = set()
    anim_acc: set[int] = set()
    for m in gltf.get("meshes", []):
        for pr in m.get("primitives", []):
            if "indices" in pr:
                used_acc.add(pr["indices"])
            for ai in pr.get("attributes", {}).values():
                used_acc.add(ai)
    for sk in gltf.get("skins", []):
        if "inverseBindMatrices" in sk:
            used_acc.add(sk["inverseBindMatrices"])
    for an in gltf.get("animations", []):
        for samp in an.get("samplers", []):
            used_acc.add(samp["input"])
            used_acc.add(samp["output"])
            anim_acc.add(samp["input"])
            anim_acc.add(samp["output"])

    old_to_new_acc: dict[int, int] = {}
    new_accessors = []
    for old_i in sorted(used_acc):
        old_to_new_acc[old_i] = len(new_accessors)
        new_accessors.append(dict(gltf["accessors"][old_i]))
    gltf["accessors"] = new_accessors

    remapped_anim_acc = {old_to_new_acc[i] for i in anim_acc}
    remapped_custom_bytes = {old_to_new_acc[i]: v for i, v in custom_acc_bytes.items() if i in old_to_new_acc}
    remapped_overrides = {old_to_new_acc[i]: v for i, v in channel_overrides.items() if i in old_to_new_acc}

    for m in gltf.get("meshes", []):
        for pr in m.get("primitives", []):
            if "indices" in pr:
                pr["indices"] = old_to_new_acc[pr["indices"]]
            pr["attributes"] = {k: old_to_new_acc[v] for k, v in pr["attributes"].items()}
    for sk in gltf.get("skins", []):
        if "inverseBindMatrices" in sk:
            sk["inverseBindMatrices"] = old_to_new_acc[sk["inverseBindMatrices"]]
    for an in gltf.get("animations", []):
        for samp in an.get("samplers", []):
            samp["input"] = old_to_new_acc[samp["input"]]
            samp["output"] = old_to_new_acc[samp["output"]]

    new_bvs = []
    new_bin = bytearray()

    def append_bytes(payload: bytes, target: int | None = None) -> int:
        while len(new_bin) % 4 != 0:
            new_bin.append(0)
        bv_entry: dict[str, int] = {"buffer": 0, "byteOffset": len(new_bin), "byteLength": len(payload)}
        if target is not None:
            bv_entry["target"] = target
        new_bin.extend(payload)
        idx = len(new_bvs)
        new_bvs.append(bv_entry)
        return idx

    # Repack every kept accessor cleanly (subsampling animation float32 tracks while preserving loop endpoints)
    bv_cache: dict[tuple[int, bool], int] = {}
    for acc_idx, acc in enumerate(gltf["accessors"]):
        old_bv_i = acc["bufferView"]
        old_bv = gltf["bufferViews"][old_bv_i]
        raw_offset = old_bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
        n_comp = TYPE_COMPONENTS[acc["type"]]
        count = acc["count"]

        is_anim_f32 = acc_idx in remapped_anim_acc and acc["componentType"] == 5126 and frame_step > 1 and count > 4
        if acc_idx in remapped_custom_bytes:
            payload = remapped_custom_bytes[acc_idx]
            target = gltf["bufferViews"][old_bv_i].get("target")
            acc["bufferView"] = append_bytes(payload, target)
        elif acc_idx in remapped_overrides:
            arr = remapped_overrides[acc_idx]
            if is_anim_f32:
                keep_rows = sorted(set(list(range(0, count, frame_step)) + [count - 1]))
                sub = np.ascontiguousarray(arr[keep_rows], dtype=np.float32)
                acc["count"] = len(keep_rows)
            else:
                sub = np.ascontiguousarray(arr, dtype=np.float32)
            acc.pop("byteOffset", None)
            if "min" in acc:
                acc["min"] = [float(x) for x in sub.min(axis=0)]
            if "max" in acc:
                acc["max"] = [float(x) for x in sub.max(axis=0)]
            acc["bufferView"] = append_bytes(sub.tobytes())
        elif is_anim_f32:
            arr = np.frombuffer(bin_chunk, dtype=np.float32, count=count * n_comp, offset=raw_offset).reshape((count, n_comp))
            keep_rows = sorted(set(list(range(0, count, frame_step)) + [count - 1]))
            sub = np.ascontiguousarray(arr[keep_rows], dtype=np.float32)
            acc["count"] = len(keep_rows)
            acc.pop("byteOffset", None)
            if "min" in acc:
                acc["min"] = [float(x) for x in sub.min(axis=0)]
            if "max" in acc:
                acc["max"] = [float(x) for x in sub.max(axis=0)]
            acc["bufferView"] = append_bytes(sub.tobytes())
        else:
            cache_key = (old_bv_i, False)
            if cache_key not in bv_cache:
                raw_slice = bin_chunk[old_bv.get("byteOffset", 0) : old_bv.get("byteOffset", 0) + old_bv["byteLength"]]
                bv_cache[cache_key] = append_bytes(raw_slice, old_bv.get("target"))
            acc["bufferView"] = bv_cache[cache_key]

    for im in gltf.get("images", []):
        if "bufferView" in im:
            old_bv = gltf["bufferViews"][im["bufferView"]]
            raw_slice = bin_chunk[old_bv.get("byteOffset", 0) : old_bv.get("byteOffset", 0) + old_bv["byteLength"]]
            im_pil = Image.open(io.BytesIO(raw_slice)).convert("RGB").resize((192, 192), Image.Resampling.LANCZOS)
            buf = io.BytesIO()
            im_pil.save(buf, format="JPEG", quality=84)
            im["bufferView"] = append_bytes(buf.getvalue())
            im["mimeType"] = "image/jpeg"

    while len(new_bin) % 4 != 0:
        new_bin.append(0)
    gltf["bufferViews"] = new_bvs
    gltf["buffers"] = [{"byteLength": len(new_bin)}]

    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4 != 0:
        json_bytes += b" "

    total_len = 12 + 8 + len(json_bytes) + 8 + len(new_bin)
    out = bytearray()
    out.extend(struct.pack("<4sII", b"glTF", 2, total_len))
    out.extend(struct.pack("<II", len(json_bytes), 0x4E4F534A))
    out.extend(json_bytes)
    out.extend(struct.pack("<II", len(new_bin), 0x004E4942))
    out.extend(new_bin)
    return bytes(out)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    tot_raw = 0
    tot_gz = 0
    for src_name, dst_name, clip_i, seated_piano in PERFORMER_SPECS:
        src_bytes = (CHARS_DIR / src_name).read_bytes()
        out_bytes = trim_and_subsample_glb(src_bytes, clip_i, frame_step=2, seated_piano=seated_piano)
        (OUT_DIR / dst_name).write_bytes(out_bytes)
        gz = gzip.compress(out_bytes, 6)
        tot_raw += len(out_bytes)
        tot_gz += len(gz)
        print(f"{dst_name:16s} raw={len(out_bytes)/1024:5.1f}KB | gzip={len(gz)/1024:5.1f}KB")
    print(f"TOTAL {len(PERFORMER_SPECS)} PERFORMERS: raw={tot_raw/1024:.1f}KB | gzip={tot_gz/1024:.1f}KB")


if __name__ == "__main__":
    main()
