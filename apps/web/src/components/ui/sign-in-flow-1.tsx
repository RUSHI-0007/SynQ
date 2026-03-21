"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useSignIn } from "@clerk/nextjs";
import * as THREE from "three";

type Uniforms = {
  [key: string]: {
    value: number[] | number[][] | number;
    type: string;
  };
};

interface ShaderProps {
  source: string;
  uniforms: {
    [key: string]: {
      value: number[] | number[][] | number;
      type: string;
    };
  };
  maxFps?: number;
}

interface SignInPageProps {
  className?: string;
  onClose?: () => void;
}

export const CanvasRevealEffect = ({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => {
  return (
    <div className={cn("h-full relative w-full", containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[0, 255, 255]]}
          dotSize={dotSize ?? 3}
          opacities={opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
          shader={`
            ${reverse ? 'u_reverse_active' : 'false'}_;
            animation_speed_factor_${animationSpeed.toFixed(1)}_;
          `}
          center={["x", "y"]}
        />
      </div>
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      )}
    </div>
  );
};

interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
  center?: ("x" | "y")[];
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  const uniforms = React.useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]];
    if (colors.length === 2) {
      colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]];
    } else if (colors.length === 3) {
      colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]];
    }
    return {
      u_colors: {
        value: colorsArray.map((color) => {
          const r = color?.[0] ?? 0;
          const g = color?.[1] ?? 0;
          const b = color?.[2] ?? 0;
          return [r / 255, g / 255, b / 255];
        }),
        type: "uniform3fv",
      },
      u_opacities: { value: opacities, type: "uniform1fv" },
      u_total_size: { value: totalSize, type: "uniform1f" },
      u_dot_size: { value: dotSize, type: "uniform1f" },
      u_reverse: { value: shader.includes("u_reverse_active") ? 1 : 0, type: "uniform1i" },
    };
  }, [colors, opacities, totalSize, dotSize, shader]);

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;
        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse;
        out vec4 fragColor;

        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) { return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x); }

        void main() {
            vec2 st = fragCoord.xy;
            ${center.includes("x") ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));" : ""}
            ${center.includes("y") ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));" : ""}
            float opacity = step(0.0, st.x) * step(0.0, st.y);
            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));
            float frequency = 5.0;
            float show_offset = random(st2);
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
            opacity *= u_opacities[int(rand * 10.0)];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));
            vec3 color = u_colors[int(show_offset * 6.0)];
            float animation_speed_factor = 0.5;
            vec2 center_grid = u_resolution / 2.0 / u_total_size;
            float dist_from_center = distance(center_grid, st2);
            float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
            float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
            float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);
            if (u_reverse == 1) {
                opacity *= 1.0 - step(timing_offset_outro, u_time * animation_speed_factor);
                opacity *= clamp((step(timing_offset_outro + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            } else {
                opacity *= step(timing_offset_intro, u_time * animation_speed_factor);
                opacity *= clamp((1.0 - step(timing_offset_intro + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            }
            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a;
        }
      `}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};

const ShaderMaterial = ({
  source,
  uniforms,
}: {
  source: string;
  hovered?: boolean;
  maxFps?: number;
  uniforms: Uniforms;
}) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const material: any = ref.current.material;
    material.uniforms.u_time.value = clock.getElapsedTime();
  });

  const getUniforms = () => {
    const preparedUniforms: any = {};
    for (const uniformName in uniforms) {
      const uniform: any = uniforms[uniformName];
      switch (uniform.type) {
        case "uniform1f": preparedUniforms[uniformName] = { value: uniform.value }; break;
        case "uniform1i": preparedUniforms[uniformName] = { value: uniform.value }; break;
        case "uniform3f": preparedUniforms[uniformName] = { value: new THREE.Vector3().fromArray(uniform.value as number[]) }; break;
        case "uniform1fv": preparedUniforms[uniformName] = { value: uniform.value }; break;
        case "uniform3fv": preparedUniforms[uniformName] = { value: (uniform.value as number[][]).map((v) => new THREE.Vector3().fromArray(v)) }; break;
        case "uniform2f": preparedUniforms[uniformName] = { value: new THREE.Vector2().fromArray(uniform.value as number[]) }; break;
        default: console.error(`Invalid uniform type for '${uniformName}'.`); break;
      }
    }
    preparedUniforms["u_time"] = { value: 0 };
    preparedUniforms["u_resolution"] = { value: new THREE.Vector2(size.width * 2, size.height * 2) };
    return preparedUniforms;
  };

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        precision mediump float;
        uniform vec2 u_resolution;
        out vec2 fragCoord;
        void main(){
          gl_Position = vec4(position.xy, 0.0, 1.0);
          fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
          fragCoord.y = u_resolution.y - fragCoord.y;
        }
      `,
      fragmentShader: source,
      uniforms: getUniforms(),
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    });
  }, [size.width, size.height, source]); // eslint-disable-line

  return (
    <mesh ref={ref as any}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full">
      <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
    </Canvas>
  );
};

// ─────────────────────────────────────────────
// Main SignInPage – fully wired to Clerk auth
// ─────────────────────────────────────────────
export const SignInPage = ({ className, onClose }: SignInPageProps) => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);

  // Step 1 – send email code via Clerk
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      await signIn!.create({ strategy: "email_code", identifier: email });
      setStep("code");
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === "code") setTimeout(() => codeInputRefs.current[0]?.focus(), 500);
  }, [step]);

  // Step 2a – handle each digit input
  const handleCodeChange = async (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) codeInputRefs.current[index + 1]?.focus();
    if (newCode.every(d => d.length === 1)) {
      await verifyCode(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2b – verify OTP with Clerk
  const verifyCode = async (otp: string) => {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn.attemptFirstFactor({ strategy: "email_code", code: otp });
      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        setReverseCanvasVisible(true);
        setTimeout(() => setInitialCanvasVisible(false), 50);
        setStep("success");
        setTimeout(() => router.push("/dashboard"), 1800);
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClick = async () => { await verifyCode(code.join("")); };

  const handleResend = async () => {
    if (!isLoaded || !signIn) return;
    setCode(["", "", "", "", "", ""]);
    setError(null);
    try { await signIn.create({ strategy: "email_code", identifier: email }); }
    catch (err: any) { setError(err?.errors?.[0]?.message ?? "Failed to resend code."); }
  };

  // OAuth
  const handleOAuth = async (strategy: "oauth_google" | "oauth_github") => {
    if (!isLoaded || !signIn) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "OAuth sign-in failed.");
    }
  };

  const handleBackClick = () => {
    setStep("email");
    setCode(["", "", "", "", "", ""]);
    setError(null);
    setReverseCanvasVisible(false);
    setInitialCanvasVisible(true);
  };

  return (
    <div className={cn("fixed inset-0 z-[9999] flex w-full flex-col bg-black", className)}>
      {/* ── 3D Canvas Background ── */}
      <div className="absolute inset-0 z-0">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect animationSpeed={3} containerClassName="bg-black" colors={[[99, 102, 241], [168, 85, 247]]} dotSize={6} reverse={false} />
          </div>
        )}
        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect animationSpeed={4} containerClassName="bg-black" colors={[[99, 102, 241], [168, 85, 247]]} dotSize={6} reverse={true} />
          </div>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.85)_0%,_transparent_70%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-black to-transparent" />
      </div>

      {/* ── UI Layer ── */}
      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
        {onClose && (
          <button onClick={onClose} className="absolute top-6 right-8 text-white/50 hover:text-white text-2xl z-50 transition-colors" aria-label="Close">✕</button>
        )}

        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <AnimatePresence mode="wait">

              {/* ── Email step ── */}
              {step === "email" && (
                <motion.div key="email" initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-6 text-center">
                  <div className="space-y-1">
                    <h1 className="text-[2.5rem] font-bold leading-tight tracking-tight text-white">Welcome to SYNQ</h1>
                    <p className="text-2xl text-white/60 font-light">Sign in to your team</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => handleOAuth("oauth_google")}
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full py-3 px-4 transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>

                    <button
                      onClick={() => handleOAuth("oauth_github")}
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full py-3 px-4 transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                      Continue with GitHub
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="h-px bg-white/10 flex-1" />
                      <span className="text-white/40 text-sm">or via email</span>
                      <div className="h-px bg-white/10 flex-1" />
                    </div>

                    <form onSubmit={handleEmailSubmit}>
                      <div className="relative">
                        <input
                          type="email"
                          placeholder="you@team.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-transparent text-white border border-white/20 rounded-full py-3 px-4 focus:outline-none focus:border-indigo-500/60 text-center"
                          required
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="absolute right-1.5 top-1.5 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white disabled:opacity-50"
                        >
                          {loading
                            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : "→"}
                        </button>
                      </div>
                    </form>

                    {error && <p className="text-red-400 text-sm">{error}</p>}
                  </div>
                </motion.div>
              )}

              {/* ── OTP code step ── */}
              {step === "code" && (
                <motion.div key="code" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-6 text-center">
                  <div className="space-y-1">
                    <h1 className="text-[2.5rem] font-bold leading-tight tracking-tight text-white">Check your email</h1>
                    <p className="text-lg text-white/50">Code sent to <span className="text-white/80">{email}</span></p>
                  </div>

                  <div className="rounded-full py-4 px-5 border border-white/10 flex justify-center">
                    {code.map((digit, i) => (
                      <div key={i} className="flex items-center">
                        <div className="relative">
                          <input
                            ref={(el) => { codeInputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleCodeChange(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            className="w-8 text-center text-xl bg-transparent text-white border-none focus:outline-none appearance-none"
                            style={{ caretColor: "transparent" }}
                          />
                          {!digit && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-xl text-white/20">0</span>
                            </div>
                          )}
                        </div>
                        {i < 5 && <span className="text-white/20 text-xl mx-1">|</span>}
                      </div>
                    ))}
                  </div>

                  {error && <p className="text-red-400 text-sm">{error}</p>}

                  <button onClick={handleResend} className="text-white/40 hover:text-white/70 text-sm transition-colors">
                    Resend code
                  </button>

                  <div className="flex gap-3">
                    <button onClick={handleBackClick} className="rounded-full bg-white text-black font-medium px-8 py-3 hover:bg-white/90 transition-colors w-[30%]">
                      Back
                    </button>
                    <button
                      onClick={handleVerifyClick}
                      disabled={!code.every(d => d !== "") || loading}
                      className={`flex-1 rounded-full font-medium py-3 border transition-all duration-300 flex items-center justify-center ${
                        code.every(d => d !== "") && !loading
                          ? "bg-white text-black border-transparent hover:bg-white/90 cursor-pointer"
                          : "bg-[#111] text-white/50 border-white/10 cursor-not-allowed"
                      }`}
                    >
                      {loading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : "Continue"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Success step ── */}
              {step === "success" && (
                <motion.div key="success" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }} className="space-y-6 text-center">
                  <div className="space-y-1">
                    <h1 className="text-[2.5rem] font-bold leading-tight tracking-tight text-white">You&apos;re in!</h1>
                    <p className="text-xl text-white/50">Loading your sandbox...</p>
                  </div>
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }} className="py-10">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </motion.div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
