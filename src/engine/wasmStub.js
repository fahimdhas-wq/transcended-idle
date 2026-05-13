// WASM stub - the real WASM engine is built with wasm-pack
// This file allows the game to build and run in JS-only mode

export const dispatch = (type, payload) =>
  JSON.stringify({ success: false, message: 'WASM not available' });

export const validate = (type, payload) =>
  JSON.stringify({ success: false, message: 'WASM not available' });

export const get_snapshot = () => null;
export const save_game = () => false;
export const load_game = () => false;
export const has_save = () => false;
export const get_save_info = () => null;
export const delete_save = () => {};
export const start_engine = () => {};
export const stop_engine = () => {};
export const pause_engine = () => {};
export const resume_engine = () => {};
export const set_time_scale = () => {};
export const compute_offline_progress = () => null;

export default async () => {};
