// Marca de Granito PC · filtro de pintura (Kuwahara de 4 sectores) para un nodo Custom de Unreal.
//
// Montaje en el material de posproceso M_PP_Pintura (Material Domain = Post Process,
// Blendable Location = Before Tonemapping para que el color siga en HDR):
//   1. Añade un nodo SceneTexture con PostProcessInput0. No hace falta conectarlo a nada útil,
//      pero tiene que existir en el grafo para que SceneTextureLookup pueda leerlo
//      (por ejemplo, multiplícalo por 0 y súmalo al resultado).
//   2. Añade un nodo Custom: Output Type = CMOT Float 3, entrada «Radius» (Scalar Parameter
//      «Pincelada», 2 = suave, 3 = media, 4 = fuerte) y pega este código.
//   3. Conecta la salida a Emissive Color.
// Coste: 4·(r+1)² lecturas por píxel. Con r = 3 son 64; en la calidad Baja usa r = 2.
// Si la imagen sale desplazada con resolución dinámica, cambia BufferSizeAndInvSize por
// ViewSizeAndInvSize.

float2 uv = GetDefaultSceneTextureUV(Parameters, 14);   // 14 = PostProcessInput0
float2 texel = View.BufferSizeAndInvSize.zw;
int r = (int)clamp(Radius, 1.0, 6.0);
float n = (float)((r + 1) * (r + 1));

float3 mean0 = 0, mean1 = 0, mean2 = 0, mean3 = 0;
float3 sq0 = 0, sq1 = 0, sq2 = 0, sq3 = 0;

[loop] for (int j = 0; j <= r; j++)
{
	[loop] for (int i = 0; i <= r; i++)
	{
		float3 c;
		// Sector 0: arriba a la izquierda
		c = SceneTextureLookup(uv + float2(-i, -j) * texel, 14, false).rgb;
		mean0 += c; sq0 += c * c;
		// Sector 1: arriba a la derecha
		c = SceneTextureLookup(uv + float2(i, -j) * texel, 14, false).rgb;
		mean1 += c; sq1 += c * c;
		// Sector 2: abajo a la izquierda
		c = SceneTextureLookup(uv + float2(-i, j) * texel, 14, false).rgb;
		mean2 += c; sq2 += c * c;
		// Sector 3: abajo a la derecha
		c = SceneTextureLookup(uv + float2(i, j) * texel, 14, false).rgb;
		mean3 += c; sq3 += c * c;
	}
}

mean0 /= n; mean1 /= n; mean2 /= n; mean3 /= n;
float3 v0 = abs(sq0 / n - mean0 * mean0);
float3 v1 = abs(sq1 / n - mean1 * mean1);
float3 v2 = abs(sq2 / n - mean2 * mean2);
float3 v3 = abs(sq3 / n - mean3 * mean3);
float s0 = v0.r + v0.g + v0.b;
float s1 = v1.r + v1.g + v1.b;
float s2 = v2.r + v2.g + v2.b;
float s3 = v3.r + v3.g + v3.b;

// Gana el sector más uniforme: así se conservan los bordes y el resto se agrupa en manchas
float3 result = mean0;
float best = s0;
if (s1 < best) { best = s1; result = mean1; }
if (s2 < best) { best = s2; result = mean2; }
if (s3 < best) { best = s3; result = mean3; }
return result;
