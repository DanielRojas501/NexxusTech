export default function SceneCanvas({ label }) {
  return (
    <canvas
      data-three-scene
      className="block h-full w-full notranslate"
      translate="no"
      role="img"
      aria-label={label}
    />
  );
}