/**
 * Catch-all stub API route that returns an empty ES module.
 * Used by the importmap to handle deep imports from packages that don't
 * have web equivalents (e.g. react-native/Libraries/Utilities/codegenNativeComponent).
 *
 * The importmap maps "react-native/" to this endpoint, so any deep import like
 * `react-native/Libraries/Utilities/codegenNativeComponent` gets resolved to
 * `/api/stub/Libraries/Utilities/codegenNativeComponent` which returns a no-op module.
 */
export async function GET() {
  const stubModule = `
// Auto-generated stub for native-only module
export default function stub() { return null; }
export function codegenNativeComponent(name) {
  return function StubComponent() { return null; };
}
export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => new Proxy({}, { get: () => () => null }),
};
export const NativeModules = {};
export const Platform = { OS: 'web', select: (obj) => obj.web || obj.default };
`;

  return new Response(stubModule, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
