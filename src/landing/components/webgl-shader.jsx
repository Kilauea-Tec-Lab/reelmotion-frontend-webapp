import { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  attribute vec3 position;
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform float xScale;
  uniform float yScale;
  uniform float distortion;

  void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

    float d = length(p) * distortion;

    float rx = p.x * (1.0 + d);
    float gx = p.x;
    float bx = p.x * (1.0 - d);

    float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);
    float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);
    float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);

    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

const WebGLShader = ({
  xScale = 1.0,
  yScale = 0.5,
  distortion = 0.05,
  className = "",
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(new THREE.Color(0x000000));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);

    const uniforms = {
      resolution: { value: [canvas.clientWidth, canvas.clientHeight] },
      time: { value: 0.0 },
      xScale: { value: xScale },
      yScale: { value: yScale },
      distortion: { value: distortion },
    };

    const position = [
      -1.0, -1.0, 0.0,
       1.0, -1.0, 0.0,
      -1.0,  1.0, 0.0,
       1.0, -1.0, 0.0,
      -1.0,  1.0, 0.0,
       1.0,  1.0, 0.0,
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(position), 3));

    const material = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const handleResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      uniforms.resolution.value = [w * renderer.getPixelRatio(), h * renderer.getPixelRatio()];
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      uniforms.time.value += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [xScale, yScale, distortion]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block ${className}`}
    />
  );
};

export default WebGLShader;
