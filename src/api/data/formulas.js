export const FORMULAS = [
  { group: 'Cálculo', items: ['d/dx xⁿ = n·xⁿ⁻¹', 'd/dx sin x = cos x ; d/dx eˣ = eˣ', '∫ xⁿ dx = xⁿ⁺¹/(n+1) + C', '∫ₐᵇ f(x)dx = F(b) − F(a)', 'V = π∫ₐᵇ [f(x)]² dx'] },
  { group: 'Álgebra y vectores', items: ['det [[a,b],[c,d]] = ad − bc', 'A·B = a₁b₁ + a₂b₂ + a₃b₃', 'cos θ = A·B / (|A||B|)', '|A| = √(a₁² + a₂² + a₃²)'] },
  { group: 'Física', items: ['ω = 2π·RPM/60', 'v = ω·r ; a꜀ = ω²·r', 'ω = ω₀ + α·t', 'ΣF = m·a ; f = μ·N', 'g = 9.81 m/s²'] },
  { group: 'EDO y vibraciones', items: ['ω₀ = √(k/m)', 'T = 2π/ω₀ ; f = 1/T', 'y = y₀·e^(kt)'] },
  { group: 'E&M y termodinámica', items: ['τ = R·C', 'F = k|q₁q₂|/r², k = 8.99×10⁹', 'η = 1 − T꜀/Tₕ', 'ΔU = Q − W'] },
  { group: 'Química, estadística y economía', items: ['PV = nRT, R = 0.08206', 'P(X=k) = C(n,k)pᵏ(1−p)ⁿ⁻ᵏ', 'F = P(1 + i)ⁿ', 'Q* = CF/(P − CV)'] },
];