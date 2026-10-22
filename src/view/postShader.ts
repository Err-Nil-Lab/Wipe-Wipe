// Pass layar penuh untuk tampilan PS1 hitam putih: abu-abu, kuantisasi dengan dither Bayer,
// butiran film, dan vignette. Dijalankan pada resolusi render yang kecil, jadi pikselnya kasar.
export const postVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const postFragment = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform float uLevels;
  uniform float uGrain;
  uniform float uVignette;
  varying vec2 vUv;

  // Matriks Bayer 4x4: pola dither tetap per piksel.
  float bayer4(vec2 p) {
    int x = int(mod(p.x, 4.0));
    int y = int(mod(p.y, 4.0));
    float m[16] = float[16](0.,8.,2.,10., 12.,4.,14.,6., 3.,11.,1.,9., 15.,7.,13.,5.);
    return m[x + y * 4] / 16.0;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec3 linear = texture2D(tDiffuse, vUv).rgb;
    // Target render menyimpan warna linear; ubah ke gamma supaya terang-gelap terlihat wajar.
    float luma = pow(dot(linear, vec3(0.299, 0.587, 0.114)), 1.0 / 2.2);

    luma += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * uGrain;
    luma += (bayer4(gl_FragCoord.xy) - 0.5) / uLevels;
    luma = floor(luma * uLevels + 0.5) / uLevels;

    float edge = distance(vUv, vec2(0.5));
    luma *= 1.0 - uVignette * smoothstep(0.25, 0.75, edge);

    gl_FragColor = vec4(vec3(clamp(luma, 0.0, 1.0)), 1.0);
  }
`;
