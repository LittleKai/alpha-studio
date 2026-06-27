import React, { useEffect, useRef } from 'react';

interface ShaderGradientProps {
    colors?: string[]; // Array of 3 hex color strings, e.g. ['#61e8ff', '#8b7dff', '#ff5a1f']
    speed?: number;    // Animation speed multiplier, default is 1.0
    className?: string;
    style?: React.CSSProperties;
}

export const ShaderGradient: React.FC<ShaderGradientProps> = ({
    colors = ['#0077B6', '#00B4D8', '#90E0EF'],
    speed = 1.0,
    className = '',
    style = {},
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const isVisibleRef = useRef(true);

    // Convert hex color codes to normalized RGB arrays [0.0 - 1.0] for WebGL
    const hexToRgb = (hex: string): [number, number, number] => {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
        const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
        const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
        return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
        if (!gl) {
            console.warn('WebGL is not supported in this browser. Gradient animation disabled.');
            return;
        }

        // --- Shader Sources ---
        const vertexShaderSource = `
            attribute vec2 position;
            varying vec2 v_uv;
            void main() {
                v_uv = position * 0.5 + 0.5;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        // Fragment Shader: Implements 2D Simplex Noise and Domain Warping on GPU
        // to produce beautiful 3D-like wavy mesh gradients.
        const fragmentShaderSource = `
            precision highp float;
            varying vec2 v_uv;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec3 u_color1;
            uniform vec3 u_color2;
            uniform vec3 u_color3;

            // Simplex Noise 2D functions
            vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

            float snoise(vec2 v){
                const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx) ;
                vec2 i1;
                i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod(i, 289.0);
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0) )
                    + i.x + vec3(0.0, i1.x, 1.0) );
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                    dot(x12.zw,x12.zw)), 0.0);
                m = m*m ;
                m = m*m ;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 a0 = x - floor(x + 0.5);
                vec3 g0 = a0*vec3(x0.x,x12.x,x12.z) + h*vec3(x0.y,x12.y,x12.w);
                return 130.0 * dot(m, g0);
            }

            void main() {
                vec2 uv = v_uv;
                
                // Adjust coordinates based on aspect ratio to prevent stretching
                float aspect = u_resolution.x / u_resolution.y;
                vec2 st = vec2(uv.x * aspect, uv.y);
                
                // Domain Warping using Simplex Noise
                float t = u_time * 0.12;
                
                vec2 q = vec2(0.0);
                q.x = snoise(st * 1.5 + vec2(0.0, t));
                q.y = snoise(st * 1.5 + vec2(1.5, t * 0.9));

                vec2 r = vec2(0.0);
                r.x = snoise(st * 1.2 + q * 1.2 + vec2(2.5, t * 0.6));
                r.y = snoise(st * 1.2 + q * 1.2 + vec2(7.3, t * 0.4));

                // Final noise map
                float f = snoise(st * 1.0 + r * 1.6 + vec2(t * 0.3, t * 0.15));
                
                // Normalize noise value to [0.0, 1.0] range
                f = clamp(f * 0.5 + 0.5, 0.0, 1.0);

                // Interpolate colors
                vec3 finalColor = mix(u_color1, u_color2, f);
                
                // Blend color3 using q length to add depth (simulating mesh layers)
                float f2 = length(q);
                finalColor = mix(finalColor, u_color3, clamp(f2 * 0.35, 0.0, 1.0));

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        // Helper to compile shaders
        const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compile error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!vs || !fs) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return;
        }

        gl.useProgram(program);

        // --- Geometry setup (full screen quad) ---
        const positionAttributeLocation = gl.getAttribLocation(program, 'position');
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1,
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        // --- Uniform Locations ---
        const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
        const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
        const color1UniformLocation = gl.getUniformLocation(program, 'u_color1');
        const color2UniformLocation = gl.getUniformLocation(program, 'u_color2');
        const color3UniformLocation = gl.getUniformLocation(program, 'u_color3');

        // --- Performance optimization using Intersection Observer ---
        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isVisibleRef.current = entry.isIntersecting;
                    if (entry.isIntersecting) {
                        requestAnimationFrame(render);
                    }
                });
            },
            { threshold: 0.01 }
        );
        intersectionObserver.observe(container);

        // --- Resize Handling ---
        const resizeCanvas = () => {
            const rect = container.getBoundingClientRect();
            // Scale resolution slightly down to optimize fragment shading performance if needed
            // (1.0 = native, 0.75 = minor performance boost, 0.5 = major performance boost on 4K)
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
        };

        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        resizeObserver.observe(container);
        resizeCanvas();

        // --- Render Loop ---
        let startTime = performance.now();
        let animationFrameId: number;

        const render = () => {
            if (!isVisibleRef.current) return;

            const elapsedSeconds = (performance.now() - startTime) / 1000;
            const timeValue = elapsedSeconds * speed;

            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // Pass uniforms
            gl.uniform1f(timeUniformLocation, timeValue);
            
            const c1 = hexToRgb(colors[0] || '#0077B6');
            const c2 = hexToRgb(colors[1] || '#00B4D8');
            const c3 = hexToRgb(colors[2] || '#90E0EF');
            
            gl.uniform3f(color1UniformLocation, c1[0], c1[1], c1[2]);
            gl.uniform3f(color2UniformLocation, c2[0], c2[1], c2[2]);
            gl.uniform3f(color3UniformLocation, c3[0], c3[1], c3[2]);

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
            gl.deleteProgram(program);
            gl.deleteShader(vs);
            gl.deleteShader(fs);
            gl.deleteBuffer(positionBuffer);
        };
    }, [colors, speed]);

    const defaultStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        ...style,
    };

    return (
        <div ref={containerRef} className={`shader-gradient-container ${className}`} style={defaultStyle}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>
    );
};

export default ShaderGradient;
