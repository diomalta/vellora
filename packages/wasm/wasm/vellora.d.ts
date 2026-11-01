/* tslint:disable */
/* eslint-disable */

/**
 * Test-only export (NOT public surface): panics, so tests can prove the trap-to-rejection path
 * and that the instance is usable again after the JS wrapper resets it.
 */
export function __forcePanicForTest(): void;

export function __wbg_reset_state(): void;

/**
 * Initial smoke export, mirroring `vellora-napi`'s `coreName`.
 */
export function coreName(): string;

/**
 * Render `html` document bytes (UTF-8 content, never a path) to PDF bytes.
 *
 * `opts` mirrors `@vellora/native`'s `RenderOpts`: `{ title?, creationDate?: [y, m, d],
 * images?: Record<string, Uint8Array>, baseUrl?, fonts?: Uint8Array[], pdfa?: "PDF/A-2b" }`.
 * Throws a JS `Error` on a core error (see the module docs for its properties).
 */
export function render(html: Uint8Array, opts: any): Uint8Array;

/**
 * Module start function: runs once per instantiation (and again after every
 * `__wbg_reset_state`, which re-runs `__wbindgen_start` on the fresh instance), so each instance
 * records its panic message before trapping.
 */
export function start(): void;

/**
 * Return (and clear) the message of the panic that trapped the last call, formatted like the
 * napi binding's rejection (`render panicked: <detail>`). `undefined` when no panic was recorded.
 */
export function takePanicMessage(): string | undefined;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly coreName: (a: number) => void;
    readonly render: (a: number, b: number, c: number, d: number) => void;
    readonly start: () => void;
    readonly takePanicMessage: (a: number) => void;
    readonly __forcePanicForTest: () => void;
    readonly Servo_NumericType_MatchesAngle: (a: number) => number;
    readonly Servo_NumericType_MatchesLength: (a: number) => number;
    readonly Servo_NumericType_MatchesLengthPercentage: (a: number) => number;
    readonly Servo_NumericType_MatchesNumber: (a: number) => number;
    readonly Servo_NumericType_MatchesPercentage: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
