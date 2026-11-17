# -*- coding: utf-8 -*-
"""
Build & bake the sculpted 3D Dark Living Storyboard Diorama (.glb) in Blender 5.3.

Run exclusively via `5.Design_mcp/3.blender/_kit/blender_headless.py` so the shared
MCP build lock and RAM monitor are enforced:
  1) Build + Cycles Vertex-AO Bake + GLB Export:
     HERO_DIORAMA_MODE=build
  2) Single-view Cycles Visual Verification Render (1 view per job):
     HERO_DIORAMA_MODE=render HERO_DIORAMA_VIEW=ch1|ch3|showtime
"""
from __future__ import annotations

import json
import math
import os
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Euler, Matrix, Vector

WORKSPACE_ROOT = Path(r"D:\Dev\NodeJS\alpha-studio")
DESIGN_MCP_BLENDER = Path(r"D:\Dev\5.Design_mcp\3.blender")
ASSETS_BLEND = DESIGN_MCP_BLENDER / ".pjs" / "led_stage_assets" / "led_stage_assets.blend"
CHARS_BLEND = DESIGN_MCP_BLENDER / ".pjs" / "led_stage_characters" / "led_stage_characters.blend"

SCRATCH_DIR = WORKSPACE_ROOT / ".claude" / "0.temp" / "hero_diorama"
BLEND_OUT = SCRATCH_DIR / "hero_dark_diorama.blend"
GLB_OUT = WORKSPACE_ROOT / "alpha-studio" / "src" / "assets" / "hero-dark-diorama.glb"
REPORT_OUT = SCRATCH_DIR / "build_report.json"

STAGE_Z = -4.2  # Three.js Z of main amphitheater center
MAQ_SCALE = 0.56  # Human-scale stage assets -> architectural maquette proportion


def t2b_pos(tx: float, ty: float, tz: float) -> Vector:
    """Convert Three.js (X right, Y up, Z toward viewer) -> Blender (X right, Y away, Z up)."""
    return Vector((float(tx), float(-tz), float(ty)))


def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_to_linear_rgba(hex_str: str, alpha: float = 1.0) -> tuple[float, float, float, float]:
    h = hex_str.lstrip("#")
    r = srgb_to_linear(int(h[0:2], 16) / 255.0)
    g = srgb_to_linear(int(h[2:4], 16) / 255.0)
    b = srgb_to_linear(int(h[4:6], 16) / 255.0)
    return (r, g, b, alpha)


def make_pbr_mat(
    name: str,
    hex_color: str,
    *,
    roughness: float = 0.55,
    metallic: float = 0.08,
    emit_hex: str | None = None,
    emit_strength: float = 0.0,
) -> bpy.types.Material:
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out_nd = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = hex_to_linear_rgba(hex_color)
    bsdf.inputs["Roughness"].default_value = float(roughness)
    bsdf.inputs["Metallic"].default_value = float(metallic)
    if emit_hex and emit_strength > 0.0:
        bsdf.inputs["Emission Color"].default_value = hex_to_linear_rgba(emit_hex)
        bsdf.inputs["Emission Strength"].default_value = float(emit_strength)
    nt.links.new(bsdf.outputs["BSDF"], out_nd.inputs["Surface"])
    return mat


def classify_source_material(src_mat: bpy.types.Material | None, mats: dict[str, bpy.types.Material], asset_hint: str = "") -> bpy.types.Material:
    """Map an appended Principled BSDF material from `led_stage_assets.blend` to our dark studio palette by actual BSDF properties (never matching the 'LED_' prefix!)."""
    if src_mat is None:
        return mats["obsidian"]

    clean_nm = src_mat.name.lower()
    if clean_nm.startswith("led_"):
        clean_nm = clean_nm[4:]

    r, g, b = 0.2, 0.22, 0.26
    metallic = 0.1
    emit_str = 0.0
    er, eg, eb = 0.0, 0.0, 0.0

    if src_mat.use_nodes and src_mat.node_tree:
        for nd in src_mat.node_tree.nodes:
            if nd.type == "BSDF_PRINCIPLED":
                bc = nd.inputs["Base Color"].default_value
                r, g, b = float(bc[0]), float(bc[1]), float(bc[2])
                metallic = float(nd.inputs["Metallic"].default_value)
                if "Emission Strength" in nd.inputs:
                    emit_str = float(nd.inputs["Emission Strength"].default_value)
                if "Emission Color" in nd.inputs:
                    ec = nd.inputs["Emission Color"].default_value
                    er, eg, eb = float(ec[0]), float(ec[1]), float(ec[2])
                break

    # 1. True emissive elements ONLY (lightsticks, neon trims, console screens, fixture lenses)
    if emit_str > 0.05 or any(k in clean_nm for k in ("emissive", "lens", "neon", "lightstick", "screen_glow")):
        if er > eb * 1.15 or r > b * 1.25 or "warm" in clean_nm or "gold" in clean_nm or "par" in clean_nm:
            return mats["emit_amber"]
        if "violet" in clean_nm:
            return mats["emit_violet"]
        return mats["emit_cyan"]

    # 2. Piano ivory keys or crisp white markings
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    if "piano" in asset_hint and lum > 0.55:
        return mats["ivory"]

    # 3. Metals (brass/gold vs anodized titanium/aluminum)
    if metallic > 0.45 or any(k in clean_nm for k in ("gold", "brass", "cymbal", "harp")):
        if r > b * 1.25 or any(k in clean_nm for k in ("gold", "brass", "cymbal", "harp")):
            return mats["brass"]
        return mats["titanium"]
    if any(k in clean_nm for k in ("truss", "aluminum", "grille", "barrier", "chrome", "silver")):
        return mats["titanium"]

    # 4. Botanical foliage
    if g > r * 1.35 and g > b * 1.2:
        return mats["jade"]

    # 5. Warm crimson / coral accents (drum shells, VIP carpet, ceremonial arch accents)
    if r > g * 1.65 and r > 0.22:
        return mats["coral"]

    # 6. Blue / indigo / cyan non-emissive surfaces (crowd outfits, arch panels, VIP chairs)
    if b > r * 1.35 and b > 0.16:
        if g > r * 1.25:
            return mats["teal"]
        return mats["teal"] if "crowd" in asset_hint else mats["vellum"]

    # 7. Bright neutral surfaces -> dark slate on crowd baseplates, dark vellum elsewhere
    if lum > 0.45:
        return mats["slate"] if "crowd" in asset_hint else mats["vellum"]
    if lum > 0.16:
        return mats["slate"]

    # 8. Deep dark housings (Steinway ebony rim, speaker cabinets, consoles)
    if "piano" in asset_hint or "dj" in asset_hint:
        return mats["charcoal_gloss"]
    return mats["obsidian"]


def clear_scene() -> None:
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)
    for img in list(bpy.data.images):
        bpy.data.images.remove(img)


def make_group(name: str, tx: float = 0.0, ty: float = 0.0, tz: float = 0.0, parent: bpy.types.Object | None = None) -> bpy.types.Object:
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = "PLAIN_AXES"
    empty.empty_display_size = 0.25
    empty.location = t2b_pos(tx, ty, tz)
    bpy.context.scene.collection.objects.link(empty)
    if parent is not None:
        empty.parent = parent
    return empty


def add_bevel_and_smooth(obj: bpy.types.Object, width: float = 0.022, segments: int = 1, angle_deg: float = 34.0) -> None:
    bev = obj.modifiers.new(name="Bevel", type="BEVEL")
    bev.width = width
    bev.segments = segments
    bev.limit_method = "ANGLE"
    bev.angle_limit = math.radians(angle_deg)
    bev.harden_normals = False
    for poly in obj.data.polygons:
        poly.use_smooth = True


def decimate_mesh_datablock(mesh: bpy.types.Mesh, ratio: float) -> bpy.types.Mesh:
    """Reduce excess polygon density on miniature stage props/characters viewed from Hero distance."""
    if ratio >= 0.99 or len(mesh.polygons) < 180:
        return mesh
    tmp_obj = bpy.data.objects.new("_decimate_tmp", mesh)
    bpy.context.scene.collection.objects.link(tmp_obj)
    mod = tmp_obj.modifiers.new(name="Decimate", type="DECIMATE")
    mod.decimate_type = "COLLAPSE"
    mod.ratio = float(ratio)
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    ev = tmp_obj.evaluated_get(deps)
    new_m = bpy.data.meshes.new_from_object(ev)
    new_m.name = mesh.name
    bpy.data.objects.remove(tmp_obj, do_unlink=True)
    bpy.data.meshes.remove(mesh)
    for p in new_m.polygons:
        p.use_smooth = True
    return new_m


def create_box_mesh(name: str, sx: float, sy_up: float, sz_depth: float, mat: bpy.types.Material, bevel: float = 0.02) -> bpy.types.Object:
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sz_depth
        v.co.z = (v.co.z + 0.5) * sy_up
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if bevel > 0:
        add_bevel_and_smooth(obj, width=bevel, segments=1)
    return obj


def create_cyl_mesh(
    name: str,
    radius_bottom: float,
    radius_top: float,
    height: float,
    mat: bpy.types.Material,
    *,
    verts: int = 36,
    bevel: float = 0.018,
) -> bpy.types.Object:
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=verts,
        radius1=radius_bottom,
        radius2=radius_top,
        depth=height,
    )
    for v in bm.verts:
        v.co.z += height * 0.5
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if bevel > 0:
        add_bevel_and_smooth(obj, width=bevel, segments=2)
    else:
        for p in obj.data.polygons:
            p.use_smooth = True
    return obj


def create_arch_panel(
    name: str,
    width: float,
    total_height: float,
    thickness: float,
    opening_w: float,
    opening_h: float,
    mat: bpy.types.Material,
    *,
    bevel: float = 0.02,
    segs: int = 28,
) -> bpy.types.Object:
    bm = bmesh.new()
    hw = width * 0.5
    arch_r = hw
    spring_y = max(0.08, total_height - arch_r)

    outer_pts: list[tuple[float, float]] = [(-hw, 0.0), (hw, 0.0), (hw, spring_y)]
    for i in range(1, segs):
        ang = (math.pi * i) / segs
        outer_pts.append((math.cos(ang) * arch_r, spring_y + math.sin(ang) * arch_r))
    outer_pts.append((-hw, spring_y))

    if opening_w <= 0.01 or opening_h <= 0.01:
        verts_front = [bm.verts.new((px, -thickness * 0.5, pz)) for px, pz in outer_pts]
        face_f = bm.faces.new(verts_front)
        ret = bmesh.ops.extrude_face_region(bm, geom=[face_f])
        verts_ext = [e for e in ret["geom"] if isinstance(e, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, verts=verts_ext, vec=(0.0, thickness, 0.0))
    else:
        ohw = min(opening_w * 0.5, hw - 0.08)
        o_spring = max(0.04, opening_h - ohw)
        ring_steps = segs + 4
        outer_chain: list[tuple[float, float]] = []
        inner_chain: list[tuple[float, float]] = []
        for i in range(ring_steps + 1):
            u = i / ring_steps
            if u <= 0.18:
                k = u / 0.18
                outer_chain.append((-hw, k * spring_y))
                inner_chain.append((-ohw, k * o_spring))
            elif u >= 0.82:
                k = (1.0 - u) / 0.18
                outer_chain.append((hw, k * spring_y))
                inner_chain.append((ohw, k * o_spring))
            else:
                k = (u - 0.18) / 0.64
                ang = math.pi * (1.0 - k)
                outer_chain.append((math.cos(ang) * hw, spring_y + math.sin(ang) * arch_r))
                inner_chain.append((math.cos(ang) * ohw, o_spring + math.sin(ang) * ohw))

        f_out = [bm.verts.new((x, -thickness * 0.5, z)) for x, z in outer_chain]
        f_in = [bm.verts.new((x, -thickness * 0.5, z)) for x, z in inner_chain]
        front_faces = []
        for i in range(ring_steps):
            front_faces.append(bm.faces.new((f_out[i], f_in[i], f_in[i + 1], f_out[i + 1])))
        ret = bmesh.ops.extrude_face_region(bm, geom=front_faces)
        verts_ext = [e for e in ret["geom"] if isinstance(e, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, verts=verts_ext, vec=(0.0, thickness, 0.0))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if bevel > 0:
        add_bevel_and_smooth(obj, width=bevel, segments=2)
    return obj


def create_annular_step(
    name: str,
    r_inner: float,
    r_outer: float,
    height: float,
    ang_start: float,
    ang_end: float,
    mat: bpy.types.Material,
    *,
    segs: int = 56,
    bevel: float = 0.022,
) -> bpy.types.Object:
    bm = bmesh.new()
    v_in = []
    v_out = []
    for i in range(segs + 1):
        a = ang_start + (ang_end - ang_start) * (i / segs)
        ca, sa = math.cos(a), math.sin(a)
        v_in.append(bm.verts.new((ca * r_inner, sa * r_inner, 0.0)))
        v_out.append(bm.verts.new((ca * r_outer, sa * r_outer, 0.0)))
    base_faces = []
    for i in range(segs):
        base_faces.append(bm.faces.new((v_in[i], v_out[i], v_out[i + 1], v_in[i + 1])))
    ret = bmesh.ops.extrude_face_region(bm, geom=base_faces)
    verts_ext = [e for e in ret["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=verts_ext, vec=(0.0, 0.0, height))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if bevel > 0:
        add_bevel_and_smooth(obj, width=bevel, segments=2)
    return obj


def place_t(
    obj: bpy.types.Object,
    parent: bpy.types.Object,
    tx: float,
    ty: float,
    tz: float,
    *,
    yaw_y_rad: float = 0.0,
    tilt_x_rad: float = 0.0,
    roll_z_rad: float = 0.0,
    scale: float | tuple[float, float, float] = 1.0,
) -> bpy.types.Object:
    obj.location = t2b_pos(tx, ty, tz)
    obj.rotation_euler = Euler((tilt_x_rad, -roll_z_rad, yaw_y_rad), "XYZ")
    if isinstance(scale, (int, float)):
        obj.scale = (float(scale), float(scale), float(scale))
    else:
        obj.scale = (float(scale[0]), float(abs(scale[2])), float(scale[1]))
    obj.parent = parent
    return obj


def append_collection_merged_mesh(
    blend_path: Path,
    col_name: str,
    new_name: str,
    mats: dict[str, bpy.types.Material],
) -> bpy.types.Mesh:
    """Append a collection from `led_stage_assets.blend`, classify Principled BSDF materials accurately, center XY & ground min_z=0."""
    with bpy.data.libraries.load(str(blend_path), link=False) as (data_from, data_to):
        if col_name not in data_from.collections:
            raise KeyError(f"Collection {col_name} not found in {blend_path}")
        data_to.collections = [col_name]

    col = data_to.collections[0]
    bpy.context.scene.collection.children.link(col)
    deps = bpy.context.evaluated_depsgraph_get()

    bm_merged = bmesh.new()
    mat_list: list[bpy.types.Material] = []
    mat_index_map: dict[str, int] = {}
    hint = col_name.lower()

    src_objs = [o for o in col.all_objects if o.type == "MESH" and not o.hide_render]
    for o in src_objs:
        eval_o = o.evaluated_get(deps)
        tmp_m = bpy.data.meshes.new_from_object(eval_o)
        tmp_m.transform(eval_o.matrix_world)

        slot_remap: list[int] = []
        for slot in o.material_slots:
            target_mat = classify_source_material(slot.material, mats, asset_hint=hint)
            if target_mat.name not in mat_index_map:
                mat_index_map[target_mat.name] = len(mat_list)
                mat_list.append(target_mat)
            slot_remap.append(mat_index_map[target_mat.name])
        if not slot_remap:
            fallback = mats["obsidian"]
            if fallback.name not in mat_index_map:
                mat_index_map[fallback.name] = len(mat_list)
                mat_list.append(fallback)
            slot_remap.append(mat_index_map[fallback.name])

        bm_part = bmesh.new()
        bm_part.from_mesh(tmp_m)
        for f in bm_part.faces:
            idx = min(max(0, f.material_index), len(slot_remap) - 1)
            f.material_index = slot_remap[idx]
            f.smooth = True
        tmp_part = bpy.data.meshes.new("_tmp_part")
        bm_part.to_mesh(tmp_part)
        bm_part.free()
        bm_merged.from_mesh(tmp_part)
        bpy.data.meshes.remove(tmp_part)
        bpy.data.meshes.remove(tmp_m)

    if bm_merged.verts:
        xs = [v.co.x for v in bm_merged.verts]
        ys = [v.co.y for v in bm_merged.verts]
        zs = [v.co.z for v in bm_merged.verts]
        cx = 0.5 * (min(xs) + max(xs))
        cy = 0.5 * (min(ys) + max(ys))
        z0 = min(zs)
        bmesh.ops.translate(bm_merged, verts=bm_merged.verts, vec=(-cx, -cy, -z0))

    out_mesh = bpy.data.meshes.new(f"{new_name}_Mesh")
    bm_merged.to_mesh(out_mesh)
    bm_merged.free()
    for m in mat_list:
        out_mesh.materials.append(m)

    for o in list(col.all_objects):
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.collections.remove(col)
    return decimate_mesh_datablock(out_mesh, 0.55)


def append_character_pose_mesh(char_obj_name: str, new_name: str) -> bpy.types.Mesh:
    with bpy.data.libraries.load(str(CHARS_BLEND), link=False) as (data_from, data_to):
        if char_obj_name not in data_from.objects:
            raise KeyError(f"Character {char_obj_name} not found in {CHARS_BLEND}")
        data_to.objects = [char_obj_name]

    src_o = data_to.objects[0]
    bpy.context.scene.collection.objects.link(src_o)
    deps = bpy.context.evaluated_depsgraph_get()
    eval_o = src_o.evaluated_get(deps)
    out_mesh = bpy.data.meshes.new_from_object(eval_o)
    out_mesh.name = f"{new_name}_Mesh"
    out_mesh.transform(eval_o.matrix_world)

    bm = bmesh.new()
    bm.from_mesh(out_mesh)
    if bm.verts:
        xs = [v.co.x for v in bm.verts]
        ys = [v.co.y for v in bm.verts]
        zs = [v.co.z for v in bm.verts]
        bmesh.ops.translate(
            bm,
            verts=bm.verts,
            vec=(-0.5 * (min(xs) + max(xs)), -0.5 * (min(ys) + max(ys)), -min(zs)),
        )
    for f in bm.faces:
        f.smooth = True
    bm.to_mesh(out_mesh)
    bm.free()

    for mat in out_mesh.materials:
        if mat and mat.use_nodes and mat.node_tree:
            for nd in mat.node_tree.nodes:
                if nd.type == "TEX_IMAGE" and nd.image:
                    w, h = nd.image.size
                    if w > 192 or h > 192:
                        nd.image.scale(192, 192)
                        nd.image.pack()

    bpy.data.objects.remove(src_o, do_unlink=True)
    return decimate_mesh_datablock(out_mesh, 0.48)


def spawn_mesh_instance(
    name: str,
    mesh: bpy.types.Mesh,
    parent: bpy.types.Object,
    tx: float,
    ty: float,
    tz: float,
    *,
    yaw_y_rad: float = 0.0,
    scale: float = 1.0,
) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return place_t(obj, parent, tx, ty, tz, yaw_y_rad=yaw_y_rad, scale=scale)


def merge_static_children_under_group(
    group_empty: bpy.types.Object,
    merged_name: str,
    exclude_meshes: set[bpy.types.Mesh],
    exclude_prefixes: tuple[str, ...] = (),
) -> bpy.types.Object | None:
    """Evaluate modifiers & world transforms of direct/nested static mesh children under `group_empty` and combine into ONE multi-material Mesh under `group_empty` to minimize WebGL draw calls."""
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    inv_group = group_empty.matrix_world.inverted()

    candidates = [
        o for o in group_empty.children_recursive
        if o.type == "MESH"
        and o.data not in exclude_meshes
        and not any(o.name.startswith(pfx) for pfx in exclude_prefixes)
    ]
    if len(candidates) <= 1:
        return candidates[0] if candidates else None

    bm_merged = bmesh.new()
    mat_list: list[bpy.types.Material] = []
    mat_map: dict[str, int] = {}

    for o in candidates:
        ev = o.evaluated_get(deps)
        tm = bpy.data.meshes.new_from_object(ev)
        local_mat = inv_group @ ev.matrix_world
        tm.transform(local_mat)

        slot_remap: list[int] = []
        for slot in o.material_slots:
            m = slot.material
            if m is None:
                continue
            if m.name not in mat_map:
                mat_map[m.name] = len(mat_list)
                mat_list.append(m)
            slot_remap.append(mat_map[m.name])
        if not slot_remap and mat_list:
            slot_remap.append(0)

        bm_part = bmesh.new()
        bm_part.from_mesh(tm)
        for f in bm_part.faces:
            if slot_remap:
                f.material_index = slot_remap[min(max(0, f.material_index), len(slot_remap) - 1)]
            f.smooth = True
        tp = bpy.data.meshes.new("_tp_merge")
        bm_part.to_mesh(tp)
        bm_part.free()
        bm_merged.from_mesh(tp)
        bpy.data.meshes.remove(tp)
        bpy.data.meshes.remove(tm)

    out_m = bpy.data.meshes.new(f"{merged_name}_Mesh")
    bm_merged.to_mesh(out_m)
    bm_merged.free()
    for m in mat_list:
        out_m.materials.append(m)

    merged_obj = bpy.data.objects.new(merged_name, out_m)
    bpy.context.scene.collection.objects.link(merged_obj)
    merged_obj.parent = group_empty

    # Remove consumed child meshes & any now-empty sub-group Empties
    for o in candidates:
        bpy.data.objects.remove(o, do_unlink=True)
    for sub_e in list(group_empty.children_recursive):
        if sub_e.type == "EMPTY" and len(sub_e.children) == 0:
            bpy.data.objects.remove(sub_e, do_unlink=True)

    return merged_obj


def build_botanical_cluster(name: str, parent: bpy.types.Object, tx: float, ty: float, tz: float, scale: float, mats: dict[str, bpy.types.Material]) -> None:
    holder = make_group(name, tx, ty, tz, parent=parent)
    pot = create_cyl_mesh(f"{name}_Pot", 0.34 * scale, 0.38 * scale, 0.24 * scale, mats["slate"], verts=32, bevel=0.02 * scale)
    place_t(pot, holder, 0, 0, 0)
    rim = create_cyl_mesh(f"{name}_Rim", 0.39 * scale, 0.39 * scale, 0.04 * scale, mats["brass"], verts=32, bevel=0.01 * scale)
    place_t(rim, holder, 0, 0.22 * scale, 0)

    leaf_offsets = [
        (0.0, 0.38, 0.0, 0.22),
        (-0.16, 0.31, 0.10, 0.17),
        (0.17, 0.33, -0.08, 0.18),
        (-0.08, 0.28, -0.14, 0.15),
        (0.11, 0.29, 0.15, 0.14),
    ]
    for idx, (ox, oy, oz, rad) in enumerate(leaf_offsets):
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=rad * scale)
        for v in bm.verts:
            v.co.z *= 1.18
        m = bpy.data.meshes.new(f"{name}_Leaf_{idx}_Mesh")
        bm.to_mesh(m)
        bm.free()
        m.materials.append(mats["jade"] if idx % 2 == 0 else mats["teal"])
        for p in m.polygons:
            p.use_smooth = True
        lo = bpy.data.objects.new(f"{name}_Leaf_{idx}", m)
        bpy.context.scene.collection.objects.link(lo)
        place_t(lo, holder, ox * scale, oy * scale, oz * scale)


def build_pleated_fan(
    name: str,
    parent: bpy.types.Object,
    tx: float,
    ty: float,
    tz: float,
    radius: float,
    blade_count: int,
    arc_rad: float,
    mat_a: bpy.types.Material,
    mat_b: bpy.types.Material,
    *,
    yaw_y_rad: float = 0.0,
    tilt_x_rad: float = 0.0,
) -> bpy.types.Object:
    grp = make_group(name, tx, ty, tz, parent=parent)
    grp.rotation_euler = Euler((tilt_x_rad, 0.0, yaw_y_rad), "XYZ")
    blade_w = (radius * arc_rad) / max(3, blade_count) * 0.92
    for i in range(blade_count):
        u = (i / max(1, blade_count - 1)) - 0.5
        ang = u * arc_rad
        b_obj = create_box_mesh(
            f"{name}_Blade_{i}",
            blade_w,
            radius,
            0.032,
            mat_a if i % 2 == 0 else mat_b,
            bevel=0.006,
        )
        b_obj.location = Vector((math.sin(ang) * radius * 0.14, (i % 2) * 0.014, 0.0))
        b_obj.rotation_euler = Euler((0.0, ang, 0.22 if i % 2 == 0 else -0.22), "XYZ")
        b_obj.parent = grp
    return grp


def purge_orphan_datablocks() -> None:
    for mesh in list(bpy.data.meshes):
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        if mat.users == 0:
            bpy.data.materials.remove(mat)
    for img in list(bpy.data.images):
        if img.users == 0:
            bpy.data.images.remove(img)


def build_diorama_scene() -> dict:
    clear_scene()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0

    mats = {
        "obsidian": make_pbr_mat("HERO_ObsidianBoard", "#0d1728", roughness=0.68, metallic=0.10),
        "charcoal_gloss": make_pbr_mat("HERO_CharcoalGloss", "#09111e", roughness=0.20, metallic=0.36),
        "slate": make_pbr_mat("HERO_SlateTier", "#162946", roughness=0.52, metallic=0.18),
        "vellum": make_pbr_mat("HERO_DraftingVellum", "#21385c", roughness=0.56, metallic=0.08),
        "ivory": make_pbr_mat("HERO_PianoIvory", "#dde7f5", roughness=0.30, metallic=0.04),
        "brass": make_pbr_mat("HERO_BrushedBrass", "#dfa956", roughness=0.26, metallic=0.88),
        "titanium": make_pbr_mat("HERO_AnodizedTitanium", "#8eaacd", roughness=0.28, metallic=0.84),
        "coral": make_pbr_mat("HERO_CoralVelvet", "#eb6e5b", roughness=0.46, metallic=0.10),
        "violet": make_pbr_mat("HERO_VioletSatin", "#7b6cf6", roughness=0.44, metallic=0.16),
        "teal": make_pbr_mat("HERO_TealAcrylic", "#2cc2e0", roughness=0.26, metallic=0.20),
        "jade": make_pbr_mat("HERO_JadeBotanical", "#2e856e", roughness=0.56, metallic=0.04),
        "emit_cyan": make_pbr_mat("HERO_EmitCyan", "#59e4fa", roughness=0.22, metallic=0.0, emit_hex="#59e4fa", emit_strength=2.15),
        "emit_amber": make_pbr_mat("HERO_EmitAmber", "#f8b456", roughness=0.24, metallic=0.0, emit_hex="#f8b456", emit_strength=2.10),
        "emit_violet": make_pbr_mat("HERO_EmitViolet", "#9686fa", roughness=0.24, metallic=0.0, emit_hex="#9686fa", emit_strength=2.05),
    }

    proto_meshes = {
        "piano": append_collection_merged_mesh(ASSETS_BLEND, "LED_Furniture_GrandPiano", "Proto_Piano", mats),
        "drums": append_collection_merged_mesh(ASSETS_BLEND, "LED_Prop_DrumKit", "Proto_Drums", mats),
        "dj_booth": append_collection_merged_mesh(ASSETS_BLEND, "LED_Furniture_DjBooth", "Proto_DjBooth", mats),
        "foh_booth": append_collection_merged_mesh(ASSETS_BLEND, "LED_Furniture_FohBooth", "Proto_FohBooth", mats),
        "camera": append_collection_merged_mesh(ASSETS_BLEND, "LED_Prop_BroadcastCamera", "Proto_Camera", mats),
        "line_array": append_collection_merged_mesh(ASSETS_BLEND, "LED_Audio_LineArray", "Proto_LineArray", mats),
        "sub_stack": append_collection_merged_mesh(ASSETS_BLEND, "LED_Audio_SubStack", "Proto_SubStack", mats),
        "wedge": append_collection_merged_mesh(ASSETS_BLEND, "LED_Audio_WedgeMonitor", "Proto_Wedge", mats),
        "cold_spark": append_collection_merged_mesh(ASSETS_BLEND, "LED_Sfx_ColdSparkBt01", "Proto_ColdSpark", mats),
        "cryo_jet": append_collection_merged_mesh(ASSETS_BLEND, "LED_Sfx_Co2CryoJet", "Proto_CryoJet", mats),
        "welcome_arch": append_collection_merged_mesh(ASSETS_BLEND, "LED_Prop_LedWelcomeArch", "Proto_WelcomeArch", mats),
        "checkin_arch": append_collection_merged_mesh(ASSETS_BLEND, "LED_Prop_CheckinBackdrop", "Proto_CheckinArch", mats),
        "plant": append_collection_merged_mesh(ASSETS_BLEND, "LED_Decor_StagePlant", "Proto_StagePlant", mats),
        "kinetic_orb": append_collection_merged_mesh(ASSETS_BLEND, "LED_Prop_KineticWinchOrb", "Proto_KineticOrb", mats),
        "truss_tower": append_collection_merged_mesh(ASSETS_BLEND, "LED_Structure_TrussTower", "Proto_TrussTower", mats),
        "mojo_barrier": append_collection_merged_mesh(ASSETS_BLEND, "LED_Prop_MojoBarrier", "Proto_MojoBarrier", mats),
        "blinder": append_collection_merged_mesh(ASSETS_BLEND, "LED_Fixture_Blinder4Lite", "Proto_Blinder", mats),
        "stairs": append_collection_merged_mesh(ASSETS_BLEND, "LED_Structure_StageStairs", "Proto_StageStairs", mats),
    }

    char_meshes: dict[str, bpy.types.Mesh] = {}

    # 3-node rigged Moving Head Beam230 prototype parts for real Pan/Tilt in Three.js
    grp_proto = make_group("GRP_FixtureProto", 0.0, -25.0, 0.0)
    with bpy.data.libraries.load(str(ASSETS_BLEND), link=False) as (_df, dt):
        dt.objects = ["LED_Beam230_Base", "LED_Beam230_Yoke", "LED_Beam230_Head"]
    deps_f = bpy.context.evaluated_depsgraph_get()
    proto_pms: list[bpy.types.Mesh] = []
    f_xs, f_ys, f_zs = [], [], []
    for part_o, out_nm in zip(dt.objects, ("PROTO_Beam_Base", "PROTO_Beam_Yoke", "PROTO_Beam_Head")):
        bpy.context.scene.collection.objects.link(part_o)
        ev = part_o.evaluated_get(deps_f)
        pm = bpy.data.meshes.new_from_object(ev)
        pm.transform(ev.matrix_world)
        pm.name = f"{out_nm}_Mesh"
        pm.materials.clear()
        pm.materials.append(mats["obsidian"])
        if "Head" in out_nm:
            pm.materials.append(mats["emit_cyan"])
        elif "Base" in out_nm:
            pm.materials.append(mats["titanium"])
        for p in pm.polygons:
            p.material_index = min(p.material_index, len(pm.materials) - 1)
            p.use_smooth = True
        for v in pm.vertices:
            f_xs.append(v.co.x); f_ys.append(v.co.y); f_zs.append(v.co.z)
        proto_pms.append(pm)
        po = bpy.data.objects.new(out_nm, pm)
        bpy.context.scene.collection.objects.link(po)
        place_t(po, grp_proto, 0, 0, 0, scale=0.72)
        bpy.data.objects.remove(part_o, do_unlink=True)
    if f_xs:
        f_shift = Matrix.Translation((-0.5 * (min(f_xs) + max(f_xs)), -0.5 * (min(f_ys) + max(f_ys)), -min(f_zs)))
        for pm in proto_pms:
            pm.transform(f_shift)

    # ═══════════════════════════════════════════════════════════════════════════
    # 1. FULL-VIEWPORT STUDIO FLOOR & SCULPTED ARCHITECT'S TOOLS (`GRP_DeskFoundation`)
    # ═══════════════════════════════════════════════════════════════════════════
    grp_desk = make_group("GRP_DeskFoundation", 0, 0, 0)
    desk_slab = create_box_mesh("Desk_MainSlab", 110.0, 0.22, 110.0, mats["charcoal_gloss"], bevel=0.04)
    place_t(desk_slab, grp_desk, 0.0, -0.22, 0.0)

    ruler = create_box_mesh("Desk_ScaleRuler", 0.22, 0.035, 2.35, mats["titanium"], bevel=0.008)
    place_t(ruler, grp_desk, 2.35, 0.0, 7.35, yaw_y_rad=0.34)

    # Mechanical pencil placed cleanly beside scale ruler (no overlap with sketchpad!)
    pencil_body = create_cyl_mesh("Desk_PencilBody", 0.046, 0.046, 1.95, mats["obsidian"], verts=6, bevel=0.006)
    pencil_body.rotation_euler = Euler((math.radians(90), 0.0, -0.38), "XYZ")
    pencil_body.location = t2b_pos(2.92, 0.046, 7.55)
    pencil_body.parent = grp_desk

    pencil_tip = create_cyl_mesh("Desk_PencilTip", 0.046, 0.006, 0.24, mats["brass"], verts=16, bevel=0.002)
    pencil_tip.rotation_euler = Euler((math.radians(-90), 0.0, -0.38), "XYZ")
    pencil_tip.location = t2b_pos(2.92 - math.sin(0.38) * 0.98, 0.046, 7.55 - math.cos(0.38) * 0.98)
    pencil_tip.parent = grp_desk

    swatch_mats = [mats["coral"], mats["emit_amber"], mats["brass"], mats["teal"], mats["violet"]]
    for s_idx, sm in enumerate(swatch_mats):
        ang = -0.55 + s_idx * 0.24
        blade = create_box_mesh(f"Desk_SwatchBlade_{s_idx}", 0.34, 0.022, 1.28, sm, bevel=0.006)
        place_t(blade, grp_desk, -2.72 + math.sin(ang) * 0.42, 0.012 + s_idx * 0.016, 7.45 - math.cos(ang) * 0.42, yaw_y_rad=-ang)
    rivet = create_cyl_mesh("Desk_SwatchRivet", 0.06, 0.06, 0.12, mats["brass"], verts=20, bevel=0.01)
    place_t(rivet, grp_desk, -2.72, 0.0, 7.45)

    for c_idx, (cx, cz, cm) in enumerate([(3.18, 6.25, mats["coral"]), (3.45, 6.45, mats["teal"]), (3.32, 6.02, mats["brass"])]):
        tok = create_cyl_mesh(f"Desk_ColorToken_{c_idx}", 0.24, 0.24, 0.035, cm, verts=32, bevel=0.008)
        place_t(tok, grp_desk, cx, 0.01 + c_idx * 0.018, cz)

    build_pleated_fan("Desk_OrigamiCraft", grp_desk, -5.25, 0.0, -0.9, 1.05, 7, 1.15, mats["slate"], mats["brass"], yaw_y_rad=0.45, tilt_x_rad=0.25)

    # ═══════════════════════════════════════════════════════════════════════════
    # 2. CHAPTER 1: CREATIVE BRIEF PAD, ZIGGURAT & SCULPTED GATEWAY (`GRP_Ch1_BriefPad`)
    # ═══════════════════════════════════════════════════════════════════════════
    grp_ch1 = make_group("GRP_Ch1_BriefPad", 0, 0, 0)
    pad_base = create_box_mesh("Ch1_PadBase", 3.45, 0.075, 4.05, mats["obsidian"], bevel=0.022)
    place_t(pad_base, grp_ch1, -0.05, 0.0, 6.95, yaw_y_rad=0.14)
    pad_sheet = create_box_mesh("Ch1_PadSheet", 3.22, 0.045, 3.82, mats["vellum"], bevel=0.014)
    place_t(pad_sheet, grp_ch1, -0.05, 0.065, 6.95, yaw_y_rad=0.14)
    pad_clip = create_box_mesh("Ch1_BrassClip", 0.62, 0.055, 0.18, mats["brass"], bevel=0.01)
    place_t(pad_clip, grp_ch1, -0.32, 0.095, 8.80, yaw_y_rad=0.14)

    for step_i in range(5):
        w = 1.42 - step_i * 0.20
        d = 1.26 - step_i * 0.16
        st = create_box_mesh(f"Ch1_Ziggurat_{step_i}", w, 0.15, d, mats["jade"] if step_i % 2 == 0 else mats["slate"], bevel=0.015)
        place_t(st, grp_ch1, -1.95, step_i * 0.14, 4.95 - step_i * 0.06, yaw_y_rad=0.12)

    pyr = create_cyl_mesh("Ch1_StudyPyramid", 0.28, 0.005, 0.52, mats["titanium"], verts=4, bevel=0.01)
    place_t(pyr, grp_ch1, -2.85, 0.0, 5.85, yaw_y_rad=0.35)

    gate_outer = create_arch_panel("Ch1_CreativeGateOuter", 1.56, 1.52, 0.24, 0.78, 1.02, mats["slate"], bevel=0.024)
    place_t(gate_outer, grp_ch1, 0.08, 0.0, 4.68, yaw_y_rad=0.08)
    gate_brass = create_arch_panel("Ch1_CreativeGateBrass", 1.12, 1.22, 0.28, 0.74, 0.98, mats["brass"], bevel=0.014)
    place_t(gate_brass, grp_ch1, 0.08, 0.0, 4.68, yaw_y_rad=0.08)
    gate_glow = create_arch_panel("Ch1_CreativeGateGlow", 0.72, 0.96, 0.06, 0.0, 0.0, mats["emit_amber"], bevel=0.008)
    place_t(gate_glow, grp_ch1, 0.08, 0.02, 4.60, yaw_y_rad=0.08)

    build_botanical_cluster("Ch1_GatePlanter", grp_ch1, 1.68, 0.0, 4.88, 1.05, mats)
    lens_coral = create_cyl_mesh("Ch1_LensCoral", 0.48, 0.48, 0.04, mats["coral"], verts=36, bevel=0.008)
    lens_coral.rotation_euler = Euler((math.radians(90), 0.0, 0.22), "XYZ")
    lens_coral.location = t2b_pos(1.95, 0.85, 4.45)
    lens_coral.parent = grp_ch1

    lens_cyan = create_cyl_mesh("Ch1_LensCyan", 0.38, 0.38, 0.04, mats["teal"], verts=36, bevel=0.008)
    lens_cyan.rotation_euler = Euler((math.radians(90), 0.0, -0.18), "XYZ")
    lens_cyan.location = t2b_pos(2.28, 0.72, 4.62)
    lens_cyan.parent = grp_ch1

    # ═══════════════════════════════════════════════════════════════════════════
    # 3. CHAPTER 2: MOODBOARD & TACTILE MATERIAL SAMPLE TRAYS (`GRP_Ch2_MoodTrays`)
    # ═══════════════════════════════════════════════════════════════════════════
    grp_ch2 = make_group("GRP_Ch2_MoodTrays", 0, 0, 0)
    tray_specs = [
        (-2.45, 0.38, 4.35, 0.16, mats["coral"], "fan"),
        (2.45, 0.44, 4.15, -0.16, mats["teal"], "slats"),
        (-2.75, 0.52, 2.85, 0.12, mats["violet"], "swatches"),
        (2.72, 0.56, 2.68, -0.14, mats["brass"], "fan"),
        (-2.15, 0.32, 1.65, 0.10, mats["slate"], "slats"),
        (2.15, 0.36, 1.55, -0.10, mats["vellum"], "swatches"),
    ]
    mood_tray_nodes: list[bpy.types.Object] = []
    for idx, (tx, ty, tz, yaw, accent_m, kind) in enumerate(tray_specs):
        t_node = make_group(f"MoodTray_{idx}", tx, ty, tz, parent=grp_ch2)
        mood_tray_nodes.append(t_node)
        board = create_box_mesh(f"Ch2_TrayBoard_{idx}", 1.48, 0.065, 1.18, mats["obsidian"], bevel=0.018)
        place_t(board, t_node, 0, 0, 0, yaw_y_rad=yaw)
        inlay = create_box_mesh(f"Ch2_TrayInlay_{idx}", 1.32, 0.035, 1.02, accent_m, bevel=0.01)
        place_t(inlay, t_node, 0, 0.05, 0, yaw_y_rad=yaw)
        pin = create_cyl_mesh(f"Ch2_TrayPin_{idx}", 0.055, 0.055, 0.12, mats["brass"], verts=20, bevel=0.008)
        place_t(pin, t_node, -0.52, 0.06, -0.36, yaw_y_rad=yaw)

        if kind == "fan":
            build_pleated_fan(f"Ch2_TrayFan_{idx}", t_node, 0.08, 0.08, 0.05, 0.46, 6, 1.3, mats["brass"], mats["obsidian"], yaw_y_rad=yaw, tilt_x_rad=1.25)
        elif kind == "slats":
            for s_i in range(5):
                slat = create_box_mesh(f"Ch2_Slat_{idx}_{s_i}", 0.08, 0.07, 0.74, mats["brass"] if s_i % 2 == 0 else mats["titanium"], bevel=0.008)
                place_t(slat, t_node, -0.28 + s_i * 0.14, 0.07, 0.0, yaw_y_rad=yaw)
            orb = create_cyl_mesh(f"Ch2_Orb_{idx}", 0.11, 0.11, 0.18, mats["emit_cyan"], verts=24, bevel=0.02)
            place_t(orb, t_node, 0.38, 0.08, 0.18, yaw_y_rad=yaw)
        else:
            for c_i, cm in enumerate((mats["coral"], mats["teal"], mats["emit_violet"])):
                sw = create_box_mesh(f"Ch2_Card_{idx}_{c_i}", 0.36, 0.04, 0.48, cm, bevel=0.008)
                place_t(sw, t_node, -0.32 + c_i * 0.32, 0.07 + c_i * 0.015, 0.04, yaw_y_rad=yaw + (c_i - 1) * 0.12)

    # ═══════════════════════════════════════════════════════════════════════════
    # 4. CHAPTER 3: PROCESSION OF SCULPTED CONCEPT PORTALS (`GRP_Ch3_Portals`)
    #    Positioned cleanly along Z = +3.95 .. +1.25 (clear of the amphitheater!)
    # ═══════════════════════════════════════════════════════════════════════════
    grp_ch3 = make_group("GRP_Ch3_Portals", 0, 0, 0)
    portal_nodes: list[bpy.types.Object] = []

    for p_idx, (pz, pw, ph, accent_m, emit_m) in enumerate([
        (3.95, 2.25, 1.95, mats["vellum"], mats["emit_cyan"]),
        (3.15, 2.75, 2.28, mats["violet"], mats["emit_amber"]),
    ]):
        p_node = make_group(f"Portal_{p_idx}", 0.0, 0.0, pz, parent=grp_ch3)
        portal_nodes.append(p_node)
        plinth = create_box_mesh(f"Ch3_Plinth_{p_idx}", pw + 0.36, 0.09, 0.52, mats["obsidian"], bevel=0.02)
        place_t(plinth, p_node, 0, 0, 0)
        arch_main = create_arch_panel(f"Ch3_ArchMain_{p_idx}", pw, ph, 0.18, pw * 0.56, ph * 0.66, accent_m, bevel=0.022)
        place_t(arch_main, p_node, 0, 0.08, 0)
        arch_cove = create_arch_panel(f"Ch3_ArchCove_{p_idx}", pw * 0.64, ph * 0.72, 0.22, pw * 0.54, ph * 0.64, emit_m, bevel=0.01)
        place_t(arch_cove, p_node, 0, 0.08, 0)

    p2_node = make_group("Portal_2", 0.0, 0.0, 2.45, parent=grp_ch3)
    portal_nodes.append(p2_node)
    spawn_mesh_instance("Ch3_CheckinLeft", proto_meshes["checkin_arch"], p2_node, -2.55, 0.0, 0.0, yaw_y_rad=0.38, scale=0.58)
    spawn_mesh_instance("Ch3_CheckinRight", proto_meshes["checkin_arch"], p2_node, 2.55, 0.0, 0.0, yaw_y_rad=-0.38, scale=0.58)

    p3_node = make_group("Portal_3", 0.0, 0.0, 1.92, parent=grp_ch3)
    portal_nodes.append(p3_node)
    p3_outer = create_arch_panel("Ch3_GrandArchOuter", 3.65, 2.75, 0.20, 2.35, 1.98, mats["slate"], bevel=0.024)
    place_t(p3_outer, p3_node, 0, 0, 0)
    p3_brass = create_arch_panel("Ch3_GrandArchBrass", 2.62, 2.15, 0.24, 2.28, 1.92, mats["brass"], bevel=0.014)
    place_t(p3_brass, p3_node, 0, 0, 0)

    p4_node = make_group("Portal_4", 0.0, 0.0, 1.32, parent=grp_ch3)
    portal_nodes.append(p4_node)
    spawn_mesh_instance("Ch3_LedWelcomeArch", proto_meshes["welcome_arch"], p4_node, 0.0, 0.0, 0.0, scale=0.72)

    # ═══════════════════════════════════════════════════════════════════════════
    # 5. CHAPTER 4: STORYBOARD PRESENTATION BOARDS RING (`GRP_Ch4_Storyboards`)
    # ═══════════════════════════════════════════════════════════════════════════
    grp_ch4 = make_group("GRP_Ch4_Storyboards", 0, 0, 0)
    storyboard_nodes: list[bpy.types.Object] = []
    board_angles = [-0.98, -0.58, -0.20, 0.20, 0.58, 0.98]
    ring_r = 7.55
    for b_idx, b_ang in enumerate(board_angles):
        bx = math.sin(b_ang) * ring_r
        bz = STAGE_Z - math.cos(b_ang) * (ring_r * 0.72)
        b_node = make_group(f"Storyboard_{b_idx}", bx, 0.0, bz, parent=grp_ch4)
        storyboard_nodes.append(b_node)
        yaw = -b_ang * 0.85

        panel = create_box_mesh(f"Ch4_BoardPanel_{b_idx}", 2.08, 2.55, 0.11, mats["obsidian"], bevel=0.022)
        place_t(panel, b_node, 0, 0, 0, yaw_y_rad=yaw, tilt_x_rad=-0.06)
        matte = create_box_mesh(f"Ch4_BoardMatte_{b_idx}", 1.84, 2.24, 0.04, mats["vellum"], bevel=0.012)
        place_t(matte, b_node, 0, 0.15, 0.055, yaw_y_rad=yaw, tilt_x_rad=-0.06)

        sketch_arch = create_arch_panel(
            f"Ch4_BoardSketchArch_{b_idx}",
            1.18,
            1.32,
            0.045,
            0.88,
            1.02,
            mats["brass"] if b_idx % 2 == 0 else mats["emit_cyan"],
            bevel=0.008,
        )
        place_t(sketch_arch, b_node, 0, 0.42, 0.08, yaw_y_rad=yaw, tilt_x_rad=-0.06)

    # ═══════════════════════════════════════════════════════════════════════════
    # 6. CHAPTERS 5-7: 5-STRATA CONCERT AMPHITHEATER (`STAGE_Z = -4.2`)
    # ═══════════════════════════════════════════════════════════════════════════

    # ─── STRATUM 1: Crescent Amphitheater Bowl, FOH Console, Cameras & 3D Crowd ───
    grp_s1 = make_group("GRP_Strata1_SeatingFoh", 0, 0, 0)
    front_center_ang = -math.pi * 0.5
    tier_defs = [
        (3.85, 4.65, 0.20),
        (4.62, 5.48, 0.38),
        (5.44, 6.35, 0.56),
    ]
    for t_i, (r_in, r_out, th) in enumerate(tier_defs):
        span = math.pi * 0.36 * (0.9 + t_i * 0.05)
        terrace = create_annular_step(
            f"S1_Terrace_{t_i}",
            r_in,
            r_out,
            th,
            front_center_ang - span,
            front_center_ang + span,
            mats["slate"] if t_i % 2 == 0 else mats["obsidian"],
            segs=52,
            bevel=0.024,
        )
        place_t(terrace, grp_s1, 0.0, 0.0, STAGE_Z)

        brass_lip = create_annular_step(
            f"S1_TerraceLip_{t_i}",
            r_in - 0.03,
            r_in + 0.05,
            th + 0.025,
            front_center_ang - span,
            front_center_ang + span,
            mats["brass"],
            segs=52,
            bevel=0.008,
        )
        place_t(brass_lip, grp_s1, 0.0, 0.0, STAGE_Z)

    for b_ang in (-0.52, -0.18, 0.18, 0.52):
        r_bar = 3.58
        bx = math.sin(b_ang) * r_bar
        bz = STAGE_Z + math.cos(b_ang) * r_bar
        spawn_mesh_instance(f"S1_Barrier_{b_ang:.2f}", proto_meshes["mojo_barrier"], grp_s1, bx, 0.0, bz, yaw_y_rad=b_ang, scale=MAQ_SCALE * 0.92)

    # Animated GPU-instanced audience (VIP seated + concert standing with lightsticks/phones) is spawned in Three.js (`threeCrowdSystem.ts`).

    foh_plinth = create_box_mesh("S1_FohPlinth", 2.35, 0.58, 1.35, mats["obsidian"], bevel=0.024)
    place_t(foh_plinth, grp_s1, 0.0, 0.0, STAGE_Z + 6.05)
    spawn_mesh_instance("S1_FohConsole", proto_meshes["foh_booth"], grp_s1, 0.0, 0.58, STAGE_Z + 6.05, yaw_y_rad=math.pi, scale=MAQ_SCALE * 1.02)
    spawn_mesh_instance("S1_CamLeft", proto_meshes["camera"], grp_s1, -1.48, 0.56, STAGE_Z + 5.95, yaw_y_rad=math.pi - 0.18, scale=MAQ_SCALE * 0.95)
    spawn_mesh_instance("S1_CamRight", proto_meshes["camera"], grp_s1, 1.48, 0.56, STAGE_Z + 5.95, yaw_y_rad=math.pi + 0.18, scale=MAQ_SCALE * 0.95)

    # ─── STRATUM 2: Multi-Tier Stage Deck, T-Catwalk & Layered Acoustic Shell ───
    grp_s2 = make_group("GRP_Strata2_StageShell", 0, 0, 0)
    deck_t1 = create_cyl_mesh("S2_DeckTier1", 3.35, 3.28, 0.28, mats["obsidian"], verts=64, bevel=0.025)
    place_t(deck_t1, grp_s2, 0.0, 0.0, STAGE_Z)
    deck_glow1 = create_annular_step("S2_DeckCove1", 3.23, 3.32, 0.045, 0.0, math.tau, mats["emit_cyan"], segs=64, bevel=0.006)
    place_t(deck_glow1, grp_s2, 0.0, 0.255, STAGE_Z)

    deck_t2 = create_cyl_mesh("S2_DeckTier2", 2.75, 2.70, 0.24, mats["charcoal_gloss"], verts=64, bevel=0.022)
    place_t(deck_t2, grp_s2, 0.0, 0.28, STAGE_Z - 0.12)
    deck_brass = create_annular_step("S2_DeckBrassRim", 2.65, 2.73, 0.038, 0.0, math.tau, mats["brass"], segs=64, bevel=0.006)
    place_t(deck_brass, grp_s2, 0.0, 0.495, STAGE_Z - 0.12)

    riser = create_cyl_mesh("S2_BandRiser", 1.62, 1.58, 0.28, mats["slate"], verts=48, bevel=0.02)
    place_t(riser, grp_s2, 0.0, 0.52, STAGE_Z - 0.95)

    catwalk = create_box_mesh("S2_Catwalk", 0.92, 0.34, 1.95, mats["charcoal_gloss"], bevel=0.02)
    place_t(catwalk, grp_s2, 0.0, 0.0, STAGE_Z + 2.55)
    b_stage = create_cyl_mesh("S2_BStage", 0.96, 0.92, 0.38, mats["charcoal_gloss"], verts=48, bevel=0.022)
    place_t(b_stage, grp_s2, 0.0, 0.0, STAGE_Z + 3.15)
    b_stage_ring = create_annular_step("S2_BStageRing", 0.88, 0.95, 0.038, 0.0, math.tau, mats["emit_amber"], segs=48, bevel=0.006)
    place_t(b_stage_ring, grp_s2, 0.0, 0.355, STAGE_Z + 3.15)

    spawn_mesh_instance("S2_StairsLeft", proto_meshes["stairs"], grp_s2, -2.85, 0.0, STAGE_Z + 1.55, yaw_y_rad=-0.65, scale=MAQ_SCALE * 0.72)
    spawn_mesh_instance("S2_StairsRight", proto_meshes["stairs"], grp_s2, 2.85, 0.0, STAGE_Z + 1.55, yaw_y_rad=0.65, scale=MAQ_SCALE * 0.72)

    shell_back_coral = create_arch_panel("S2_ShellBackCoral", 6.85, 4.85, 0.16, 0.0, 0.0, mats["coral"], bevel=0.028, segs=36)
    place_t(shell_back_coral, grp_s2, -0.35, 0.0, STAGE_Z - 2.68, yaw_y_rad=0.06)

    shell_back_violet = create_arch_panel("S2_ShellBackViolet", 6.45, 4.55, 0.16, 0.0, 0.0, mats["violet"], bevel=0.026, segs=36)
    place_t(shell_back_violet, grp_s2, 0.42, 0.0, STAGE_Z - 2.48, yaw_y_rad=-0.06)

    shell_main_arch = create_arch_panel("S2_ShellMainArch", 5.85, 4.35, 0.24, 4.35, 3.45, mats["slate"], bevel=0.028, segs=36)
    place_t(shell_main_arch, grp_s2, 0.0, 0.15, STAGE_Z - 2.18)

    shell_brass_cove = create_arch_panel("S2_ShellBrassCove", 4.62, 3.62, 0.28, 4.30, 3.40, mats["brass"], bevel=0.016, segs=36)
    place_t(shell_brass_cove, grp_s2, 0.0, 0.15, STAGE_Z - 2.18)

    medallion = create_cyl_mesh("S2_CenterMedallion", 1.55, 1.55, 0.12, mats["obsidian"], verts=48, bevel=0.02)
    medallion.rotation_euler = Euler((math.radians(90), 0.0, 0.0), "XYZ")
    medallion.location = t2b_pos(0.0, 2.35, STAGE_Z - 2.32)
    medallion.parent = grp_s2

    grp_wings_l = make_group("GRP_StageWingsL", -2.55, 0.0, STAGE_Z - 1.65, parent=grp_s2)
    grp_wings_r = make_group("GRP_StageWingsR", 2.55, 0.0, STAGE_Z - 1.65, parent=grp_s2)
    wing_mats = [mats["teal"], mats["coral"], mats["violet"], mats["brass"]]
    for side, w_grp in ((-1, grp_wings_l), (1, grp_wings_r)):
        for w_i in range(4):
            wx = side * (0.10 + w_i * 0.56)
            wz = -0.10 + w_i * 0.48
            wh = 3.55 - w_i * 0.44
            wing = create_arch_panel(
                f"S2_Wing_{'L' if side < 0 else 'R'}_{w_i}",
                0.88,
                wh,
                0.10,
                0.0,
                0.0,
                wing_mats[w_i],
                bevel=0.016,
            )
            place_t(wing, w_grp, wx, 0.12, wz, yaw_y_rad=-side * (0.38 + w_i * 0.12))
        spawn_mesh_instance(f"S2_Plant_{'L' if side < 0 else 'R'}", proto_meshes["plant"], grp_s2, side * 3.25, 0.18, STAGE_Z + 0.55, scale=MAQ_SCALE * 1.05)

    # Ground-stacked Dual-18 Subwoofers & 4 Stationary Truss Towers stay planted on GRP_Strata2_StageShell!
    for side in (-1, 1):
        for s_off in (0.0, 0.72):
            spawn_mesh_instance(
                f"S2_Sub_{side}_{s_off:.2f}",
                proto_meshes["sub_stack"],
                grp_s2,
                side * (3.15 + s_off),
                0.0,
                STAGE_Z + 1.15 - s_off * 0.25,
                yaw_y_rad=-side * 0.24,
                scale=MAQ_SCALE * 0.95,
            )

    tower_coords = [
        (-3.65, STAGE_Z + 1.05),
        (3.65, STAGE_Z + 1.05),
        (-3.45, STAGE_Z - 1.95),
        (3.45, STAGE_Z - 1.95),
    ]
    for tw_i, (twx, twz) in enumerate(tower_coords):
        spawn_mesh_instance(f"S2_TrussTower_{tw_i}", proto_meshes["truss_tower"], grp_s2, twx, 0.0, twz, scale=MAQ_SCALE * 2.15)

    # ─── STRATUM 3: Real Stage Instruments & SFX Hardware (Rigged Animated Performers loaded separately!) ───
    grp_s3 = make_group("GRP_Strata3_BandSfx", 0, 0, 0)
    spawn_mesh_instance("S3_GrandPiano", proto_meshes["piano"], grp_s3, -1.52, 0.52, STAGE_Z - 0.18, yaw_y_rad=0.48 + math.pi, scale=MAQ_SCALE * 0.92)
    spawn_mesh_instance("S3_DrumKit", proto_meshes["drums"], grp_s3, 0.0, 0.80, STAGE_Z - 0.88, yaw_y_rad=0.0, scale=MAQ_SCALE * 0.92)
    spawn_mesh_instance("S3_DjBooth", proto_meshes["dj_booth"], grp_s3, 1.48, 0.52, STAGE_Z - 0.35, yaw_y_rad=-0.42, scale=MAQ_SCALE * 0.82)

    for w_x in (-1.35, -0.48, 0.48, 1.35):
        spawn_mesh_instance(f"S3_Wedge_{w_x:.2f}", proto_meshes["wedge"], grp_s3, w_x, 0.52, STAGE_Z + 1.65, yaw_y_rad=math.pi, scale=MAQ_SCALE * 0.95)

    spark_coords = [
        (-2.15, 0.28, STAGE_Z + 1.85),
        (-1.15, 0.28, STAGE_Z + 2.25),
        (-0.58, 0.38, STAGE_Z + 3.15),
        (0.58, 0.38, STAGE_Z + 3.15),
        (1.15, 0.28, STAGE_Z + 2.25),
        (2.15, 0.28, STAGE_Z + 1.85),
    ]
    for sp_i, (spx, spy, spz) in enumerate(spark_coords):
        spawn_mesh_instance(f"S3_ColdSpark_{sp_i}", proto_meshes["cold_spark"], grp_s3, spx, spy, spz, scale=MAQ_SCALE * 1.15)
    spawn_mesh_instance("S3_CryoLeft", proto_meshes["cryo_jet"], grp_s3, -2.55, 0.28, STAGE_Z + 1.25, scale=MAQ_SCALE * 1.1)
    spawn_mesh_instance("S3_CryoRight", proto_meshes["cryo_jet"], grp_s3, 2.55, 0.28, STAGE_Z + 1.25, scale=MAQ_SCALE * 1.1)

    # ─── STRATUM 4: Flown J-Curve Line-Array PA Hangs & Suspended Kinetic Orbs ───
    grp_s4 = make_group("GRP_Strata4_AudioKinetic", 0, 0, 0)
    spawn_mesh_instance("S4_LineArrayL", proto_meshes["line_array"], grp_s4, -3.28, 2.65, STAGE_Z + 0.65, yaw_y_rad=0.26, scale=MAQ_SCALE * 1.18)
    spawn_mesh_instance("S4_LineArrayR", proto_meshes["line_array"], grp_s4, 3.28, 2.65, STAGE_Z + 0.65, yaw_y_rad=-0.26, scale=MAQ_SCALE * 1.18)

    for k_i, (kx, ky, kz) in enumerate([
        (-2.05, 3.15, STAGE_Z + 0.25),
        (-0.85, 3.45, STAGE_Z + 0.65),
        (0.85, 3.45, STAGE_Z + 0.65),
        (2.05, 3.15, STAGE_Z + 0.25),
    ]):
        spawn_mesh_instance(f"KineticOrb_{k_i}", proto_meshes["kinetic_orb"], grp_s4, kx, ky, kz, scale=MAQ_SCALE * 0.78)

    # ─── STRATUM 5: Overhead Motorized Octagonal Concert Truss Crown ───
    grp_s5 = make_group("GRP_Strata5_TrussCrown", 0, 0, 0)

    crown_bm = bmesh.new()
    crown_pts_t = [
        (-3.65, STAGE_Z + 1.05),
        (-2.35, STAGE_Z + 1.85),
        (0.0, STAGE_Z + 2.12),
        (2.35, STAGE_Z + 1.85),
        (3.65, STAGE_Z + 1.05),
        (3.45, STAGE_Z - 1.95),
        (0.0, STAGE_Z - 2.35),
        (-3.45, STAGE_Z - 1.95),
    ]
    crown_y_bot = 4.25
    crown_y_top = 4.62
    chord_r = 0.042

    def add_tube_seg(p0: Vector, p1: Vector, rad: float, segs: int = 8) -> None:
        vec = p1 - p0
        ln = vec.length
        if ln < 1e-4:
            return
        tmp = bmesh.new()
        bmesh.ops.create_cone(tmp, cap_ends=True, cap_tris=False, segments=segs, radius1=rad, radius2=rad, depth=ln)
        quat = vec.normalized().to_track_quat("Z", "Y")
        mat_xform = Matrix.Translation((p0 + p1) * 0.5) @ quat.to_matrix().to_4x4()
        bmesh.ops.transform(tmp, matrix=mat_xform, verts=tmp.verts)
        tm = bpy.data.meshes.new("_truss_seg")
        tmp.to_mesh(tm)
        tmp.free()
        crown_bm.from_mesh(tm)
        bpy.data.meshes.remove(tm)

    n_cp = len(crown_pts_t)
    for i in range(n_cp):
        x0, z0 = crown_pts_t[i]
        x1, z1 = crown_pts_t[(i + 1) % n_cp]
        b0_lo = t2b_pos(x0, crown_y_bot, z0)
        b1_lo = t2b_pos(x1, crown_y_bot, z1)
        b0_hi = t2b_pos(x0, crown_y_top, z0)
        b1_hi = t2b_pos(x1, crown_y_top, z1)
        add_tube_seg(b0_lo, b1_lo, chord_r)
        add_tube_seg(b0_hi, b1_hi, chord_r)
        add_tube_seg(b0_lo, b0_hi, chord_r * 0.85)
        sub_n = 4
        for s in range(sub_n):
            u0 = s / sub_n
            u1 = (s + 1) / sub_n
            p_a = b0_lo.lerp(b1_lo, u0)
            p_b = b0_hi.lerp(b1_hi, u1)
            p_c = b0_hi.lerp(b1_hi, u0)
            add_tube_seg(p_a, p_b, chord_r * 0.55, segs=6)
            add_tube_seg(p_c, b0_lo.lerp(b1_lo, u1), chord_r * 0.45, segs=6)

    for p in crown_bm.faces:
        p.smooth = True
    crown_mesh = bpy.data.meshes.new("S5_TrussCrown_Mesh")
    crown_bm.to_mesh(crown_mesh)
    crown_bm.free()
    crown_mesh.materials.append(mats["titanium"])
    crown_obj = bpy.data.objects.new("S5_TrussCrown", crown_mesh)
    bpy.context.scene.collection.objects.link(crown_obj)
    crown_obj.parent = grp_s5

    for bl_i, bl_u in enumerate((-0.75, -0.45, -0.15, 0.15, 0.45, 0.75)):
        bx = bl_u * 2.95
        bz = STAGE_Z + 1.98 - abs(bl_u) * 0.32
        spawn_mesh_instance(f"S5_Blinder_{bl_i}", proto_meshes["blinder"], grp_s5, bx, crown_y_bot - 0.22, bz, scale=MAQ_SCALE * 0.95)

    # ═══════════════════════════════════════════════════════════════════════════
    # 7. MERGE STATIC SUBTREES PER ANIMATION NODE (SLASHES DRAW CALLS BY ~80%!)
    # ═══════════════════════════════════════════════════════════════════════════
    # Keep heavy repeated prototypes shared across instances so GLB binary stays ~1.5MB raw / ~600KB gzipped!
    shared_heavy_set = set(char_meshes.values()) | {
        proto_meshes["truss_tower"],
        proto_meshes["line_array"],
        proto_meshes["sub_stack"],
        proto_meshes["checkin_arch"],
        proto_meshes["kinetic_orb"],
    }
    char_mesh_set = set(char_meshes.values())
    merge_static_children_under_group(grp_desk, "DeskFoundation_Merged", shared_heavy_set)
    merge_static_children_under_group(grp_ch1, "Ch1_BriefPad_Merged", shared_heavy_set)
    for idx, t_node in enumerate(mood_tray_nodes):
        merge_static_children_under_group(t_node, f"MoodTray_{idx}_Merged", shared_heavy_set)
    for idx, p_node in enumerate(portal_nodes):
        merge_static_children_under_group(p_node, f"Portal_{idx}_Merged", shared_heavy_set)
    for idx, b_node in enumerate(storyboard_nodes):
        merge_static_children_under_group(b_node, f"Storyboard_{idx}_Merged", shared_heavy_set)
    merge_static_children_under_group(grp_s1, "Strata1_SeatingFoh_Merged", shared_heavy_set)
    merge_static_children_under_group(grp_wings_l, "StageWingsL_Merged", shared_heavy_set)
    merge_static_children_under_group(grp_wings_r, "StageWingsR_Merged", shared_heavy_set)
    merge_static_children_under_group(grp_s2, "Strata2_StageShell_Merged", shared_heavy_set, exclude_prefixes=("StageWingsL_", "StageWingsR_"))
    merge_static_children_under_group(grp_s3, "Strata3_Hardware_Merged", shared_heavy_set)
    merge_static_children_under_group(grp_s4, "Strata4_Audio_Merged", shared_heavy_set, exclude_prefixes=("KineticOrb_",))
    merge_static_children_under_group(grp_s5, "Strata5_TrussCrown_Merged", shared_heavy_set)

    purge_orphan_datablocks()

    # ═══════════════════════════════════════════════════════════════════════════
    # 8. BAKE CYCLES RAY-TRACED AMBIENT OCCLUSION TO `COLOR_0`
    # ═══════════════════════════════════════════════════════════════════════════
    deps = bpy.context.evaluated_depsgraph_get()
    mesh_rep_obj: dict[bpy.types.Mesh, bpy.types.Object] = {}
    for o in list(scene.objects):
        if o.type != "MESH":
            continue
        if o.modifiers:
            ev = o.evaluated_get(deps)
            baked_m = bpy.data.meshes.new_from_object(ev)
            baked_m.name = o.data.name + "_Baked"
            old_m = o.data
            o.modifiers.clear()
            o.data = baked_m
            if old_m.users == 0:
                bpy.data.meshes.remove(old_m)
        if o.data not in char_mesh_set and o.data not in mesh_rep_obj:
            mesh_rep_obj[o.data] = o

    rep_objs = list(mesh_rep_obj.values())
    for m_data in mesh_rep_obj:
        # Remove unused UV maps on non-textured meshes to save ~100KB in GLB
        while m_data.uv_layers:
            m_data.uv_layers.remove(m_data.uv_layers[0])
        while m_data.color_attributes:
            m_data.color_attributes.remove(m_data.color_attributes[0])
        ca = m_data.color_attributes.new(name="Col", type="FLOAT_COLOR", domain="CORNER")
        m_data.color_attributes.active_color = ca
        m_data.color_attributes.render_color_index = 0

    world = bpy.data.worlds.new("HeroBakeWorld")
    scene.world = world
    world.use_nodes = True
    bg_nd = world.node_tree.nodes.get("Background")
    if bg_nd:
        bg_nd.inputs[0].default_value = (0.04, 0.07, 0.13, 1.0)
        bg_nd.inputs[1].default_value = 0.8

    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 24
    world.light_settings.ao_factor = 1.0
    world.light_settings.distance = 2.4

    # Temporarily hide early-chapter portals/moodtrays from casting false AO onto the amphitheater stage
    fg_groups = (grp_ch1, grp_ch2, grp_ch3)
    fg_objs = [o for g in fg_groups for o in g.children_recursive if o.type == "MESH"]
    stage_objs = [o for o in rep_objs if o not in fg_objs]

    # Pass A: Bake AO for main venue + desk + storyboards cleanly without foreground portal shadows
    for fo in fg_objs:
        fo.hide_render = True
    bpy.ops.object.select_all(action="DESELECT")
    for so in stage_objs:
        so.select_set(True)
    bpy.context.view_layer.objects.active = stage_objs[0]
    scene.render.bake.target = "VERTEX_COLORS"
    bpy.ops.object.bake(type="AO")

    # Pass B: Bake AO for foreground chapters 1-3 cleanly against the studio desk
    for fo in fg_objs:
        fo.hide_render = False
    bpy.ops.object.select_all(action="DESELECT")
    for fo in fg_objs:
        if fo in rep_objs:
            fo.select_set(True)
    if any(fo.select_get() for fo in fg_objs):
        bpy.context.view_layer.objects.active = next(fo for fo in fg_objs if fo.select_get())
        bpy.ops.object.bake(type="AO")

    # Remap raw Cycles AO in scene-linear space (`0.28 .. 1.04`) per Bug #8
    for m_data in mesh_rep_obj:
        ca = m_data.color_attributes.get("Col")
        if not ca or len(ca.data) == 0:
            continue
        n_loops = len(ca.data)
        buf = np.zeros(n_loops * 4, dtype=np.float32)
        ca.data.foreach_get("color", buf)
        rgba = buf.reshape((n_loops, 4))

        loop_vert_idx = np.zeros(n_loops, dtype=np.int32)
        m_data.loops.foreach_get("vertex_index", loop_vert_idx)
        v_co = np.zeros(len(m_data.vertices) * 3, dtype=np.float32)
        m_data.vertices.foreach_get("co", v_co)
        vz = v_co.reshape((-1, 3))[loop_vert_idx, 2]
        z_span = max(float(vz.max() - vz.min()), 0.25)
        z_norm = np.clip((vz - float(vz.min())) / z_span, 0.0, 1.0)[:, None]

        ao_raw = np.clip(rgba[:, :3], 0.0, 1.0)
        ao_shaped = (0.28 + 0.72 * np.power(ao_raw, 0.92)) * (0.91 + 0.13 * z_norm)
        rgba[:, :3] = np.clip(ao_shaped, 0.0, 1.0)
        rgba[:, 3] = 1.0
        ca.data.foreach_set("color", rgba.ravel())
        m_data.update()

    purge_orphan_datablocks()

    def add_area_light(nm: str, tx: float, ty: float, tz: float, target_t: tuple[float, float, float], energy: float, hex_c: str, size: float) -> None:
        ld = bpy.data.lights.new(name=nm, type="AREA")
        ld.energy = energy
        ld.color = hex_to_linear_rgba(hex_c)[:3]
        ld.size = size
        lo = bpy.data.objects.new(nm, ld)
        bpy.context.scene.collection.objects.link(lo)
        lo.location = t2b_pos(tx, ty, tz)
        direction = (t2b_pos(*target_t) - lo.location).normalized()
        lo.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    add_area_light("Light_StudioKey", 10.5, 13.5, 8.5, (0.0, 1.2, -1.5), 1650.0, "#eef7ff", 9.0)
    add_area_light("Light_StudioRim", -11.0, 9.5, -9.5, (0.0, 1.8, -4.2), 1150.0, "#8f80ff", 7.5)
    add_area_light("Light_WarmFill", 7.5, 6.5, -2.5, (0.0, 1.0, 2.5), 680.0, "#ffbe6b", 6.5)

    def add_ortho_cam(nm: str, target_t: tuple[float, float, float], az: float, el: float, ortho_scale: float) -> None:
        cd = bpy.data.cameras.new(nm)
        cd.type = "ORTHO"
        cd.ortho_scale = ortho_scale
        co = bpy.data.objects.new(nm, cd)
        bpy.context.scene.collection.objects.link(co)
        dist = 28.0
        tx = target_t[0] + math.sin(az) * math.cos(el) * dist
        ty = target_t[1] + math.sin(el) * dist
        tz = target_t[2] + math.cos(az) * math.cos(el) * dist
        co.location = t2b_pos(tx, ty, tz)
        direction = (t2b_pos(*target_t) - co.location).normalized()
        co.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    add_ortho_cam("Camera_01_Ch1Brief", (0.15, 0.65, 6.0), 0.50, 0.54, 9.6)
    add_ortho_cam("Camera_02_Ch3Portals", (0.0, 1.15, 2.4), 0.46, 0.50, 11.2)
    add_ortho_cam("Camera_03_Showtime", (0.0, 1.55, -2.85), -0.38, 0.48, 15.6)

    SCRATCH_DIR.mkdir(parents=True, exist_ok=True)
    GLB_OUT.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
    blend1 = BLEND_OUT.with_suffix(".blend1")
    if blend1.is_file():
        blend1.unlink()

    rna_keys = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    desired = {
        "filepath": str(GLB_OUT),
        "export_format": "GLB",
        "export_yup": True,
        "export_apply": False,
        "export_animations": False,
        "export_draco_mesh_compression_enable": False,
        "export_materials": "EXPORT",
        "export_image_format": "WEBP",
        "export_image_quality": 85,
        "export_texcoords": True,
        "export_normals": True,
        "export_colors": True,
        "export_vertex_color": "ACTIVE",
        "export_cameras": False,
        "export_lights": False,
    }
    export_kwargs = {k: v for k, v in desired.items() if k == "filepath" or k in rna_keys}
    res = bpy.ops.export_scene.gltf(**export_kwargs)
    if "FINISHED" not in res:
        raise RuntimeError(f"GLB export failed: {res}")

    total_verts = sum(len(o.data.vertices) for o in scene.objects if o.type == "MESH")
    unique_verts = sum(len(m.vertices) for m in bpy.data.meshes)
    report = {
        "blender_version": bpy.app.version_string,
        "glb_path": str(GLB_OUT),
        "glb_size_kb": round(GLB_OUT.stat().st_size / 1024.0, 1),
        "mesh_objects": len([o for o in scene.objects if o.type == "MESH"]),
        "unique_meshes": len(bpy.data.meshes),
        "unique_vertices": unique_verts,
        "instanced_vertices_total": total_verts,
        "materials": len(bpy.data.materials),
    }
    REPORT_OUT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print("HERO_DIORAMA_BUILD_OK", json.dumps(report))
    return report


def render_single_view(view_slug: str) -> None:
    if not BLEND_OUT.is_file():
        raise FileNotFoundError(f"Missing {BLEND_OUT}; run build mode first.")
    bpy.ops.wm.open_mainfile(filepath=str(BLEND_OUT))
    scene = bpy.context.scene

    cam_map = {
        "ch1": ("Camera_01_Ch1Brief", "render_01_ch1_brief.png"),
        "ch3": ("Camera_02_Ch3Portals", "render_02_ch3_portals.png"),
        "showtime": ("Camera_03_Showtime", "render_03_showtime.png"),
    }
    if view_slug not in cam_map:
        raise ValueError(f"Unknown view_slug={view_slug!r}; expected one of {sorted(cam_map)}")

    cam_name, out_name = cam_map[view_slug]
    scene.camera = bpy.data.objects[cam_name]

    def set_group_hide(grp_name: str, hidden: bool) -> None:
        g = bpy.data.objects.get(grp_name)
        if g:
            for ch in g.children_recursive:
                ch.hide_render = hidden

    set_group_hide("GRP_FixtureProto", True)
    if view_slug == "showtime":
        # Match Chapter 7 runtime state: foreground chapters 1-3 have gracefully retracted
        set_group_hide("GRP_Ch1_BriefPad", True)
        set_group_hide("GRP_Ch2_MoodTrays", True)
        set_group_hide("GRP_Ch3_Portals", True)
    elif view_slug == "ch1":
        set_group_hide("GRP_Ch3_Portals", True)

    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 40
    scene.cycles.use_denoising = False
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"

    out_path = SCRATCH_DIR / out_name
    if out_path.is_file():
        out_path.unlink()
    scene.render.filepath = str(out_path)
    bpy.ops.render.render(write_still=True)
    print("HERO_DIORAMA_RENDER_OK", str(out_path))


if __name__ == "__main__":
    mode = os.environ.get("HERO_DIORAMA_MODE", "build").strip().lower()
    if mode == "build":
        build_diorama_scene()
    elif mode == "render":
        view = os.environ.get("HERO_DIORAMA_VIEW", "").strip().lower()
        if not view:
            raise RuntimeError("HERO_DIORAMA_VIEW must be specified in render mode")
        render_single_view(view)
    else:
        raise RuntimeError(f"Unsupported HERO_DIORAMA_MODE={mode!r}")
